/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/multi-level/manager
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/multi-level/manager', (require, exports, module) => {
	const { Type } = require('type');
	const { Feature } = require('im/messenger/lib/feature');
	const { ReactionAssetsManager } = require('im/messenger/lib/reaction-assets-manager');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { DialogMessageContextMenu } = require('im/messenger/controller/dialog/lib/message-menu/src/context/default');
	const { MessageMultiMenuView } = require('im/messenger/controller/dialog/lib/message-menu/src/multi-level/view');

	/**
	 * @implements {IMultiLevelMessageMenuManager}
	 * @class MultiLevelMessageMenuManager
	 */
	class MultiLevelMessageMenuManager
	{
		/** @type {Record<string, (actionHelper: IMessageMenuActionHelper) => void>} */
		#handlers = {};
		/** @type {Record<string, (menu: IMessageMenuView, actionHelper: IMessageMenuActionHelper) => void>} */
		#actions = {};
		/** @type {Record<string, MessageContextMenuSectionItem>} */
		#sections = {};
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

			this.logger = getLoggerWithContext('dialog--message-menu', this);
		}

		get handlers()
		{
			return this.#handlers;
		}

		get actions()
		{
			return this.#actions;
		}

		get sections()
		{
			return this.#sections;
		}

		/**
		 * @param {Record<string, MessageContextMenuSectionItem>} sections
		 */
		set sections(sections)
		{
			this.#sections = sections;
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

		async registerSections()
		{
			this.sections = await this.getSection();
		}

		async registerErrorMenuSections()
		{
			this.sections = await this.getErrorMenuSection();
		}

		async registerSendingMenuSection()
		{
			this.sections = await this.getSendingMenuSection();
		}

		/**
		 * @returns {Promise<DialogWidgetMessageMultiLevelMenu>}
		 */
		async createMenu() {
			await this.registerActions();
			await this.registerActionsHandlers();
			await this.registerSections();

			const tree = await this.getOrderedActionTree();

			const view = new MessageMultiMenuView();

			await this.#addReaction(view);

			this.#buildMenuItems(tree, view);

			return view.toDialogWidgetMessageMenu();
		}

		/**
		 * @return {Promise<DialogWidgetMessageMultiLevelMenu>}
		 */
		async createErrorMenu()
		{
			await this.registerActions();
			await this.registerActionsHandlers();
			await this.registerErrorMenuSections();

			const tree = await this.getOrderedErrorActionTree();

			const view = new MessageMultiMenuView();

			this.#buildMenuItems(tree, view);

			return view.toDialogWidgetMessageMenu();
		}

		/**
		 * @return {Promise<DialogWidgetMessageMultiLevelMenu>}
		 */
		async createSendingMenu()
		{
			await this.registerActions();
			await this.registerActionsHandlers();
			await this.registerSendingMenuSection();

			const tree = await this.getOrderedSendingActionTree();

			const view = new MessageMultiMenuView();

			this.#buildMenuItems(tree, view);

			return view.toDialogWidgetMessageMenu();
		}

		/**
		 * @param {Array<string|MessageContextTreeSectionNode>} tree
		 * @param {IMessageMultiMenuView} view
		 * @param {?string} [sectionId]
		 * @param {boolean} [isRootLevel]
		 */
		#buildMenuItems(tree, view, sectionId = null, isRootLevel = true)
		{
			try
			{
				tree.forEach((node) => {
					if (this.isRootSectionItem(isRootLevel, node))
					{
						const sectionItem = this.invokeSection(node.sectionId);
						view.addSection(sectionItem);
						this.#buildMenuItems(node.children, view, node.sectionId, false);
					}
					else if (this.isSubSectionItem(node))
					{
						const subMenuView = new MessageMultiMenuView();
						const sectionItem = this.invokeSection(node.sectionId);
						subMenuView.addSection(sectionItem);

						this.#buildMenuItems(node.children, subMenuView, node.sectionId, false);

						if (subMenuView.actionListItems.length === 0)
						{
							return;
						}

						this.invokeAction(node.nextMenuActionType, view, {
							sectionCode: sectionId,
							nextMenu: subMenuView.toDialogWidgetMessageNextMenu(),
						});
					}
					else if (this.isActionItem(node))
					{
						const sectionCode = sectionId || '';

						this.invokeAction(node, view, { sectionCode });
					}
				});
			}
			catch (error)
			{
				this.logger.error('#buildMenuItems catch:', error);
			}
		}

		/**
		 * @param {boolean} isRootLevel
		 * @param {string|MessageContextTreeSectionNode} node
		 * @return {boolean}
		 */
		isRootSectionItem(isRootLevel, node)
		{
			return isRootLevel
				&& Type.isPlainObject(node)
				&& Type.isStringFilled(node.sectionId)
				&& Type.isArrayFilled(node.children);
		}

		/**
		 * @param {string|MessageContextTreeSectionNode} node
		 * @return {boolean}
		 */
		isSubSectionItem(node)
		{
			return Type.isPlainObject(node)
				&& Type.isStringFilled(node.nextMenuActionType)
				&& Array.isArray(node.children);
		}

		/**
		 * @param {string|MessageContextTreeSectionNode} node
		 * @return {boolean}
		 */
		isActionItem(node)
		{
			return Type.isStringFilled(node);
		}

		/**
		 * @param {number} [messageId]
		 * @return {Promise<Record<string, (menu: IMessageMenuView, actionHelper: IMessageMenuActionHelper) => void>>}
		 */
		async getActions(messageId = this.messageModel.id)
		{
			const baseController = this.#createBaseMessageContextMenuControllerByMessageId();
			const contextController = await this.#createMessageContextMenuControllerByMessageId(messageId);

			return {
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
			const baseController = this.#createBaseMessageContextMenuControllerByMessageId();
			const contextController = await this.#createMessageContextMenuControllerByMessageId(messageId);

			return {
				...baseController.getActionHandlers(),
				...contextController.getActionHandlers(),
			};
		}

		/**
		 * @param {number} [messageId]
		 * @return {Promise<(string|object)[]>}
		 */
		async getOrderedActionTree(messageId = this.messageModel.id)
		{
			const contextController = await this.#createMessageContextMenuControllerByMessageId(messageId);

			return contextController.getOrderedActionTree(this.actionHelper);
		}

		/**
		 * @param {number} [messageId]
		 * @return {Promise<(string|object)[]>}
		 */
		async getOrderedErrorActionTree(messageId = this.messageModel.id)
		{
			const contextController = await this.#createMessageContextMenuControllerByMessageId(messageId);

			return contextController.getOrderedErrorActionTree();
		}

		/**
		 * @param {number} [messageId]
		 * @return {Promise<(string|object)[]>}
		 */
		async getOrderedSendingActionTree(messageId = this.messageModel.id)
		{
			const contextController = await this.#createMessageContextMenuControllerByMessageId(messageId);

			return contextController.getOrderedSendingActionTree();
		}

		/**
		 * @param {number} [messageId]
		 * @return {Promise<Record<string, MessageContextMenuSectionItem>>}
		 */
		async getSection(messageId = this.messageModel.id)
		{
			const contextController = await this.#createMessageContextMenuControllerByMessageId(messageId);

			return contextController.getSection();
		}

		/**
		 * @param {number} [messageId]
		 * @return {Promise<Record<string, MessageContextMenuSectionItem>>}
		 */
		async getErrorMenuSection(messageId = this.messageModel.id)
		{
			const contextController = await this.#createMessageContextMenuControllerByMessageId(messageId);

			return contextController.getErrorMenuSection();
		}

		/**
		 * @param {number} [messageId]
		 * @return {Promise<Record<string, MessageContextMenuSectionItem>>}
		 */
		async getSendingMenuSection(messageId = this.messageModel.id)
		{
			const contextController = await this.#createMessageContextMenuControllerByMessageId(messageId);

			return contextController.getSendingMenuSection();
		}

		/**
		 * @return {IMessageContextMenu}
		 */
		#createBaseMessageContextMenuControllerByMessageId()
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
		async #createMessageContextMenuControllerByMessageId(messageId)
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
		async #getReactionsAssets()
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
		 * @param {IMessageMultiMenuView} view
		 */
		async #addReaction(view)
		{
			const reactions = await this.#getReactionsAssets();
			if (this.actionHelper.isPossibleReact() && Type.isArrayFilled(reactions))
			{
				if (Feature.isReactionsV2Enabled)
				{
					view.setMoreReactionsSetting?.(true);
				}
				reactions.forEach((reaction) => {
					view.addReaction(reaction);
				});
			}
		}

		/**
		 * @param {string} actionId
		 * @param {MessageMenuActionTapParams} params
		 */
		invokeActionHandler(actionId, params)
		{
			return this.handlers[actionId]?.(this.actionHelper, { actionId, ...params });
		}

		/**
		 * @param {string} actionId
		 * @param {IMessageMultiMenuView} view
		 * @param {object} options
		 */
		invokeAction(actionId, view, options)
		{
			return this.actions[actionId]?.(view, this.actionHelper, options);
		}

		/**
		 * @param {string} sectionId
		 * @return {MessageContextMenuSectionItem}
		 */
		invokeSection(sectionId)
		{
			return this.sections?.[sectionId];
		}
	}

	module.exports = { MultiLevelMessageMenuManager };
});
