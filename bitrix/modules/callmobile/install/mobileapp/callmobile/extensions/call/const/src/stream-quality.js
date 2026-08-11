/**
 * @module call/const/stream-quality
 */
jn.define('call/const/stream-quality', (require, exports, module) => {
	const StreamQuality = Object.freeze({
		low: 1,
		medium: 2,
		high: 3,
	});

	module.exports = { StreamQuality };
});
