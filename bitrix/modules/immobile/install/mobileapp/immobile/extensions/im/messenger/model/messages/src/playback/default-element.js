/**
 * @module im/messenger/model/messages/playback/default-element
 */

jn.define('im/messenger/model/messages/playback/default-element', (require, exports, module) => {
	const playbackDefaultElement = Object.freeze({
		playingTime: 0,
		isPlaying: false,
	});

	module.exports = {
		playbackDefaultElement,
	};
});
