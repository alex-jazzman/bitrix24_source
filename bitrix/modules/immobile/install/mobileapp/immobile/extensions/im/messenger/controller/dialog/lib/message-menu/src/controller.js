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
		MessageParams,
		MessageMenuActionType,
	} = require('im/messenger/const');
	const { getLogger } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');

	const {
		LikeReaction,
		KissReaction,
		LaughReaction,
		WonderReaction,
		CryReaction,
		AngryReaction,
		FacepalmReaction,
	} = require('im/messenger/controller/dialog/lib/message-menu/reaction');
	const { MessageMenuMessage } = require('im/messenger/controller/dialog/lib/message-menu/message');
	const { MessageMenuView } = require('im/messenger/controller/dialog/lib/message-menu/view');
	const { MessageMenu } = require('im/messenger/controller/dialog/lib/message-menu/menu');

	const logger = getLogger('dialog--message-menu');

	/**
	 * @class MessageMenuController
	 */
	class MessageMenuController
	{
		/**
		 * @type {IDialogHeaderTitle|null}
		 */
		#messageContextMenuController = null;

		/**
		 * @param {DialogLocator} serviceLocator
		 * @param {() => DialoguesModelState} getDialog
		 */
		static async create({ dialogLocator, getDialog })
		{
			const controller = new this({ dialogLocator, getDialog });

			await controller.registerActions();
			await controller.registerActionHandlers();

			return controller;
		}

		/**
		 * @param {DialogLocator} serviceLocator
		 * @param {() => DialoguesModelState} getDialog
		 */
		constructor({ dialogLocator, getDialog })
		{
			/** @type {DialogLocator} */
			this.dialogLocator = dialogLocator;
			this.getDialog = getDialog;
			/** @type {DialogConfigurator} */
			this.configurator = this.dialogLocator.get('configurator');
			this.store = dialogLocator.get('store');
			/** @type {Record<string, function(Message): void>} */
			this.handlers = {};

			this.actions = {};

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
			this.dialogLocator.get('view')
				.off(EventType.dialog.messageMenuActionTap, this.messageMenuActionTapHandler)
				.off(EventType.dialog.messageMenuReactionTap, this.messageMenuReactionTapHandler)
				.off(EventType.dialog.messageLongTap, this.messageLongTapHandler)
			;
		}

		/**
		 * @return {Promise<IMessageContextMenu>}
		 */
		async getMessageContextMenuController()
		{
			if (!this.#messageContextMenuController)
			{
				this.#messageContextMenuController = await this.#initMessageContextMenuController();
			}

			return this.#messageContextMenuController;
		}

		/**
		 * @return {Promise<IMessageContextMenu>}
		 */
		async #initMessageContextMenuController()
		{
			const MessageContextMenuControllerClass = await this.configurator.getMessageContextMenuControllerClass();

			const contextMenuController = new MessageContextMenuControllerClass({
				getDialog: this.getDialog,
				relatedEntity: this.configurator.getRelatedEntity(),
			});

			if (contextMenuController instanceof MessageMenu)
			{
				contextMenuController.setDialogLocator(this.dialogLocator);
			}

			return contextMenuController;
		}

		/**
		 * @param {MessageMenuMessage} message
		 * @return {Promise<string[]>}
		 */
		async getOrderedActions(message)
		{
			const controller = await this.getMessageContextMenuController();
			const orderedActions = await controller.getOrderedActions();

			return [
				MessageMenuActionType.reaction,
				...orderedActions,
			];
		}

		/**
		 * @param {MessageMenuMessage} message
		 * @return {Promise<string[]>}
		 */
		async getOrderedActionsForErrorMessage(message)
		{
			return [
				MessageMenuActionType.resend,
				MessageMenuActionType.delete,
			];
		}

		/**
		 * @param index
		 * @param {Message} message
		 */
		async onMessageLongTap(index, message)
		{
			logger.log('MessageMenuController onMessageLongTap', message);
			const messageId = Number(message.id);
			const isRealMessage = Type.isNumber(messageId);
			if (!isRealMessage)
			{
				this.#processFileErrorMessage(message);

				return;
			}

			if (!ChatPermission.isCanOpenMessageMenu(this.dialogId))
			{
				Haptics.notifyFailure();

				return;
			}

			const messageModel = this.store.getters['messagesModel/getById'](messageId);

			if (!messageModel || !('id' in messageModel))
			{
				Haptics.notifyFailure();

				return;
			}

			if (this.isMenuNotAvailableByComponentId(messageModel))
			{
				Haptics.notifyFailure();

				return;
			}

			const contextMenuMessage = this.createMessageMenuMessage(messageId);

			const menu = new MessageMenuView();

			const orderedActions = await this.getOrderedActions(contextMenuMessage);
			orderedActions
				.forEach((actionId) => this.actions[actionId](menu, contextMenuMessage))
			;

			this.dialogLocator.get('view')
				.showMenuForMessage(message, menu)
			;
			Haptics.impactMedium();
		}

		createMessageMenuMessage(messageId)
		{
			const messageModel = clone(this.store.getters['messagesModel/getById'](messageId));
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

			return new MessageMenuMessage({
				messageModel,
				fileModel,
				dialogModel,
				userModel,
				isPinned: this.store.getters['messagesModel/pinModel/isPinned'](messageModel.id),
				isUserSubscribed,
			});
		}

		/**
		 * @param {Message} message
		 */
		async #processFileErrorMessage(message)
		{
			if (message.status !== OwnMessageStatus.error)
			{
				Haptics.notifyFailure();

				return;
			}

			const messageModel = this.store.getters['messagesModel/getById'](message.id);
			if (!messageModel || !('id' in messageModel))
			{
				Haptics.notifyFailure();

				return;
			}

			if (this.isMenuNotAvailableByComponentId(messageModel))
			{
				Haptics.notifyFailure();

				return;
			}

			const dialogModel = this.store.getters['dialoguesModel/getById'](this.dialogId);
			const contextMenuMessage = new MessageMenuMessage({
				messageModel,
				dialogModel,
			});

			const menu = new MessageMenuView();
			const orderedActions = await this.getOrderedActionsForErrorMessage(contextMenuMessage);
			orderedActions
				.forEach((actionId) => this.actions[actionId](menu, contextMenuMessage))
			;

			this.dialogLocator.get('view')
				.showMenuForMessage(message, menu)
			;
			Haptics.impactMedium();
		}

		/**
		 * @param {string} actionId
		 * @param {Message} message
		 */
		onMessageMenuActionTap(actionId, message)
		{
			logger.log('MessageMenuController onMessageMenuActionTap', actionId, message);
			if (!(actionId in this.handlers))
			{
				logger.error('Message Menu: unknown action', actionId, message);
			}

			const messageMenuMessage = this.createMessageMenuMessage(message.id);

			this.handlers[actionId](messageMenuMessage);
		}

		onMessageMenuReactionTap(reactionId, message)
		{
			logger.log('MessageMenuController onMessageMenuReactionTap', reactionId, message);

			this.dialogLocator.get('message-service')
				.setReaction(reactionId, message.id)
			;
		}

		async registerActions()
		{
			const controller = await this.getMessageContextMenuController();

			this.actions = {
				[MessageMenuActionType.reaction]: this.addReactionAction.bind(this),
				...controller.getActions(),
			};
		}

		async registerActionHandlers()
		{
			const controller = await this.getMessageContextMenuController();

			this.handlers = {
				...controller.getActionHandlers(),
			};
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuMessage} message
		 */
		addReactionAction(menu, message)
		{
			if (message.isPossibleReact())
			{
				menu
					.addReaction(LikeReaction)
					.addReaction(KissReaction)
					.addReaction(LaughReaction)
					.addReaction(WonderReaction)
					.addReaction(CryReaction)
					.addReaction(AngryReaction)
					.addReaction(FacepalmReaction)
				;
			}
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
				MessageParams.ComponentId.SignMessage,
				MessageParams.ComponentId.CallMessage,
			];
			if (componentIdsNotAvailableMenu.includes(componentId))
			{
				return true;
			}

			const isCreateBannerMessage = componentId?.includes('CreationMessage');
			if (isCreateBannerMessage)
			{
				return true;
			}

			return false;
		}
	}

	module.exports = { MessageMenuController };
});
