/* eslint no-undef: 0 */
/**
 * @module im/messenger/controller/dialog/lib/message-menu/controller
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/controller', (require, exports, module) => {
	const { Type } = require('type');
	const { Haptics } = require('haptics');
	const { clone } = require('utils/object');

	const {
		EventType,
		OwnMessageStatus,
		MessageComponent,
		AiTasksStatusType,
		MessageType,
	} = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { getLogger } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');

	const { MessageMenuActionHelper } = require('im/messenger/controller/dialog/lib/message-menu/src/message-action-helper');
	const { OneLevelMessageMenuManager } = require('im/messenger/controller/dialog/lib/message-menu/src/one-level/manager');
	const { MultiLevelMessageMenuManager } = require('im/messenger/controller/dialog/lib/message-menu/src/multi-level/manager');

	const logger = getLogger('dialog--message-menu');

	/**
	 * @class MessageMenuController
	 */
	class MessageMenuController
	{
		/**
		 * @param {MessageMenuControllerCreateParams} params
		 */
		constructor({ dialogLocator, getDialog })
		{
			/** @type {DialogLocator} */
			this.dialogLocator = dialogLocator;
			this.getDialog = getDialog;
			this.store = dialogLocator.get('store');

			/** @type {IOneLevelMessageMenuManager|IMultiLevelMessageMenuManager} */
			this.menuManager = null;

			this.messageLongTapHandler = this.onMessageLongTap.bind(this);
			this.messageMenuActionTapHandler = this.onMessageMenuActionTap.bind(this);
			this.messageMenuReactionTapHandler = this.onMessageMenuReactionTap.bind(this);
		}

		get dialogId()
		{
			return this.getDialog().dialogId;
		}

		subscribeEvents()
		{
			this.dialogLocator.get('view')
				.on(EventType.dialog.messageMenuActionTap, this.messageMenuActionTapHandler)
				.on(EventType.dialog.messageMenuReactionTap, this.messageMenuReactionTapHandler)
				.on(EventType.dialog.messageLongTap, this.messageLongTapHandler)
			;
		}

		unsubscribeEvents()
		{
			this.menuManager = null;
			this.dialogLocator.get('view')
				.off(EventType.dialog.messageMenuActionTap, this.messageMenuActionTapHandler)
				.off(EventType.dialog.messageMenuReactionTap, this.messageMenuReactionTapHandler)
				.off(EventType.dialog.messageLongTap, this.messageLongTapHandler)
			;
		}

		/**
		 * @return {boolean}
		 */
		isMultiLevelMenuSupported()
		{
			return Feature.isMultilevelMessageMenuSupported && Feature.isReactionsV2Enabled;
		}

		/**
		 * @param index
		 * @param {DialogWidgetItem} message
		 */
		async onMessageLongTap(index, message)
		{
			logger.log('MessageMenuController onMessageLongTap', message);
			const messageId = Number(message.id);
			const isRealMessage = Type.isNumber(messageId);
			if (!isRealMessage)
			{
				await this.#processFileErrorMessage(message);
				await this.#processSendingMessage(message);

				return;
			}

			if (!ChatPermission.canOpenMessageMenu(this.dialogId))
			{
				Haptics.notifyFailure();

				return;
			}

			const messageModel = this.#getMessageModel(messageId);
			if (Type.isNil(messageModel?.id))
			{
				Haptics.notifyFailure();

				return;
			}

			if (this.isMenuNotAvailableByComponentId(messageModel))
			{
				Haptics.notifyFailure();

				return;
			}

			this.createMenuManager(messageModel);

			await this.showMenu(message);

			this.#interruptMessageAnimation(messageId);

			Haptics.impactMedium();
		}

		/**
		 * @param {number} messageId
		 */
		#interruptMessageAnimation(messageId)
		{
			const payloadParams = {
				id: messageId,
				fields: {
					visualState: { aiTaskStatus: AiTasksStatusType.animationInterrupted },
				},
			};

			this.store.dispatch('messagesModel/updateVisualState', payloadParams);
		}

		/**
		 * @param {DialogWidgetItem} message
		 */
		async #processFileErrorMessage(message)
		{
			if (message.status !== OwnMessageStatus.error)
			{
				return;
			}

			const messageModel = this.#getMessageModel(message.id);
			if (Type.isNil(messageModel))
			{
				Haptics.notifyFailure();

				return;
			}

			if (this.isMenuNotAvailableByComponentId(messageModel))
			{
				Haptics.notifyFailure();

				return;
			}

			this.createMenuManager(messageModel);

			await this.showErrorMenu(message);

			Haptics.impactMedium();
		}

		/**
		 * @param {DialogWidgetItem} message
		 */
		async #processSendingMessage(message)
		{
			if (
				message.status !== OwnMessageStatus.sending
				|| message.type !== MessageType.text
			)
			{
				return;
			}

			const messageModel = this.#getMessageModel(message.id);
			if (Type.isNil(messageModel))
			{
				Haptics.notifyFailure();

				return;
			}

			if (this.isMenuNotAvailableByComponentId(messageModel))
			{
				Haptics.notifyFailure();

				return;
			}

			this.createMenuManager(messageModel);

			await this.showSendingMenu(message);

			Haptics.impactMedium();
		}

		/**
		 * @param {string} actionId
		 * @param {Message} message
		 * @param {MessageMenuActionTapParams} params
		 */
		async onMessageMenuActionTap(actionId, message, params)
		{
			logger.log('MessageMenuController onMessageMenuActionTap', actionId, message, params);
			if (!(actionId in this.menuManager.handlers))
			{
				logger.error('Message Menu: unknown action', actionId, message);

				return false;
			}

			return this.menuManager.invokeActionHandler(actionId, { ...params });
		}

		onMessageMenuReactionTap(reactionId, message)
		{
			logger.log('MessageMenuController onMessageMenuReactionTap', reactionId, message);

			this.dialogLocator.get('message-service').setReaction(reactionId, message.id, { shouldAnimated: false, isUpdateUi: false });
		}

		/**
		 * @param {DialogWidgetItem} message
		 */
		async showMenu(message)
		{
			const dialogWidgetMessageMenu = await this.menuManager.createMenu();
			this.show(message, dialogWidgetMessageMenu);
		}

		/**
		 * @param {DialogWidgetItem} message
		 */
		async showErrorMenu(message)
		{
			const dialogWidgetMessageMenu = await this.menuManager.createErrorMenu();
			this.show(message, dialogWidgetMessageMenu);
		}

		/**
		 * @param {DialogWidgetItem} message
		 */
		async showSendingMenu(message)
		{
			const dialogWidgetMessageMenu = await this.menuManager.createSendingMenu();
			this.show(message, dialogWidgetMessageMenu);
		}

		/**
		 * @param {DialogWidgetItem} message
		 * @param {DialogWidgetMessageMenu} dialogWidgetMessageMenu
		 */
		show(message, dialogWidgetMessageMenu)
		{
			if (this.isMultiLevelMenuSupported())
			{
				this.dialogLocator.get('view').showMultiLevelMenuForMessage(message, dialogWidgetMessageMenu);
			}
			else
			{
				this.dialogLocator.get('view').showMenuForMessage(message, dialogWidgetMessageMenu);
			}
		}

		/**
		 * @param {MessagesModelState} messageModel
		 */
		createMenuManager(messageModel)
		{
			if (this.isMultiLevelMenuSupported())
			{
				this.menuManager = new MultiLevelMessageMenuManager(
					this.createMessageMenuActionHelper(messageModel),
					this.dialogLocator,
					this.getDialog,
				);
			}
			else
			{
				this.menuManager = new OneLevelMessageMenuManager(
					this.createMessageMenuActionHelper(messageModel),
					this.dialogLocator,
					this.getDialog,
				);
			}
		}

		#getMessageModel(messageId)
		{
			return this.store.getters['messagesModel/getById'](messageId);
		}

		/**
		 * @param {MessagesModelState} message
		 * @return {Boolean}
		 */
		isMenuNotAvailableByComponentId(message)
		{
			const componentId = message.params?.componentId;
			if (Type.isNil(componentId))
			{
				return false;
			}

			const componentIdsNotAvailableMenu = [
				MessageComponent.sign,
				MessageComponent.call,
				MessageComponent.admin,
			];
			if (componentIdsNotAvailableMenu.includes(componentId))
			{
				return true;
			}

			return componentId?.includes('CreationMessage');
		}

		/**
		 * @returns {MessageMenuActionHelper}
		 */
		createMessageMenuActionHelper(messageModel)
		{
			const fileModel = clone(this.store.getters['filesModel/getById'](messageModel.files[0]));
			const dialogModel = clone(this.store.getters['dialoguesModel/getById'](this.dialogId));
			const userModel = clone(this.store.getters['usersModel/getById'](messageModel.authorId));
			const commentInfo = clone(this.store.getters['commentModel/getByMessageId'](messageModel.id));

			let isUserSubscribed = false;

			if (commentInfo)
			{
				isUserSubscribed = commentInfo.isUserSubscribed;
			}

			if (!commentInfo && messageModel.authorId === serviceLocator.get('core').getUserId())
			{
				isUserSubscribed = true;
			}

			return new MessageMenuActionHelper({
				messageModel,
				fileModel,
				dialogModel,
				userModel,
				isPinned: this.store.getters['messagesModel/pinModel/isPinned'](messageModel.id),
				isUserSubscribed,
			});
		}

		/* region internal api  */
		/**
		 * @param {?number} [messageId]
		 * @returns {Promise<object>}
		 */
		getActionHandlersByMessageId(messageId)
		{
			const messageModel = this.#getMessageModel(messageId);
			this.createMenuManager(messageModel);

			return this.menuManager?.getActionHandlers(messageId);
		}

		/**
		 * @returns {?IMessageMenuActionHelper}
		 */
		getCurrentActionHelper()
		{
			return this.menuManager?.actionHelper;
		}
	}

	module.exports = { MessageMenuController };
});
