/**
 * @module im/messenger/controller/chat-composer/create/group-chat
 */
jn.define('im/messenger/controller/chat-composer/create/group-chat', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Color } = require('tokens');
	const { NotifyManager } = require('notify-manager');
	const { isEqual } = require('utils/object');

	const { NestedDepartmentSelector } = require('selector/widget/entity/tree-selectors/nested-department-selector');
	const {
		DialogType,
		EntitySelectorElementType,
		OpenDialogContextType,
	} = require('im/messenger/const');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { EntitySelectorHelper } = require('im/messenger/lib/helper');

	const { ChatService } = require('im/messenger/provider/services/chat');

	const { GroupChatView } = require('im/messenger/controller/chat-composer/lib/view/group-chat');
	const { showClosingSelectorAlert } = require('im/messenger/controller/chat-composer/lib/confirm');

	const logger = LoggerManager.getInstance().getLogger('chat-composer--channel');

	/**
	 * @class CreateGroupChat
	 */
	class CreateGroupChat
	{
		/**
		 * @param {number} parentChatId
		 */
		constructor(parentChatId)
		{
			this.dialogInfo = {
				name: '',
				description: '',
				avatar: '',
				type: DialogType.chat,
				userCounter: 0,
				members: EntitySelectorHelper.createUserList([serviceLocator.get('core').getUserId()]),
				parentChatId,
			};
			/** @type {Array<NestedDepartmentSelectorItem>} */
			this.participants = [];
			/** @type {ChannelView | null} */
			this.mainView = null;

			this.layoutWidget = null;
			this.selectorWidget = null;
		}

		/**
		 * @param {CreateGroupChatOpenProps} props
		 * @param parentWidget
		 *
		 * @return Promise<LayoutWidget>
		 */
		async open(props = {}, parentWidget = PageManager)
		{
			this.selector = new NestedDepartmentSelector({
				initSelectedIds: this.dialogInfo.members,
				undeselectableIds: EntitySelectorHelper.createUserList([serviceLocator.get('core').getUserId()]),
				widgetParams: {
					title: Loc.getMessage('IMMOBILE_CHAT_COMPOSER_CREATE_GROUP_CHAT_TITLE'),
					sendButtonName: Loc.getMessage('IMMOBILE_CHAT_COMPOSER_USER_SELECTOR_CONTINUE_BUTTON'),
				},
				leftButtons: this.#buildLeftButtons(props),
				allowMultipleSelection: true,
				closeOnSelect: true,
				events: {
					onClose: (selectedEntity) => {
						/*
						Move to the recent tab because if the last selected tab was department and in the next step,
						the selector will draw the recent items, but the tab will not be updated.
						*/
						this.selectorWidget.setScopeById('recent');

						this.onCloseParticipantSelector(selectedEntity);
					},
				},
				createOptions: {
					enableCreation: false,
				},
				selectOptions: {
					canUnselectLast: true,
					singleEntityByType: false,
				},
				canUseRecent: false,
				provider: {
					context: 'IMMOBILE_UPDATE_GROUP_CHAT_PARTICIPANT',
					options: {
						useLettersForEmptyAvatar: true,
						allowFlatDepartments: true,
						allowSelectRootDepartment: true,
						addMetaUser: false,
					},
				},
			});

			const selector = this.selector.getSelector();

			selector.close = () => {
				selector.onClose();

				return new Promise((resolve) => {
					if (!selector.widget)
					{
						return resolve();
					}

					selector.handleOnEventsCallback('onWidgetClosed', selector.getEntityItems());
				});
			};

			selector.onViewHidden = () => {
				if (selector.widget !== null)
				{
					selector.handleOnEventsCallback('onViewHidden');
				}
			};

			const selectorShowWidgetParams = props.selectorShowWidgetParams ?? {};
			selector.show(
				{
					widgetParams: selectorShowWidgetParams,
				},
				parentWidget,
			)
				.then((selectorWidget) => {
					this.selectorWidget = selectorWidget;
				})
				.catch((error) => {
					logger.error(`${this.constructor.name}.onClickParticipantAction.selector.show.catch:`, error);
				})
			;
		}

		/**
		 * @param {CreateGroupChatOpenProps} props
		 * @return {Array}
		 */
		#buildLeftButtons(props)
		{
			if (!props?.showLeftButtons)
			{
				return [];
			}

			return [
				{
					id: 'immobile_selector_back_button',
					type: 'back',
					callback: () => {
						const currentItems = this.selector.getSelector().getCurrentSelectedItems().map((item) => {
							return [item.params.type, item.params.id];
						});

						if (isEqual([...this.dialogInfo.members], currentItems))
						{
							this.selectorWidget.back();

							return;
						}

						showClosingSelectorAlert({
							onClose: () => {
								this.selectorWidget.back();
							},
							onCancel: () => {},
						});
					},
				},
			];
		}

		/**
		 * @protected
		 * @param {object} props
		 * @param parentWidget
		 *
		 * @return Promise<LayoutWidget>
		 */
		async openMainView(props = {}, parentWidget = PageManager)
		{
			let resolveOpen = () => {};

			let rejectOpen = () => {};
			const openPromise = new Promise((resolve, reject) => {
				resolveOpen = resolve;
				rejectOpen = reject;
			});

			try
			{
				const widgetName = 'layout';
				/**
				 * @type PageManagerProps
				 */
				const widgetParams = {
					titleParams: this.getTitleParams(),
					useLargeTitleMode: true,
					backgroundColor: Color.bgSecondary.toHex(),
				};

				if (parentWidget === PageManager)
				{
					widgetParams.backdrop = {
						mediumPositionPercent: 85,
						horizontalSwipeAllowed: false,
						onlyMediumPosition: true,
					};
				}

				this.mainView = GroupChatView.openToCreate(this.getDialogInfoProps(props));

				parentWidget.openWidget(widgetName, widgetParams)
					.then((layoutWidget) => {
						this.layoutWidget = layoutWidget;
						layoutWidget.showComponent(this.mainView);

						resolveOpen(layoutWidget);
					})
					.catch((error) => {
						logger.error(error);

						rejectOpen(error);
					});
			}
			catch (error)
			{
				logger.error(error);

				rejectOpen(error);
			}

			return openPromise;
		}

		/** @protected */
		getTitleParams()
		{
			return {
				text: Loc.getMessage('IMMOBILE_CHAT_COMPOSER_CREATE_GROUP_CHAT_TITLE'),
				type: 'dialog',
			};
		}

		/**
		 * @protected
		 * @return {ChannelViewProps}
		 */
		getDialogInfoProps(props)
		{
			return {
				...props,
				name: this.dialogInfo.name,
				description: this.dialogInfo.description,
				avatar: this.dialogInfo.avatar,
				type: this.dialogInfo.type,
				userCounter: this.dialogInfo.userCounter,
				callbacks: {
					onClickCreateButton: this.onClickCreate.bind(this),
					onChangeAvatar: this.onChangeAvatar.bind(this),
					onChangeMessagesAutoDeleteDelay: this.onChangeMessagesAutoDeleteDelay.bind(this),
					onDestroy: () => {
						this.mainView = null;
					},
				},
			};
		}

		/**
		 * @protected
		 * @param {Array<Object>} selectedEntity
		 */
		onCloseParticipantSelector(selectedEntity)
		{
			this.participants = selectedEntity;

			this.openMainView({
				participantsList: selectedEntity,
			}, this.selectorWidget);
		}

		/**
		 * @protected
		 * @param {{ title: string, description: string }} params
		 */
		onClickCreate({ title, description })
		{
			this.dialogInfo.name = title;
			this.dialogInfo.description = description;

			this.create()
				.then((result) => {
					NotifyManager.hideLoadingIndicatorWithoutFallback();
					const chatId = result.chatId;

					this.#openChat(chatId);
				})
				.catch((error) => {
					NotifyManager.hideLoadingIndicator(false);
					logger.error(`${this.constructor.name}.create group chat error`, error);
				})
			;
		}

		/**
		 * @protected
		 * @param {string} avatar
		 */
		onChangeAvatar(avatar)
		{
			this.dialogInfo.avatar = avatar;
		}

		/**
		 * @protected
		 * @param {string} delay
		 */
		onChangeMessagesAutoDeleteDelay(delay)
		{
			this.dialogInfo.messagesAutoDeleteDelay = delay;
		}

		/** @protected */
		async create()
		{
			const config = {
				type: 'CHAT',
				title: this.dialogInfo.name ?? '',
				description: '',
				ownerId: serviceLocator.get('core').getUserId(),
				memberEntities: this.getMemberEntities(),
				searchable: 'N',
				parentChatId: this.dialogInfo.parentChatId,
			};

			if (this.dialogInfo.avatar)
			{
				config.avatar = this.dialogInfo.avatar;
			}

			if (this.dialogInfo.messagesAutoDeleteDelay)
			{
				config.messagesAutoDeleteDelay = this.dialogInfo.messagesAutoDeleteDelay;
			}

			const chatService = new ChatService();

			NotifyManager.showLoadingIndicator();

			return chatService.createChat(config);
		}

		/** @protected */
		getMemberEntities()
		{
			const currentUserId = serviceLocator.get('core').getUserId();

			this.dialogInfo.members = EntitySelectorHelper.getMemberList(this.participants);

			const isCurrentUserAddedToMembers = this.dialogInfo.members.some(([type, id]) => {
				return type === EntitySelectorElementType.user && Number(id) === currentUserId;
			});

			if (!isCurrentUserAddedToMembers)
			{
				this.dialogInfo.members.push(EntitySelectorHelper.createUserElement(currentUserId));
			}

			return this.dialogInfo.members;
		}

		/**
		 * @param {number} chatId
		 */
		async #openChat(chatId)
		{
			this.layoutWidget.close();

			try
			{
				await serviceLocator.get('dialog-manager').openDialog({
					dialogId: `chat${chatId}`,
					context: OpenDialogContextType.chatCreation,
				});
			}
			catch (e)
			{
				logger.error(`${this.constructor.name}.#openChat error:`, e);
			}
		}
	}

	module.exports = { CreateGroupChat };
});
