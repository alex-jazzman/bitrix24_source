import { type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';
import 'main.polyfill.intersectionobserver';
import 'ui.fonts.opensans';

import { MessageAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { LocalStorageKey, AudioPlaybackRate, AudioPlaybackState as State, EventType, PlaylistScope } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { Utils } from 'im.v2.lib.utils';

import { Playlist } from '../classes/playlist';
import { Timeline } from './elements/timeline/timeline';
import { TranscriptionButton } from './elements/transcription-button/transcription-button';
import { TranscriptionText } from './elements/transcription-text/transcription-text';

import './css/audio-player.css';

// @vue/component
export const AudioPlayer = {
	name: 'AudioPlayer',
	components: { MessageAvatar, Timeline, TranscriptionButton, TranscriptionText },
	props: {
		src: {
			type: String,
			default: '',
		},
		file: {
			type: Object,
			required: true,
		},
		authorId: {
			type: Number,
			required: true,
		},
		messageId: {
			type: [String, Number],
			required: true,
		},
		withContextMenu: {
			type: Boolean,
			default: true,
		},
		withAvatar: {
			type: Boolean,
			default: true,
		},
		withPlaybackRateControl: {
			type: Boolean,
			default: false,
		},
		withTranscription: {
			type: Boolean,
			default: true,
		},
		playlistScope: {
			type: String,
			default: PlaylistScope.chat,
		},
	},
	data(): JsonObject
	{
		return {
			preload: 'none',
			loaded: false,
			loading: false,
			state: State.none,
			timeCurrent: 0,
			timeTotal: 0,
			showContextButton: false,
			currentRate: AudioPlaybackRate['1'],
			isTranscriptionOpened: false,
		};
	},
	computed: {
		State: () => State,
		isPlaying(): boolean
		{
			return this.state === State.play;
		},
		labelTime(): string
		{
			if (!this.loaded && !this.timeTotal)
			{
				return '--:--';
			}

			let time = 0;
			if (this.isPlaying)
			{
				time = this.timeTotal - this.timeCurrent;
			}
			else
			{
				time = this.timeTotal;
			}

			return Utils.date.formatMediaDurationTime(time);
		},
		AvatarSize: () => AvatarSize,
		fileSize(): string
		{
			return Utils.file.formatFileSize(this.file.size);
		},
		currentRateLabel(): string
		{
			return `${this.currentRate}x`;
		},
		metaInfo(): string
		{
			return `${this.fileSize}, ${this.labelTime}`;
		},
		isTranscriptionAvailable(): boolean
		{
			return this.withTranscription
				&& this.file.isTranscribable
				&& FeatureManager.isFeatureAvailable(Feature.aiFileTranscriptionAvailable)
				&& FeatureManager.isFeatureAvailable(Feature.copilotAvailable);
		},
	},
	created()
	{
		this.localStorageInst = LocalStorageManager.getInstance();
		this.currentRate = this.getRateFromLS();

		Playlist.getInstance(this.playlistScope).register(this.file);
		this.getEmitter().subscribe(EventType.audioPlayer.pause, this.onPause);
		this.getEmitter().subscribe(EventType.player.playNext, this.onPlayNext);
	},
	mounted()
	{
		this.getObserver().observe(this.$refs.body);
	},
	beforeUnmount()
	{
		Playlist.getInstance(this.playlistScope).unregister(this.file);

		this.getEmitter().unsubscribe(EventType.audioPlayer.pause, this.onPause);
		this.getEmitter().unsubscribe(EventType.player.playNext, this.onPlayNext);

		this.getObserver().unobserve(this.$refs.body);
	},
	methods:
	{
		loadFile(play: boolean = false)
		{
			if (this.loaded || (this.loading && !play))
			{
				return;
			}

			this.preload = 'auto';

			if (!play)
			{
				return;
			}

			this.loading = true;

			if (this.source())
			{
				void this.source().play();
			}
		},
		clickToButton()
		{
			if (!this.src)
			{
				return;
			}

			if (this.isPlaying)
			{
				this.pause();
			}
			else
			{
				this.play();
			}
		},
		play()
		{
			this.updateRate(this.getRateFromLS());

			if (!this.loaded)
			{
				this.loadFile(true);

				return;
			}

			void this.source().play();
		},
		pause()
		{
			this.source().pause();
		},
		stop()
		{
			this.state = State.stop;
			this.source().pause();
		},
		getRateFromLS(): $Values<typeof AudioPlaybackRate>
		{
			return this.localStorageInst.get(LocalStorageKey.audioPlaybackRate) || AudioPlaybackRate['1'];
		},
		setRateInLS(newRate: $Values<typeof AudioPlaybackRate>)
		{
			this.localStorageInst.set(LocalStorageKey.audioPlaybackRate, newRate);
		},
		getNextPlaybackRate(currentRate: $Values<typeof AudioPlaybackRate>): $Values<typeof AudioPlaybackRate>
		{
			const rates = Object.values(AudioPlaybackRate).sort();
			const currentIndex = rates.indexOf(currentRate);
			const nextIndex = (currentIndex + 1) % rates.length;

			return rates[nextIndex];
		},
		changeRate()
		{
			if ([State.pause, State.none].includes(this.state))
			{
				return;
			}

			const commonCurrentRate = this.getRateFromLS();
			const newRate = this.getNextPlaybackRate(commonCurrentRate);

			Analytics.getInstance().player.onChangeRate(this.file.chatId, newRate);
			this.setRateInLS(newRate);
			this.updateRate(newRate);
		},
		updateRate(newRate: $Values<typeof AudioPlaybackRate>)
		{
			this.currentRate = newRate;
			this.source().playbackRate = newRate;
		},
		onPause(event: BaseEvent)
		{
			const data = event.getData();

			if (data.initiator === this.file.id)
			{
				return;
			}

			this.pause();
		},
		onPlayNext(event: BaseEvent)
		{
			const data = event.getData();

			if (data.fileId !== this.file.id || data.scope !== this.playlistScope)
			{
				return;
			}

			this.$refs.body?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			this.play();
		},
		source(): HTMLAudioElement
		{
			return this.$refs.source;
		},
		audioEventRouter(eventName: string, event: BaseEvent)
		{
			// eslint-disable-next-line default-case
			switch (eventName)
			{
				case 'durationchange':
				case 'loadeddata':
				case 'loadedmetadata':
					if (!this.source())
					{
						return;
					}
					this.timeTotal = this.source().duration;

					break;
				case 'abort':
				case 'error':
					console.error('BxAudioPlayer: load failed', this.file.id, event);

					this.loading = false;
					this.state = State.none;
					this.timeTotal = 0;
					this.preload = 'none';

					break;
				case 'canplaythrough':
					this.loading = false;
					this.loaded = true;

					break;
				case 'timeupdate':
					if (!this.source())
					{
						return;
					}

					this.timeCurrent = this.source().currentTime;

					break;
				case 'ended':
					this.timeCurrent = 0;
					this.source().currentTime = 0;
					this.state = State.stop;
					Playlist.getInstance(this.playlistScope).onFileEnded({
						file: this.file,
						context: { emitter: this.getEmitter() },
					});

					break;
				case 'pause':
					Analytics.getInstance().player.onPause(this.file.id);
					if (this.state !== State.stop)
					{
						this.state = State.pause;
					}

					break;
				case 'play':
					Analytics.getInstance().player.onPlay(this.file.id);
					this.state = State.play;

					this.getEmitter().emit(EventType.audioPlayer.pause, { initiator: this.file.id });

					break;
				// No default
			}
		},
		getObserver(): IntersectionObserver
		{
			if (this.observer)
			{
				return this.observer;
			}

			this.observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && this.preload === 'none')
					{
						this.preload = 'metadata';
						this.observer.unobserve(entry.target);
					}
				});
			}, {
				threshold: [0, 1],
			});

			return this.observer;
		},
		onTimelineClick(progress: number)
		{
			this.play();
			this.source().currentTime = this.timeTotal / 100 * progress;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div class="bx-im-audio-player__scope">
			<div
				class="bx-im-audio-player__container"
				ref="body"
				@mouseover="showContextButton = true"
				@mouseleave="showContextButton = false"
			>
				<div class="bx-im-audio-player__control-container">
					<button
						class="bx-im-audio-player__control-button"
						:class="{
							'bx-im-audio-player__control-loader': loading,
							'bx-im-audio-player__control-play': !loading && !this.isPlaying,
							'bx-im-audio-player__control-pause': !loading && this.isPlaying,
						}"
						@click="clickToButton"
					></button>
					<div v-if="withAvatar" class="bx-im-audio-player__author-avatar-container">
						<MessageAvatar
							:messageId="messageId"
							:authorId="authorId"
							:size="AvatarSize.XS"
						/>
					</div>
				</div>
				<div class="bx-im-audio-player__content-container">
					<div class="bx-im-audio-player__timeline-container">
						<Timeline
							:loaded="loaded"
							:timeCurrent="timeCurrent"
							:timeTotal="timeTotal"
							@change="onTimelineClick"
						/>
						<div class="bx-im-audio-player__timer-container --ellipsis">
							{{ metaInfo }}
						</div>
					</div>
					<div v-if="isTranscriptionAvailable" class="bx-im-audio-player__transcription">
						<TranscriptionButton
							:file="file"
							:messageId="messageId"
							:isOpened="isTranscriptionOpened"
							@transcriptionToggle="isTranscriptionOpened = !isTranscriptionOpened"
						/>
					</div>
					<div
						v-if="!withPlaybackRateControl"
						class="bx-im-audio-player__rate-button-container"
					>
						<button
							:class="{'--hidden': !isPlaying}"
							@click="changeRate"
						>
							{{ currentRateLabel }}
						</button>
					</div>
					<button
						v-if="showContextButton && withContextMenu"
						class="bx-im-messenger__context-menu-icon bx-im-audio-player__context-menu-button"
						@click="$emit('contextMenuClick', $event)"
					></button>
				</div>
				<audio
					v-if="src"
					:src="src"
					class="bx-im-audio-player__audio-source"
					ref="source"
					:preload="preload"
					@abort="audioEventRouter('abort', $event)"
					@error="audioEventRouter('error', $event)"
					@suspend="audioEventRouter('suspend', $event)"
					@canplay="audioEventRouter('canplay', $event)"
					@canplaythrough="audioEventRouter('canplaythrough', $event)"
					@durationchange="audioEventRouter('durationchange', $event)"
					@loadeddata="audioEventRouter('loadeddata', $event)"
					@loadedmetadata="audioEventRouter('loadedmetadata', $event)"
					@timeupdate="audioEventRouter('timeupdate', $event)"
					@play="audioEventRouter('play', $event)"
					@playing="audioEventRouter('playing', $event)"
					@pause="audioEventRouter('pause', $event)"
					@ended="audioEventRouter('ended', $event)"
				></audio>
			</div>
			<TranscriptionText
				:file="file"
				:isOpened="isTranscriptionOpened"
				:messageId="messageId"
			/>
		</div>
	`,
};
