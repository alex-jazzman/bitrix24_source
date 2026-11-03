/**
 * @module im/messenger/controller/dialog/lib/audio-panel
 */
jn.define('im/messenger/controller/dialog/lib/audio-panel', (require, exports, module) => {
	const { AudioPanel } = require('im/messenger/controller/dialog/lib/audio-panel/audio-player');
	const { returnToAudioMessage, prepareAudioName } = require(
		'im/messenger/controller/dialog/lib/audio-panel/audio-helper',
	);

	module.exports = {
		AudioPanel,
		prepareAudioName,
		returnToAudioMessage,
	};
});
