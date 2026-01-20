/**
 * @module im/messenger/const/anchor-type
 */
jn.define('im/messenger/const/anchor-type', (require, exports, module) => {
	const AnchorType = Object.freeze({
		mention: 'mention',
		reaction: 'reaction',
	});

	module.exports = {
		AnchorType,
	};
});
