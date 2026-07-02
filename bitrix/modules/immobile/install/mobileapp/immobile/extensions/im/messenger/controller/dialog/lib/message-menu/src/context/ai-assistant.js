/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/context/ai-assistant
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/context/ai-assistant', (require, exports, module) => {
	const { MessageComponent, MessageMenuActionType, MessageMenuSectionId } = require('im/messenger/const');
	const { DialogMessageContextMenu } = require('im/messenger/controller/dialog/lib/message-menu/src/context/default');

	/**
	 * @class AiAssistantMessageContextMenu
	 */
	class AiAssistantMessageContextMenu extends DialogMessageContextMenu
	{
		/**
		 * @param {IMessageMenuActionHelper} actionHelper
		 * @return {Promise<string[]>}
		 */
		async getOrderedActions(actionHelper)
		{
			const modelMessage = actionHelper.messageModel;
			const baseActions = await super.getOrderedActions(actionHelper);

			if (this.isAiAssistantMessage(modelMessage))
			{
				const aiAssistantActions = new Set([
					MessageMenuActionType.reaction,
					MessageMenuActionType.reply,
					MessageMenuActionType.copy,
					MessageMenuActionType.copyLink,
					MessageMenuActionType.pin,
					MessageMenuActionType.unpin,
					MessageMenuActionType.forward,
					MessageMenuActionType.mark,
					MessageMenuActionType.feedback,
					MessageMenuActionType.create,
					MessageMenuActionType.multiselect,
				]);

				return baseActions.filter((action) => aiAssistantActions.has(action));
			}

			return baseActions.filter((action) => ![MessageMenuActionType.edit].includes(action));
		}

		/**
		 * @param {IMessageMenuActionHelper} actionHelper
		 * @return {Array<MessageContextTreeSectionNode>}
		 */
		getOrderedActionTree(actionHelper)
		{
			const message = actionHelper.messageModel;

			if (this.isAiAssistantMessage(message))
			{
				return [
					{
						sectionId: MessageMenuSectionId.dialogMain,
						children: [
							MessageMenuActionType.copy,
							MessageMenuActionType.pin,
							MessageMenuActionType.unpin,
							MessageMenuActionType.forward,
							MessageMenuActionType.createTask,
							{
								sectionId: MessageMenuSectionId.dialogMore,
								nextMenuActionType: MessageMenuActionType.more,
								children: [
									MessageMenuActionType.mark,
									MessageMenuActionType.createEvent,
									MessageMenuActionType.feedback,
									MessageMenuActionType.multiselect,
								],
							},
						],
					},
				];
			}

			return [
				{
					sectionId: MessageMenuSectionId.dialogMain,
					children: [
						MessageMenuActionType.copy,
						MessageMenuActionType.pin,
						MessageMenuActionType.unpin,
						MessageMenuActionType.forward,
						MessageMenuActionType.mark,
						MessageMenuActionType.createTask,
						MessageMenuActionType.createEvent,
						MessageMenuActionType.multiselect,
					],
				},
			];
		}

		/**
		 * @param {MessagesModelState} message
		 */
		isAiAssistantMessage(message)
		{
			return message.params?.componentId === MessageComponent.aiAssistant;
		}
	}

	module.exports = { AiAssistantMessageContextMenu };
});
