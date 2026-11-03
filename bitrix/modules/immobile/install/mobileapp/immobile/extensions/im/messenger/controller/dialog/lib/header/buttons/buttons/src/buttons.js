/**
 * @module im/messenger/controller/dialog/lib/header/buttons/buttons/buttons
 */
jn.define('im/messenger/controller/dialog/lib/header/buttons/buttons/buttons', (require, exports, module) => {
	const { isOnline } = require('device/connection');
	const { requireLazy } = require('require-lazy');

	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');

	const {
		Analytics,
		UserRole,
		DialogType,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { CallManager } = require('im/messenger/lib/integration/callmobile/call-manager');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const {
		Notification,
		ToastType,
	} = require('im/messenger/lib/ui/notification');
	const {
		ChatPermission,
		UserPermission,
	} = require('im/messenger/lib/permission-manager');
	const { Logger } = require('im/messenger/lib/logger');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const {
		CallAudioButton,
		CallVideoButton,
		UnsubscribedFromCommentsButton,
		SubscribedToCommentsButton,
		AddUsersButton,
	} = require('im/messenger/controller/dialog/lib/header/buttons/buttons/button-configuration');

	/**
	 * @class HeaderButtons
	 * @implements {IDialogHeaderButtons}
	 */
	class HeaderButtons
	{
		/**
		 * @param {() => DialoguesModelState} getDialog
		 * @param {RelatedEntityData} relatedEntity
		 */
		constructor({ getDialog, relatedEntity })
		{
			/**
			 * @protected
			 * @type {() => DialoguesModelState}
			 * */
			this.getDialog = getDialog;

			/**
			 * @protected
			 * @type {RelatedEntityData}
			 * */
			this.relatedEntity = relatedEntity;

			/**
			 * @private
			 */
			this.store = serviceLocator.get('core').getStore();

			/**
			 * @type {IServiceLocator<DialogLocatorServices>|null}
			 */
			this.dialogLocator = null;
		}

		get dialogId()
		{
			return this.getDialog().dialogId;
		}

		/**
		 * @param {IServiceLocator<DialogLocatorServices>} dialogLocator
		 */
		setDialogLocator(dialogLocator)
		{
			this.dialogLocator = dialogLocator;
		}

		/**
		 * @protected
		 * @return {Array<DialogHeaderButton>}
		 */
		getButtons()
		{
			const isDialogWithUser = !DialogHelper.isDialogId(this.dialogId);
			const dialogData = this.store.getters['dialoguesModel/getById'](this.dialogId);

			return isDialogWithUser
				? this.getUserHeaderButtons()
				: this.getDialogHeaderButtons(dialogData)
			;
		}

		/**
		 * @protected
		 * @param {string} buttonId
		 * @return void
		 */
		tapHandler(buttonId)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			switch (buttonId)
			{
				case CallVideoButton.id: {
					CallManager.getInstance().sendAnalyticsEvent(this.dialogId, Analytics.Element.videocall, Analytics.Section.chatWindow);
					void CallManager.getInstance().createVideoCall(this.dialogId);
					break;
				}

				case CallAudioButton.id: {
					CallManager.getInstance().sendAnalyticsEvent(this.dialogId, Analytics.Element.audiocall, Analytics.Section.chatWindow);
					void CallManager.getInstance().createAudioCall(this.dialogId);
					break;
				}

				case SubscribedToCommentsButton.id: {
					Notification.showToast(ToastType.unsubscribeFromComments, this.dialogLocator?.get('view').ui);
					this.dialogLocator?.get('chat-service').unsubscribeFromComments(this.dialogId);

					break;
				}

				case UnsubscribedFromCommentsButton.id: {
					Notification.showToast(ToastType.subscribeToComments, this.dialogLocator?.get('view').ui);
					this.dialogLocator?.get('chat-service').subscribeToComments(this.dialogId);

					break;
				}

				case AddUsersButton.id: {
					this.callUserAddWidget();
					break;
				}

				default: {
					break;
				}
			}
		}

		/**
		 * @private
		 * @return {Array<DialogHeaderButton>}
		 * @private
		 */
		getUserHeaderButtons()
		{
			const userData = this.store.getters['usersModel/getById'](this.dialogId);

			if (!UserPermission.canCall(userData))
			{
				return [];
			}

			return [CallVideoButton, CallAudioButton];
		}

		/**
		 * @private
		 * @param {DialoguesModelState?} dialogData
		 * @return {Array<DialogHeaderButton>} buttons
		 */
		getDialogHeaderButtons(dialogData)
		{
			if (!dialogData)
			{
				return [];
			}

			return this.getButtonsByChatType(dialogData.type);
		}

		/**
		 * @private
		 * @param {DialogType} type
		 * @return {Array<DialogHeaderButton>}
		 */
		getButtonsByChatType(type)
		{
			// eslint-disable-next-line sonarjs/no-small-switch
			switch (type)
			{
				case DialogType.comment: {
					return this.getCommentButtons();
				}

				case DialogType.copilot: {
					return this.getCopilotButtons();
				}

				default: {
					return this.getDefaultChatButtons();
				}
			}
		}

		/**
		 * @private
		 * @return {Array<DialogHeaderButton>}
		 */
		getDefaultChatButtons()
		{
			const dialogData = this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (!dialogData || !ChatPermission.canCall(dialogData))
			{
				return [];
			}

			return [CallVideoButton, CallAudioButton];
		}

		/**
		 * @private
		 * @return {Array<DialogHeaderButton>}
		 */
		getCommentButtons()
		{
			const dialog = this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (dialog.role === UserRole.guest)
			{
				return [];
			}

			const commentInfo = this.store.getters['commentModel/getByDialogId'](this.dialogId);
			if (Type.isPlainObject(commentInfo))
			{
				return commentInfo.isUserSubscribed
					? [SubscribedToCommentsButton]
					: [UnsubscribedFromCommentsButton]
				;
			}

			let isUserSubscribed = false;
			const messageModel = this.store.getters['messagesModel/getById'](dialog.parentMessageId);
			if ('id' in messageModel)
			{
				isUserSubscribed = messageModel.authorId === serviceLocator.get('core').getUserId();
			}

			return isUserSubscribed
				? [SubscribedToCommentsButton]
				: [UnsubscribedFromCommentsButton]
			;
		}

		/**
		 * @private
		 * @return {DialogHeaderButton|*}
		 */
		getCopilotButtons()
		{
			return this.renderAddUserButton();
		}

		/**
		 * @private
		 * @return {DialogHeaderButton}
		 */
		renderAddUserButton()
		{
			const dialogData = this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (!dialogData || !ChatPermission.canAddParticipants(dialogData))
			{
				return [];
			}

			return [AddUsersButton];
		}

		/**
		 * @desc The selector of the "add members" window, asked for on the first tap and kept afterwards.
		 * The header is drawn for every dialog that opens, so the tree of the org structure, its
		 * provider, the chat service and the guard of the parent project are not loaded with it.
		 * @private
		 * @return {Promise<Object>}
		 */
		async getMemberEntitySelector()
		{
			this.memberEntitySelectorModule ??= await requireLazy('im:messenger/controller/selector/member-entity');

			return this.memberEntitySelectorModule.MemberEntitySelector;
		}

		/**
		 * @private
		 */
		callUserAddWidget()
		{
			Logger.log(`${this.constructor.name}.callUserAddWidget`);

			AnalyticsService.getInstance().sendUserAddButtonClicked({
				dialogId: this.dialogId,
				section: Analytics.Section.chatHeader,
			});

			// A refusal to open is not dropped: `open()` passes it on, and without a handler here it
			// would become an unhandled rejection. A refusal to load the selector is told about the
			// same way: the window simply never opens.
			this.openMemberEntitySelector().catch((error) => {
				Logger.error(`${this.constructor.name}.callUserAddWidget.catch:`, error);
			});
		}

		/**
		 * @private
		 * @return {Promise<void>}
		 */
		async openMemberEntitySelector()
		{
			const MemberEntitySelector = await this.getMemberEntitySelector();

			const selector = new MemberEntitySelector({
				dialogId: this.dialogId,
				onSelectMemberEntities: this.onSelectMemberEntities,
			});

			await selector.open();
		}

		/**
		 * @param {Array<MemberEntity>} addedEntities the part of the selection the chat does not have
		 * yet: the selector counts it against the composition the window was opened with
		 */
		onSelectMemberEntities = async (addedEntities) => {
			// One tap costs two requests at most, and they are the calls themselves: the delta comes
			// counted from the selector. `Confirm Access` holds the wait for the user as well, so that
			// its time is told apart from the time of the calls.
			const point = new PerfPoint('IM Add Members Submit', `dialog ${this.dialogId}`).start();

			try
			{
				// The two calls take people and nodes and nothing else, so an element of any other type
				// never reaches the server. It is reported instead of being dropped: silence here reads
				// as "the whole selection went through".
				const MemberEntitySelector = await this.getMemberEntitySelector();

				const {
					userIds,
					structureNodes,
					unsupportedEntities,
				} = MemberEntitySelector.splitEntities(addedEntities);

				if (userIds.length === 0 && structureNodes.length === 0)
				{
					// The alert waits for the user, so the measurement stops before it.
					point.end();
					await MemberEntitySelector.showUnsupportedEntitiesError(unsupportedEntities);

					return;
				}

				const dialog = this.store.getters['dialoguesModel/getById'](this.dialogId);
				if (!dialog)
				{
					Logger.error(`${this.constructor.name}.onSelectMemberEntities: unknown dialog`, this.dialogId);

					return;
				}

				// The confirmation waits for the user, and that wait is unavoidable: it happens before
				// the calls. It gets a measurement of its own so that it is told apart from the network.
				point.startPoint('Confirm Access');
				const isConfirmed = await MemberEntitySelector.confirmAdditionToProjectChildChat(dialog, addedEntities);
				point.endPoint('Confirm Access', { isConfirmed });
				if (!isConfirmed)
				{
					return;
				}

				const chatSettings = Application.storage.getObject('settings.chat', {
					historyShow: true,
				});

				const { usersErrors, nodesErrors } = await MemberEntitySelector.sendEntities({
					chatService: this.dialogLocator.get('chat-service'),
					chatId: dialog.chatId,
					userIds,
					structureNodes,
					historyShow: chatSettings.historyShow,
					probe: {
						onUsersCallStart: () => point.startPoint('Add Users'),
						onUsersCallEnd: () => point.endPoint('Add Users', { itemsCount: userIds.length }),
						onNodesCallStart: () => point.startPoint('Link Nodes'),
						onNodesCallEnd: () => point.endPoint('Link Nodes', { itemsCount: structureNodes.length }),
					},
				});

				// The alerts below wait for the user, so the measurement stops with the calls. The
				// `finally` below only covers the branches that never get here.
				point.end();

				// The linking is confirmed before the alerts and not after them: an alert dismissed with
				// the system back button never resolves, and word of what went through must not wait on
				// word of what did not.
				if (!nodesErrors)
				{
					MemberEntitySelector.showStructureNodesLinkedToast(structureNodes.length);
				}

				// Each call is told about on its own: they are independent, and a message about the whole
				// selection would name a part that is in the chat already.
				await MemberEntitySelector.showCallError(usersErrors);
				await MemberEntitySelector.showCallError(nodesErrors);
				await MemberEntitySelector.showUnsupportedEntitiesError(unsupportedEntities);
			}
			catch (errors)
			{
				Logger.error('MemberEntitySelector.onSelectMemberEntities error: ', errors);

				// The alert waits for the user, so the measurement stops before it.
				point.end();

				// A failure of the handler is told about in the words a refused call is told about by:
				// this entry point has nothing of its own to say it with. A throw is not a list of
				// errors of the server, so what is not a list goes on as an empty one.
				const MemberEntitySelector = await this.getMemberEntitySelector();
				await MemberEntitySelector.showCallError(Type.isArray(errors) ? errors : []);
			}
			finally
			{
				point.end();
			}
		};

		/**
		 * @param {string} chatType
		 * @return {Array<DialogHeaderButton>}
		 */
		getButtonsForOptimisticChat(chatType)
		{
			// eslint-disable-next-line sonarjs/no-small-switch
			switch (chatType)
			{
				case DialogType.copilot:
					return [AddUsersButton];

				default:
					return [];
			}
		}

		/**
		 * @private
		 * @param {DialoguesModelState?} dialogData
		 * @return {boolean}
		 */
		isDialogCopilot(dialogData)
		{
			this.isCopilot = dialogData?.type === DialogType.copilot;

			return this.isCopilot;
		}
	}

	module.exports = {
		HeaderButtons,
	};
});
