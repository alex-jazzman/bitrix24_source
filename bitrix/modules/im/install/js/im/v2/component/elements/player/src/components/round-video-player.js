import 'main.polyfill.intersectionobserver';

import { EventEmitter, type BaseEvent } from 'main.core.events';

import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { PlaybackRate } from 'im.v2.lib.playback';
import { Outline as OutlineIcons, BIcon } from 'ui.icon-set.api.vue';

import { Utils } from 'im.v2.lib.utils';
import { AudioPlaybackRate, Color, EventType, FileStatus, PlaylistScope } from 'im.v2.const';
import { FadeAnimation } from 'im.v2.component.animation';

import { Playlist, type PlaylistTrack } from '../classes/playlist';
import { RoundProgressBar } from './elements/round-progress-bar';
import { TranscriptionButton } from './elements/transcription-button/transcription-button';

import './css/round-video-player.css';

import type { JsonObject } from 'main.core';
import type { ImModelFile } from 'im.v2.model';

const PlaybackMode = {
	autoplay: 'autoplay',
	manual: 'manual',
};

const PlaybackState = {
	loading: 'loading',
	playing: 'playing',
	paused: 'paused',
};

const MUTE_ICON_SIZE = 16;

// @vue/component
export const RoundVideoPlayer = {
	name: 'RoundVideoPlayer',
	components: { BIcon, FadeAnimation, RoundProgressBar, TranscriptionButton },
	props: {
		item: {
			type: Object,
			required: true,
		},
		message: {
			type: Object,
			required: true,
		},
		startWithSound: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['openTranscription'],
	data(): JsonObject
	{
		return {
			playbackMode: PlaybackMode.autoplay,
			playbackState: PlaybackState.loading,
			currentTime: 0,
			duration: 0,
			animationFrameId: null,
			currentTimeSmoothed: 0,
			currentRate: AudioPlaybackRate['1'],
		};
	},
	computed: {
		PlaybackMode: () => PlaybackMode,
		OutlineIcons: () => OutlineIcons,
		MUTE_ICON_SIZE: () => MUTE_ICON_SIZE,
		Color: () => Color,
		file(): ImModelFile
		{
			return this.item;
		},
		isLoaded(): boolean
		{
			return this.playbackState === PlaybackState.loading;
		},
		isAutoplay(): boolean
		{
			return this.playbackMode === PlaybackMode.autoplay;
		},
		formattedTime(): string
		{
			if (!this.isLoaded && !this.duration)
			{
				return '--:--';
			}

			const time = this.duration - this.currentTime;

			return Utils.date.formatMediaDurationTime(time);
		},
		videoElement(): HTMLVideoElement
		{
			return this.$refs.videoElement;
		},
		currentProgress(): number
		{
			if (this.duration === 0)
			{
				return 0;
			}

			return (this.currentTimeSmoothed / this.duration) * 100;
		},
		isPaused(): boolean
		{
			return this.playbackState === PlaybackState.paused;
		},
		isTranscriptionAvailable(): boolean
		{
			return this.file.isTranscribable
				&& FeatureManager.isFeatureAvailable(Feature.videoNoteTranscriptionAvailable)
				&& FeatureManager.isFeatureAvailable(Feature.copilotAvailable);
		},
		isPlaybackRateFeatureAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isVideoNotePlaybackRateAvailable);
		},
		isPlaybackRateAvailable(): boolean
		{
			return this.file.status === FileStatus.done && this.isPlaybackRateFeatureAvailable;
		},
		currentRateLabel(): string
		{
			return `${this.currentRate}x`;
		},
		rateControlAriaLabel(): string
		{
			return this.loc('IM_ELEMENTS_PLAYER_ROUND_VIDEO_RATE_ARIA', { '#RATE#': this.currentRateLabel });
		},
	},
	created()
	{
		Playlist.getInstance(PlaylistScope.chat).register(this.playlistTrack());
	},
	mounted()
	{
		this.getObserver().observe(this.$refs.body);
		this.getEmitter().subscribe(EventType.player.playNext, this.handlePlayNextRequest);
		this.getEmitter().subscribe(EventType.roundVideoPlayer.onClickPlay, this.handleOtherVideoStarted);
		EventEmitter.subscribe(EventType.playback.onServiceStart, this.handleServiceStarted);
		this.getEmitter().subscribe(EventType.audioPlayer.pause, this.handleOtherPlayerStarted);
		if (this.isPlaybackRateFeatureAvailable)
		{
			EventEmitter.subscribe(EventType.player.rateChange, this.handleRateChange);
		}

		if (this.startWithSound)
		{
			this.notifyPlaybackServiceAboutStart();
			this.switchToManualMode();
		}
	},
	beforeUnmount()
	{
		this.stopProgressAnimation();
		this.getObserver().unobserve(this.$refs.body);
		Playlist.getInstance(PlaylistScope.chat).unregister(this.playlistTrack());
		this.getEmitter().unsubscribe(EventType.player.playNext, this.handlePlayNextRequest);
		this.getEmitter().unsubscribe(EventType.roundVideoPlayer.onClickPlay, this.handleOtherVideoStarted);
		EventEmitter.unsubscribe(EventType.playback.onServiceStart, this.handleServiceStarted);
		this.getEmitter().unsubscribe(EventType.audioPlayer.pause, this.handleOtherPlayerStarted);
		// Unconditionally: the guard on the subscribe is enough, and unsubscribing a listener that was
		// never subscribed is a no-op. A condition here would leak the listener the moment it names the
		// neighbouring isPlaybackRateAvailable, which is reactive and can read differently than at mount.
		EventEmitter.unsubscribe(EventType.player.rateChange, this.handleRateChange);
	},
	methods: {
		togglePlayMode()
		{
			this.getEmitter().emit(EventType.roundVideoPlayer.onClickPlay, { fileId: this.file.id });
			if (this.playbackMode === PlaybackMode.autoplay)
			{
				Analytics.getInstance().player.onPlay(this.file.id);
				this.notifyPlaybackServiceAboutStart();
				this.switchToManualMode();

				return;
			}

			if (this.playbackState === PlaybackState.playing)
			{
				Analytics.getInstance().player.onPause(this.file.id);
				this.pauseVideo();
			}
			else
			{
				Analytics.getInstance().player.onPlay(this.file.id);
				this.notifyPlaybackServiceAboutStart();
				this.playVideo();
			}
		},
		notifyPlaybackServiceAboutStart()
		{
			EventEmitter.emit(EventType.playback.onExternalPlayerStart, { fileId: this.file.id });
		},
		playVideo()
		{
			if (this.isPlaybackRateFeatureAvailable)
			{
				// every start goes through here, so the common rate is re-read at each of them, not kept from the mount
				this.updateRate(PlaybackRate.get());
			}

			// Only a start with sound claims the audible channel: a muted preview leaves the voice
			// messages alone. The circle owns no file the voice players know, so their own guard by
			// initiator keeps them from answering their own request - and keeps this one out of it.
			if (!this.isAutoplay)
			{
				this.getEmitter().emit(EventType.audioPlayer.pause, { initiator: this.file.id });
			}

			void this.videoElement.play();
		},
		pauseVideo()
		{
			this.videoElement.pause();
		},
		handleRateControlClick()
		{
			// the new value comes back through the broadcast, so this player applies it the same way as the others
			PlaybackRate.set(PlaybackRate.getNext(PlaybackRate.get()));
		},
		handleRateChange(event: BaseEvent<{rate: $Values<typeof AudioPlaybackRate>}>)
		{
			this.updateRate(event.getData().rate);
		},
		// A voice message has taken the audible channel, so this circle goes back to the muted preview -
		// the same retreat as when another circle starts. Without it both play at once, and the chat
		// playlist holds files of both kinds: the one that ends first sends playNext into the other,
		// interrupting a play() with a pause() on a live element.
		handleOtherPlayerStarted(event: BaseEvent<{initiator: string | number}>)
		{
			if (event.getData().initiator === this.file.id || this.isAutoplay)
			{
				return;
			}

			this.switchToAutoplayMode();
		},
		updateRate(newRate: $Values<typeof AudioPlaybackRate>)
		{
			this.currentRate = newRate;
			this.videoElement.playbackRate = newRate;
		},
		handleLoadedMetaData()
		{
			this.duration = this.videoElement.duration;
			this.playVideo();
		},
		handleCanPlayThrough()
		{
			if (this.playbackState === PlaybackState.loading)
			{
				this.playVideo();
			}
		},
		handlePlay()
		{
			this.playbackState = PlaybackState.playing;
			this.startProgressAnimation();
		},
		handlePause()
		{
			this.playbackState = PlaybackState.paused;
			this.stopProgressAnimation();
		},
		handleEnded()
		{
			this.switchToAutoplayMode();
			Playlist.getInstance(PlaylistScope.chat).onFileEnded({
				...this.playlistTrack(),
				context: { emitter: this.getEmitter() },
			});
		},
		handleTimeUpdate()
		{
			this.currentTime = this.videoElement.currentTime;
		},
		handleError(event: Event)
		{
			console.error('Im.RoundVideoPlayer: loading failed', event);
			this.playbackState = PlaybackState.loading;
			this.duration = 0;
			this.stopProgressAnimation();
		},
		// See AudioPlayer.playlistTrack: the message is a part of the address of a track.
		playlistTrack(): PlaylistTrack
		{
			return { messageId: this.message.id, file: this.file };
		},
		handlePlayNextRequest(event: BaseEvent<{messageId: string | number, fileId: string, scope: string}>)
		{
			const { messageId, fileId, scope } = event.getData();
			if (fileId !== this.file.id || messageId !== this.message.id || scope !== PlaylistScope.chat)
			{
				return;
			}

			this.$refs.body.scrollIntoView({ behavior: 'smooth', block: 'center' });
			this.switchToManualMode();
		},
		handleOtherVideoStarted(event: BaseEvent<{fileId: string}>)
		{
			const { fileId } = event.getData();
			if (fileId === this.file.id)
			{
				return;
			}

			this.switchToAutoplayMode();
		},
		handleServiceStarted()
		{
			if (this.playbackMode !== PlaybackMode.manual)
			{
				return;
			}

			this.switchToAutoplayMode();
		},
		switchToAutoplayMode()
		{
			this.keepFocusInsidePlayer();
			this.playbackMode = PlaybackMode.autoplay;
			this.videoElement.loop = true;
			this.videoElement.muted = true;
			this.playVideo();
		},
		switchToManualMode()
		{
			this.playbackMode = PlaybackMode.manual;
			this.videoElement.currentTime = 0;
			this.videoElement.loop = false;
			this.videoElement.muted = false;
			this.playVideo();
		},
		// autoplay unmounts the rate control, so the focus it holds is moved to the circle before that happens
		keepFocusInsidePlayer()
		{
			if (document.activeElement !== this.$refs.rateControl)
			{
				return;
			}

			// preventScroll is deliberate: moving the focus must not pull the feed back to a circle
			// the user has already scrolled away from
			this.$refs.body.focus({ preventScroll: true });
		},
		getObserver(): IntersectionObserver
		{
			if (this.observer)
			{
				return this.observer;
			}

			this.observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (!this.isAutoplay)
					{
						return;
					}

					if (entry.isIntersecting)
					{
						this.playVideo();
					}
					else
					{
						this.pauseVideo();
					}
				});
			}, { threshold: [0, 1] });

			return this.observer;
		},
		startProgressAnimation()
		{
			const update = () => {
				if (!this.videoElement)
				{
					return;
				}
				this.currentTimeSmoothed = this.videoElement.currentTime;
				this.animationFrameId = requestAnimationFrame(update);
			};
			update();
		},
		stopProgressAnimation()
		{
			if (!this.animationFrameId)
			{
				return;
			}

			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(code: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(code, replacements);
		},
	},
	template: `
		<div class="bx-im-round-video-player__container" data-testid="im-round-video-player">
			<FadeAnimation :duration="200">
				<div
					v-if="isAutoplay"
					class="bx-im-round-video-player__mute"
					data-testid="im-round-video-player-mute"
				>
					<BIcon
						:name="OutlineIcons.SOUND_OFF"
						:color="Color.white"
						:size="MUTE_ICON_SIZE"
					/>
				</div>
				<button
					v-else-if="isPlaybackRateAvailable"
					type="button"
					class="bx-im-round-video-player__rate-button --focus-visible"
					data-testid="im-round-video-player-rate-btn"
					:aria-label="rateControlAriaLabel"
					ref="rateControl"
					@click="handleRateControlClick"
				>{{ currentRateLabel }}</button>
			</FadeAnimation>
			<div v-if="isTranscriptionAvailable" class="bx-im-round-video-player__transcribe-button">
				<TranscriptionButton
					:file="file"
					:messageId="message.id"
					:isOpened="false"
					:isOverlay="true"
					@transcriptionToggle="$emit('openTranscription')"
				/>
			</div>
			<div class="bx-im-round-video-player__time-container">
				<div
					class="bx-im-round-video-player__time"
					data-testid="im-round-video-player-time"
				>{{ formattedTime }}</div>
			</div>
			<div
				class="bx-im-round-video-player__video-container"
				data-testid="im-round-video-player-video-container"
				ref="body"
				tabindex="-1"
				@click.stop="togglePlayMode"
			>
				<FadeAnimation :duration="200">
					<div v-if="isPaused" class="bx-im-round-video-player__start-play_button"></div>
				</FadeAnimation>
				<video
					:src="file.urlDownload"
					class="bx-im-round-video-player__video"
					:poster="file.urlPreview"
					ref="videoElement"
					data-testid="im-round-video-player-video"
					preload="metadata"
					playsinline
					loop
					muted
					@abort="handleError"
					@error="handleError"
					@canplaythrough="handleCanPlayThrough"
					@loadedmetadata="handleLoadedMetaData"
					@timeupdate="handleTimeUpdate"
					@play="handlePlay"
					@pause="handlePause"
					@ended="handleEnded"
				></video>
				<FadeAnimation :duration="200">
					<RoundProgressBar 
						v-if="playbackMode === PlaybackMode.manual" 
						:progress="currentProgress" 
					/>
				</FadeAnimation>
			</div>
		</div>
	`,
};
