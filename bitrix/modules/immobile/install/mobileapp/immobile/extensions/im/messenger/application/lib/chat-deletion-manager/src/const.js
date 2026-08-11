/**
 * @module im/messenger/application/lib/chat-deletion-manager/src/const
 */
jn.define('im/messenger/application/lib/chat-deletion-manager/src/const', (require, exports, module) => {
	/**
	 * @enum {string}
	 */
	const ChatDeletionOrigin = Object.freeze({
		local: 'local',
		pull: 'pull',
	});

	/**
	 * @enum {string}
	 */
	const ChatDeletionReason = Object.freeze({
		delete: 'delete',
		leave: 'leave',
		hide: 'hide',
	});

	module.exports = { ChatDeletionOrigin, ChatDeletionReason };
});
