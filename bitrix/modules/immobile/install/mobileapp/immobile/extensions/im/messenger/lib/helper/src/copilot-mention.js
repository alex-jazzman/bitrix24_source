/**
 * @module im/messenger/lib/helper/copilot-mention
 */
jn.define('im/messenger/lib/helper/copilot-mention', (require, exports, module) => {
	const { DialogType } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { UserHelper } = require('im/messenger/lib/helper/user');
	const { DialogHelper } = require('im/messenger/lib/helper/dialog');

	const groupDialogTypes = new Set([DialogType.chat, DialogType.open, DialogType.collab]);

	/**
	 * @desc The single source of truth for whether the "tap to mention BitrixGPT" gesture applies.
	 * @param {DialoguesModelState} dialogModel
	 * @param {UsersModelState} userModel
	 * @return {boolean}
	 */
	function isCopilotMentionByGestureAvailable(dialogModel, userModel)
	{
		if (!UserHelper.createByModel(userModel)?.isCopilotBot)
		{
			return false;
		}

		if (!groupDialogTypes.has(dialogModel?.type))
		{
			return false;
		}

		if (!Feature.isCopilotMentionAvailable)
		{
			return false;
		}

		if (!DialogHelper.createByModel(dialogModel)?.isCopilotMentionSupported)
		{
			return false;
		}

		return ChatPermission.canReply(dialogModel);
	}

	module.exports = {
		isCopilotMentionByGestureAvailable,
	};
});
