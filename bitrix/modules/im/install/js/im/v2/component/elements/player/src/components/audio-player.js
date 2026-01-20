import 'ui.fonts.opensans';
import 'main.polyfill.intersectionobserver';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { BaseEvent, EventEmitter } from 'main.core.events';

import { LocalStorageKey, AudioPlaybackRate, AudioPlaybackState as State, EventType } from 'im.v2.const';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { Utils } from 'im.v2.lib.utils';
import { MessageAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { Analytics } from 'im.v2.lib.analytics';

import { Timeline } from './elements/timeline/timeline';
import { TranscriptionButton } from './elements/transcription-button/transcription-button';
import { TranscriptionText } from './elements/transcription-text/transcription-text';

import './css/audio-player.css';

import type { JsonObject } from 'main.core';

const ID_KEY = 'im:audioplayer:id';

// @vue/component
export const AudioPlayer = {
	name: 'AudioPlayer',
	components: { MessageAvatar, Timeline, TranscriptionButton, TranscriptionText },
	props: {
		id: {
			type: Number,
			default: 0,
		},
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
	},
	data(): JsonObject {
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
	computed:
	{
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
		getAudioPlayerIds(): Array
		{
			return this.$Bitrix.Data.get(ID_KEY, []);
		},
		currentRateLabel(): string
		{
			return this.isPlaying ? `${this.currentRate}x` : '';
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
	watch:
	{
		id(value: number)
		{
			this.registerPlayer(value);
		},
		timeCurrent(value: number)
		{
			const progress = Math.round(100 / this.timeTotal * value);
			if (progress > 70)
			{
				this.preloadNext();
			}
		},
	},
	created()
	{
		this.localStorageInst = LocalStorageManager.getInstance();
		this.currentRate = this.getRateFromLS();

		this.preloadRequestSent = false;
		this.registeredId = 0;

		this.registerPlayer(this.id);
		this.getEmitter().subscribe(EventType.audioPlayer.play, this.onPlay);
		this.getEmitter().subscribe(EventType.audioPlayer.stop, this.onStop);
		this.getEmitter().subscribe(EventType.audioPlayer.pause, this.onPause);
		this.getEmitter().subscribe(EventType.audioPlayer.preload, this.onPreload);
	},
	mounted()
	{
		this.getObserver().observe(this.$refs.body);
	},
	beforeUnmount()
	{
		this.unregisterPlayer();

		this.getEmitter().unsubscribe(EventType.audioPlayer.play, this.onPlay);
		this.getEmitter().unsubscribe(EventType.audioPlayer.stop, this.onStop);
		this.getEmitter().unsubscribe(EventType.audioPlayer.pause, this.onPause);
		this.getEmitter().unsubscribe(EventType.audioPlayer.preload, this.onPreload);

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
		registerPlayer(id: number): boolean
		{
			if (id <= 0)
			{
				return;
			}

			this.unregisterPlayer();
			const audioIdArray = [...new Set([...this.getAudioPlayerIds, id])];
			this.$Bitrix.Data.set(ID_KEY, audioIdArray.sort((a, b) => a - b));

			this.registeredId = id;
		},
		unregisterPlayer(): boolean
		{
			if (!this.registeredId)
			{
				return;
			}

			this.$Bitrix.Data.get(ID_KEY, this.getAudioPlayerIds.filter((id) => id !== this.registeredId));

			this.registeredId = 0;
		},
		playNext(): boolean
		{
			if (!this.registeredId)
			{
				return;
			}

			const nextId = this.getAudioPlayerIds.filter((id) => id > this.registeredId).slice(0, 1)[0];
			if (nextId)
			{
				this.getEmitter().emit(EventType.audioPlayer.play, { id: nextId, start: true });
			}
		},
		preloadNext(): boolean
		{
			if (this.preloadRequestSent || !this.registeredId)
			{
				return;
			}

			this.preloadRequestSent = true;

			const nextId = this.getAudioPlayerIds.filter((id) => id > this.registeredId).slice(0, 1)[0];
			if (nextId)
			{
				this.getEmitter().emit(EventType.audioPlayer.preload, { id: nextId });
			}
		},
		onPlay(event: BaseEvent)
		{
			const data = event.getData();

			if (data.id !== this.id)
			{
				return;
			}

			if (data.start)
			{
				this.stop();
			}

			this.play();
		},
		onStop(event: BaseEvent)
		{
			const data = event.getData();

			if (data.initiator === this.id)
			{
				return;
			}

			this.stop();
		},
		onPause(event: BaseEvent)
		{
			const data = event.getData();

			if (data.initiator === this.id)
			{
				return;
			}

			this.pause();
		},
		onPreload(event: BaseEvent)
		{
			const data = event.getData();

			if (data.id !== this.id)
			{
				return;
			}

			this.loadFile();
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
					console.error('BxAudioPlayer: load failed', this.id, event);

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

					if (this.isPlaying && this.timeCurrent >= this.timeTotal)
					{
						this.playNext();
					}

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

					if (this.state === State.stop)
					{
						this.timeCurrent = 0;
					}

					if (this.id > 0)
					{
						this.getEmitter().emit(EventType.audioPlayer.pause, { initiator: this.id });
					}

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
							:class="{'--active': isPlaying}"
							@click="changeRate"
						>
						<span :class="{'bx-im-audio-player__rate-icon': !isPlaying}">
							{{ currentRateLabel }}
						</span>
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
