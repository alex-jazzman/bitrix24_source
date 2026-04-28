/**
 * @module im/messenger/application/lib/dialog-manager/resolver
 */
jn.define('im/messenger/application/lib/dialog-manager/resolver', (require, exports, module) => {
	const { Type } = require('type');
	const { DialogType } = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { Dialog } = require('im/messenger/controller/dialog/chat');
	const { CopilotDialog } = require('im/messenger/controller/dialog/copilot');
	const { AiAssistantDialog } = require('im/messenger/controller/dialog/ai-assistant');

	/**
	 * @param {DialoguesModelState} dialog
	 * @return {Promise<Dialog>}
	 */
	async function createDialogByModel(dialog)
	{
		const dialogId = dialog.dialogId;
		const dialogType = dialog?.type;
		if (dialogType === DialogType.copilot)
		{
			return new CopilotDialog();
		}

		// TODO: handle case when AiAssistantBot is not in the store
		const dialogHelper = DialogHelper.createByDialogId(dialogId);
		if (dialogHelper?.isAiAssistant)
		{
			return new AiAssistantDialog();
		}

		return new Dialog();
	}

	/**
	 * @param {string} chatType
	 * @return {Promise<Dialog|null>}
	 */
	async function createDialogByChatType(chatType)
	{
		if (!Type.isStringFilled(chatType))
		{
			return null;
		}

		switch (chatType)
		{
			case DialogType.copilot:
				return new CopilotDialog();

			case DialogType.aiAssistant:
				return new AiAssistantDialog();

			// there is not enough data to initialize the task chat
			case DialogType.tasksTask:
				return null;

			default:
				return new Dialog();
		}
	}

	module.exports = {
		createDialogByModel,
		createDialogByChatType,
	};
});
