/**
 * @module im/messenger/application/lib/chat-deletion-manager
 */
jn.define('im/messenger/application/lib/chat-deletion-manager', (require, exports, module) => {
	const {
		ChatDeletionManager,
		ChatDeletionOrigin,
		ChatDeletionReason,
	} = require('im/messenger/application/lib/chat-deletion-manager/src/manager');

	module.exports = {
		ChatDeletionManager,
		ChatDeletionOrigin,
		ChatDeletionReason,
	};
});
