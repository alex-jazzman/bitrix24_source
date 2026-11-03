import { Dom, Event, Tag } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { reactive, ref } from 'ui.vue3';

import { AudioPlaybackRate, EventType, FileStatus, PlaybackTrackState } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';

import { PlaybackPauseReason } from '../const/pause-reason';
import { CallPriority } from './call-priority';
import { PlaybackBroadcast } from './playback-broadcast';
import { PlaybackRate } from './playback-rate';
import { PlaybackSnapshot, type PlaybackTrack } from './playback-snapshot';

const FORMAT_ERROR_CODES = new Set([
	MediaError.MEDIA_ERR_DECODE,
	MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
]);

const LOST_TRACK_STATES = new Set([
	PlaybackTrackState.accessDenied,
	PlaybackTrackState.messageDeleted,
	PlaybackTrackState.fileDeleted,
]);

const UNPLAYABLE_TRACK_STATES = new Set([...LOST_TRACK_STATES, PlaybackTrackState.fileProcessing]);

export type PlaybackState = {
	trackState: $Values<typeof PlaybackTrackState>,
	position: number,
	rate: $Values<typeof AudioPlaybackRate>,
	pauseReason: $Values<typeof PlaybackPauseReason> | null,
};

export class PlaybackService
{
	static instance: PlaybackService;

	#audioElement: HTMLAudioElement;
	#broadcast: PlaybackBroadcast;
	#state: PlaybackState;
	#snapshot = ref(null);
	#stopped: boolean = false;
	#playedToEnd: boolean = false;

	static getInstance(): PlaybackService
	{
		if (!this.instance)
		{
			this.instance = new this();
		}

		return this.instance;
	}

	static getInstanceIfCreated(): ?PlaybackService
	{
		return this.instance;
	}

