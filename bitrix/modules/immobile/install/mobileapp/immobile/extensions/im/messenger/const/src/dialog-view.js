/**
 * @module im/messenger/const/dialog-view
 */
jn.define('im/messenger/const/dialog-view', (require, exports, module) => {
	const DialogViewUpdatingBlocksType = Object.freeze({
		status: 'status',
		showAvatar: 'showAvatar',
		isAuthorBottomMessage: 'isAuthorBottomMessage',
		isAuthorTopMessage: 'isAuthorTopMessage',
		showUsername: 'showUsername',
		commentInfo: 'commentInfo',
		vote: 'vote',
		reactionAnimate: 'reaction_animate_',
		withoutUi: 'without-ui',
		aiAnimation: 'aiAnimation',
	});

	module.exports = {
		DialogViewUpdatingBlocksType,
	};
});
