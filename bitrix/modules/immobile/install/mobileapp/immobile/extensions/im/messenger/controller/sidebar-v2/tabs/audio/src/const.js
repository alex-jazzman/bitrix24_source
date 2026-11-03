/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio/src/const
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/audio/src/const', (require, exports, module) => {
	const PlayerStage = Object.freeze({
		PLAYING: 'playing',
		PAUSED: 'paused',
		LOADING: 'loading',
		IDLE: 'idle',
	});

	/**
	 * The tab carries voice messages and video notes, so its empty screen names no record type.
	 * The retired phrase of the audio-only tab keeps its own id: its translations were made for
	 * the old meaning and must not answer the new one.
	 */
	const AudioTabEmptyScreenTitleId = 'IMMOBILE_SIDEBAR_V2_COMMON_TAB_AUDIO_EMPTY_SCREEN_TITLE_MSGVER_1';

	module.exports = {
		PlayerStage,
		AudioTabEmptyScreenTitleId,
	};
});
