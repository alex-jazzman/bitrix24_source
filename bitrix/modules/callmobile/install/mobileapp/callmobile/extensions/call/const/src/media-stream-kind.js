/**
 * @module call/const/media-stream-kind
 */
jn.define('call/const/media-stream-kind', (require, exports, module) => {
	const MediaStreamKind = Object.freeze({
		Camera: 1,
		Microphone: 2,
		Screen: 3,
	});

	module.exports = { MediaStreamKind };
});
