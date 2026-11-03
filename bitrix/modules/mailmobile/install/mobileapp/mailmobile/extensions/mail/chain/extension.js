/**
 * @module mail/chain
 */
jn.define('mail/chain', (require, exports, module) => {
	const { Color, Corner, Indent, Typography } = require('tokens');
	const { Loc } = require('loc');
	const { Text5 } = require('ui-system/typography/text');
	const { Icon: UiIcon, IconView } = require('ui-system/blocks/icon');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonDesign } = require('ui-system/form/buttons/button');
	const { Haptics } = require('haptics');
	const { FriendlyDate } = require('layout/ui/friendly-date');
	const { Moment } = require('utils/date');
	const { dayShortMonth, shortTime } = require('utils/date/formats');
	const { throttle } = require('utils/function');
	const { clone, isEqual } = require('utils/object');
	const { ActionPanel } = require('mail/chain/action-panel');
	const { Avatar } = require('mail/message/elements/avatar');
	const { ContactList } = require('mail/message/elements/contact/list');
	const { getChainPromise, getMessagePromise, deleteMessage, getMessageNeighbors } = require('mail/message/tools/connector');
	const { getThemeRequestParams } = require('mail/message/theme-request');
	const {
		ActionMenu,
		getFavoriteActionPayload,
		isFavoriteActionVisible,
	} = require('mail/simple-list/items/message-redux/src/action-menu');
	const { MessageBody } = require('mail/message/elements/messagebody');
	const { MailOpener } = require('mail/opener');
	const { NotifyManager } = require('notify-manager');
	const { ContextMenu } = require('layout/ui/context-menu');
	const { AjaxMethod } = require('mail/const');
	const connection = require('device/connection');
	const { selectById } = require('mail/statemanager/redux/slices/messages/selector');
	const { setFavoriteState } = require('mail/statemanager/redux/slices/messages/thunk');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { showErrorToast } = require('toast');

	function getChainFavoritePayload(chain, cardId)
	{
		const message = chain[cardId];

		return message ? getFavoriteActionPayload(message) : null;
	}

	/**
	 * The quote of a reply, of a reply to all and of a forward is built from the body of the card, and the
	 * chain carries only two bodies: the opened letter and the last incoming one. Every other card gets its
	 * body later, and until it arrives - or after its load has failed - there is nothing to quote.
	 */
	function canQuoteMessage(message)
	{
		return Boolean(message)
			&& message.isBodyLoaded === true
			&& message.isLoadingBody !== true
			&& message.bodyLoadFailed !== true
		;
	}

	/**
	 * Opens the sending form for the card when there is a body to quote, and says why when there is none. A
	 * form opened without it would show the user a reply to a letter they cannot see. The card itself already
	 * carries the reason: the loader while the body is on its way, the error screen with the retry once the
	 * load has failed. The openers are taken as arguments so that the rule can be asked about without a screen.
	 */
	function openSendFormWhenQuotable({
		message,
		getParams,
		openSend = (params) => MailOpener.openSend(params),
		showError = showErrorToast,
	})
	{
		if (!canQuoteMessage(message))
		{
			showError({ message: Loc.getMessage('MESSAGE_VIEW_BODY_LOAD_ERROR_TITLE') });

			return false;
		}

		openSend(getParams());

		return true;
	}

	function getChainFavoriteActionTitle(message)
	{
		return BX.message(
			message?.isFavorite
				? 'MAILMOBILE_CHAIN_REMOVE_FROM_FAVORITES'
				: 'MAILMOBILE_CHAIN_ADD_TO_FAVORITES',
		);
	}

	function updateChainFavoriteState(chain, cardId, isFavorite)
	{
		const updatedChain = Array.isArray(chain) ? [...chain] : { ...chain };
		if (updatedChain[cardId])
		{
			updatedChain[cardId] = {
				...updatedChain[cardId],
				isFavorite: Boolean(isFavorite),
			};
		}

		return updatedChain;
	}

	function getChainFavoriteResult(message, action, latestRequestId = action?.meta?.requestId)
	{
		if (latestRequestId !== action?.meta?.requestId)
		{
			return null;
		}

		const { data, errors } = action?.payload ?? {};
		if (errors?.length > 0)
		{
			return { isFavorite: Boolean(message.isFavorite), error: errors[0] };
		}
		if (action?.meta?.requestStatus === 'rejected')
		{
			return { isFavorite: Boolean(message.isFavorite), error: action.error };
		}

		return { isFavorite: Boolean(data?.isFavorite), error: null };
	}

	function applyChainFavoriteTransition(chain, requests, cardId, change)
	{
		const message = chain[cardId];
		if (!message)
		{
			return { applied: false, chain, requests };
		}

		const nextRequests = { ...requests };
		if (change.phase === 'optimistic')
		{
			nextRequests[message.id] = {
				requestId: change.requestId,
				previous: Boolean(message.isFavorite),
			};

			return {
				applied: true,
				chain: updateChainFavoriteState(chain, cardId, change.isFavorite),
				requests: nextRequests,
			};
		}

		if (nextRequests[message.id]?.requestId !== change.requestId)
		{
			return { applied: false, chain, requests };
		}

		delete nextRequests[message.id];

		return {
			applied: true,
			chain: updateChainFavoriteState(chain, cardId, change.isFavorite),
			requests: nextRequests,
		};
	}

	async function executeChainFavoriteAction({
		cardId,
		readOnly,
		getChain,
		onStateChange,
		getLatestRequestId,
		getReduxMessage = (id) => selectById(store.getState(), id),
		dispatchAction = dispatch,
		createFavoriteAction = setFavoriteState,
		showError = showErrorToast,
		isOnline = connection.isOnline(),
	})
	{
		const chainMessage = getChain()[cardId];
		const reduxMessage = getReduxMessage(chainMessage?.id);
		const message = reduxMessage
			? { ...chainMessage, isFavorite: reduxMessage.isFavorite }
			: chainMessage;
		if (!isFavoriteActionVisible({ message, isOnline, readOnly }))
		{
			return null;
		}

		const payload = getFavoriteActionPayload(message);
		const request = dispatchAction(createFavoriteAction(payload));
		onStateChange(cardId, {
			isFavorite: payload.isFavorite,
			phase: 'optimistic',
			requestId: request.requestId,
		});

		const action = await request;
		if (getLatestRequestId(message.id) !== action.meta.requestId)
		{
			return action;
		}

		const currentReduxMessage = getReduxMessage(message.id);
		const result = reduxMessage
			? { isFavorite: currentReduxMessage?.isFavorite ?? message.isFavorite, error: null }
			: getChainFavoriteResult(message, action, action.meta.requestId);

		if (result.error)
		{
			showError(result.error);
		}

		onStateChange(cardId, {
			isFavorite: result.isFavorite,
			phase: 'settled',
			requestId: action.meta.requestId,
		});

		return action;
	}

	const titles = {
		fields: {
			to: BX.message('MESSAGE_VIEW_HEADER_TO'),
			cc: BX.message('MESSAGE_VIEW_HEADER_CC'),
			bcc: BX.message('MESSAGE_VIEW_HEADER_BCC'),
		},
	};

	const paddingRightHeader = Indent.XL3.toNumber();
	const paddingLeftHeader = Indent.XL4.toNumber();
	const avatarSize = 34;
	const contactsBlockLeftPadding = Indent.M.toNumber();
	const directorIconPaddingRight = Indent.M.toNumber();
	const maxWidthDate = 100;
	const directionItemWidth = Indent.XL4.toNumber();

	const allMarginsWidth = paddingRightHeader
		+ paddingLeftHeader
		+ avatarSize
		+ contactsBlockLeftPadding
		+ directorIconPaddingRight
		+ maxWidthDate
		+ directionItemWidth;

	let deviceWidth = device.screen.width;
	if (!deviceWidth)
	{
		deviceWidth = 360;
	}

	const maxWidthTextFiled = deviceWidth - allMarginsWidth;

	const MESSAGE_DIRECTION_OUTGOING = 2;

	/**
	 * The arrow that tells where a message went: out of the mailbox or into it.
	 *
	 * @param {number} [direction]
	 * @return {Icon}
	 */
	const messageDirectionIcon = (direction) => (
		direction === MESSAGE_DIRECTION_OUTGOING
			? UiIcon.SOLID_LOWER_LEFT_ARROW
			: UiIcon.SOLID_LOWER_RIGHT_ARROW
	);

	function readMessage(message)
	{
		if (message.isRead === false && message.uidId)
		{
			// eslint-disable-next-line no-param-reassign
			message.isRead = true;

			BX.ajax.runAction(
				AjaxMethod.mailChangeReadStatus,
				{
					data: {
						ids: [message.uidId],
						isRead: 1,
					},
				},
			).catch(() => {
				// eslint-disable-next-line no-param-reassign
				message.isRead = false;
			});
		}
	}

	function BodyLoadError(props)
	{
		return StatusBlock({
			testId: 'message-card-in-chain-body-load-error',
			title: Loc.getMessage('MESSAGE_VIEW_BODY_LOAD_ERROR_TITLE'),
			description: Loc.getMessage('MESSAGE_VIEW_BODY_LOAD_ERROR_DESCRIPTION'),
			style: {
				paddingBottom: Indent.XL3.toNumber(),
			},
			buttons: [
				Button({
					testId: 'message-card-in-chain-body-load-error-retry-button',
					text: Loc.getMessage('MESSAGE_VIEW_BODY_LOAD_ERROR_RETRY'),
					design: ButtonDesign.OUTLINE_ACCENT_2,
					onClick: props.retryAction,
				}),
			],
		});
	}

	function MessageCard(props)
	{
		const message = props.message;

		if (message.isVisible === false)
		{
			return null;
		}

		const format = message.format;

		let bodyPlaceholder = null;
		let subject = null;
		let footer = null;
		let messageBody = null;
		const isBodyReady = message.isBodyLoaded === true
			&& message.attachments !== undefined
			&& message.isLoadingBody !== true
		;

		if (format === 'full')
		{
			if (!props.readOnly)
			{
				footer = View(
					{
						style: {
							height: 42,
						},
					},
					MoreButton({
						testId: 'message-card-in-chain-more-button-in-footer',
						style: {
							bottom: Indent.S.toNumber(),
							right: Indent.XL3.toNumber(),
							position: 'absolute',
						},
						action: props.showMenuAction.bind(null, props.id, message.id, message.subject, 'full'),
					}),
				);
			}

			if (message.bodyLoadFailed === true)
			{
				bodyPlaceholder = BodyLoadError({
					retryAction: props.retryLoadAction.bind(null, props.id),
				});
			}
			else if (!isBodyReady)
			{
				bodyPlaceholder = Loader({
					style: {
						width: 45,
						height: 45,
						alignSelf: 'center',
						paddingBottom: 100,
					},
					animating: true,
					size: 'large',
				});
			}
			subject = message.subject;
		}

		if (isBodyReady)
		{
			messageBody = new MessageBody({
				subject,
				files: message.attachments,
				isHiddenField: false,
				format: message.format,
				content: message.body,
				isBodyThemed: message.isBodyThemed === true,
			});
		}

		return View(
			{
				style: {
					backgroundColor: Color.bgContentPrimary.toHex(),
					marginBottom: Indent.XS.toNumber(),
					marginTop: Indent.XS.toNumber(),
					borderRadius: Corner.L.toNumber(),
				},
			},
			Header({
				direction: message.direction,
				subject: message.subject,
				date: message.date,
				time: message.time,
				format: message.format,
				to: message.to,
				from: message.from,
				bcc: message.bcc,
				cc: message.cc,
				id: message.id,
				isFavorite: message.isFavorite,
				isFavoriteAllowed: message.isFavoriteAllowed && !props.readOnly,
				onFavoriteClick: props.onFavoriteClick,
			}),
			subject,
			messageBody,
			bodyPlaceholder,
			footer,
		);
	}

	function MoreButton(props)
	{
		return IconView({
			icon: UiIcon.MORE,
			color: Color.base5,
			size: 30,
			style: props.style,
			testId: props.testId,
			onClick: props.action,
		});
	}

	function DirectionItem(props)
	{
		const isOutgoing = props.direction === MESSAGE_DIRECTION_OUTGOING;

		return View(
			{
				style: {
					paddingTop: Indent.XL3.toNumber(),
					paddingRight: directorIconPaddingRight,
					width: directionItemWidth + directorIconPaddingRight,
				},
				testId: isOutgoing ? 'message-card-direction-outgoing' : 'message-card-direction-incoming',
			},
			IconView({
				icon: messageDirectionIcon(props.direction),
				color: Color.base4,
				size: 24,
			}),
		);
	}

	function Header(props)
	{
		const header = [];

		const {
			format,
			from,
			to,
			bcc,
			cc,
			id,
			date,
			subject,
		} = props;

		const fields = {
			to: {
				list: to,
			},
			cc: {
				list: cc,
			},
			bcc: {
				list: bcc,
			},
		};

		header.push(new ContactList({
			maxWidthTextFiled,
			format: 'big',
			list: from,
			fieldId: id,
			testId: 'message-card-header-contact-from',
		}));

		if (format === 'full')
		{
			header.push(...Object.entries(fields).map(([key, item]) => {
				return View(
					{
						style: {
							flexDirection: 'row',
							center: 'center',
						},
					},
					new ContactList({
						maxWidthTextFiled,
						format: 'little',
						list: item.list,
						title: titles.fields[key],
						testId: `message-card-header-contact-${key}`,
					}),
				);
			}));
		}
		else
		{
			header.push(Text5({
				testId: 'mail-chain-card-subject',
				accent: true,
				color: Color.base2,
				style: {
					textAlignVertical: 'top',
					paddingRight: Indent.XL3.toNumber(),
					marginTop: Indent.XS2.toNumber(),
				},
				text: subject,
			}));
		}

		function renderDate(date)
		{
			if (date === undefined)
			{
				return null;
			}

			const moment = Moment.createFromTimestamp(date);

			return new FriendlyDate({
				timeSeparator: '\r\n',
				moment,
				defaultFormat: (moment) => {
					const day = moment.format(dayShortMonth());
					const time = moment.format(shortTime);

					return `${day}\r\n${time}`;
				},
				useTimeAgo: true,
				showTime: true,
				style: {
					...Typography.text5.getStyle(),
					maxWidth: maxWidthDate,
					lineHeightMultiple: 1.3,
					textAlign: 'center',
					color: Color.base4.toHex(),
				},
			});
		}

		function renderFavoriteIcon()
		{
			if (props.isFavoriteAllowed !== true)
			{
				return null;
			}

			const isFavorite = props.isFavorite === true;

			return IconView({
				testId: 'mailmobile-chain-message-favorite',
				icon: UiIcon.FAVORITE,
				solid: isFavorite,
				size: 20,
				color: isFavorite ? Color.accentMainWarning : Color.base4,
				style: {
					marginRight: Indent.S.toNumber(),
				},
				onClick: props.onFavoriteClick,
			});
		}

		function renderContacts(header)
		{
			return View(
				{
					style: {
						flex: 1,
						paddingTop: Indent.XL.toNumber(),
						paddingLeft: contactsBlockLeftPadding,
					},
				},
				...header,
			);
		}

		function renderAvatar()
		{
			const fullName = from?.[0]?.customData?.name;
			const email = from?.[0]?.customData?.email;

			if (fullName === undefined || fullName === null)
			{
				return null;
			}

			return View(
				{
					style: {
						paddingTop: Indent.XL.toNumber(),
					},
				},
				Avatar({
					fullName,
					email,
					size: avatarSize,
				}),
			);
		}

		return View(
			{
				style: {
					paddingBottom: Indent.XL.toNumber(),
					flexDirection: 'row',
					paddingLeft: paddingLeftHeader,
					paddingRight: paddingRightHeader,
					width: '100%',
					backgroundColor: Color.bgContentPrimary.toHex(),
				},
			},
			View(
				{
					style: {
						flex: 1,
						flexDirection: 'row',
					},
				},
				DirectionItem({
					direction: props.direction,
				}),
				renderAvatar(),
				renderContacts(header),
			),
			View(
				{
					style: {
						top: Indent.XL.toNumber(),
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				renderFavoriteIcon(),
				renderDate(date),
			),
		);
	}

	class MessageChain extends LayoutComponent
	{
		constructor(props)
		{
			const {
				threadId,
				chain,
				widget,
				isCrmMessage,
				startEmailSender = null,
				source = 'mail',
				readOnly = false,
				act = '',
				mailUfMessageToken = '',
			} = props;

			super();

			this.constant = {
				isCrmMessage,
				startEmailSender,
				source,
				readOnly,
				act,
				mailUfMessageToken,
			};

			this.threadId = threadId;
			this.layout = widget;

			this.actions = readOnly
				? {}
				: {
					replyButton: () => this.replyMessageAction(),
					replyAllButton: () => this.replyAllMessageAction(),
					forwardButton: () => this.forwardAction(),
					moreButton: isCrmMessage ? this.showContextMenu.bind(this) : this.openMoreMenuAction.bind(this),
				}
			;

			this.setChain(threadId, chain.list, chain.properties, false);
		}

		getNeighbors()
		{
			return this.neighborChains;
		}

		setNeighbors(props = {})
		{
			const {
				PREV = null,
				NEXT = null,
				needButtonsUpdate = false,
			} = props;

			if (PREV && PREV.ID)
			{
				this.neighborChains.prevId = Number(PREV.ID);
			}
			else
			{
				this.neighborChains.prevId = false;
			}

			if (NEXT && NEXT.ID)
			{
				this.neighborChains.nextId = Number(NEXT.ID);
			}
			else
			{
				this.neighborChains.nextId = false;
			}

			if (needButtonsUpdate)
			{
				this.layout.setRightButtons(this.getRightButtons());
			}
		}

		flippingChain(id)
		{
			this.layout.setRightButtons(this.getRightButtons(true));

			NotifyManager.showLoadingIndicator();
			this.uploadChain(id, this.constant.isCrmMessage).then(() => {
				NotifyManager.hideLoadingIndicator(true, '', 1);
			});
		}

		/**
		 * Flipping walks the neighbouring threads of a crm entity, so only a letter of one has
		 * anywhere to flip to: a letter of a mailbox or one opened from a task card has not.
		 */
		canFlipChain()
		{
			return Boolean(this.constant.isCrmMessage) && !this.constant.readOnly;
		}

		getRightButtons(disabledButtons = false)
		{
			if (!this.canFlipChain())
			{
				return [];
			}

			const {
				nextId = false,
				prevId = false,
			} = this.getNeighbors();

			// both buttons hold their place in the header: one of them disappearing would move the
			// other under the finger already reaching for it, so a flip with nowhere to go stays
			// in place, dimmed and inert
			const flipButton = (id, icon, targetId) => ({
				id,
				type: icon.getIconName(),
				color: (targetId ? Color.base4 : Color.base6).toHex(),
				testID: `right-button-${id}`,
				callback: targetId && !disabledButtons
					? this.flippingChain.bind(this, targetId)
					: undefined,
			});

			return [
				flipButton('flipping-up', UiIcon.CHEVRON_DOWN, nextId),
				flipButton('flipping-down', UiIcon.CHEVRON_UP, prevId),
			];
		}

		async showContextMenu(
			id = this.lastIncomingCardId,
			messageId = this.lastIncomingId,
			title = this.lastIncomingTitle,
			format = 'little',
		)
		{
			if (this.constant.readOnly)
			{
				return;
			}

			if (title === undefined)
			{
				title = '';
			}

			const baseActions = [
				{
					id: 'reply',
					title: BX.message('MESSAGE_VIEW_CONTEXT_MENU_REPLY'),
					subTitle: '',
					icon: UiIcon.REPLY_2,
					onClickCallback: () => {
						menu.close(() => {
							this.replyMessageAction(id);
						});
					},
				},
				{
					id: 'reply-all',
					title: BX.message('MESSAGE_VIEW_CONTEXT_MENU_REPLY_ALL'),
					subTitle: '',
					icon: UiIcon.REPLY_TO_ALL,
					onClickCallback: () => {
						menu.close(() => {
							this.replyAllMessageAction(id);
						});
					},
				},
				{
					id: 'forward',
					title: BX.message('MESSAGE_VIEW_CONTEXT_MENU_FORWARD'),
					subTitle: '',
					icon: UiIcon.FORWARD,
					onClickCallback: () => {
						menu.close(() => {
							this.forwardAction(id);
						});
					},
				},
			];

			let moreActions = [];
			const selectedMessage = this.state.chain[id];
			if (isFavoriteActionVisible({
				message: selectedMessage,
				isOnline: connection.isOnline(),
				readOnly: this.constant.readOnly,
			}))
			{
				moreActions.push({
					id: 'favorite',
					title: getChainFavoriteActionTitle(selectedMessage),
					subTitle: '',
					onClickCallback: () => {
						menu.close(() => {
							void this.changeFavoriteState(id);
						});
					},
				});
			}

			if (this.constant.isCrmMessage)
			{
				moreActions.push(
					{
						id: 'exclude-from-crm',
						title: BX.message('MESSAGE_VIEW_CONTEXT_MENU_EXCLUDE_FROM_CRM'),
						subTitle: '',
						icon: UiIcon.DELETE_PERSON,
						onClickCallback: () => {
							menu.close(() => {
								this.deleteMessage(id, messageId, true);
							});
						},
					},
					{
						id: 'mark-as-spam',
						title: BX.message('MESSAGE_VIEW_CONTEXT_MENU_MARK_AS_SPAM'),
						subTitle: '',
						icon: UiIcon.BAN,
						onClickCallback: () => {
							menu.close(() => {
								this.deleteMessage(id, messageId, false, true);
							});
						},
					},
					{
						id: 'delete-message',
						title: BX.message('MESSAGE_VIEW_CONTEXT_MENU_DELETE'),
						subTitle: '',
						icon: UiIcon.TRASHCAN,
						onClickCallback: () => {
							menu.close(() => {
								this.deleteMessage(id, messageId);
							});
						},
					},
				);
			}

			let actions;

			// the three actions above quote the body of the card, so a card whose body has not arrived - or
			// whose load has failed - offers only the actions that do not need it
			if (format === 'full' && canQuoteMessage(this.state.chain?.[id]))
			{
				actions = [
					...baseActions,
					...moreActions,
				];
			}
			else
			{
				actions = [
					...moreActions,
				];
			}

			const menu = new ContextMenu({
				testId: 'message-card-in-chain-action-menu',
				actions,
				params: {
					title: `${BX.message('MESSAGE_VIEW_CONTEXT_MENU_TITLE_MESSAGE')} ${title}`,
					showCancelButton: true,
				},
			});

			await menu.show();
		}

		async changeFavoriteState(cardId)
		{
			return executeChainFavoriteAction({
				cardId,
				readOnly: this.constant.readOnly,
				getChain: () => this.state.chain,
				onStateChange: this.onFavoriteStateChange.bind(this),
				getLatestRequestId: (messageId) => this.favoriteRequests?.[messageId]?.requestId,
			});
		}

		onFavoriteStateChange(cardId, change)
		{
			const transition = applyChainFavoriteTransition(
				this.state.chain,
				this.favoriteRequests ?? {},
				cardId,
				change,
			);
			if (!transition.applied)
			{
				return;
			}

			this.favoriteRequests = transition.requests;
			this.setState({ chain: transition.chain });
		}

		getOwnerEntity(cardId)
		{
			return {
				ownerId: Number(this.state.chain[cardId].ownerId),
				ownerType: this.state.chain[cardId].ownerType,
				ownerTypeId: Number(this.state.chain[cardId].ownerTypeId),
			};
		}

		getSendersSet(cardId)
		{
			return (this.getMessage(cardId)).availableSenders;
		}

		getFiles(cardId)
		{
			return this.state.chain[cardId].attachments;
		}

		getOwner(cardId)
		{
			let ownerData = {};

			if (this.constant.isCrmMessage)
			{
				ownerData = {
					...this.getOwnerEntity(cardId),
				};
			}

			ownerData.inResponseToMessage = this.state.chain[cardId].id;

			return ownerData;
		}

		getMessage(cardId)
		{
			return {
				...this.state.chain[cardId],
				owner: this.getOwner(cardId),
			};
		}

		getSubject(cardId)
		{
			return this.state.chain[cardId].subject;
		}

		getStartEmailSender(cardId)
		{
			if (this.constant.startEmailSender !== null)
			{
				return this.constant.startEmailSender;
			}

			const header = this.getMessage(cardId);

			if (header.replyFromEmail)
			{
				return header.replyFromEmail;
			}

			return null;
		}

		getReplyParams(cardId)
		{
			const header = this.getMessage(cardId);
			let contacts = this.clearFromEmployeeEmails(header.from, header.employees);

			if (contacts.length === 0)
			{
				contacts = this.clearFromEmployeeEmails(header.to, header.employees);
			}

			return {
				startEmailSender: this.getStartEmailSender(cardId),
				isCrmMessage: this.constant.isCrmMessage,
				uploadSenders: false,
				uploadClients: false,
				isSendFiles: false,
				files: this.getFiles(cardId),
				senders: this.getSendersSet(cardId),
				subject: `Re: ${this.getSubject(cardId)}`,
				owner: header.owner,
				contacts,
				reply_message_body: this.getBodyHtml(cardId),
				isBodyThemed: header.isBodyThemed === true,
				element: 'reply',
				source: this.constant.source,
			};
		}

		clearFromEmployeeEmails(contacts, employeeContacts)
		{
			if (employeeContacts === undefined)
			{
				return contacts;
			}

			const employeeEmails = new Set(employeeContacts.map((item) => item?.customData?.email.toLowerCase()));

			return contacts.filter((contact) => {
				const email = contact?.customData?.email ?? contact?.email;
				if (!email)
				{
					return false;
				}

				return !employeeEmails.has(email.toLowerCase());
			});
		}

		getReplyAllParams(cardId)
		{
			const message = this.getMessage(cardId);

			return {
				startEmailSender: this.getStartEmailSender(cardId),
				isCrmMessage: this.constant.isCrmMessage,
				uploadSenders: false,
				uploadClients: false,
				isSendFiles: false,
				files: this.getFiles(cardId),
				senders: this.getSendersSet(cardId),
				subject: `Re: ${this.getSubject(cardId)}`,
				owner: message.owner,
				contacts: this.clearFromEmployeeEmails([...message.to, ...message.from], message.employees),
				cc: this.clearFromEmployeeEmails([...message.cc, ...message.bcc], message.employees),
				reply_message_body: this.getBodyHtml(cardId),
				isBodyThemed: message.isBodyThemed === true,
				source: this.constant.source,
				element: 'reply_all',
			};
		}

		getForwardParams(cardId)
		{
			const message = this.getMessage(cardId);

			return {
				startEmailSender: this.getStartEmailSender(cardId),
				isCrmMessage: this.constant.isCrmMessage,
				uploadSenders: false,
				uploadClients: false,
				isSendFiles: true,
				files: this.getFiles(cardId),
				senders: this.getSendersSet(cardId),
				subject: `Fwd: ${this.getSubject(cardId)}`,
				owner: message.owner,
				reply_message_body: this.getBodyHtml(cardId),
				isBodyThemed: message.isBodyThemed === true,
				isForward: 1,
				source: this.constant.source,
				element: 'forward',
			};
		}

		getBodyHtml(cardId)
		{
			const body = this.state.chain[cardId].body;

			return body === undefined ? '' : body;
		}

		openSendForm(cardId, getParams)
		{
			return openSendFormWhenQuotable({
				message: this.state.chain?.[cardId],
				getParams,
			});
		}

		replyMessageAction(cardId = this.lastIncomingCardId)
		{
			return this.openSendForm(cardId, () => this.getReplyParams(cardId));
		}

		replyAllMessageAction(cardId = this.lastIncomingCardId)
		{
			return this.openSendForm(cardId, () => this.getReplyAllParams(cardId));
		}

		forwardAction(cardId = this.lastIncomingCardId)
		{
			return this.openSendForm(cardId, () => this.getForwardParams(cardId));
		}

		openMoreMenuAction(target)
		{
			Haptics.impactLight();
			const cardId = this.state.chain.findIndex((message) => Number(message.id) === Number(this.threadId));
			void new ActionMenu(this.threadId).show({
				target,
				isDetailCard: true,
				onFavoriteStateChange: cardId < 0
					? () => {}
					: (change) => this.onFavoriteStateChange(cardId, change),
			});
		}

		hideChainItem(cardId)
		{
			const chain = clone(this.state.chain);

			if (chain[cardId])
			{
				chain[cardId].isVisible = false;
				if (!isEqual(this.state.chain, chain))
				{
					this.setState({
						chain,
					});
				}
			}
		}

		showChainItem(cardId)
		{
			const chain = clone(this.state.chain);

			if (chain[cardId])
			{
				chain[cardId].isVisible = true;
				if (!isEqual(this.state.chain, chain))
				{
					this.setState({
						chain,
					});
				}
			}
		}

		onMessageDelete()
		{
			this.messageCount--;

			if (this.messageCount === 0)
			{
				layout.close();
			}
		}

		onMessageDeleteFailure(cardId)
		{
			this.showChainItem(cardId);
		}

		deleteMessage(cardId, messageId, excludeFromCrm = false, markAsSpam = false)
		{
			this.hideChainItem(cardId);

			deleteMessage({
				id: messageId,
				ownerId: this.state.chain[cardId].ownerId,
				ownerType: this.state.chain[cardId].ownerType,
				successAction: this.onMessageDelete.bind(this),
				failureAction: this.onMessageDeleteFailure.bind(this, cardId),
				excludeFromCrm,
				markAsSpam,
			});
		}

		loadMessage(id, chain = this.state.chain)
		{
			const message = chain[id];
			const messageId = message.id;

			if (
				message.isLoadingBody === true
				|| message.isBodyLoaded === true
			)
			{
				return;
			}

			message.isLoadingBody = true;
			message.bodyLoadFailed = false;

			getMessagePromise(
				messageId,
				true,
				true,
				this.constant.isCrmMessage,
				this.constant.act,
				this.constant.mailUfMessageToken,
				getThemeRequestParams(),
			).then((response) => {
				const updatedChain = clone(this.state.chain);
				const loadedMessage = response.data;
				const targetIndex = updatedChain.findIndex((item) => String(item.id) === String(messageId));
				if (targetIndex === -1)
				{
					return;
				}

				updatedChain[targetIndex].body = loadedMessage.body;
				updatedChain[targetIndex].attachments = loadedMessage.attachments;
				updatedChain[targetIndex].isBodyThemed = loadedMessage.isBodyThemed === true;
				updatedChain[targetIndex].isBodyLoaded = true;
				updatedChain[targetIndex].isLoadingBody = false;
				this.setState({
					chain: updatedChain,
				});
			}).catch(() => {
				const updatedChain = clone(this.state.chain);
				const targetIndex = updatedChain.findIndex((item) => String(item.id) === String(messageId));
				if (targetIndex === -1)
				{
					return;
				}

				updatedChain[targetIndex].isLoadingBody = false;
				updatedChain[targetIndex].bodyLoadFailed = true;
				this.setState({
					chain: updatedChain,
				});
			});
		}

		retryLoadMessage(id)
		{
			const chain = clone(this.state.chain);

			this.loadMessage(id, chain);
			this.setState({
				chain,
			});
		}

		cardTouch(id)
		{
			const chain = clone(this.state.chain);
			let cardHasChanged;

			if (chain[id].format === 'minimized')
			{
				chain[id].format = 'full';
				cardHasChanged = true;
			}
			else
			{
				chain[id].format = 'minimized';
				cardHasChanged = true;
			}

			if (cardHasChanged)
			{
				this.loadMessage(id, chain);
				this.setState({
					chain,
				});
			}
		}

		uploadChain(threadId)
		{
			return getChainPromise(
				threadId,
				this.constant.isCrmMessage,
				this.constant.act,
				this.constant.mailUfMessageToken,
				getThemeRequestParams(),
			).then(({ data }) => {
				this.setChain(threadId, data.list, data.properties, true);
			});
		}

		uploadNeighbors(threadId)
		{
			const { ownerId, ownerTypeId } = this.getOwnerEntity(0);

			getMessageNeighbors(ownerId, ownerTypeId, Number(threadId))
				.then((response) => {
					this.setNeighbors({
						needButtonsUpdate: true,
						...response.data,
					});
				});
		}

		setChain(threadId, chain, properties, withRender = true)
		{
			this.neighborChains = {};
			this.setNeighbors({
				needButtonsUpdate: !withRender,
			});

			this.messageCount = chain.length;
			this.properties = properties;
			this.lastIncomingCardId = null;
			this.lastIncomingTitle = '';

			this.lastIncomingId = this.properties.lastIncomingId;

			chain = chain.map((item, key) => {
				// eslint-disable-next-line no-param-reassign
				item.isBodyThemed = item.isBodyThemed === true;
				// eslint-disable-next-line no-param-reassign
				item.isBodyLoaded = Number(threadId) === Number(item.id)
					|| (typeof item.body === 'string' && item.body.length > 0)
				;

				if (Number(item.id) === Number(this.properties.lastIncomingId))
				{
					this.lastIncomingCardId = key;
					this.lastIncomingTitle = item.subject;
				}

				if (Number(threadId) === Number(item.id))
				{
					// eslint-disable-next-line no-param-reassign
					item.format = 'full';

					if (this.constant.isCrmMessage === 0)
					{
						readMessage(item);
					}
				}
				else
				{
					// eslint-disable-next-line no-param-reassign
					item.format = 'minimized';
				}

				return item;
			});

			if (!isEqual(this.state.chain, chain))
			{
				if (withRender)
				{
					this.setState({
						chain,
					});
				}
				else
				{
					this.state.chain = chain;
				}

				if (this.canFlipChain())
				{
					this.uploadNeighbors(threadId);
				}
			}
		}

		render()
		{
			const chain = this.state.chain;

			let ActionPanelIndentStub = null;
			let ActionPanelView = null;

			if (this.properties.lastIncomingId !== null && !this.constant.readOnly)
			{
				ActionPanelView = new ActionPanel({
					actions: this.actions,
				});

				ActionPanelIndentStub = new ActionPanel({
					indentStub: true,
				});
			}

			if (chain.length === 0)
			{
				return null;
			}

			const cards = [];

			for (const [i, element] of chain.entries())
			{
				let action = this.cardTouch.bind(this, i);
				action = throttle(action, 500, this);

				cards.push(View(
					{
						testId: 'message-card-in-chain',
						onClick: () => {
							if (this.constant.isCrmMessage === 0)
							{
								readMessage(element);
							}

							action();
						},
					},
					MessageCard({
						message: element,
						id: i,
						showMenuAction: this.showContextMenu.bind(this),
						onFavoriteClick: () => this.changeFavoriteState(i),
						retryLoadAction: this.retryLoadMessage.bind(this),
						readOnly: this.constant.readOnly,
					}),
				));
			}

			return View(
				{},
				ScrollView(
					{
						style: {
							height: '100%',
							backgroundColor: Color.bgContentPrimary.toHex(),
						},
					},
					View(
						{},
						View({
							style: {
								flexDirection: 'row',
								flexWrap: 'wrap',
							},
						}),
						...cards,
						ActionPanelIndentStub,
					),
				),
				ActionPanelView,
			);
		}
	}

	module.exports = {
		MessageChain,
		canQuoteMessage,
		openSendFormWhenQuotable,
		messageDirectionIcon,
		getChainFavoriteActionTitle,
		getChainFavoritePayload,
		getChainFavoriteResult,
		applyChainFavoriteTransition,
		executeChainFavoriteAction,
		updateChainFavoriteState,
	};
});
