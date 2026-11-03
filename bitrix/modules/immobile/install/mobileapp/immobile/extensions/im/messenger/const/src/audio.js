/**
 * @module im/messenger/const/src/audio
 */
jn.define('im/messenger/const/src/audio', (require, exports, module) => {
	const AudioEvents = {
		playingMediaChanged: 'playingMediaChanged',
		speedChanged: 'speedChanged',
		timeUpdate: 'timeupdate',
		pause: 'pause',
		stop: 'stop',
		finish: 'finish',
		error: 'error',
		play: 'play',
		ready: 'ready',
	};

	const AudioPlayingState = {
		playing: 'playing',
		paused: 'paused',
		stopped: 'stopped',
		final: 'final',
	};

	/**
	 * The playback rates of the voice messages and the video notes, in the order the control walks
	 * them. One setting is shared by both, so the set lives here and not next to one of its players.
	 * The first value is the safe one: a rate outside the set comes back to it.
	 *
	 * @type {ReadonlyArray<AudioRate>}
	 */
	const AvailableAudioRates = Object.freeze([1, 1.5, 2]);

	module.exports = {
		AudioEvents,
		AudioPlayingState,
		AvailableAudioRates,
	};
});
