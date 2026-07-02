/* eslint no-undef: 0 */
/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/one-level/manager
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/one-level/manager', (require, exports, module) => {
	const {
		MessageMenuActionType,
	} = require('im/messenger/const');

	const { Feature } = require('im/messenger/lib/feature');
	const { ReactionAssetsManager } = require('im/messenger/lib/reaction-assets-manager');

	const { DialogMessageContextMenu } = require('im/messenger/controller/dialog/lib/message-menu/src/context/default');
	const { MessageMenuView } = require('im/messenger/controller/dialog/lib/message-menu/src/one-level/view');

	/**
	 * @implements {IOneLevelMessageMenuManager}
	 * @class OneLevelMessageMenuManager
 	*/
	class OneLevelMessageMenuManager
	{
		/** @type {Record<string, (actionHelper: IMessageMenuActionHelper) => void>} */
		#handlers = {};
		/** @type {Record<string, (menu: IMessageMenuView, actionHelper: IMessageMenuActionHelper) => void>} */
		#actions = {};
		/** @type {IMessageMenuActionHelper} */
		actionHelper = null;

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {DialogLocator} dialogLocator
		 * @param {() => DialoguesModelState} getDialog
		 */
		constructor(actionHelper, dialogLocator, getDialog)
		{
			this.actionHelper = actionHelper;
			this.dialogLocator = dialogLocator;
			this.getDialog = getDialog;

			/** @type {DialogConfigurator} */
			this.configurator = this.dialogLocator.get('configurator');
		}

		get handlers()
		{
			return this.#handlers;
		}

		get actions()
		{
			return this.#actions;
		}

		/**
		 * @returns {MessagesModelState}
		 */
		get messageModel()
		{
			return this.actionHelper.messageModel;
		}

		async registerActionsHandlers()
		{
			this.#handlers = await this.getActionHandlers();
		}

		async registerActions()
		{
			this.#actions = await this.getActions();
		}

		/**
		 * @return {Promise<DialogWidgetMessageMenu>}
		 */
		async createMenu()
		{
			await this.registerActions();
			await this.registerActionsHandlers();
			const view = new MessageMenuView();
			const orderedActions = await this.getOrderedActions();

			orderedActions.forEach((actionId) => this.actions[actionId](view, this.actionHelper));
			view.clearUnnecessarySeparators();

			return view.toDialogWidgetMessageMenu();
		}

		/**
		 * @return {Promise<DialogWidgetMessageMenu>}
		 */
		async createErrorMenu()
		{
			await this.registerActions();
			await this.registerActionsHandlers();
			const view = new MessageMenuView();
			const orderedActions = await this.getOrderedActionsForErrorMessage();

			orderedActions.forEach((actionId) => this.actions[actionId](view, this.actionHelper));
			view.clearUnnecessarySeparators();

			return view.toDialogWidgetMessageMenu();
		}

		/**
		 * @return {Promise<DialogWidgetMessageMenu>}
		 */
		async createSendingMenu()
		{
			await this.registerActions();
			await this.registerActionsHandlers();
			const view = new MessageMenuView();
			const orderedActions = await this.getOrderedActionsForSendingMessage();

			orderedActions.forEach((actionId) => this.actions[actionId](view, this.actionHelper));
			view.clearUnnecessarySeparators();

			return view.toDialogWidgetMessageMenu();
		}

		/**
		 * @param {number} [messageId]
		 * @return {Promise<Record<string, (menu: IMessageMenuView, actionHelper: IMessageMenuActionHelper) => void>>}
		 */
		async getActions(messageId = this.messageModel.id)
		{
			const baseController = this.createBaseMessageContextMenuControllerByMessageId();
			const contextController = await this.createMessageContextMenuControllerByMessageId(messageId);
			const reactionAssets = await this.getReactionsAssets();

			return {
				[MessageMenuActionType.reaction]: (menu, message) => {
					this.addReactionAction(menu, message, reactionAssets);
				},
				...contextController.getActions(),
				...baseController.getActions(),
			};
		}

		/**
		 * @param {number} [messageId]
		 * @return {Promise<Record<string, (actionHelper: IMessageMenuActionHelper) => void>>}
		 */
		async getActionHandlers(messageId = this.messageModel.id)
		{
			const baseController = this.createBaseMessageContextMenuControllerByMessageId();
			const contextController = await this.createMessageContextMenuControllerByMessageId(messageId);

			return {
				...baseController.getActionHandlers(),
				...contextController.getActionHandlers(),
			};
		}

		/**
		 * @return {IMessageContextMenu}
		 */
		createBaseMessageContextMenuControllerByMessageId()
		{
			const baseContextMenuController = new DialogMessageContextMenu({
				getDialog: this.getDialog,
				relatedEntity: this.configurator.getRelatedEntity(),
			});

			baseContextMenuController.setDialogLocator(this.dialogLocator);

			return baseContextMenuController;
		}

		/**
		 * @param {number} messageId
		 * @return {Promise<IMessageContextMenu>}
		 */
		async createMessageContextMenuControllerByMessageId(messageId)
		{
			const MessageContextMenuControllerClass = await this.configurator
				.getMessageContextMenuControllerClassByMessageId(messageId)
			;

			const contextMenuController = new MessageContextMenuControllerClass({
				getDialog: this.getDialog,
				relatedEntity: this.configurator.getRelatedEntity(),
			});

			if (contextMenuController instanceof DialogMessageContextMenu)
			{
				contextMenuController.setDialogLocator(this.dialogLocator);
			}

			return contextMenuController;
		}

		/**
		 * @return {Promise<Array<ReactionData>>|Array<ReactionData>}
		 */
		async getReactionsAssets()
		{
			let reactions = [];
			if (Feature.isReactionsV2Enabled)
			{
				reactions = await ReactionAssetsManager.getInstance().getTopReactions();
			}
			else
			{
				reactions = ReactionAssetsManager.getInstance().getLegacyReactions();
			}

			return reactions;
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} message
		 * @param {Array<object>} reactions
		 */
		async addReactionAction(menu, message, reactions)
		{
			if (!message.isPossibleReact())
			{
				return;
			}

			if (Feature.isReactionsV2Enabled)
			{
				menu.setReactionVersion(2);
				menu.setMoreReactionsSetting(true);
			}

			reactions.forEach((reaction) => {
				menu.addReaction(reaction);
			});
		}

		/**
		 * @return {Promise<string[]>}
		 */
		async getOrderedActions()
		{
			const controller = await this.createMessageContextMenuControllerByMessageId(this.messageModel.id);
			const orderedActions = await controller.getOrderedActions(this.actionHelper);

			return [
				MessageMenuActionType.reaction,
				...orderedActions,
			];
		}

		/**
		 * @return {Promise<string[]>}
		 */
		async getOrderedActionsForErrorMessage()
		{
			return [
				MessageMenuActionType.resend,
				MessageMenuActionType.delete,
			];
		}

		/**
		 * @return {Promise<string[]>}
		 */
		async getOrderedActionsForSendingMessage()
		{
			return [
				MessageMenuActionType.copy,
			];
		}

		/**
		 * @param {string} actionId
		 * @param {object} params
		 */
		invokeActionHandler(actionId, params)
		{
			return this.handlers[actionId]?.(this.actionHelper, params);
		}
	}
	module.exports = { OneLevelMessageMenuManager };
});
