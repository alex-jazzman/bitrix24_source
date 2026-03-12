import 'main.polyfill.intersectionobserver';

import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Outline as OutlineIcons, BIcon } from 'ui.icon-set.api.vue';

import { Utils } from 'im.v2.lib.utils';
import { Color, EventType } from 'im.v2.const';
import { FadeAnimation } from 'im.v2.component.animation';

import { Playlist } from '../classes/playlist';
import { RoundProgressBar } from './elements/round-progress-bar';
import { TranscriptionButton } from './elements/transcription-button/transcription-button';

import './css/round-video-player.css';

import type { EventEmitter, BaseEvent } from 'main.core.events';
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
	},
	created()
	{
		Playlist.getInstance().register(this.file);
	},
	mounted()
	{
		this.getObserver().observe(this.$refs.body);
		this.getEmitter().subscribe(EventType.roundVideoPlayer.playNext, this.handlePlayNextRequest);
		this.getEmitter().subscribe(EventType.roundVideoPlayer.onClickPlay, this.handleOtherVideoStarted);

		if (this.startWithSound)
		{
			this.switchToManualMode();
		}
	},
	beforeUnmount()
	{
		this.stopProgressAnimation();
		this.getObserver().unobserve(this.$refs.body);
		Playlist.getInstance().unregister(this.file);
		this.getEmitter().unsubscribe(EventType.roundVideoPlayer.playNext, this.handlePlayNextRequest);
		this.getEmitter().unsubscribe(EventType.roundVideoPlayer.onClickPlay, this.handleOtherVideoStarted);
	},
	methods: {
		togglePlayMode()
		{
			this.getEmitter().emit(EventType.roundVideoPlayer.onClickPlay, { fileId: this.file.id });
			if (this.playbackMode === PlaybackMode.autoplay)
			{
				Analytics.getInstance().player.onPlay(this.file.id);
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
				this.playVideo();
			}
		},
		playVideo()
		{
			void this.videoElement.play();
		},
		pauseVideo()
		{
			this.videoElement.pause();
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
			Playlist.getInstance().onFileEnded({
				file: this.file,
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
		handlePlayNextRequest(event: BaseEvent<{fileId: string}>)
		{
			const { fileId } = event.getData();
			if (fileId !== this.file.id)
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
		switchToAutoplayMode()
		{
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
	},
	template: `
		<div class="bx-im-round-video-player__container">
			<FadeAnimation :duration="200">
				<div v-if="isAutoplay" class="bx-im-round-video-player__mute">
					<BIcon
						:name="OutlineIcons.SOUND_OFF"
						:color="Color.white"
						:size="MUTE_ICON_SIZE"
					/>
				</div>
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
				<div class="bx-im-round-video-player__time">{{ formattedTime }}</div>
			</div>
			<div class="bx-im-round-video-player__video-container" ref="body" @click.stop="togglePlayMode">
				<FadeAnimation :duration="200">
					<div v-if="isPaused" class="bx-im-round-video-player__start-play_button"></div>
				</FadeAnimation>
				<video
					:src="file.urlDownload"
					class="bx-im-round-video-player__video"
					:poster="file.urlPreview"
					ref="videoElement"
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