	constructor()
	{
		this.#state = reactive({
			trackState: PlaybackTrackState.paused,
			position: 0,
			rate: PlaybackRate.get(),
			pauseReason: null,
		});
		this.#audioElement = this.#mountAudioElement();
		this.#subscribeToElement();
		this.#broadcast = new PlaybackBroadcast(this.#onOtherTabStart);

		EventEmitter.subscribe(EventType.player.rateChange, this.#onRateChange);
		EventEmitter.subscribe(EventType.playback.onExternalPlayerStart, this.#onExternalPlayerStart);
		EventEmitter.subscribe(EventType.dialog.onMessageDeleted, this.#onMessageDeleted);
		EventEmitter.subscribe(EventType.slider.onClose, this.#onMessengerClose);

		CallPriority.create(this);
	}

	play(track: PlaybackTrack): void
	{
		this.#snapshot.value = new PlaybackSnapshot(track);
		this.#resetProgress();

		if (track.status !== FileStatus.done)
		{
			this.#stopped = true;
			this.#state.trackState = PlaybackTrackState.fileProcessing;
			this.#releaseSource();

			return;
		}

		this.#state.trackState = PlaybackTrackState.loading;

		this.#audioElement.src = track.src;
		this.#audioElement.currentTime = 0;
		this.#startPlayback();
	}

	resume(): void
	{
		if (this.#hasNothingToPlay())
		{
			return;
		}

		const isRetryAfterFailure = this.#state.trackState !== PlaybackTrackState.paused;

		this.#state.pauseReason = null;
		this.#audioElement.currentTime = this.#audioElement.ended ? 0 : this.#state.position;

		if (isRetryAfterFailure)
		{
			this.#state.trackState = PlaybackTrackState.loading;
		}

		this.#startPlayback();
	}

	pause(reason: $Values<typeof PlaybackPauseReason>): void
	{
		if (!this.#acceptsPauseReason(reason))
		{
			return;
		}

		this.#state.pauseReason = reason;
		this.#audioElement.pause();
	}

	stop(state: $Values<typeof PlaybackTrackState>): void
	{
		this.#stopped = true;
		this.#audioElement.pause();
		this.#state.trackState = state;
		this.#state.pauseReason = null;

		if (this.#isTrackLost())
		{
			this.#releaseSource();
		}
	}

	seek(position: number): void
	{
		if (this.#hasNothingToPlay())
		{
			return;
		}

		this.#audioElement.currentTime = position;
		this.#state.position = position;
	}

	// the rate is common to every player of the page, so the write goes through the shared holder and
	// comes back as a broadcast - this service applies it in the same handler as a switch made elsewhere
	setRate(rate: $Values<typeof AudioPlaybackRate>): void
	{
		if (this.#snapshot.value)
		{
			Analytics.getInstance().player.onChangeRate(this.#snapshot.value.chatId, rate);
		}

		PlaybackRate.set(rate);
	}

	close(): void
	{
		this.#stopped = true;
		this.#audioElement.pause();
		this.#releaseSource();
		this.#snapshot.value = null;
		this.#state.trackState = PlaybackTrackState.paused;
		this.#resetProgress();
	}

	getState(): PlaybackState
	{
		return this.#state;
	}

	getSnapshot(): ?PlaybackSnapshot
	{
		return this.#snapshot.value;
	}

	isCurrentFile(fileId: string | number): boolean
	{
		const snapshot = this.#snapshot.value;

		return Boolean(snapshot) && String(snapshot.fileId) === String(fileId);
	}

	canResume(): boolean
	{
		return Boolean(this.#snapshot.value) && !this.#hasNothingToPlay();
	}

	handleMessageDeleted(messageId: string | number): void
	{
		if (!this.#isCurrentMessage(messageId))
		{
			return;
		}

		this.stop(PlaybackTrackState.messageDeleted);
	}

	handleFileDeleted(fileId: string | number): void
	{
		if (!this.isCurrentFile(fileId))
		{
			return;
		}

		this.stop(PlaybackTrackState.fileDeleted);
	}

	handleChatAccessLost(dialogId: string): void
	{
		if (this.#snapshot.value?.dialogId !== dialogId)
		{
			return;
		}

		this.stop(PlaybackTrackState.accessDenied);
	}

	handleCallFinished(wasConnected: boolean): void
	{
		if (this.#state.pauseReason !== PlaybackPauseReason.incomingCallMissed)
		{
			return;
		}

		if (wasConnected)
		{
			this.#state.pauseReason = PlaybackPauseReason.incomingCallAnswered;

			return;
		}

		this.resume();
	}

	#isTrackLost(): boolean
	{
		return LOST_TRACK_STATES.has(this.#state.trackState);
	}

	#hasNothingToPlay(): boolean
	{
		return UNPLAYABLE_TRACK_STATES.has(this.#state.trackState);
	}

	#releaseSource(): void
	{
		this.#audioElement.removeAttribute('src');
		this.#audioElement.load();
	}

	#acceptsPauseReason(reason: $Values<typeof PlaybackPauseReason>): boolean
	{
		if (!this.#snapshot.value || this.#stopped || this.#playedToEnd)
		{
			return false;
		}

		const currentReason = this.#state.pauseReason;

		return currentReason === null
			|| reason === PlaybackPauseReason.manual
			|| currentReason === PlaybackPauseReason.incomingCallMissed;
	}

	#isCurrentMessage(messageId: string | number): boolean
	{
		const snapshot = this.#snapshot.value;

		return Boolean(snapshot) && String(snapshot.messageId) === String(messageId);
	}

	#mountAudioElement(): HTMLAudioElement
	{
		const audioElement = Tag.render`<audio class="bx-im-playback__source" preload="auto"></audio>`;
		const container = Tag.render`<div class="bx-im-playback__container" hidden></div>`;

		Dom.append(audioElement, container);
		Dom.append(container, document.body);

		return audioElement;
	}

	#subscribeToElement(): void
	{
		const handlerByEvent = {
			loadedmetadata: this.#onDurationChange,
			durationchange: this.#onDurationChange,
			timeupdate: this.#onTimeUpdate,
			playing: this.#onPlaying,
			pause: this.#onPause,
			ended: this.#onEnded,
			error: this.#onError,
		};

		Object.entries(handlerByEvent).forEach(([eventName, handler]) => {
			Event.bind(this.#audioElement, eventName, handler);
		});
	}

	#startPlayback(): void
	{
		this.#stopped = false;
		this.#playedToEnd = false;

		if (this.#snapshot.value)
		{
			EventEmitter.emit(EventType.playback.onServiceStart, { fileId: this.#snapshot.value.fileId });
			this.#broadcast.announceStart(this.#snapshot.value.fileId);
		}

		this.#audioElement.playbackRate = this.#state.rate;
		this.#audioElement.play().catch(() => {
			if (this.#stopped)
			{
				return;
			}

			this.#state.trackState = PlaybackTrackState.paused;
		});
	}

	#resetProgress(): void
	{
		this.#state.position = 0;
		this.#state.pauseReason = null;
	}

	#onDurationChange = (): void => {
		if (!this.#snapshot.value || !Number.isFinite(this.#audioElement.duration))
		{
			return;
		}

		this.#snapshot.value.duration = this.#audioElement.duration;
	};

	#onTimeUpdate = (): void => {
		if (!this.#snapshot.value)
		{
			return;
		}

		this.#state.position = this.#audioElement.currentTime;
	};

	#onPlaying = (): void => {
		if (this.#stopped)
		{
			return;
		}

		this.#state.trackState = PlaybackTrackState.playing;

		if (this.#snapshot.value)
		{
			Analytics.getInstance().player.onPlay(this.#snapshot.value.fileId);
		}
	};

	#onPause = (): void => {
		if (this.#state.trackState !== PlaybackTrackState.playing)
		{
			return;
		}

		this.#state.trackState = PlaybackTrackState.paused;

		if (this.#snapshot.value)
		{
			Analytics.getInstance().player.onPause(this.#snapshot.value.fileId);
		}
	};

	#onEnded = (): void => {
		if (this.#stopped || !this.#snapshot.value)
		{
			return;
		}

		this.#playedToEnd = true;
		this.#state.trackState = PlaybackTrackState.paused;

		EventEmitter.emit(EventType.playback.onTrackEnded, {
			fileId: this.#snapshot.value.fileId,
			scope: this.#snapshot.value.scope,
		});
	};

	#onError = (): void => {
		if (this.#stopped || !this.#snapshot.value)
		{
			return;
		}

		this.#state.trackState = FORMAT_ERROR_CODES.has(this.#audioElement.error?.code)
			? PlaybackTrackState.unsupportedFormat
			: PlaybackTrackState.loadingError;
	};

	// a switch made anywhere - the bar, a voice message, a video note - reaches the record that is
	// playing right now, not only the one started after it
	#onRateChange = (event: BaseEvent<{ rate: $Values<typeof AudioPlaybackRate> }>): void => {
		const { rate } = event.getData();

		this.#state.rate = rate;
		this.#audioElement.playbackRate = rate;
	};

	#onExternalPlayerStart = (): void => {
		if (!this.canResume())
		{
			return;
		}

		this.stop(PlaybackTrackState.paused);
	};

	#onMessageDeleted = (event: BaseEvent<{ messageId: string | number }>): void => {
		this.handleMessageDeleted(event.getData().messageId);
	};

	#onMessengerClose = (): void => {
		this.close();
	};

	#onOtherTabStart = (): void => {
		this.pause(PlaybackPauseReason.otherTab);
	};
}
