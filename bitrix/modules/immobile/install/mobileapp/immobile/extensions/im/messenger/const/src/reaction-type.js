/**
 * @module im/messenger/const/reaction-type
 */
jn.define('im/messenger/const/reaction-type', (require, exports, module) => {
	/**
	 * @deprecated use ReactionAssetsManager.getAvailableReactions
	 * @desc Legacy basic reaction type pack
	 */
	const ReactionType = Object.freeze({
		like: 'like',
		kiss: 'kiss',
		laugh: 'laugh',
		wonder: 'wonder',
		cry: 'cry',
		angry: 'angry',
		facepalm: 'facepalm',
	});

	module.exports = { ReactionType };
});
