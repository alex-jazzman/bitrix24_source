/**
 * @module im/messenger/controller/dialog/lib/optimistic-chat-manager
 */
jn.define('im/messenger/controller/dialog/lib/optimistic-chat-manager', (require, exports, module) => {
	const { OptimisticChatManager } = require('im/messenger/controller/dialog/lib/optimistic-chat-manager/manager');
	const { TextFieldOptimisticHandler } = require('im/messenger/controller/dialog/lib/optimistic-chat-manager/text-field-handler');

	module.exports = { OptimisticChatManager, TextFieldOptimisticHandler };
});
