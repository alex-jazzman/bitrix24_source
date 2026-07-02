/**
 * @module im/messenger/api/dialog-integration/message/context-menu
 */
jn.define('im/messenger/api/dialog-integration/message/context-menu', (require, exports, module) => {
	const { MessageMenuActionType, MessageMenuSectionId } = require('im/messenger/const');

	/**
	 * @abstract
	 * @class MessageContextMenu
	 * @implements {IMessageContextMenu}
	 */
	class MessageContextMenu
	{
		/**
		 * @param {MessageMenuContext} context
		 */
		constructor(context)
		{
			const {
				getDialog,
				relatedEntity,
			} = context;

			/**
			 * @protected
			 * @type {() => DialoguesModelState} */
			this.getDialog = getDialog;

			/**
			 * @protected
			 * @type {RelatedEntityData}
			 * */
			this.relatedEntity = relatedEntity;
		}

		/**
		 * @abstract
		 * @return {Record<string, (MessageMenuView, MessageMenuActionHelper, object) => void>}
		 */
		getActions()
		{
			throw new Error(`${this.constructor.name}: getActions() must be override in subclass.`);
		}

		/**
		 * @abstract
		 * @return {Record<string, (message: IMessageMenuActionHelper) => void>}
		 */
		getActionHandlers()
		{
			throw new Error(`${this.constructor.name}: getActionHandlers() must be override in subclass.`);
		}

		/**
		 * @abstract
		 * @return {Record<string, MessageContextMenuSectionItem>}
		 */
		getSection()
		{
			throw new Error(`${this.constructor.name}: getSection() must be override in subclass.`);
		}

		/**
		 * @abstract
		 * @return {Record<string, MessageContextMenuSectionItem>}
		 */
		getErrorMenuSection()
		{}

		/**
		 * @abstract
		 * @return {Record<string, MessageContextMenuSectionItem>}
		 */
		getSendingMenuSection()
		{}

		/**
		 * @param actionHelper
		 * @return {Promise<string[]>}
		 */
		async getOrderedActions(actionHelper)
		{
			return [
				MessageMenuActionType.reply,
				MessageMenuActionType.openVoteResult,
				MessageMenuActionType.revote,
				MessageMenuActionType.copy,
				MessageMenuActionType.copyLink,
				MessageMenuActionType.mark,
				MessageMenuActionType.edit,
				MessageMenuActionType.subscribe,
				MessageMenuActionType.unsubscribe,
				MessageMenuActionType.pin,
				MessageMenuActionType.unpin,
				MessageMenuActionType.forward,
				MessageMenuActionType.askCopilot,
				MessageMenuActionType.feedback,
				MessageMenuActionType.create,
				MessageMenuActionType.downloadToDevice,
				MessageMenuActionType.downloadToDisk,
				MessageMenuActionType.profile,
				MessageMenuActionType.finishVote,
				MessageMenuActionType.delete,
				MessageMenuActionType.multiselect,
			];
		}

		/**
		 * @returns {Array<string|object>}
		 */
		getOrderedActionTree(actionHelper)
		{
			return [
				{
					sectionId: MessageMenuSectionId.dialogMain,
					children: [
						MessageMenuActionType.reply,
						MessageMenuActionType.copy,
					],
				},
			];
		}

		/**
		 * @abstract
		 * @returns {Array<string|object>}
		 */
		getOrderedErrorActionTree()
		{}

		/**
		 * @abstract
		 * @returns {Array<string|object>}
		 */
		getOrderedSendingActionTree()
		{}
	}

	module.exports = {
		MessageContextMenu,
	};
});
