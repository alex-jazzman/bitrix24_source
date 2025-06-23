/**
 * @module im/messenger/controller/dialog/lib/header/buttons
 */
jn.define('im/messenger/controller/dialog/lib/header/buttons', (require, exports, module) => {
	const { debounce } = require('utils/function');
	const { isEqual } = require('utils/object');
	const { isOnline } = require('device/connection');

	const { DialogType, UserRole, BotCode, Analytics } = require('im/messenger/const');
	const { CallManager } = require('im/messenger/lib/integration/callmobile/call-manager');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { ChatPermission, UserPermission } = require('im/messenger/lib/permission-manager');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Logger } = require('im/messenger/lib/logger');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { MemberSelector } = require('im/messenger/controller/selector/member');

	const {
		CallAudioButton,
		CallVideoButton,
		UnsubscribedFromCommentsButton,
		SubscribedToCommentsButton,
		AddUsersButton,
		CancelMultipleSelectButton,
	} = require('im/messenger/controller/dialog/lib/header/button-configuration');

	/**
	 * @class HeaderButtons
	 */
	class HeaderButtons
	{
		/**
		 * @param {MessengerCoreStore} store
		 * @param {number|string} dialogId
		 * @param {DialogLocator} locator
		 */
		constructor({ store, dialogId, locator })
		{
			/** @private */
			this.store = store;

			/** @private */
			this.dialogId = dialogId;

			/** @private */
			this.timerId = null;

			this.buttons = [];

			this.tapHandler = debounce(this.onTap, 300, this, true);

			this.dialogLocator = locator;
		}

		/**
		 * @param {boolean} [isUpdateState=false] this only open widget
		 * @return {Array<DialogHeaderButton>}
		 */
		getButtons(isUpdateState = false)
		{
			if (this.checkSelectMessagesModeEnabled())
			{
				this.buttons = [this.getCancelMultipleSelectButton()];

				return this.buttons;
			}

			const isDialogWithUser = !DialogHelper.isDialogId(this.dialogId);
			const dialogData = this.store.getters['dialoguesModel/getById'](this.dialogId);

			const buttons = isDialogWithUser
				? this.renderUserHeaderButtons()
				: this.renderDialogHeaderButtons(dialogData)
			;

			if (isUpdateState)
			{
				this.buttons = buttons;
			}

			return buttons;
		}

		/**
		 * @param {DialogView} view
		 * @param {boolean} [isUseCallbacks=false] deprecated - use EventType.view.barButtonTap
		 */
		render(view = this.dialogLocator.get('view'), isUseCallbacks = false)
		{
			let buttons = this.getButtons();

			if (isUseCallbacks)
			{
				buttons = buttons.map((button) => {
					return { ...button, callback: () => {} };
				});
			}

			const getBtnWithoutCallback = (btn) => {
				const { callback, ...stateWithoutCallback } = btn;

				return stateWithoutCallback;
			};

			const prevStateWithoutCallback = this.buttons.map((btn) => getBtnWithoutCallback(btn));
			const newStateWithoutCallback = buttons.map((btn) => getBtnWithoutCallback(btn));

			if (isEqual(prevStateWithoutCallback, newStateWithoutCallback))
			{
				return;
			}

			Logger.info(`${this.constructor.name}.render before:`, this.buttons, ' after: ', buttons);
			this.buttons = buttons;

			view.setRightButtons(buttons);
		}

		/**
		 * @return {Array<DialogHeaderButton>}
		 * @private
		 */
		renderUserHeaderButtons()
		{
			const userData = this.store.getters['usersModel/getById'](this.dialogId);

			if (!UserPermission.isCanCall(userData))
			{
				return [];
			}

			return [CallVideoButton, CallAudioButton];
		}

		/**
		 * @param {DialoguesModelState?} dialogData
		 * @return {Array<DialogHeaderButton>} buttons
		 * @private
		 */
		renderDialogHeaderButtons(dialogData)
		{
			if (!dialogData)
			{
				return [];
			}

			return this.getButtonsByChatType(dialogData.type);
		}

		/**
		 * @param {() => any} callback
		 * @void
		 */
		renderCancelMultipleButton(callback)
		{
			this.forceRenderButtons([this.getCancelMultipleSelectButton(callback)]);
		}

		/**
		 * @param {Array<DialogHeaderButton>} buttons
		 * @param {DialogView} view
		 */
		forceRenderButtons(buttons, view = this.dialogLocator.get('view'))
		{
			Logger.info(`${this.constructor.name}.forceRenderButton before:`, this.buttons, ' after: ', buttons);
			this.buttons = buttons;
			view.setRightButtons(buttons);
		}

		/**
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
		 * @return {Array<DialogHeaderButton>}
		 */
		getDefaultChatButtons()
		{
			const dialogData = this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (!dialogData || !ChatPermission.isCanCall(dialogData))
			{
				return [];
			}

			return [CallVideoButton, CallAudioButton];
		}

		/**
		 * @return {Array<DialogHeaderButton>}
		 */
		getCommentButtons()
		{
			const dialog = this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (dialog.role === UserRole.guest)
			{
				return [];
			}

			let isUserSubscribed = false;

			const messageModel = this.store.getters['messagesModel/getById'](dialog.parentMessageId);
			if ('id' in messageModel)
			{
				const commentInfo = this.store.getters['commentModel/getByMessageId'](dialog.parentMessageId);

				if (commentInfo)
				{
					isUserSubscribed = commentInfo.isUserSubscribed;
				}

				if (!commentInfo && messageModel.authorId === serviceLocator.get('core').getUserId())
				{
					isUserSubscribed = true;
				}
			}

			if (!isUserSubscribed)
			{
				return [UnsubscribedFromCommentsButton];
			}

			return [SubscribedToCommentsButton];
		}

		getCopilotButtons()
		{
			return this.renderAddUserButton();
		}

		/**
		 * @return {DialogHeaderButton}
		 * @private
		 */
		renderAddUserButton()
		{
			const dialogData = this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (!dialogData || !ChatPermission.isCanAddParticipants(dialogData))
			{
				return [];
			}

			return [AddUsersButton];
		}

		/**
		 * @param {() => any} callback
		 * @return {DialogHeaderButton}
		 */
		getCancelMultipleSelectButton(callback)
		{
			return {
				...CancelMultipleSelectButton,
				callback,
			};
		}

		/**
		 * @private
		 * @param {string} buttonId
		 */
		onTap(buttonId)
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
					CallManager.getInstance().createVideoCall(this.dialogId);
					break;
				}

				case CallAudioButton.id: {
					CallManager.getInstance().sendAnalyticsEvent(this.dialogId, Analytics.Element.audiocall, Analytics.Section.chatWindow);
					CallManager.getInstance().createAudioCall(this.dialogId);
					break;
				}

				case SubscribedToCommentsButton.id: {
					Notification.showToast(ToastType.unsubscribeFromComments, this.dialogLocator.get('view').ui);
					this.dialogLocator.get('chat-service').unsubscribeFromComments(this.dialogId);

					break;
				}

				case UnsubscribedFromCommentsButton.id: {
					Notification.showToast(ToastType.subscribeToComments, this.dialogLocator.get('view').ui);
					this.dialogLocator.get('chat-service').subscribeToComments(this.dialogId);

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

		callUserAddWidget()
		{
			Logger.log(`${this.constructor.name}.callMemberSelector`);

			const memberSelector = new MemberSelector({
				onSelectMembers: this.onSelectMembers,
			});

			memberSelector.open();
		}

		onSelectMembers = (membersIds) => {
			const chatSettings = Application.storage.getObject('settings.chat', {
				historyShow: true,
			});

			const chatId = this.store.getters['dialoguesModel/getById'](this.dialogId).chatId;
			const showHistory = chatSettings.historyShow;

			const chatService = this.dialogLocator.get('chat-service');
			chatService.addToChat(chatId, membersIds, showHistory)
				.catch((errors) => {
					Logger.error('MemberSelector.onSelectMembers error: ', errors);
				})
			;
		};

		/**
		 * @param {DialoguesModelState?} dialogData
		 * @return {boolean}
		 * @private
		 */
		isDialogCopilot(dialogData)
		{
			this.isCopilot = dialogData?.type === DialogType.copilot;

			return this.isCopilot;
		}

		/**
		 * @return {boolean}
		 */
		checkSelectMessagesModeEnabled()
		{
			return this.dialogLocator.get('select-manager')?.isSelectMessagesModeEnabled() ?? false;
		}
	}

	module.exports = { HeaderButtons };
});
