/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_fonts_opensans, main_polyfill_intersectionobserver, main_core_events, im_v2_component_animation, im_v2_const, im_v2_lib_utils, im_v2_lib_analytics, im_v2_lib_feature, im_v2_lib_playback, ui_iconSet_api_vue, ui_iconSet_smallOutline, im_v2_component_elements_loader, im_v2_provider_service_message, main_core, im_v2_component_elements_avatar, ui_infoHelper, ui_vue3_components_richLoc, im_v2_lib_parser, im_v2_lib_copilot) {
	'use strict';

	const State = Object.freeze({
		play: 'play',
		pause: 'pause',
		stop: 'stop',
		none: 'none'
	});
	const PreloadAttribute = Object.freeze({
		none: 'none',
		metadata: 'metadata',
		auto: 'auto'
	});

	// @vue/component
	const DefaultVideoPlayer = {
		name: 'DefaultVideoPlayer',
		components: {
			FadeAnimation: im_v2_component_animation.FadeAnimation
		},
		props: {
			fileId: {
				type: [Number, String],
				default: 0
			},
			src: {
				type: String,
				required: true
			},
			previewImageUrl: {
				type: String,
				default: ''
			},
			withAutoplay: {
				type: Boolean,
				default: true
			},
			elementStyle: {
				type: Object,
				default: null
			},
			withPlayerControls: {
				type: Boolean,
				default: true
			},
			viewerAttributes: {
				type: Object,
				default: () => {}
			}
		},
		data() {
			return {
				preloadAttribute: PreloadAttribute.none,
				loaded: false,
				loading: false,
				state: State.none,
				timeCurrent: 0,
				timeTotal: 0,
				isMuted: true
			};
		},
		computed: {
			State: () => State,
			isAutoPlayDisabled() {
				return !this.withAutoplay && this.state === State.none;
			},
			showStartButton() {
				return this.withPlayerControls && this.isAutoPlayDisabled;
			},
			showInterface() {
				return this.withPlayerControls && !this.showStartButton;
			},
			formattedTime() {
				if (!this.loaded && !this.timeTotal) {
					return '--:--';
				}
				let time = 0;
				if (this.state === State.play) {
					time = this.timeTotal - this.timeCurrent;
				} else {
					time = this.timeTotal;
				}
				return im_v2_lib_utils.Utils.date.formatMediaDurationTime(time);
			},
			controlButtonClass() {
				if (this.loading) {
					return '--loading';
				}
				return this.state === State.play ? '--pause' : '--play';
			},
			source() {
				return this.$refs.source;
			},
			hasViewerAttributes() {
				return Object.keys(this.viewerAttributes).length > 0;
			}
		},
		created() {
			if (!this.previewImageUrl) {
				this.preloadAttribute = PreloadAttribute.metadata;
			}
		},
		mounted() {
			this.getObserver().observe(this.$refs.body);
		},
		beforeUnmount() {
			this.getObserver().unobserve(this.$refs.body);
		},
		methods: {
			loadFile() {
				if (this.loaded || this.loading) {
					return;
				}
				this.preloadAttribute = PreloadAttribute.auto;
				this.loading = true;
				this.playAfterLoad = true;
			},
			handleControlClick() {
				if (this.state === State.play) {
					this.getObserver().unobserve(this.$refs.body);
					this.pause();
				} else {
					this.notifyPlaybackServiceAboutStart();
					this.play();
				}
			},
			notifyPlaybackServiceAboutStart() {
				main_core_events.EventEmitter.emit(im_v2_const.EventType.playback.onExternalPlayerStart, {
					fileId: this.fileId
				});
			},
			handleMuteClick() {
				if (this.isMuted) {
					this.notifyPlaybackServiceAboutStart();
					this.unmute();
				} else {
					this.mute();
				}
			},
			handleContainerClick() {
				if (this.hasViewerAttributes) {
					this.pause();
					return;
				}
				this.handleControlClick();
			},
			play() {
				if (!this.loaded) {
					this.loadFile();
					return;
				}
				void this.source.play();
			},
			pause() {
				this.source.pause();
			},
			mute() {
				this.isMuted = true;
				this.source.muted = true;
			},
			unmute() {
				this.isMuted = false;
				this.source.muted = false;
			},
			handleError(event) {
				console.error('Im.VideoPlayer: loading failed', this.fileId, event);
				this.loading = false;
				this.state = State.none;
				this.timeTotal = 0;
				this.preloadAttribute = PreloadAttribute.none;
			},
			handleAbort(event) {
				this.handleError(event);
			},
			handlePlay() {
				this.state = State.play;
			},
			handleLoadedData() {
				this.timeTotal = this.source.duration;
			},
			handleDurationChange() {
				this.handleLoadedData();
			},
			handleLoadedMetaData() {
				this.timeTotal = this.source.duration;
				this.loaded = true;
				this.play();
			},
			handleCanPlayThrough() {
				this.loading = false;
				this.loaded = true;
				this.play();
			},
			handlePause() {
				if (this.state === State.stop) {
					return;
				}
				this.state = State.pause;
			},
			handleVolumeChange() {
				if (this.source.muted) {
					this.mute();
				} else {
					this.unmute();
				}
			},
			handleTimeUpdate() {
				this.timeCurrent = this.source.currentTime;
			},
			getObserver() {
				if (this.observer) {
					return this.observer;
				}
				this.observer = new IntersectionObserver(entries => {
					if (this.isAutoPlayDisabled) {
						return;
					}
					entries.forEach(entry => {
						if (entry.isIntersecting) {
							this.play();
						} else {
							this.pause();
						}
					});
				}, {
					threshold: [0, 1]
				});
				return this.observer;
			}
		},
		template: `
		<div
			class="bx-im-video-player__container"
			data-testid="im-video-player"
			@click.stop="handleContainerClick"
		>
			<FadeAnimation :duration="500">
				<div
					v-if="showStartButton"
					class="bx-im-video-player__start-play_button"
					data-testid="im-video-player-start"
					@click.stop="handleControlClick"
				>
					<span class="bx-im-video-player__start-play_icon"></span>
				</div>
			</FadeAnimation>
			<FadeAnimation :duration="500">
				<div
					v-if="showInterface"
					class="bx-im-video-player__control-button_container"
					data-testid="im-video-player-play"
					@click.stop="handleControlClick"
				>
					<button class="bx-im-video-player__control-button" :class="controlButtonClass"></button>
				</div>
			</FadeAnimation>
			<FadeAnimation :duration="500">
				<div 
					v-if="showInterface" 
					class="bx-im-video-player__info-container" 
					data-testid="im-video-player-sound"
					@click.stop="handleMuteClick"
				>
					<span
						class="bx-im-video-player__time"
						data-testid="im-video-player-time"
					>{{ formattedTime }}</span>
					<span class="bx-im-video-player__sound" :class="{'--muted': isMuted}"></span>
				</div>
			</FadeAnimation>
			<div class="bx-im-video-player__video-container" ref="body">
				<video
					v-bind="viewerAttributes"
					:src="src"
					class="bx-im-video-player__video"
					:poster="previewImageUrl"
					ref="source"
					data-testid="im-video-player-video"
					:preload="preloadAttribute"
					playsinline
					loop
					muted
					:style="elementStyle"
					@abort="handleAbort"
					@error="handleError"
					@canplaythrough="handleCanPlayThrough"
					@durationchange="handleDurationChange"
					@loadeddata="handleLoadedData"
					@loadedmetadata="handleLoadedMetaData"
					@volumechange="handleVolumeChange"
					@timeupdate="handleTimeUpdate"
					@play="handlePlay"
					@pause="handlePause"
				></video>
			</div>
		</div>
	`
	};

	const Direction = {
		asc: 'asc',
		desc: 'desc'
	};
	const ScopeDirection = {
		[im_v2_const.PlaylistScope.chat]: Direction.asc,
		[im_v2_const.PlaylistScope.sidebar]: Direction.desc
	};

	/**
	 * A track is a file inside a particular message, not a file on its own: the same file can be
	 * attached to several messages, and each of them is a separate player on the screen.
	 */

	class Playlist {
		static #instances = new Map();
		#scope;
		#tracks = {};
		constructor(scope) {
			this.#scope = scope;
		}
		static getInstance(scope) {
			if (!this.#instances.has(scope)) {
				this.#instances.set(scope, new this(scope));
			}
			return this.#instances.get(scope);
		}
		register(track) {
			const {
				chatId
			} = track.file;
			if (!this.#tracks[chatId]) {
				this.#tracks[chatId] = new Map();
			}
			this.#tracks[chatId].set(Playlist.#keyOf(track), track);
		}
		unregister(track) {
			this.#tracks[track.file.chatId]?.delete(Playlist.#keyOf(track));
		}
		onFileEnded(payload) {
			const {
				context: {
					emitter
				}
			} = payload;
			const nextTrack = this.#getNextTrack(payload);
			if (!nextTrack) {
				return;
			}
			emitter.emit(im_v2_const.EventType.player.playNext, {
				messageId: nextTrack.messageId,
				fileId: nextTrack.file.id,
				scope: this.#scope
			});
		}

		// The message is a part of the address, not a decoration: keyed by the file alone, two messages
		// carrying the same file collapsed into one entry, so the round trip skipped one of them.
		static #keyOf({
			messageId,
			file
		}) {
			return `${messageId}:${file.id}`;
		}
		#getNextTrack(current) {
			const chat = this.#tracks[current.file.chatId];
			if (!chat) {
				return null;
			}
			const direction = ScopeDirection[this.#scope];
			if (!direction) {
				return null;
			}
			const sortCallback = direction === Direction.desc ? (a, b) => b.file.date - a.file.date : (a, b) => a.file.date - b.file.date;
			// Sort is stable, so tracks sharing a date keep the order they were registered in - for a
			// producer uploading its files in one batch that is the only order there is.
			const tracks = [...chat.values()].sort(sortCallback);
			const currentKey = Playlist.#keyOf(current);
			const currentIndex = tracks.findIndex(track => Playlist.#keyOf(track) === currentKey);
			if (currentIndex === -1) {
				return null;
			}
			return tracks[currentIndex + 1];
		}
	}

	const PLAYER_RADIUS = 130;
	const PLAYER_DIAMETER = PLAYER_RADIUS * 2;
	const PLAYER_PROGRESS_MARGIN = 1;

	// @vue/component
	const RoundProgressBar = {
		name: 'RoundProgressBar',
		props: {
			progress: {
				type: Number,
				required: true,
				validator: value => value >= 0 && value <= 100
			}
		},
		computed: {
			PLAYER_RADIUS: () => PLAYER_RADIUS,
			PLAYER_DIAMETER: () => PLAYER_DIAMETER,
			PLAYER_PROGRESS_MARGIN: () => PLAYER_PROGRESS_MARGIN,
			progressStyles() {
				const radius = PLAYER_RADIUS - PLAYER_PROGRESS_MARGIN;
				const circumference = 2 * Math.PI * radius;
				const offset = circumference - this.progress / 100 * circumference;
				return {
					strokeDasharray: circumference,
					strokeDashoffset: offset
				};
			}
		},
		template: `
		<div class="bx-im-round-video-player__progress-container">
			<svg :viewBox="\`0 0 ${PLAYER_DIAMETER} ${PLAYER_DIAMETER}\`">
				<circle
					:style="progressStyles"
					class="bx-im-round-video-player__progress"
					:transform="\`rotate(-90, ${PLAYER_RADIUS}, ${PLAYER_RADIUS})\`"
					:cx="PLAYER_RADIUS"
					:cy="PLAYER_RADIUS"
					:r="PLAYER_RADIUS - PLAYER_PROGRESS_MARGIN"
				></circle>
			</svg>
		</div>
	`
	};

	// @vue/component
	const TranscriptionButton = {
		name: 'TranscriptionButton',
		components: {
			Spinner: im_v2_component_elements_loader.Spinner,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			file: {
				type: Object,
				required: true
			},
			isOpened: {
				type: Boolean,
				required: true
			},
			messageId: {
				type: [String, Number],
				required: true
			},
			isOverlay: {
				type: Boolean,
				default: false
			}
		},
		emits: ['transcriptionToggle'],
		computed: {
			SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
			SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor,
			fileId() {
				return this.file.id;
			},
			chatId() {
				return this.file.chatId;
			},
			transcription() {
				return this.$store.getters['files/getTranscription'](this.fileId);
			},
			status() {
				return this.transcription ? this.transcription.status : null;
			},
			isPending() {
				return this.status === im_v2_const.TranscriptionStatus.PENDING;
			},
			isSuccess() {
				return this.status === im_v2_const.TranscriptionStatus.SUCCESS;
			},
			buttonIcon() {
				if (this.isOpened) {
					return ui_iconSet_api_vue.Outline.CHEVRON_TOP_M;
				}
				return this.isOverlay ? ui_iconSet_api_vue.SmallOutline.TRANSCRIPTION : ui_iconSet_api_vue.Outline.TRANSCRIPTION;
			}
		},
		watch: {
			status(newStatus, oldStatus) {
				if (oldStatus === im_v2_const.TranscriptionStatus.PENDING) {
					im_v2_lib_analytics.Analytics.getInstance().player.onViewTranscription(this.file.id, newStatus);
					this.open();
				}
			}
		},
		methods: {
			async onButtonClick() {
				if (this.isPending) {
					return;
				}
				if (this.isOpened) {
					this.close();
					return;
				}
				if (this.isSuccess) {
					im_v2_lib_analytics.Analytics.getInstance().player.onViewTranscription(this.file.id, im_v2_const.TranscriptionStatus.SUCCESS);
					this.open();
					return;
				}
				const result = await this.transcribe();
				if (result) {
					this.open();
				}
			},
			async transcribe() {
				const messageService = new im_v2_provider_service_message.MessageService({
					chatId: this.chatId
				});
				return messageService.transcribe(this.fileId, this.messageId);
			},
			open() {
				this.$emit('transcriptionToggle', true);
			},
			close() {
				this.$emit('transcriptionToggle', false);
			}
		},
		template: `
		<div class="bx-im-transcription-button__container">
			<button
				class="bx-im-transcription-button__button"
				:class="{'--overlay': isOverlay}"
				@click="onButtonClick"
			>
				<Spinner v-if="isPending" :size="SpinnerSize.XXS" :color="SpinnerColor.white" />
				<BIcon
					v-else
					:name="buttonIcon"
					class="bx-im-transcription-button__icon"
				/>
			</button>
		</div>
	`
	};

	const PlaybackMode = {
		autoplay: 'autoplay',
		manual: 'manual'
	};
	const PlaybackState = {
		loading: 'loading',
		playing: 'playing',
		paused: 'paused'
	};
	const MUTE_ICON_SIZE = 16;

	// @vue/component
	const RoundVideoPlayer = {
		name: 'RoundVideoPlayer',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			FadeAnimation: im_v2_component_animation.FadeAnimation,
			RoundProgressBar,
			TranscriptionButton
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			message: {
				type: Object,
				required: true
			},
			startWithSound: {
				type: Boolean,
				default: false
			}
		},
		emits: ['openTranscription'],
		data() {
			return {
				playbackMode: PlaybackMode.autoplay,
				playbackState: PlaybackState.loading,
				currentTime: 0,
				duration: 0,
				animationFrameId: null,
				currentTimeSmoothed: 0,
				currentRate: im_v2_const.AudioPlaybackRate['1']
			};
		},
		computed: {
			PlaybackMode: () => PlaybackMode,
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			MUTE_ICON_SIZE: () => MUTE_ICON_SIZE,
			Color: () => im_v2_const.Color,
			file() {
				return this.item;
			},
			isLoaded() {
				return this.playbackState === PlaybackState.loading;
			},
			isAutoplay() {
				return this.playbackMode === PlaybackMode.autoplay;
			},
			formattedTime() {
				if (!this.isLoaded && !this.duration) {
					return '--:--';
				}
				const time = this.duration - this.currentTime;
				return im_v2_lib_utils.Utils.date.formatMediaDurationTime(time);
			},
			videoElement() {
				return this.$refs.videoElement;
			},
			currentProgress() {
				if (this.duration === 0) {
					return 0;
				}
				return this.currentTimeSmoothed / this.duration * 100;
			},
			isPaused() {
				return this.playbackState === PlaybackState.paused;
			},
			isTranscriptionAvailable() {
				return this.file.isTranscribable && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.videoNoteTranscriptionAvailable) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable);
			},
			isPlaybackRateFeatureAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isVideoNotePlaybackRateAvailable);
			},
			isPlaybackRateAvailable() {
				return this.file.status === im_v2_const.FileStatus.done && this.isPlaybackRateFeatureAvailable;
			},
			currentRateLabel() {
				return `${this.currentRate}x`;
			},
			rateControlAriaLabel() {
				return this.loc('IM_ELEMENTS_PLAYER_ROUND_VIDEO_RATE_ARIA', {
					'#RATE#': this.currentRateLabel
				});
			}
		},
		created() {
			Playlist.getInstance(im_v2_const.PlaylistScope.chat).register(this.playlistTrack());
		},
		mounted() {
			this.getObserver().observe(this.$refs.body);
			this.getEmitter().subscribe(im_v2_const.EventType.player.playNext, this.handlePlayNextRequest);
			this.getEmitter().subscribe(im_v2_const.EventType.roundVideoPlayer.onClickPlay, this.handleOtherVideoStarted);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.playback.onServiceStart, this.handleServiceStarted);
			this.getEmitter().subscribe(im_v2_const.EventType.audioPlayer.pause, this.handleOtherPlayerStarted);
			if (this.isPlaybackRateFeatureAvailable) {
				main_core_events.EventEmitter.subscribe(im_v2_const.EventType.player.rateChange, this.handleRateChange);
			}
			if (this.startWithSound) {
				this.notifyPlaybackServiceAboutStart();
				this.switchToManualMode();
			}
		},
		beforeUnmount() {
			this.stopProgressAnimation();
			this.getObserver().unobserve(this.$refs.body);
			Playlist.getInstance(im_v2_const.PlaylistScope.chat).unregister(this.playlistTrack());
			this.getEmitter().unsubscribe(im_v2_const.EventType.player.playNext, this.handlePlayNextRequest);
			this.getEmitter().unsubscribe(im_v2_const.EventType.roundVideoPlayer.onClickPlay, this.handleOtherVideoStarted);
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.playback.onServiceStart, this.handleServiceStarted);
			this.getEmitter().unsubscribe(im_v2_const.EventType.audioPlayer.pause, this.handleOtherPlayerStarted);
			// Unconditionally: the guard on the subscribe is enough, and unsubscribing a listener that was
			// never subscribed is a no-op. A condition here would leak the listener the moment it names the
			// neighbouring isPlaybackRateAvailable, which is reactive and can read differently than at mount.
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.player.rateChange, this.handleRateChange);
		},
		methods: {
			togglePlayMode() {
				this.getEmitter().emit(im_v2_const.EventType.roundVideoPlayer.onClickPlay, {
					fileId: this.file.id
				});
				if (this.playbackMode === PlaybackMode.autoplay) {
					im_v2_lib_analytics.Analytics.getInstance().player.onPlay(this.file.id);
					this.notifyPlaybackServiceAboutStart();
					this.switchToManualMode();
					return;
				}
				if (this.playbackState === PlaybackState.playing) {
					im_v2_lib_analytics.Analytics.getInstance().player.onPause(this.file.id);
					this.pauseVideo();
				} else {
					im_v2_lib_analytics.Analytics.getInstance().player.onPlay(this.file.id);
					this.notifyPlaybackServiceAboutStart();
					this.playVideo();
				}
			},
			notifyPlaybackServiceAboutStart() {
				main_core_events.EventEmitter.emit(im_v2_const.EventType.playback.onExternalPlayerStart, {
					fileId: this.file.id
				});
			},
			playVideo() {
				if (this.isPlaybackRateFeatureAvailable) {
					// every start goes through here, so the common rate is re-read at each of them, not kept from the mount
					this.updateRate(im_v2_lib_playback.PlaybackRate.get());
				}

				// Only a start with sound claims the audible channel: a muted preview leaves the voice
				// messages alone. The circle owns no file the voice players know, so their own guard by
				// initiator keeps them from answering their own request - and keeps this one out of it.
				if (!this.isAutoplay) {
					this.getEmitter().emit(im_v2_const.EventType.audioPlayer.pause, {
						initiator: this.file.id
					});
				}
				void this.videoElement.play();
			},
			pauseVideo() {
				this.videoElement.pause();
			},
			handleRateControlClick() {
				// the new value comes back through the broadcast, so this player applies it the same way as the others
				im_v2_lib_playback.PlaybackRate.set(im_v2_lib_playback.PlaybackRate.getNext(im_v2_lib_playback.PlaybackRate.get()));
			},
			handleRateChange(event) {
				this.updateRate(event.getData().rate);
			},
			// A voice message has taken the audible channel, so this circle goes back to the muted preview -
			// the same retreat as when another circle starts. Without it both play at once, and the chat
			// playlist holds files of both kinds: the one that ends first sends playNext into the other,
			// interrupting a play() with a pause() on a live element.
			handleOtherPlayerStarted(event) {
				if (event.getData().initiator === this.file.id || this.isAutoplay) {
					return;
				}
				this.switchToAutoplayMode();
			},
			updateRate(newRate) {
				this.currentRate = newRate;
				this.videoElement.playbackRate = newRate;
			},
			handleLoadedMetaData() {
				this.duration = this.videoElement.duration;
				this.playVideo();
			},
			handleCanPlayThrough() {
				if (this.playbackState === PlaybackState.loading) {
					this.playVideo();
				}
			},
			handlePlay() {
				this.playbackState = PlaybackState.playing;
				this.startProgressAnimation();
			},
			handlePause() {
				this.playbackState = PlaybackState.paused;
				this.stopProgressAnimation();
			},
			handleEnded() {
				this.switchToAutoplayMode();
				Playlist.getInstance(im_v2_const.PlaylistScope.chat).onFileEnded({
					...this.playlistTrack(),
					context: {
						emitter: this.getEmitter()
					}
				});
			},
			handleTimeUpdate() {
				this.currentTime = this.videoElement.currentTime;
			},
			handleError(event) {
				console.error('Im.RoundVideoPlayer: loading failed', event);
				this.playbackState = PlaybackState.loading;
				this.duration = 0;
				this.stopProgressAnimation();
			},
			// See AudioPlayer.playlistTrack: the message is a part of the address of a track.
			playlistTrack() {
				return {
					messageId: this.message.id,
					file: this.file
				};
			},
			handlePlayNextRequest(event) {
				const {
					messageId,
					fileId,
					scope
				} = event.getData();
				if (fileId !== this.file.id || messageId !== this.message.id || scope !== im_v2_const.PlaylistScope.chat) {
					return;
				}
				this.$refs.body.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
				this.switchToManualMode();
			},
			handleOtherVideoStarted(event) {
				const {
					fileId
				} = event.getData();
				if (fileId === this.file.id) {
					return;
				}
				this.switchToAutoplayMode();
			},
			handleServiceStarted() {
				if (this.playbackMode !== PlaybackMode.manual) {
					return;
				}
				this.switchToAutoplayMode();
			},
			switchToAutoplayMode() {
				this.keepFocusInsidePlayer();
				this.playbackMode = PlaybackMode.autoplay;
				this.videoElement.loop = true;
				this.videoElement.muted = true;
				this.playVideo();
			},
			switchToManualMode() {
				this.playbackMode = PlaybackMode.manual;
				this.videoElement.currentTime = 0;
				this.videoElement.loop = false;
				this.videoElement.muted = false;
				this.playVideo();
			},
			// autoplay unmounts the rate control, so the focus it holds is moved to the circle before that happens
			keepFocusInsidePlayer() {
				if (document.activeElement !== this.$refs.rateControl) {
					return;
				}

				// preventScroll is deliberate: moving the focus must not pull the feed back to a circle
				// the user has already scrolled away from
				this.$refs.body.focus({
					preventScroll: true
				});
			},
			getObserver() {
				if (this.observer) {
					return this.observer;
				}
				this.observer = new IntersectionObserver(entries => {
					entries.forEach(entry => {
						if (!this.isAutoplay) {
							return;
						}
						if (entry.isIntersecting) {
							this.playVideo();
						} else {
							this.pauseVideo();
						}
					});
				}, {
					threshold: [0, 1]
				});
				return this.observer;
			},
			startProgressAnimation() {
				const update = () => {
					if (!this.videoElement) {
						return;
					}
					this.currentTimeSmoothed = this.videoElement.currentTime;
					this.animationFrameId = requestAnimationFrame(update);
				};
				update();
			},
			stopProgressAnimation() {
				if (!this.animationFrameId) {
					return;
				}
				cancelAnimationFrame(this.animationFrameId);
				this.animationFrameId = null;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(code, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(code, replacements);
			}
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
	`
	};

	const buildPlaybackView = (service, fileId, fallbackDuration) => {
		const state = service.getState();
		if (!service.isCurrentFile(fileId)) {
			return {
				isPlaying: false,
				isLoading: false,
				isLoaded: false,
				timeCurrent: 0,
				timeTotal: fallbackDuration,
				rate: state.rate
			};
		}
		const timeTotal = service.getSnapshot()?.duration || fallbackDuration;
		return {
			isPlaying: state.trackState === im_v2_const.PlaybackTrackState.playing,
			isLoading: state.trackState === im_v2_const.PlaybackTrackState.loading,
			isLoaded: timeTotal > 0,
			timeCurrent: state.position,
			timeTotal,
			rate: state.rate
		};
	};
	const buildPlaybackTrack = source => {
		const {
			file,
			src,
			messageId,
			scope,
			dialogId,
			authorId,
			waveformIndex
		} = source;
		return {
			fileId: file.id,
			src,
			messageId,
			scope,
			dialogId,
			chatId: file.chatId,
			authorId,
			authorName: file.authorName,
			fileName: file.name,
			isVideoNote: file.isVideoNote,
			status: file.status,
			waveformIndex
		};
	};

	// @vue/component
	const PlayerControlButton = {
		name: 'PlayerControlButton',
		props: {
			isPlaying: {
				type: Boolean,
				default: false
			},
			isLoading: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click'],
		template: `
		<button
			class="bx-im-audio-player__control-button"
			:class="{
				'bx-im-audio-player__control-loader': isLoading,
				'bx-im-audio-player__control-play': !isLoading && !isPlaying,
				'bx-im-audio-player__control-pause': !isLoading && isPlaying,
			}"
			data-testid="im-audio-player-play"
			@click="$emit('click')"
		></button>
	`
	};

	// @vue/component
	const PlayerRateButton = {
		name: 'PlayerRateButton',
		props: {
			rate: {
				type: Number,
				required: true
			},
			isHidden: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click'],
		template: `
		<div class="bx-im-audio-player__rate-button-container">
			<button
				:class="{'--hidden': isHidden}"
				data-testid="im-audio-player-rate"
				@click="$emit('click')"
			>
				{{ rate }}x
			</button>
		</div>
	`
	};

	const Wave = {
		count: 5,
		verticalShift: 44,
		activeVerticalShift: 19
	};
	const getRandomWaveformIndex = () => Math.floor(Math.random() * Wave.count);

	// @vue/component
	const Timeline = {
		name: 'PLayerTimeline',
		props: {
			loaded: {
				type: Boolean,
				default: false
			},
			timeCurrent: {
				type: Number,
				required: true
			},
			timeTotal: {
				type: Number,
				required: true
			},
			withSeeking: {
				type: Boolean,
				default: true
			},
			waveformIndex: {
				type: Number,
				default: null
			},
			stretched: {
				type: Boolean,
				default: false
			}
		},
		emits: ['change'],
		data() {
			return {
				seekerOffset: 0,
				containerWidth: 0
			};
		},
		computed: {
			progress() {
				return Math.round(100 / this.timeTotal * this.timeCurrent);
			},
			seekerPositionStyles() {
				if (!this.loaded || !this.withSeeking) {
					return {
						display: 'none'
					};
				}
				return {
					left: `${this.seekerOffset}px`
				};
			},
			trackWidth() {
				return this.containerWidth;
			},
			progressPosition() {
				if (!this.loaded || this.timeCurrent === 0) {
					return {
						width: '100%'
					};
				}
				const offset = Math.round(this.trackWidth / 100 * this.progress);
				return {
					width: `${offset}px`
				};
			},
			waveType() {
				return this.waveformIndex ?? this.ownWaveformIndex;
			},
			activeWaveStyles() {
				const shift = this.waveType * Wave.verticalShift + Wave.activeVerticalShift;
				return {
					...this.progressPosition,
					'background-position-y': `-${shift}px`
				};
			},
			waveStyles() {
				const shift = this.waveType * Wave.verticalShift;
				return {
					'background-position-y': `-${shift}px`
				};
			}
		},
		created() {
			this.ownWaveformIndex = getRandomWaveformIndex();
		},
		mounted() {
			this.initResizeObserver();
		},
		beforeUnmount() {
			this.getResizeObserver()?.disconnect();
		},
		methods: {
			initResizeObserver() {
				this.containerWidth = this.$refs.timeline.offsetWidth;
				this.resizeObserver = new ResizeObserver(([entry]) => {
					this.containerWidth = entry.contentRect.width;
				});
				this.resizeObserver.observe(this.$refs.timeline);
			},
			getResizeObserver() {
				return this.resizeObserver;
			},
			setPosition() {
				if (!this.loaded || !this.withSeeking) {
					return;
				}
				const pixelPerPercent = this.trackWidth / 100;
				const progress = Math.round(this.seekerOffset / pixelPerPercent);
				this.$emit('change', progress);
			},
			updateSeekerPosition(event) {
				if (!this.loaded || !this.withSeeking) {
					return;
				}
				this.seekerOffset = event.offsetX > 0 ? event.offsetX : 0;
			}
		},
		template: `
		<div 
			ref="timeline"
			:class="{'--with-seeking': withSeeking, '--stretched': stretched}"
			class="bx-im-player-timeline__container" 
			data-testid="im-player-timeline"
			@click="setPosition" 
			@mousemove="updateSeekerPosition" 
		>
			<div class="bx-im-player-timeline__wave" :style="waveStyles"></div>
			<div class="bx-im-player-timeline__wave" :style="activeWaveStyles"></div>
			<div class="bx-im-player-timeline__seeker" :style="seekerPositionStyles"></div>
		</div>
	`
	};

	const ErrorMessageByType = {
		[im_v2_const.FileType.video]: 'IM_MESSAGE_FILE_AUDIO_TRANSCRIPTION_ERROR_VIDEO',
		[im_v2_const.FileType.audio]: 'IM_MESSAGE_FILE_AUDIO_TRANSCRIPTION_ERROR'
	};
	const LIMIT_ERROR_CODE = 'LIMIT_IS_EXCEEDED_BAAS';

	// @vue/component
	const TranscriptionText = {
		name: 'TranscriptionText',
		components: {
			ExpandAnimation: im_v2_component_animation.ExpandAnimation,
			RichLoc: ui_vue3_components_richLoc.RichLoc
		},
		props: {
			file: {
				type: Object,
				required: true
			},
			messageId: {
				type: [String, Number],
				required: true
			},
			isOpened: {
				type: Boolean,
				required: true
			},
			// The consumer renders the message text below the transcription: the divider separates them
			withMessageText: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			transcription() {
				return this.$store.getters['files/getTranscription'](this.file.id);
			},
			text() {
				return im_v2_lib_parser.Parser.decode({
					text: this.transcription?.transcriptText ?? ''
				});
			},
			isError() {
				return Boolean(this.transcription && this.transcription.status === im_v2_const.TranscriptionStatus.ERROR);
			},
			isLimitError() {
				return Boolean(this.transcription && this.transcription.errorCode === LIMIT_ERROR_CODE);
			},
			errorText() {
				if (this.isLimitError) {
					return this.loc('IM_MESSAGE_FILE_TRANSCRIPTION_LIMIT_ERROR_MSGVER_1', {
						'#COPILOT_NAME#': this.copilotManager.getName()
					});
				}
				const code = ErrorMessageByType[this.file.type];
				return this.loc(code);
			},
			needToShowDivider() {
				return this.isOpened && this.withMessageText && Boolean(this.message.text);
			},
			needToShowDisclaimer() {
				return !this.isError && Boolean(this.transcription?.transcriptText);
			},
			message() {
				return this.$store.getters['messages/getById'](this.messageId);
			}
		},
		created() {
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
		},
		methods: {
			loc(code, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(code, replacements);
			},
			onLimitErrorLinkClick() {
				const promoter = new ui_infoHelper.FeaturePromoter({
					code: im_v2_const.SliderCode.buyMarketPlus
				});
				promoter.show();
			}
		},
		template: `
		<div class="bx-im-transcription-text__container" data-testid="im-transcription-text-root">
			<ExpandAnimation>
				<div
					v-if="isOpened"
					class="bx-im-transcription-text__content"
				>
					<div v-if="!isError" v-html="text"></div>
					<RichLoc
						v-else
						:text="errorText"
						class="--error"
						placeholder="[url]"
					>
						<template #url="{ text }">
							<span class="bx-im-transcription-text__error-link" @click="onLimitErrorLinkClick">
								{{ text }}
							</span>
						</template>
					</RichLoc>
					<template v-if="needToShowDisclaimer">
						<div class="bx-im-transcription-text__disclaimer-divider"></div>
						<div class="bx-im-transcription-text__disclaimer">
							{{ loc('IM_MESSAGE_FILE_TRANSCRIPTION_DISCLAIMER') }}
						</div>
					</template>
				</div>
			</ExpandAnimation>
			<div
				v-if="needToShowDivider"
				class="bx-im-transcription-text__divider"
				data-testid="im-transcription-text-divider"
			></div>
		</div>
	`
	};

	// @vue/component
	const AudioPlayer = {
		name: 'AudioPlayer',
		components: {
			MessageAvatar: im_v2_component_elements_avatar.MessageAvatar,
			PlayerControlButton,
			PlayerRateButton,
			Timeline,
			TranscriptionButton,
			TranscriptionText
		},
		props: {
			src: {
				type: String,
				default: ''
			},
			file: {
				type: Object,
				required: true
			},
			authorId: {
				type: Number,
				required: true
			},
			messageId: {
				type: [String, Number],
				required: true
			},
			withContextMenu: {
				type: Boolean,
				default: true
			},
			withAvatar: {
				type: Boolean,
				default: true
			},
			withPlaybackRateControl: {
				type: Boolean,
				default: false
			},
			withTranscription: {
				type: Boolean,
				default: true
			},
			playlistScope: {
				type: String,
				default: im_v2_const.PlaylistScope.chat
			}
		},
		data() {
			return {
				preload: 'none',
				loaded: false,
				loading: false,
				state: im_v2_const.AudioPlaybackState.none,
				timeCurrent: 0,
				mediaDuration: 0,
				showContextButton: false,
				currentRate: im_v2_const.AudioPlaybackRate['1'],
				isTranscriptionOpened: false
			};
		},
		computed: {
			State: () => im_v2_const.AudioPlaybackState,
			fileDuration() {
				return main_core.Type.isNumber(this.file.duration) ? this.file.duration : 0;
			},
			// The duration fixed at send time wins over the media element: a record made by the browser
			// often carries no duration in its container, and the element then reports Infinity.
			// Files sent before the field appeared keep reading it from the media as before.
			timeTotal() {
				return this.fileDuration || this.mediaDuration;
			},
			// Only a voice message is watched: any other transcribable file waits exactly as it did before.
			isWaitingForTranscription() {
				if (!this.file.isVoiceNote) {
					return false;
				}
				return this.$store.getters['files/getTranscription'](this.file.id)?.status === im_v2_const.TranscriptionStatus.PENDING;
			},
			isServicePlaybackEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBackgroundAudioPlaybackAvailable);
			},
			playbackService() {
				return im_v2_lib_playback.PlaybackService.getInstance();
			},
			dialogId() {
				return this.$store.getters['chats/getByChatId'](this.file.chatId)?.dialogId ?? '';
			},
			playback() {
				return this.isServicePlaybackEnabled ? this.servicePlayback : this.legacyPlayback;
			},
			playbackCommands() {
				if (this.isServicePlaybackEnabled) {
					return {
						toggle: this.toggleServicePlayback,
						changeRate: this.changeServiceRate,
						seek: this.seekServicePlayback,
						playNext: this.startServicePlayback
					};
				}
				return {
					toggle: this.toggleLegacyPlayback,
					changeRate: this.changeLegacyRate,
					seek: this.seekLegacyPlayback,
					playNext: this.play
				};
			},
			servicePlayback() {
				return buildPlaybackView(this.playbackService, this.file.id, this.timeTotal);
			},
			isCurrentRecordOfThisSurface() {
				return this.playbackService.isCurrentFile(this.file.id) && this.playbackService.getSnapshot()?.scope === this.playlistScope;
			},
			waveformIndex() {
				if (!this.isServicePlaybackEnabled || !this.playbackService.isCurrentFile(this.file.id)) {
					return this.ownWaveformIndex;
				}
				return this.playbackService.getSnapshot()?.waveformIndex ?? this.ownWaveformIndex;
			},
			legacyPlayback() {
				return {
					isPlaying: this.state === im_v2_const.AudioPlaybackState.play,
					isLoading: this.loading,
					isLoaded: this.loaded,
					timeCurrent: this.timeCurrent,
					timeTotal: this.timeTotal,
					rate: this.currentRate
				};
			},
			isPlaying() {
				return this.playback.isPlaying;
			},
			labelTime() {
				const {
					timeTotal,
					timeCurrent
				} = this.playback;
				if (!this.loaded && !timeTotal) {
					return '--:--';
				}
				let time = 0;
				if (this.isPlaying) {
					time = timeTotal - timeCurrent;
				} else {
					time = timeTotal;
				}
				return im_v2_lib_utils.Utils.date.formatMediaDurationTime(time);
			},
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			fileSize() {
				return im_v2_lib_utils.Utils.file.formatFileSize(this.file.size);
			},
			metaInfo() {
				return `${this.fileSize}, ${this.labelTime}`;
			},
			isTranscriptionAvailable() {
				return this.withTranscription && this.file.isTranscribable && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.aiFileTranscriptionAvailable) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable);
			}
		},
		created() {
			this.currentRate = im_v2_lib_playback.PlaybackRate.get();
			this.ownWaveformIndex = getRandomWaveformIndex();
			Playlist.getInstance(this.playlistScope).register(this.playlistTrack());
			this.subscribeToEvents();
		},
		mounted() {
			// Metadata is preloaded only to learn the duration, so a file that carries it is left alone.
			if (!this.fileDuration) {
				this.getObserver().observe(this.$refs.body);
			}
		},
		beforeUnmount() {
			Playlist.getInstance(this.playlistScope).unregister(this.playlistTrack());
			this.unsubscribeFromEvents();
			// Unconditional: the duration can appear after mount, and unobserve of an unobserved element is a no-op.
			this.observer?.unobserve(this.$refs.body);
		},
		methods: {
			subscribeToEvents() {
				this.getEmitter().subscribe(im_v2_const.EventType.player.playNext, this.onPlayNext);
				if (this.isServicePlaybackEnabled) {
					main_core_events.EventEmitter.subscribe(im_v2_const.EventType.playback.onTrackEnded, this.onTrackEnded);
					return;
				}
				this.getEmitter().subscribe(im_v2_const.EventType.audioPlayer.pause, this.onPause);
				main_core_events.EventEmitter.subscribe(im_v2_const.EventType.player.rateChange, this.onRateChange);
			},
			unsubscribeFromEvents() {
				this.getEmitter().unsubscribe(im_v2_const.EventType.player.playNext, this.onPlayNext);
				if (this.isServicePlaybackEnabled) {
					main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.playback.onTrackEnded, this.onTrackEnded);
					return;
				}
				this.getEmitter().unsubscribe(im_v2_const.EventType.audioPlayer.pause, this.onPause);
				main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.player.rateChange, this.onRateChange);
			},
			toggleServicePlayback() {
				if (!this.src) {
					return;
				}
				if (this.playback.isPlaying) {
					this.playbackService.pause(im_v2_lib_playback.PlaybackPauseReason.manual);
					return;
				}
				this.startServicePlayback();
			},
			startServicePlayback() {
				if (this.isCurrentRecordOfThisSurface && this.playbackService.canResume()) {
					this.playbackService.resume();
					return;
				}
				this.playbackService.play(this.getPlaybackTrack());
			},
			changeServiceRate() {
				const {
					rate
				} = this.playbackService.getState();
				this.playbackService.setRate(im_v2_lib_playback.PlaybackRate.getNext(rate));
			},
			seekServicePlayback(progress) {
				const position = this.playback.timeTotal / 100 * progress;
				if (!this.isCurrentRecordOfThisSurface) {
					this.startServicePlayback();
				}
				this.playbackService.seek(position);
			},
			getPlaybackTrack() {
				return buildPlaybackTrack({
					file: this.file,
					src: this.src,
					messageId: this.messageId,
					scope: this.playlistScope,
					dialogId: this.dialogId,
					authorId: this.authorId,
					waveformIndex: this.waveformIndex
				});
			},
			loadFile(play = false) {
				if (this.loaded || this.loading && !play) {
					return;
				}
				this.preload = 'auto';
				if (!play) {
					return;
				}
				this.loading = true;
				if (this.source()) {
					void this.source().play();
				}
			},
			toggleLegacyPlayback() {
				if (!this.src) {
					return;
				}
				if (this.isPlaying) {
					this.pause();
				} else {
					this.play();
				}
			},
			play() {
				this.updateRate(im_v2_lib_playback.PlaybackRate.get());
				if (!this.loaded) {
					this.loadFile(true);
					return;
				}
				void this.source().play();
			},
			pause() {
				this.source().pause();
			},
			stop() {
				this.state = im_v2_const.AudioPlaybackState.stop;
				this.source().pause();
			},
			changeLegacyRate() {
				if ([im_v2_const.AudioPlaybackState.pause, im_v2_const.AudioPlaybackState.none].includes(this.state)) {
					return;
				}
				const commonCurrentRate = im_v2_lib_playback.PlaybackRate.get();
				const newRate = im_v2_lib_playback.PlaybackRate.getNext(commonCurrentRate);
				im_v2_lib_analytics.Analytics.getInstance().player.onChangeRate(this.file.chatId, newRate);
				// the new value comes back through the broadcast, so this player applies it the same way as the others
				im_v2_lib_playback.PlaybackRate.set(newRate);
			},
			updateRate(newRate) {
				this.currentRate = newRate;
				// a player mounted without a source has no media element to carry the rate
				if (this.source()) {
					this.source().playbackRate = newRate;
				}
			},
			onRateChange(event) {
				this.updateRate(event.getData().rate);
			},
			onPause(event) {
				const data = event.getData();
				if (data.initiator === this.file.id) {
					return;
				}
				this.pause();
			},
			// The same file can hang in several messages, so the file alone does not say which player is
			// meant: without the message every one of them would start and scroll the list to itself.
			playlistTrack() {
				return {
					messageId: this.messageId,
					file: this.file
				};
			},
			onPlayNext(event) {
				const data = event.getData();
				if (data.fileId !== this.file.id || data.messageId !== this.messageId || data.scope !== this.playlistScope) {
					return;
				}
				this.$refs.body?.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
				this.playbackCommands.playNext();
			},
			onTrackEnded(event) {
				const {
					fileId,
					scope
				} = event.getData();
				if (fileId !== this.file.id || scope !== this.playlistScope) {
					return;
				}
				Playlist.getInstance(scope).onFileEnded({
					file: this.file,
					context: {
						emitter: this.getEmitter()
					}
				});
			},
			source() {
				return this.$refs.source;
			},
			audioEventRouter(eventName, event) {
				// eslint-disable-next-line default-case
				switch (eventName) {
					case 'durationchange':
					case 'loadeddata':
					case 'loadedmetadata':
						if (!this.source()) {
							return;
						}
						this.mediaDuration = this.source().duration;
						break;
					case 'abort':
					case 'error':
						console.error('BxAudioPlayer: load failed', this.file.id, event);
						this.loading = false;
						this.state = im_v2_const.AudioPlaybackState.none;
						this.mediaDuration = 0;
						this.preload = 'none';
						break;
					case 'canplaythrough':
						this.loading = false;
						this.loaded = true;
						break;
					case 'timeupdate':
						if (!this.source()) {
							return;
						}
						this.timeCurrent = this.source().currentTime;
						break;
					case 'ended':
						this.timeCurrent = 0;
						this.source().currentTime = 0;
						this.state = im_v2_const.AudioPlaybackState.stop;
						Playlist.getInstance(this.playlistScope).onFileEnded({
							...this.playlistTrack(),
							context: {
								emitter: this.getEmitter()
							}
						});
						break;
					case 'pause':
						im_v2_lib_analytics.Analytics.getInstance().player.onPause(this.file.id);
						if (this.state !== im_v2_const.AudioPlaybackState.stop) {
							this.state = im_v2_const.AudioPlaybackState.pause;
						}
						break;
					case 'play':
						im_v2_lib_analytics.Analytics.getInstance().player.onPlay(this.file.id);
						this.state = im_v2_const.AudioPlaybackState.play;
						this.getEmitter().emit(im_v2_const.EventType.audioPlayer.pause, {
							initiator: this.file.id
						});
						break;
					// No default
				}
			},
			getObserver() {
				if (this.observer) {
					return this.observer;
				}
				this.observer = new IntersectionObserver(entries => {
					entries.forEach(entry => {
						if (entry.isIntersecting && this.preload === 'none') {
							this.preload = 'metadata';
							this.observer.unobserve(entry.target);
						}
					});
				}, {
					threshold: [0, 1]
				});
				return this.observer;
			},
			seekLegacyPlayback(progress) {
				this.play();
				this.source().currentTime = this.timeTotal / 100 * progress;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
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
	`
	};

	// @vue/component
	const TranscribedVideoPlayer = {
		name: 'TranscribedVideoPlayer',
		components: {
			TranscriptionText,
			TranscriptionButton,
			Timeline
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			message: {
				type: Object,
				required: true
			},
			withMessageText: {
				type: Boolean,
				default: true
			}
		},
		emits: ['closeTranscription', 'clickPlay'],
		data() {
			return {
				duration: 0
			};
		},
		computed: {
			file() {
				return this.item;
			},
			playButtonStyles() {
				return {
					backgroundImage: `url(${this.file.urlPreview})`
				};
			},
			formattedTime() {
				if (this.duration === 0) {
					return '--:--';
				}
				return im_v2_lib_utils.Utils.date.formatMediaDurationTime(this.duration);
			}
		},
		methods: {
			handleLoadedMetaData() {
				this.duration = this.$refs.videoElement.duration;
			}
		},
		template: `
		<div class="bx-im-transcribed-video-player__container">
			<div class="bx-im-transcribed-video-player__video">
				<div
					:style="playButtonStyles"
					class="bx-im-transcribed-video-player__play"
					data-testid="im-transcribed-video-player-play-btn"
					@click="$emit('clickPlay')"
				>
					<div class="bx-im-transcribed-video-player__play-button-overlay"></div>
					<div class="bx-im-transcribed-video-player__play-icon"></div>
				</div>
				<div class="bx-im-transcribed-video-player__content">
					<div class="bx-im-transcribed-video-player__timeline-container">
						<Timeline
							:loaded="duration > 0"
							:timeCurrent="duration"
							:timeTotal="duration"
							:withSeeking="false"
						/>
						<div class="bx-im-transcribed-video-player__metainfo">{{ formattedTime }}</div>
					</div>
					<div
						class="bx-im-transcribed-video-player__transcription-button"
						data-testid="im-transcribed-video-player-collapse-btn"
					>
						<TranscriptionButton
							:file="file"
							:isOpened="true"
							:messageId="message.id"
							@transcriptionToggle="$emit('closeTranscription')"
						/>
					</div>
				</div>
				<video
					:src="file.urlDownload"
					class="bx-im-transcribed-video-player__video-source"
					ref="videoElement"
					preload="metadata"
					@loadedmetadata="handleLoadedMetaData"
				></video>
			</div>
			<TranscriptionText
				:file="file"
				:isOpened="true"
				:messageId="message.id"
				:withMessageText="withMessageText"
				class="bx-im-transcribed-video-player__transcription-text"
			/>
		</div>
	`
	};

	exports.AudioPlayer = AudioPlayer;
	exports.DefaultVideoPlayer = DefaultVideoPlayer;
	exports.RoundVideoPlayer = RoundVideoPlayer;
	exports.Timeline = Timeline;
	exports.TranscribedVideoPlayer = TranscribedVideoPlayer;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX, BX, BX.Event, BX.Messenger.v2.Component.Animation, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI.IconSet, window, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Service, BX, BX.Messenger.v2.Component.Elements, BX.UI, BX.UI.Vue3.Components, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
