/**
 * @module im/messenger/const/message-action
 */
jn.define('im/messenger/const/message-action', (require, exports, module) => {
	const MessageActionType = {
		copy: 'action_copy',
		regenerate: 'action_regenerate',
		like: 'action_like',
		dislike: 'action_dislike',
		forward: 'action_forward',
	};

	const MessageActionVoteValue = {
		like: 'like',
		dislike: 'dislike',
	};

	module.exports = { MessageActionType, MessageActionVoteValue };
});
