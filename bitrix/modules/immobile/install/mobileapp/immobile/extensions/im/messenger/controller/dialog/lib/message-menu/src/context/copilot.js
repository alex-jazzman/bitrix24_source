/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/context/copilot
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/context/copilot', (require, exports, module) => {
	const { MessageComponent, MessageMenuActionType, MessageMenuSectionId } = require('im/messenger/const');
	const { DialogMessageContextMenu } = require('im/messenger/controller/dialog/lib/message-menu/src/context/default');

	/**
	 * @class CopilotMessageContextMenu
	 */
	class CopilotMessageContextMenu extends DialogMessageContextMenu
	{
		/**
		 * @param {IMessageMenuActionHelper} actionHelper
		 * @return {Promise<string[]>}
		 */
		async getOrderedActions(actionHelper)
		{
			const modelMessage = actionHelper.messageModel;
			const baseActions = await super.getOrderedActions(actionHelper);

			if (this.isCopilotMessage(modelMessage))
			{
				const actions = [
					MessageMenuActionType.reaction,
					MessageMenuActionType.reply,
					MessageMenuActionType.forward,
					MessageMenuActionType.mark,
					MessageMenuActionType.feedback,
					MessageMenuActionType.delete,
					MessageMenuActionType.multiselect,
				];

				if (this.isCopilotErrorMessage(modelMessage))
				{
					actions.push(MessageMenuActionType.copy);
				}

				return actions;
			}

			if (this.isCopilotCreateMessage(modelMessage) || this.isCopilotBannerMessage(modelMessage))
			{
				return [];
			}

			return baseActions.filter((action) => ([
				MessageMenuActionType.reaction,
				MessageMenuActionType.reply,
				MessageMenuActionType.edit,
				MessageMenuActionType.delete,
				MessageMenuActionType.copy,
				MessageMenuActionType.multiselect,
				MessageMenuActionType.forward,
				MessageMenuActionType.mark,
			].includes(action)));
		}

		/**
		 * @param {IMessageMenuActionHelper} actionHelper
		 * @return {Array<MessageContextTreeSectionNode>}
		 */
		getOrderedActionTree(actionHelper)
		{
			const message = actionHelper.messageModel;

			if (this.isCopilotErrorMessage(message))
			{
				return [
					{
						sectionId: MessageMenuSectionId.dialogMain,
						children: [
							MessageMenuActionType.reply,
							MessageMenuActionType.copy,
							MessageMenuActionType.forward,
							MessageMenuActionType.mark,
							MessageMenuActionType.feedback,
						],
					},
					{
						sectionId: MessageMenuSectionId.dialogFooter,
						children: [
							MessageMenuActionType.delete,
							MessageMenuActionType.multiselect,
						],

					},
				];
			}

			if (this.isCopilotMessage(message))
			{
				return [
					{
						sectionId: MessageMenuSectionId.dialogMain,
						children: [
							MessageMenuActionType.reply,
							MessageMenuActionType.forward,
							MessageMenuActionType.mark,
							MessageMenuActionType.feedback,
						],
					},
					{
						sectionId: MessageMenuSectionId.dialogFooter,
						children: [
							MessageMenuActionType.delete,
							MessageMenuActionType.multiselect,
						],
					},
				];
			}

			if (this.isCopilotCreateMessage(message) || this.isCopilotBannerMessage(message))
			{
				return [];
			}

			return [
				{
					sectionId: MessageMenuSectionId.dialogMain,
					children: [
						MessageMenuActionType.reply,
						MessageMenuActionType.copy,
						MessageMenuActionType.forward,
						MessageMenuActionType.mark,
					],
				},
				{
					sectionId: MessageMenuSectionId.dialogFooter,
					children: [
						MessageMenuActionType.delete,
						MessageMenuActionType.multiselect,
					],
				},
			];
		}

		/**
		 *
		 * @param {MessagesModelState} message
		 */
		isCopilotMessage(message)
		{
			return message.params?.componentId === MessageComponent.copilot;
		}

		/**
		 *
		 * @param {MessagesModelState} message
		 */
		isCopilotCreateMessage(message)
		{
			return message.params?.componentId === MessageComponent.copilotCreation;
		}

		/**
		 *
		 * @param {MessagesModelState} message
		 */
		isCopilotBannerMessage(message)
		{
			return message.params?.componentId === MessageComponent.copilotAddedUsers;
		}

		/**
		 *
		 * @param {MessagesModelState} message
		 */
		isCopilotErrorMessage(message)
		{
			return this.isCopilotMessage(message) && message.params?.COMPONENT_PARAMS?.copilotError === true;
		}
	}

	module.exports = { CopilotMessageContextMenu };
});
