/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, ui_vue3, im_v2_const, im_v2_lib_analytics, im_v2_lib_localStorage) {
	'use strict';

	const PlaybackPauseReason = {
		manual: 'manual',
		incomingCallMissed: 'incomingCallMissed',
		incomingCallAnswered: 'incomingCallAnswered',
		outgoingCall: 'outgoingCall',
		otherTab: 'otherTab'
	};

	const CallEventName = {
		incomingCall: 'CallEvents::incomingCall',
		callCreated: 'CallEvents::callCreated',
		callLeft: 'BX.Call.Controller:onCallLeft',
		callDestroyed: 'BX.Call.Controller:onCallDestroyed'
	};
	const OUTGOING_CALL_DIRECTION = 'Outgoing';
	class CallPriority {
		static #instance = null;
		#service;
		#outgoingPhoneCallStarted = false;
		#phoneCallConnected = false;
		static create(service) {
			this.#instance = new CallPriority(service);
		}
		static getInstanceIfCreated() {
			return this.#instance;
		}
		constructor(service) {
			this.#service = service;
			this.#subscribeToCallEvents();
		}
		handleOutgoingPhoneCall() {
			this.#outgoingPhoneCallStarted = true;
		}
		handlePhoneCallCreated() {
			this.#service.pause(this.#outgoingPhoneCallStarted ? PlaybackPauseReason.outgoingCall : PlaybackPauseReason.incomingCallMissed);
		}
		handlePhoneCallConnected(isIncoming) {
			this.#phoneCallConnected = true;
			this.#service.pause(isIncoming ? PlaybackPauseReason.incomingCallAnswered : PlaybackPauseReason.outgoingCall);
		}
		handlePhoneCallDestroyed() {
			const wasConnected = this.#phoneCallConnected;
			this.#outgoingPhoneCallStarted = false;
			this.#phoneCallConnected = false;
			this.#service.handleCallFinished(wasConnected);
		}
		#subscribeToCallEvents() {
			main_core_events.EventEmitter.subscribe(CallEventName.incomingCall, this.#onIncomingCall);
			main_core_events.EventEmitter.subscribe(CallEventName.callCreated, this.#onCallCreated);
			main_core_events.EventEmitter.subscribe(CallEventName.callLeft, this.#onCallFinished);
			main_core_events.EventEmitter.subscribe(CallEventName.callDestroyed, this.#onCallFinished);
		}
		#onIncomingCall = () => {
			this.#service.pause(PlaybackPauseReason.incomingCallMissed);
		};
		#onCallCreated = event => {
			if (event.getData()?.[0]?.call?.direction !== OUTGOING_CALL_DIRECTION) {
				return;
			}
			this.#service.pause(PlaybackPauseReason.outgoingCall);
		};
		#onCallFinished = event => {
			this.#service.handleCallFinished(event.getData()?.callDetails?.wasConnected === true);
		};
	}

	const CHANNEL_NAME = 'im-playback';
	const PLAYBACK_STARTED = 'playbackStarted';
	class PlaybackBroadcast {
		#channel;
		#senderId = main_core.Text.getRandom();
		#onOtherTabStart;
		constructor(onOtherTabStart) {
			this.#onOtherTabStart = onOtherTabStart;
			this.#channel = this.#openChannel();
		}
		announceStart(fileId) {
			this.#channel?.postMessage({
				type: PLAYBACK_STARTED,
				senderId: this.#senderId,
				fileId
			});
		}
		close() {
			this.#channel?.close();
		}
		#openChannel() {
			try {
				const channel = new BroadcastChannel(CHANNEL_NAME);
				channel.onmessage = this.#onMessage;
				return channel;
			} catch {
				return null;
			}
		}
		#onMessage = event => {
			const message = event.data;
			if (message?.type !== PLAYBACK_STARTED || message.senderId === this.#senderId) {
				return;
			}
			this.#onOtherTabStart(message.fileId);
		};
	}

	class PlaybackRate {
		static get() {
			const storedRate = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.audioPlaybackRate);
			// the storage is shared, so the stored value is checked against the catalogue of known-good
			// ones: a media element throws on a non-numeric rate and on one outside the range it supports
			const isKnownRate = Object.values(im_v2_const.AudioPlaybackRate).includes(storedRate);
			return isKnownRate ? storedRate : im_v2_const.AudioPlaybackRate['1'];
		}

		// the broadcast is required so that a write cannot leave the players that are already running
		// behind: they take the new value from it, not from a re-read of the storage. It goes to the
		// global emitter, because the listeners live on both sides of an application boundary - the
		// players sit in Vue applications with an emitter of their own, the playback service is a
		// singleton outside all of them
		static set(rate) {
			im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.audioPlaybackRate, rate);
			main_core_events.EventEmitter.emit(im_v2_const.EventType.player.rateChange, {
				rate
			});
		}
		static getNext(rate) {
			// integer-like keys come first in Object.values, so the raw order is [1, 2, 1.5] - keep the cycle ascending
			const rates = Object.values(im_v2_const.AudioPlaybackRate).sort((a, b) => a - b);
			const currentIndex = rates.indexOf(rate);
			const nextIndex = (currentIndex + 1) % rates.length;
			return rates[nextIndex];
		}
	}

	class PlaybackSnapshot {
		duration = null;
		constructor(track) {
			this.fileId = track.fileId;
			this.src = track.src;
			this.messageId = track.messageId;
			this.scope = track.scope;
			this.dialogId = track.dialogId;
			this.chatId = track.chatId;
			this.authorId = track.authorId;
			this.authorName = track.authorName;
			this.fileName = track.fileName;
			this.isVideoNote = track.isVideoNote;
			this.status = track.status;
			this.waveformIndex = track.waveformIndex;
		}
	}

	const FORMAT_ERROR_CODES = new Set([MediaError.MEDIA_ERR_DECODE, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]);
	const LOST_TRACK_STATES = new Set([im_v2_const.PlaybackTrackState.accessDenied, im_v2_const.PlaybackTrackState.messageDeleted, im_v2_const.PlaybackTrackState.fileDeleted]);
	const UNPLAYABLE_TRACK_STATES = new Set([...LOST_TRACK_STATES, im_v2_const.PlaybackTrackState.fileProcessing]);
	class PlaybackService {
		#audioElement;
		#broadcast;
		#state;
		#snapshot = ui_vue3.ref(null);
		#stopped = false;
		#playedToEnd = false;
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}
		static getInstanceIfCreated() {
			return this.instance;
		}
		constructor() {
			this.#state = ui_vue3.reactive({
				trackState: im_v2_const.PlaybackTrackState.paused,
				position: 0,
				rate: PlaybackRate.get(),
				pauseReason: null
			});
			this.#audioElement = this.#mountAudioElement();
			this.#subscribeToElement();
			this.#broadcast = new PlaybackBroadcast(this.#onOtherTabStart);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.player.rateChange, this.#onRateChange);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.playback.onExternalPlayerStart, this.#onExternalPlayerStart);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.onMessageDeleted, this.#onMessageDeleted);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.slider.onClose, this.#onMessengerClose);
			CallPriority.create(this);
		}
		play(track) {
			this.#snapshot.value = new PlaybackSnapshot(track);
			this.#resetProgress();
			if (track.status !== im_v2_const.FileStatus.done) {
				this.#stopped = true;
				this.#state.trackState = im_v2_const.PlaybackTrackState.fileProcessing;
				this.#releaseSource();
				return;
			}
			this.#state.trackState = im_v2_const.PlaybackTrackState.loading;
			this.#audioElement.src = track.src;
			this.#audioElement.currentTime = 0;
			this.#startPlayback();
		}
		resume() {
			if (this.#hasNothingToPlay()) {
				return;
			}
			const isRetryAfterFailure = this.#state.trackState !== im_v2_const.PlaybackTrackState.paused;
			this.#state.pauseReason = null;
			this.#audioElement.currentTime = this.#audioElement.ended ? 0 : this.#state.position;
			if (isRetryAfterFailure) {
				this.#state.trackState = im_v2_const.PlaybackTrackState.loading;
			}
			this.#startPlayback();
		}
		pause(reason) {
			if (!this.#acceptsPauseReason(reason)) {
				return;
			}
			this.#state.pauseReason = reason;
			this.#audioElement.pause();
		}
		stop(state) {
			this.#stopped = true;
			this.#audioElement.pause();
			this.#state.trackState = state;
			this.#state.pauseReason = null;
			if (this.#isTrackLost()) {
				this.#releaseSource();
			}
		}
		seek(position) {
			if (this.#hasNothingToPlay()) {
				return;
			}
			this.#audioElement.currentTime = position;
			this.#state.position = position;
		}

		// the rate is common to every player of the page, so the write goes through the shared holder and
		// comes back as a broadcast - this service applies it in the same handler as a switch made elsewhere
		setRate(rate) {
			if (this.#snapshot.value) {
				im_v2_lib_analytics.Analytics.getInstance().player.onChangeRate(this.#snapshot.value.chatId, rate);
			}
			PlaybackRate.set(rate);
		}
		close() {
			this.#stopped = true;
			this.#audioElement.pause();
			this.#releaseSource();
			this.#snapshot.value = null;
			this.#state.trackState = im_v2_const.PlaybackTrackState.paused;
			this.#resetProgress();
		}
		getState() {
			return this.#state;
		}
		getSnapshot() {
			return this.#snapshot.value;
		}
		isCurrentFile(fileId) {
			const snapshot = this.#snapshot.value;
			return Boolean(snapshot) && String(snapshot.fileId) === String(fileId);
		}
		canResume() {
			return Boolean(this.#snapshot.value) && !this.#hasNothingToPlay();
		}
		handleMessageDeleted(messageId) {
			if (!this.#isCurrentMessage(messageId)) {
				return;
			}
			this.stop(im_v2_const.PlaybackTrackState.messageDeleted);
		}
		handleFileDeleted(fileId) {
			if (!this.isCurrentFile(fileId)) {
				return;
			}
			this.stop(im_v2_const.PlaybackTrackState.fileDeleted);
		}
		handleChatAccessLost(dialogId) {
			if (this.#snapshot.value?.dialogId !== dialogId) {
				return;
			}
			this.stop(im_v2_const.PlaybackTrackState.accessDenied);
		}
		handleCallFinished(wasConnected) {
			if (this.#state.pauseReason !== PlaybackPauseReason.incomingCallMissed) {
				return;
			}
			if (wasConnected) {
				this.#state.pauseReason = PlaybackPauseReason.incomingCallAnswered;
				return;
			}
			this.resume();
		}
		#isTrackLost() {
			return LOST_TRACK_STATES.has(this.#state.trackState);
		}
		#hasNothingToPlay() {
			return UNPLAYABLE_TRACK_STATES.has(this.#state.trackState);
		}
		#releaseSource() {
			this.#audioElement.removeAttribute('src');
			this.#audioElement.load();
		}
		#acceptsPauseReason(reason) {
			if (!this.#snapshot.value || this.#stopped || this.#playedToEnd) {
				return false;
			}
			const currentReason = this.#state.pauseReason;
			return currentReason === null || reason === PlaybackPauseReason.manual || currentReason === PlaybackPauseReason.incomingCallMissed;
		}
		#isCurrentMessage(messageId) {
			const snapshot = this.#snapshot.value;
			return Boolean(snapshot) && String(snapshot.messageId) === String(messageId);
		}
		#mountAudioElement() {
			const audioElement = main_core.Tag.render`<audio class="bx-im-playback__source" preload="auto"></audio>`;
			const container = main_core.Tag.render`<div class="bx-im-playback__container" hidden></div>`;
			main_core.Dom.append(audioElement, container);
			main_core.Dom.append(container, document.body);
			return audioElement;
		}
		#subscribeToElement() {
			const handlerByEvent = {
				loadedmetadata: this.#onDurationChange,
				durationchange: this.#onDurationChange,
				timeupdate: this.#onTimeUpdate,
				playing: this.#onPlaying,
				pause: this.#onPause,
				ended: this.#onEnded,
				error: this.#onError
			};
			Object.entries(handlerByEvent).forEach(([eventName, handler]) => {
				main_core.Event.bind(this.#audioElement, eventName, handler);
			});
		}
		#startPlayback() {
			this.#stopped = false;
			this.#playedToEnd = false;
			if (this.#snapshot.value) {
				main_core_events.EventEmitter.emit(im_v2_const.EventType.playback.onServiceStart, {
					fileId: this.#snapshot.value.fileId
				});
				this.#broadcast.announceStart(this.#snapshot.value.fileId);
			}
			this.#audioElement.playbackRate = this.#state.rate;
			this.#audioElement.play().catch(() => {
				if (this.#stopped) {
					return;
				}
				this.#state.trackState = im_v2_const.PlaybackTrackState.paused;
			});
		}
		#resetProgress() {
			this.#state.position = 0;
			this.#state.pauseReason = null;
		}
		#onDurationChange = () => {
			if (!this.#snapshot.value || !Number.isFinite(this.#audioElement.duration)) {
				return;
			}
			this.#snapshot.value.duration = this.#audioElement.duration;
		};
		#onTimeUpdate = () => {
			if (!this.#snapshot.value) {
				return;
			}
			this.#state.position = this.#audioElement.currentTime;
		};
		#onPlaying = () => {
			if (this.#stopped) {
				return;
			}
			this.#state.trackState = im_v2_const.PlaybackTrackState.playing;
			if (this.#snapshot.value) {
				im_v2_lib_analytics.Analytics.getInstance().player.onPlay(this.#snapshot.value.fileId);
			}
		};
		#onPause = () => {
			if (this.#state.trackState !== im_v2_const.PlaybackTrackState.playing) {
				return;
			}
			this.#state.trackState = im_v2_const.PlaybackTrackState.paused;
			if (this.#snapshot.value) {
				im_v2_lib_analytics.Analytics.getInstance().player.onPause(this.#snapshot.value.fileId);
			}
		};
		#onEnded = () => {
			if (this.#stopped || !this.#snapshot.value) {
				return;
			}
			this.#playedToEnd = true;
			this.#state.trackState = im_v2_const.PlaybackTrackState.paused;
			main_core_events.EventEmitter.emit(im_v2_const.EventType.playback.onTrackEnded, {
				fileId: this.#snapshot.value.fileId,
				scope: this.#snapshot.value.scope
			});
		};
		#onError = () => {
			if (this.#stopped || !this.#snapshot.value) {
				return;
			}
			this.#state.trackState = FORMAT_ERROR_CODES.has(this.#audioElement.error?.code) ? im_v2_const.PlaybackTrackState.unsupportedFormat : im_v2_const.PlaybackTrackState.loadingError;
		};

		// a switch made anywhere - the bar, a voice message, a video note - reaches the record that is
		// playing right now, not only the one started after it
		#onRateChange = event => {
			const {
				rate
			} = event.getData();
			this.#state.rate = rate;
			this.#audioElement.playbackRate = rate;
		};
		#onExternalPlayerStart = () => {
			if (!this.canResume()) {
				return;
			}
			this.stop(im_v2_const.PlaybackTrackState.paused);
		};
		#onMessageDeleted = event => {
			this.handleMessageDeleted(event.getData().messageId);
		};
		#onMessengerClose = () => {
			this.close();
		};
		#onOtherTabStart = () => {
			this.pause(PlaybackPauseReason.otherTab);
		};
	}

	exports.CallPriority = CallPriority;
	exports.PlaybackPauseReason = PlaybackPauseReason;
	exports.PlaybackRate = PlaybackRate;
	exports.PlaybackService = PlaybackService;
	exports.PlaybackSnapshot = PlaybackSnapshot;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.Vue3, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=playback.bundle.js.map
