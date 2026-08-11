/**
 * @module im/messenger/controller/dialog/lib/optimistic-chat-manager
 */
jn.define('im/messenger/controller/dialog/lib/optimistic-chat-manager', (require, exports, module) => {
	const { OptimisticChatManager } = require('im/messenger/controller/dialog/lib/optimistic-chat-manager/manager');
	const { TextFieldOptimisticHandler } = require('im/messenger/controller/dialog/lib/optimistic-chat-manager/text-field-handler');
	const { OptimisticAssistantButtonManager } = require('im/messenger/controller/dialog/lib/optimistic-chat-manager/assistant-button-manager');

	module.exports = { OptimisticChatManager, TextFieldOptimisticHandler, OptimisticAssistantButtonManager };
});
