import { Type, type JsonObject } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import 'main.polyfill.intersectionobserver';
import 'ui.fonts.opensans';

import { MessageAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import {
	AudioPlaybackRate,
	AudioPlaybackState as State,
	EventType,
	PlaylistScope,
	TranscriptionStatus,
} from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { PlaybackPauseReason, PlaybackRate, PlaybackService, type PlaybackTrack } from 'im.v2.lib.playback';
import { Utils } from 'im.v2.lib.utils';

import { Playlist, type PlaylistTrack } from '../classes/playlist';
import { buildPlaybackTrack, buildPlaybackView, type PlaybackView } from '../lib/playback-mapping';
import { PlayerControlButton } from './elements/control-button/control-button';
import { PlayerRateButton } from './elements/rate-button/rate-button';
import { getRandomWaveformIndex, Timeline } from './elements/timeline/timeline';
import { TranscriptionButton } from './elements/transcription-button/transcription-button';
import { TranscriptionText } from './elements/transcription-text/transcription-text';

import './css/audio-player.css';

type PlaybackCommands = {
	toggle: () => void,
	changeRate: () => void,
	seek: (progress: number) => void,
	playNext: () => void,
};

// @vue/component
export const AudioPlayer = {
	name: 'AudioPlayer',
	components: {
		MessageAvatar,
		PlayerControlButton,
		PlayerRateButton,
		Timeline,
		TranscriptionButton,
		TranscriptionText,
	},
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
			mediaDuration: 0,
			showContextButton: false,
			currentRate: AudioPlaybackRate['1'],
			isTranscriptionOpened: false,
		};
	},
	computed: {
		State: () => State,
		fileDuration(): number
		{
			return Type.isNumber(this.file.duration) ? this.file.duration : 0;
		},
		// The duration fixed at send time wins over the media element: a record made by the browser
		// often carries no duration in its container, and the element then reports Infinity.
		// Files sent before the field appeared keep reading it from the media as before.
		timeTotal(): number
		{
			return this.fileDuration || this.mediaDuration;
		},
		// Only a voice message is watched: any other transcribable file waits exactly as it did before.
		isWaitingForTranscription(): boolean
		{
			if (!this.file.isVoiceNote)
			{
				return false;
			}

			return this.$store.getters['files/getTranscription'](this.file.id)?.status === TranscriptionStatus.PENDING;
		},
		isServicePlaybackEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBackgroundAudioPlaybackAvailable);
		},
		playbackService(): PlaybackService
		{
			return PlaybackService.getInstance();
		},
		dialogId(): string
		{
			return this.$store.getters['chats/getByChatId'](this.file.chatId)?.dialogId ?? '';
		},
		playback(): PlaybackView
		{
			return this.isServicePlaybackEnabled ? this.servicePlayback : this.legacyPlayback;
		},
		playbackCommands(): PlaybackCommands
		{
			if (this.isServicePlaybackEnabled)
			{
				return {
					toggle: this.toggleServicePlayback,
					changeRate: this.changeServiceRate,
					seek: this.seekServicePlayback,
					playNext: this.startServicePlayback,
				};
			}

			return {
				toggle: this.toggleLegacyPlayback,
				changeRate: this.changeLegacyRate,
				seek: this.seekLegacyPlayback,
				playNext: this.play,
			};
		},
		servicePlayback(): PlaybackView
		{
			return buildPlaybackView(this.playbackService, this.file.id, this.timeTotal);
		},
		isCurrentRecordOfThisSurface(): boolean
		{
			return this.playbackService.isCurrentFile(this.file.id)
				&& this.playbackService.getSnapshot()?.scope === this.playlistScope;
		},
		waveformIndex(): number
		{
			if (!this.isServicePlaybackEnabled || !this.playbackService.isCurrentFile(this.file.id))
			{
				return this.ownWaveformIndex;
			}

			return this.playbackService.getSnapshot()?.waveformIndex ?? this.ownWaveformIndex;
		},
		legacyPlayback(): PlaybackView
		{
			return {
				isPlaying: this.state === State.play,
				isLoading: this.loading,
				isLoaded: this.loaded,
				timeCurrent: this.timeCurrent,
				timeTotal: this.timeTotal,
				rate: this.currentRate,
			};
		},
		isPlaying(): boolean
		{
			return this.playback.isPlaying;
		},
		labelTime(): string
		{
			const { timeTotal, timeCurrent } = this.playback;
			if (!this.loaded && !timeTotal)
			{
				return '--:--';
			}

			let time = 0;
			if (this.isPlaying)
			{
				time = timeTotal - timeCurrent;
			}
			else
			{
				time = timeTotal;
			}

			return Utils.date.formatMediaDurationTime(time);
		},
		AvatarSize: () => AvatarSize,
		fileSize(): string
		{
			return Utils.file.formatFileSize(this.file.size);
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
		this.currentRate = PlaybackRate.get();
		this.ownWaveformIndex = getRandomWaveformIndex();

		Playlist.getInstance(this.playlistScope).register(this.playlistTrack());
		this.subscribeToEvents();
	},
	mounted()
	{
		// Metadata is preloaded only to learn the duration, so a file that carries it is left alone.
		if (!this.fileDuration)
		{
			this.getObserver().observe(this.$refs.body);
		}
	},
	beforeUnmount()
	{
		Playlist.getInstance(this.playlistScope).unregister(this.playlistTrack());
		this.unsubscribeFromEvents();
		// Unconditional: the duration can appear after mount, and unobserve of an unobserved element is a no-op.
		this.observer?.unobserve(this.$refs.body);
	},
	methods:
	{
		subscribeToEvents()
		{
			this.getEmitter().subscribe(EventType.player.playNext, this.onPlayNext);

			if (this.isServicePlaybackEnabled)
			{
				EventEmitter.subscribe(EventType.playback.onTrackEnded, this.onTrackEnded);

				return;
			}

			this.getEmitter().subscribe(EventType.audioPlayer.pause, this.onPause);
			EventEmitter.subscribe(EventType.player.rateChange, this.onRateChange);
		},
		unsubscribeFromEvents()
		{
			this.getEmitter().unsubscribe(EventType.player.playNext, this.onPlayNext);

			if (this.isServicePlaybackEnabled)
			{
				EventEmitter.unsubscribe(EventType.playback.onTrackEnded, this.onTrackEnded);

				return;
			}

			this.getEmitter().unsubscribe(EventType.audioPlayer.pause, this.onPause);
			EventEmitter.unsubscribe(EventType.player.rateChange, this.onRateChange);
		},
		toggleServicePlayback()
		{
			if (!this.src)
			{
				return;
			}

			if (this.playback.isPlaying)
			{
				this.playbackService.pause(PlaybackPauseReason.manual);

				return;
			}

			this.startServicePlayback();
		},
		startServicePlayback()
		{
			if (this.isCurrentRecordOfThisSurface && this.playbackService.canResume())
			{
				this.playbackService.resume();

				return;
			}

			this.playbackService.play(this.getPlaybackTrack());
		},
		changeServiceRate()
		{
			const { rate } = this.playbackService.getState();

			this.playbackService.setRate(PlaybackRate.getNext(rate));
		},
		seekServicePlayback(progress: number)
		{
			const position = this.playback.timeTotal / 100 * progress;

			if (!this.isCurrentRecordOfThisSurface)
			{
				this.startServicePlayback();
			}

			this.playbackService.seek(position);
		},
		getPlaybackTrack(): PlaybackTrack
		{
			return buildPlaybackTrack({
				file: this.file,
				src: this.src,
				messageId: this.messageId,
				scope: this.playlistScope,
				dialogId: this.dialogId,
				authorId: this.authorId,
				waveformIndex: this.waveformIndex,
			});
		},
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
		toggleLegacyPlayback()
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
			this.updateRate(PlaybackRate.get());

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
		changeLegacyRate()
		{
			if ([State.pause, State.none].includes(this.state))
			{
				return;
			}

			const commonCurrentRate = PlaybackRate.get();
			const newRate = PlaybackRate.getNext(commonCurrentRate);

			Analytics.getInstance().player.onChangeRate(this.file.chatId, newRate);
			// the new value comes back through the broadcast, so this player applies it the same way as the others
			PlaybackRate.set(newRate);
		},
		updateRate(newRate: $Values<typeof AudioPlaybackRate>)
		{
			this.currentRate = newRate;
			// a player mounted without a source has no media element to carry the rate
			if (this.source())
			{
				this.source().playbackRate = newRate;
			}
		},
		onRateChange(event: BaseEvent)
		{
			this.updateRate(event.getData().rate);
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
		// The same file can hang in several messages, so the file alone does not say which player is
		// meant: without the message every one of them would start and scroll the list to itself.
		playlistTrack(): PlaylistTrack
		{
			return { messageId: this.messageId, file: this.file };
		},
		onPlayNext(event: BaseEvent)
		{
			const data = event.getData();

			if (
				data.fileId !== this.file.id
				|| data.messageId !== this.messageId
				|| data.scope !== this.playlistScope
			)
			{
				return;
			}

			this.$refs.body?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			this.playbackCommands.playNext();
		},
		onTrackEnded(event: BaseEvent)
		{
			const { fileId, scope } = event.getData();

			if (fileId !== this.file.id || scope !== this.playlistScope)
			{
				return;
			}

			Playlist.getInstance(scope).onFileEnded({
				file: this.file,
				context: { emitter: this.getEmitter() },
			});
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
					this.mediaDuration = this.source().duration;

					break;
				case 'abort':
				case 'error':
					console.error('BxAudioPlayer: load failed', this.file.id, event);

					this.loading = false;
					this.state = State.none;
					this.mediaDuration = 0;
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
						...this.playlistTrack(),
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
		seekLegacyPlayback(progress: number)
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
		<div class="bx-im-audio-player__scope" data-testid="im-audio-player">
			<div
				class="bx-im-audio-player__container"
				ref="body"
				@mouseover="showContextButton = true"
				@mouseleave="showContextButton = false"
			>
				<div class="bx-im-audio-player__control-container">
					<PlayerControlButton
						:isPlaying="playback.isPlaying"
						:isLoading="playback.isLoading"
						@click="playbackCommands.toggle()"
					/>
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
							:loaded="playback.isLoaded"
							:timeCurrent="playback.timeCurrent"
							:timeTotal="playback.timeTotal"
							:waveformIndex="waveformIndex"
							@change="playbackCommands.seek($event)"
						/>
						<div
							class="bx-im-audio-player__timer-container --ellipsis"
							data-testid="im-audio-player-time"
						>
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
					<PlayerRateButton
						v-if="withPlaybackRateControl"
						:rate="playback.rate"
						:isHidden="!playback.isPlaying"
						@click="playbackCommands.changeRate()"
					/>
					<button
						v-if="showContextButton && withContextMenu"
						class="bx-im-messenger__context-menu-icon bx-im-audio-player__context-menu-button"
						data-testid="im-audio-player-context-menu"
						@click="$emit('contextMenuClick', $event)"
					></button>
				</div>
				<audio
					v-if="src"
					:src="src"
					class="bx-im-audio-player__audio-source"
					ref="source"
					:preload="preload"
					data-testid="im-audio-player-source"
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
