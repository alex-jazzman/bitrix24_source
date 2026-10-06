/**
 * @module im/messenger/lib/element/recent/item/base
 */
jn.define('im/messenger/lib/element/recent/item/base', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Color } = require('tokens');
	const { Type } = require('type');
	const { Theme } = require('im/lib/theme');
	const { Uuid } = require('utils/uuid');
	const { merge } = require('utils/object');
	const { Icon } = require('assets/icons');
	const { Feature } = require('im/messenger/lib/feature');
	const { DraftType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { DateHelper } = require('im/messenger/lib/helper');
	const { DateFormatter } = require('im/messenger/lib/date-formatter');
	const { DialogHelper, UserHelper } = require('im/messenger/lib/helper');
	const {
		Path,
		MessageStatus,
		AnchorType,
	} = require('im/messenger/const');
	const {
		ContextMenuSection,
		ContextMenuActionOrder,
		PinAction,
		UnpinAction,
		ReadAction,
		UnreadAction,
		MuteAction,
		UnmuteAction,
		ProfileAction,
		HideAction,
		AddToFolderAction,
	} = require('im/messenger/lib/element/recent/item/action/action');
	const {
		CounterPrefix,
		CounterValue,
		CounterPostfix,
		CounterSuffix,
	} = require('im/messenger/lib/element/recent/const/test-id');
	const { parser } = require('im/messenger/lib/parser');

	const RecentItemSectionCode = Object.freeze({
		pinned: 'pinned',
		general: 'general',
	});

	const ContextMenuSectionOrder = [
		ContextMenuSection.main,
		ContextMenuSection.bottom,
	];

	/**
	 * @class RecentItem
	 */
	class RecentItem
	{
		/** @type {?boolean} */
		#subtitleAvatarVisible = null;

		/** @type {RecentWidgetItemContextMenu|null|undefined} */
		#contextMenu;

		/**
		 * @param {RecentModelState} modelItem
		 * @param {object} options
		 */
		constructor(modelItem = {}, options = {})
		{
			this.id = 0;
			this.title = 'title';
			this.subtitle = 'subtitle';
			this.subtitleAvatar = null;
			this.imageUrl = '';
			this.color = '';
			this.backgroundColor = '';
			this.date = 0;
			this.displayedDate = '';
			this.messageCount = 0;
			this.unread = false;
			this.sectionCode = '';
			this.sortValues = {};
			this.menuMode = '';
			this.actions = [];
			this.params = {};
			this.styles = {
				title: {
					font: {
						fontStyle: 'semibold',
						color: ChatTitle.createFromDialogId(modelItem.id).getTitleColor(),
						useColor: true,
					},
					additionalImage: {},
					showBBCode: true,
				},
				subtitle: {},
				avatar: {},
				date: {
					image: {
						sizeMultiplier: 0.7,
						name: '',
					},
				},
				counter: {},
				pin: {},
			};
			this.isSuperEllipseIcon = false;
			this.counterTestId = '';

			this
				.initParams(modelItem, options)
				.createId()
				.createTitle()
				.createSubtitle()
				.truncateSubtitle()
				.createImageUrl()
				.createColor()
				.createBackgroundColor()
				.createDate()
				.createDisplayedDate()
				.createMessageCount()
				.createUnread()
				.createSectionCode()
				.createSortValues()
				.createMenuMode()
				.createActions()
				.createParams()
				.createMutedTitleStyle()
				.createTitleStyle()
				.createSubtitleStyle()
				.createDraftRecent()
				.createSubtitleAvatar()
				.createAvatar()
				.createAvatarStyle()
				.createDateStyle()
				.createMentionStyle()
				.createCommentsStyle()
				.createCounterStyle()
				.createLikesStyle()
				.createPinnedStyle()
				.createCounterTestId()
			;
		}

		/**
		 * @return {RecentWidgetItem}
		 */
		toRecentWidgetItem()
		{
			const { model, ...paramsWithoutModel } = this.params;

			return {
				id: this.id,
				title: this.title,
				subtitle: this.subtitle,
				subtitleAvatar: this.subtitleAvatar,
				avatar: this.avatar,
				imageUrl: this.imageUrl,
				color: this.color,
				backgroundColor: this.backgroundColor,
				date: this.date,
				displayedDate: this.displayedDate,
				messageCount: this.messageCount,
				counterTestId: this.counterTestId,
				unread: this.unread,
				sectionCode: this.sectionCode,
				sortValues: this.sortValues,
				menuMode: this.menuMode,
				actions: this.actions,
				contextMenu: this.buildContextMenu(),
				params: paramsWithoutModel,
				styles: this.styles,
				isSuperEllipseIcon: this.isSuperEllipseIcon,
			};
		}

		/**
		 * @return Boolean
		 */
		get isMute()
		{
			return Boolean(this.getDialogItem()?.muteList?.includes(serviceLocator.get('core').getUserId()));
		}

		/**
		 * @param {RecentModelState} modelItem
		 * @param {object} options
		 * @return RecentItem
		 */
		initParams(modelItem, options)
		{
			const dialog = this.getDialogById(modelItem.id);
			const store = serviceLocator.get('core').getStore();
			const counterState = store.getters['counterModel/getByChatId'](dialog?.chatId);
			const counter = counterState?.counter ?? 0;
			const anchors = store.getters['anchorModel/getByChatId'](dialog?.chatId);

			this.params = {
				model: {
					recent: modelItem,
					dialog,
					counter,
					counterState,
					anchors,
				},
				options,
				id: modelItem.id,
				type: modelItem.type,
				useLetterImage: true,
			};

			return this;
		}

		/**
		 * @return {boolean}
		 */
		hasMention()
		{
			return this.params.model.anchors.some((anchor) => anchor.type === AnchorType.mention);
		}

		/**
		 * @return {boolean}
		 */
		hasReaction()
		{
			return this.params.model.anchors.some((anchor) => anchor.type === AnchorType.reaction);
		}

		/**
		 * @return RecentItem
		 */
		createId()
		{
			this.id = this.getModelItem().id;

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createTitle()
		{
			const item = this.getModelItem();
			const title = ChatTitle.createFromDialogId(item.id, {
				showItsYou: true,
			}).getTitle();

			if (title)
			{
				this.title = title;
			}

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createSubtitle()
		{
			return this;
		}

		/**
		 * @return RecentItem
		 */
		truncateSubtitle()
		{
			if (Type.isStringFilled(this.subtitle) && this.subtitle.length > 150)
			{
				this.subtitle = this.subtitle.slice(0, 150);
			}

			return this;
		}

		createDraftRecent()
		{
			const showDraft = this.getRenderProperty('showDraft', true);
			if (!showDraft)
			{
				return this;
			}

			if (!this.hasDraft())
			{
				return this;
			}

			let { text: draftText } = this.getDraftModel();
			const draftPrefix = (text) => {
				return Feature.isChatDialogListSupportsSubtitleBbCodes
					? `[COLOR=${Color.accentMainAlert.toHex()}]${text}[/COLOR]`
					: text;
			};
			draftText = parser.simplify({ text: draftText });

			this.subtitle = `${draftPrefix(Loc.getMessage('IMMOBILE_MESSAGE_SIGN_DRAFT_SUBTITLE_PREFIX'))} ${draftText}`.trim();
			this.styles.subtitle = {
				image: null,
				font: null,
				cornerRadius: null,
				backgroundColor: null,
				padding: null,
				showBBCode: false,
			};

			return this;
		}

		/**
		 * @return {RecentItem}
		 */
		createSubtitleAvatar()
		{
			if (!this.shouldShowSubtitleAvatar())
			{
				return this;
			}

			const message = this.getItemMessage();
			const dialog = this.getDialogItem();

			this.subtitleAvatar = ChatAvatar
				.createFromDialogId(message.senderId, { chatId: dialog?.chatId, messageId: message.id })
				.getRecentItemSubtitleAvatarProps();

			return this;
		}

		/**
		 * @return {boolean}
		 */
		shouldShowSubtitleAvatar()
		{
			if (this.#subtitleAvatarVisible === null)
			{
				this.#subtitleAvatarVisible = this.computeShouldShowSubtitleAvatar();
			}

			return this.#subtitleAvatarVisible;
		}

		/**
		 * @return {boolean}
		 */
		computeShouldShowSubtitleAvatar()
		{
			if (!Feature.isChatRecentSubtitleAvatarSupported)
			{
				return false;
			}

			if (this.hasDraft())
			{
				return false;
			}

			if (!DialogHelper.isDialogId(this.id))
			{
				return false;
			}

			const dialog = this.getDialogItem();
			if (!Type.isPlainObject(dialog) || Type.isArrayFilled(dialog.inputActions))
			{
				return false;
			}

			if (DialogHelper.createByModel(dialog)?.isOpenlines)
			{
				return false;
			}

			const message = this.getItemMessage();
			if (!Type.isPlainObject(message) || !message.id)
			{
				return false;
			}

			const { senderId } = message;
			if (!senderId || senderId === serviceLocator.get('core').getUserId())
			{
				return false;
			}

			const sender = serviceLocator.get('core').getStore().getters['usersModel/getById'](senderId);
			if (!sender)
			{
				return false;
			}

			const senderUserHelper = UserHelper.createByModel(sender);
			if (senderUserHelper?.isCopilotBot && (dialog.userCounter ?? 0) <= 2)
			{
				return false;
			}

			return true;
		}

		/**
		 * @deprecated use to AvatarDetail
		 * @return RecentItem
		 */
		createImageUrl()
		{
			const item = this.getModelItem();
			this.imageUrl = ChatAvatar.createFromDialogId(item.id).getAvatarUrl();

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createColor()
		{
			return this;
		}

		/**
		 * @return RecentItem
		 */
		createBackgroundColor()
		{
			return this;
		}

		/**
		 * @return RecentItem
		 */
		createDate()
		{
			const getOrder = this.getRenderProperty('getOrder');
			if (Type.isFunction(getOrder))
			{
				this.date = getOrder(this);

				return this;
			}

			const date = DateHelper.cast(this.getItemDate(), new Date());
			this.date = Math.round(date.getTime() / 1000);

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createDisplayedDate()
		{
			const getDisplayedDate = this.getRenderProperty('getDisplayedDate');
			if (Type.isFunction(getDisplayedDate))
			{
				this.displayedDate = getDisplayedDate(this);

				return this;
			}

			const date = DateHelper.cast(this.getItemDate(), null);
			this.displayedDate = DateFormatter.getRecentFormat(date);

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createMessageCount()
		{
			const dialog = this.getDialogItem();

			const counter = this.getCounter();
			if (counter)
			{
				this.messageCount = counter;
			}

			if (dialog)
			{
				this.messageCount = (counter === 1 && this.hasMention()) ? 0 : counter;
			}

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createUnread()
		{
			const isManuallyUnread = this.getModelItem().unread === true
				|| this.getCounterState()?.isMarkedAsUnread === true;

			// Tabs that hide the counter (Channels) must not render an unread dot
			// for a manual "read later" mark. Matches web behavior.
			const showCounter = this.getRenderProperty('showCounter', true);

			this.unread = showCounter && isManuallyUnread;

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createSectionCode()
		{
			this.sectionCode = this.getModelItem().pinned
				? RecentItemSectionCode.pinned
				: RecentItemSectionCode.general
			;

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createSortValues()
		{
			this.sortValues = {
				order: this.date,
			};

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createMenuMode()
		{
			this.menuMode = 'dialog';

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createActions()
		{
			return this;
		}

		/**
		 * @return RecentItem
		 */
		createParams()
		{
			return this;
		}

		/**
		 * @return RecentItem
		 */
		createAvatar()
		{
			const modelItem = this.getModelItem();
			this.avatar = ChatAvatar.createFromDialogId(modelItem.id).getRecentItemAvatarProps();

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createAvatarStyle()
		{
			if (Feature.isImageInRecentAvatarStyleAvailable)
			{
				const isMessagesAutoDeleteEnabled = this.getDialogHelper()?.isMessagesAutoDeleteDelayEnabled;

				if (isMessagesAutoDeleteEnabled)
				{
					this.styles.avatar = {
						image: {
							name: Icon.TIMER_DOT.getIconName(),
							tintColor: Color.base2.toHex(),
						},
					};
				}
			}

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createMutedTitleStyle()
		{
			const isMuted = this.getDialogHelper()?.isMuted;

			if (isMuted)
			{
				this.styles.title = merge(this.styles.title, {
					additionalImage: {
						name: 'name_status_mute',
					},
				});
			}

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createTitleStyle()
		{
			return this;
		}

		/**
		 * @return RecentItem
		 */
		createSubtitleStyle()
		{
			this.styles.subtitle = { showBBCode: true };

			const message = this.getItemMessage();
			const dialog = this.getDialogItem();
			let subtitleStyle = {};

			const hasInputAction = Type.isArrayFilled(dialog?.inputActions);
			if (hasInputAction)
			{
				const typingAnimationColor = Feature.isChatRecentSubtitleAvatarSupported
					? Color.accentMainPrimaryalt.toHex()
					: '#777777';

				subtitleStyle = {
					animation: {
						color: typingAnimationColor,
						type: 'bubbles',
					},
				};

				this.styles.subtitle = merge(this.styles.subtitle, subtitleStyle);

				return this;
			}

			if (message.senderId === serviceLocator.get('core').getUserId())
			{
				subtitleStyle = {
					image: {
						name: Icon.REPLY.getIconName(),
						sizeMultiplier: 0.7,
					},
				};

				if (message?.subTitleIcon && message?.subTitleIcon !== '')
				{
					subtitleStyle = { image: { name: message.subTitleIcon, sizeMultiplier: 0.7 } };
				}

				this.styles.subtitle = merge(this.styles.subtitle, subtitleStyle);

				return this;
			}

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createDateStyle()
		{
			const item = this.getModelItem();
			const message = this.getItemMessage();
			const isMessageFromCurrentUser = message.senderId === serviceLocator.get('core').getUserId();

			let name = '';
			let url = '';
			let sizeMultiplier = 0.7;
			let tintColor = '';

			if (this.hasReaction() && !Feature.isRecentLikeAvailable)
			{
				url = this.getImageUrlByFileName('status_reaction.png');
				name = Icon.HEART.getIconName();
				tintColor = Color.accentMainAlert.toHex();
				sizeMultiplier = 1.2;
			}
			else if (isMessageFromCurrentUser && !this.hasDraft())
			{
				switch (message.status)
				{
					case MessageStatus.received: {
						name = Icon.CHECK.getIconName();
						tintColor = Color.base4.toHex();

						break;
					}

					case MessageStatus.error: {
						name = 'message_error';
						break;
					}

					case MessageStatus.delivered: {
						name = Icon.DOUBLE_CHECK.getIconName();
						tintColor = Color.accentMainPrimaryalt.toHex();

						break;
					}

					default:
					{
						if (item.pinned && !Feature.isPinInRecentStyleAvailable)
						{
							name = Icon.PIN.getIconName();
							sizeMultiplier = 0.9;
						}
					}
				}
			}
			else if (item.pinned && !Feature.isPinInRecentStyleAvailable)
			{
				name = Icon.PIN.getIconName();
				sizeMultiplier = 0.9;
			}
			else
			{
				return this;
			}

			const dateStyle = {
				image: {
					sizeMultiplier,
					url,
				},
			};

			if (name !== '')
			{
				dateStyle.image.name = name;
			}

			if (tintColor !== '')
			{
				dateStyle.image.tintColor = tintColor;
			}

			this.styles.date = dateStyle;

			return this;
		}

		createMentionStyle()
		{
			if (this.hasMention())
			{
				this.styles.mentions = {
					backgroundColor: Color.accentMainPrimary.toHex(),
					image: {
						name: Icon.SMALL_MENTION.getIconName(),
						tintColor: Color.baseWhiteFixed.toHex(),
						contentHeight: 16,
					},
				};
			}

			return this;
		}

		needShowLikes()
		{
			const dialog = this.getDialogItem();
			const counter = dialog?.counter ?? 0;

			if (!this.hasReaction() || (counter > 1 && this.hasMention()))
			{
				return false;
			}

			return true;
		}

		createLikesStyle()
		{
			if (!Feature.isRecentLikeAvailable || !this.needShowLikes())
			{
				return this;
			}

			this.styles.like = {
				backgroundColor: Color.accentMainAlert.toHex(),
				image: {
					name: Icon.HEART.getIconName(),
					tintColor: Color.baseWhiteFixed.toHex(),
					contentHeight: 16,
				},
			};

			return this;
		}

		/**
		 * @returns {RecentItem}
		 */
		createCommentsStyle()
		{
			return this;
		}

		/**
		 * @return RecentItem
		 */
		createCounterStyle()
		{
			this.styles.counter.backgroundColor = this.isMute ? Theme.colors.base5 : Theme.colors.accentMainPrimaryalt;

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createPinnedStyle()
		{
			const item = this.getModelItem();
			if (Feature.isPinInRecentStyleAvailable && item.pinned)
			{
				this.styles.pin = {
					image: {
						name: Icon.PIN.getIconName(),
						tintColor: Color.base4.toHex(),
					},
				};
			}

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createCounterTestId()
		{
			if (this.messageCount === 0 && !this.unread)
			{
				this.counterTestId = null;

				return this;
			}

			const prefix = CounterPrefix.listItemCounter;
			const dialogId = this.getModelItem().id;
			const suffix = CounterSuffix.messages;
			const value = this.messageCount > 0 ? this.messageCount : CounterValue.unread;
			const postfix = this.isMute ? CounterPostfix.muted : CounterPostfix.unmuted;

			this.counterTestId = `${prefix}-${dialogId}-${suffix}-${value}-${postfix}`;

			return this;
		}

		/**
		 * Sorts a copy of `this.actions` by `ContextMenuActionOrder` for popup rendering.
		 * Subclasses may override if popup order must differ (see OpenlineItem).
		 * @return {Array<RecentWidgetItemAction>}
		 */
		createContextMenuActions()
		{
			return [...this.actions].sort(
				(a, b) => this.#getContextMenuOrderIndex(a) - this.#getContextMenuOrderIndex(b),
			);
		}

		/**
		 * @param {RecentWidgetItemAction} action
		 * @return {number}
		 */
		#getContextMenuOrderIndex(action)
		{
			const index = ContextMenuActionOrder.findIndex(
				(orderedAction) => orderedAction.identifier === action.identifier,
			);

			return index === -1 ? ContextMenuActionOrder.length : index;
		}

		/**
		 * @return {RecentWidgetItemContextMenu|null}
		 */
		buildContextMenu()
		{
			if (this.#contextMenu === undefined)
			{
				this.#contextMenu = this.#computeContextMenu();
			}

			return this.#contextMenu;
		}

		/**
		 * @return {RecentWidgetItemContextMenu|null}
		 */
		#computeContextMenu()
		{
			if (!Feature.isRecentContextMenuSupported)
			{
				return null;
			}

			const actions = this.createContextMenuActions();
			if (!actions || actions.length === 0)
			{
				return null;
			}

			const items = actions.map((action) => ({
				id: action.identifier,
				title: action.title,
				iconName: action.iconName,
				sectionCode: ContextMenuSection.main,
				...action.contextMenu,
			}));

			const usedSections = new Set(items.map((item) => item.sectionCode));
			const sections = ContextMenuSectionOrder
				.filter((id) => usedSections.has(id))
				.map((id) => ({ id, title: '' }));

			return { sections, items };
		}

		/**
		 * @return {?DialoguesModelState}
		 */
		getDialogById(dialogId)
		{
			return serviceLocator.get('core').getStore().getters['dialoguesModel/getById'](dialogId);
		}

		/**
		 * @return {RecentModelState}
		 */
		getModelItem()
		{
			return this.params.model.recent;
		}

		/**
		 * {number} dialogId
		 * @return {?UsersModelState}
		 */
		getUserModelByDialogId(dialogId)
		{
			return serviceLocator.get('core').getStore().getters['usersModel/getById'](dialogId);
		}

		/**
		 * @return {DialogHelper}
		 */
		getDialogHelper()
		{
			return DialogHelper.createByDialogId(this.getModelItem().id);
		}

		/**
		 * @returns {Date}
		 */
		getItemDate()
		{
			const item = this.getModelItem();
			const uploadingLastActivityDate = item.uploadingState?.lastActivityDate;
			const draftLastActivityDate = this.getDraftModel()?.lastActivityDate;

			return draftLastActivityDate ?? uploadingLastActivityDate ?? item.lastActivityDate;
		}

		/**
		 * @returns {Date}
		 */
		getMessageDate()
		{
			const item = this.getModelItem();

			return DateHelper.cast(item.message?.date, new Date());
		}

		/**
		 * @returns {RecentMessage}
		 */
		getItemMessage()
		{
			const item = this.getModelItem();

			return item.uploadingState?.message ?? item.message;
		}

		/**
		 * @returns {MessagesModelState|null|{}}
		 */
		getModelMessage()
		{
			const message = this.getItemMessage();

			return Uuid.isV4(message?.id)
				? serviceLocator.get('core').getStore().getters['messagesModel/getByTemplateId'](message.id)
				: serviceLocator.get('core').getStore().getters['messagesModel/getById'](message.id);
		}

		/**
		 * @return {number}
		 */
		getCounter()
		{
			return this.params.model.counter;
		}

		/**
		 * @return {?CounterModelState}
		 */
		getCounterState()
		{
			return this.params.model.counterState;
		}

		/**
		 * @param {RecentModelState} [item=this.getModelItem()]
		 * @return {string}
		 */
		getMessageText(item = this.getModelItem())
		{
			const message = this.getItemMessage();
			const modelMessage = this.getModelMessage();

			const id = modelMessage?.id || modelMessage?.templateId;

			if (!id)
			{
				return parser.simplify({
					text: message.text,
					attach: message?.params?.withAttach ?? false,
					files: message?.params?.withFile ?? false,
					showFilePrefix: false,
					sticker: Type.isPlainObject(message?.sticker),
				});
			}

			const isBlockMessage = modelMessage.block && modelMessage.block.elements;
			if (isBlockMessage && !Type.isStringFilled(modelMessage.text))
			{
				return `[${Loc.getMessage('IMMOBILE_PARSER_EMOJI_TYPE_ATTACH')}]`;
			}

			const messageFiles = serviceLocator.get('core').getStore().getters['messagesModel/getMessageFiles'](id);

			return parser.simplify({
				text: modelMessage.text,
				attach: modelMessage?.params?.ATTACH ?? false,
				files: messageFiles,
				showFilePrefix: false,
				sticker: Type.isPlainObject(modelMessage?.stickerParams),
			});
		}

		/**
		 * @return {DraftModelState}
		 */
		getDraftModel()
		{
			return serviceLocator.get('core').getStore().getters['draftModel/getById'](this.id);
		}

		hasDraft()
		{
			const draft = this.getDraftModel();

			return draft && (draft.type !== DraftType.text || draft.text);
		}

		/**
		 * @return {DialoguesModelState || undefined}
		 */
		getDialogItem()
		{
			return this.params.model.dialog;
		}

		/**
		 * @return {RecentWidgetItemAction}
		 */
		getMuteAction()
		{
			return this.isMute ? UnmuteAction : MuteAction;
		}

		/**
		 * @return {RecentWidgetItemAction}
		 */
		getHideAction()
		{
			return HideAction;
		}

		/**
		 * @return {RecentWidgetItemAction}
		 */
		getPinAction()
		{
			const item = this.getModelItem();

			return item.pinned === true ? UnpinAction : PinAction;
		}

		/**
		 * @return {RecentWidgetItemAction}
		 */
		getReadAction()
		{
			const item = this.getModelItem();
			const hasUnread = item.unread === true
				|| this.unread === true
				|| this.getCounter() > 0
				|| this.getReadActionChildrenCounter() > 0;

			return hasUnread ? ReadAction : UnreadAction;
		}

		/**
		 * Aggregated unread counter of nested (child) chats taken into account when
		 * choosing between the "mark as read" and "mark as unread" menu action.
		 * Plain chats have no nested chats, so the base implementation returns 0.
		 * @return {number}
		 */
		getReadActionChildrenCounter()
		{
			return 0;
		}

		/**
		 * @return {RecentWidgetItemAction}
		 */
		getProfileAction()
		{
			return ProfileAction;
		}

		/**
		 * @return {?RecentWidgetItemAction}
		 */
		getAddToFolderAction()
		{
			if (!Feature.isChatFoldersAvailable)
			{
				return null;
			}

			if (this.getDialogHelper()?.isNested === true)
			{
				return null;
			}

			return AddToFolderAction;
		}

		getImageUrlByFileName(fileName = '')
		{
			return `${Path.toExtensions}assets/common/png/${fileName}`;
		}

		/**
		 * @param {keyof CommonRenderServiceProps['itemOptions']} name
		 * @param defaultValue
		 * @returns {*|null}
		 */
		getRenderProperty(name, defaultValue = null)
		{
			if (Type.isNil(this.params.options?.[name]))
			{
				return defaultValue;
			}

			return this.params.options[name];
		}
	}

	module.exports = {
		RecentItem,
		RecentItemSectionCode,
	};
});
