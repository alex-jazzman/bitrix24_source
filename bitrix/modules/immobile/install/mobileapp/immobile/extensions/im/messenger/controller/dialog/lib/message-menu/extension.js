/**
 * @module im/messenger/controller/dialog/lib/message-menu
 */
jn.define('im/messenger/controller/dialog/lib/message-menu', (require, exports, module) => {
	const { MessageMenuController } = require('im/messenger/controller/dialog/lib/message-menu/controller');
	const { DialogMessageContextMenu } = require('im/messenger/controller/dialog/lib/message-menu/src/context/default');
	const { CopilotMessageContextMenu } = require('im/messenger/controller/dialog/lib/message-menu/src/context/copilot');
	const { AiAssistantMessageContextMenu } = require('im/messenger/controller/dialog/lib/message-menu/src/context/ai-assistant');
	const MenuActions = require('im/messenger/controller/dialog/lib/message-menu/src/action');
	const MenuSection = require('im/messenger/controller/dialog/lib/message-menu/src/section');
	const { MessageMenuActionHelper } = require('im/messenger/controller/dialog/lib/message-menu/src/message-action-helper');

	module.exports = {
		MessageMenuController,
		MessageMenuActionHelper,
		DialogMessageContextMenu,
		CopilotMessageContextMenu,
		AiAssistantMessageContextMenu,
		MenuActions,
		MenuSection,
	};
});
