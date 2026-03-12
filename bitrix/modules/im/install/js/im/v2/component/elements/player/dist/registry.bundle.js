/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,ui_iconSet_api_vue,ui_iconSet_smallOutline,im_v2_component_elements_loader,im_v2_provider_service_message,ui_fonts_opensans,main_polyfill_intersectionobserver,im_v2_lib_feature,main_core_events,im_v2_lib_localStorage,im_v2_component_elements_avatar,im_v2_lib_analytics,ui_infoHelper,ui_vue3_components_richLoc,im_v2_component_animation,im_v2_const,im_v2_lib_parser,im_v2_lib_utils) {
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
	        this.play();
	      }
	    },
	    handleMuteClick() {
	      if (this.isMuted) {
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
		<div class="bx-im-video-player__container" @click.stop="handleContainerClick">
			<FadeAnimation :duration="500">
				<div v-if="showStartButton" class="bx-im-video-player__start-play_button" @click.stop="handleControlClick">
					<span class="bx-im-video-player__start-play_icon"></span>
				</div>
			</FadeAnimation>
			<FadeAnimation :duration="500">
				<div v-if="showInterface" class="bx-im-video-player__control-button_container" @click.stop="handleControlClick">
					<button class="bx-im-video-player__control-button" :class="controlButtonClass"></button>
				</div>
			</FadeAnimation>
			<FadeAnimation :duration="500">
				<div 
					v-if="showInterface" 
					class="bx-im-video-player__info-container" 
					@click.stop="handleMuteClick"
				>
					<span class="bx-im-video-player__time">{{ formattedTime }}</span>
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

	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	var _files = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("files");
	var _getNextFile = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getNextFile");
	class Playlist {
	  constructor() {
	    Object.defineProperty(this, _getNextFile, {
	      value: _getNextFile2
	    });
	    Object.defineProperty(this, _files, {
	      writable: true,
	      value: {}
	    });
	  }
	  static getInstance() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance] = new this();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance];
	  }
	  register(file) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _files)[_files][file.chatId]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _files)[_files][file.chatId] = new Set();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _files)[_files][file.chatId].add(file);
	  }
	  unregister(file) {
	    babelHelpers.classPrivateFieldLooseBase(this, _files)[_files][file.chatId].delete(file);
	  }
	  onFileEnded(payload) {
	    const {
	      file,
	      context: {
	        emitter
	      }
	    } = payload;
	    const nextFile = babelHelpers.classPrivateFieldLooseBase(this, _getNextFile)[_getNextFile](file);
	    if (!nextFile) {
	      return;
	    }
	    emitter.emit(im_v2_const.EventType.roundVideoPlayer.playNext, {
	      fileId: nextFile.id
	    });
	  }
	}
	function _getNextFile2(file) {
	  const chatFiles = [...babelHelpers.classPrivateFieldLooseBase(this, _files)[_files][file.chatId]];
	  chatFiles.sort((a, b) => a.date - b.date);
	  const currentIndex = chatFiles.indexOf(file);
	  return chatFiles[currentIndex + 1];
	}
	Object.defineProperty(Playlist, _instance, {
	  writable: true,
	  value: void 0
	});

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
	    },
	    iconColor() {
	      return this.isOverlay ? im_v2_const.Color.white : im_v2_const.Color.accentBlue;
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
					:color="iconColor"
					:size="20"
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
	      currentTimeSmoothed: 0
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
	    }
	  },
	  created() {
	    Playlist.getInstance().register(this.file);
	  },
	  mounted() {
	    this.getObserver().observe(this.$refs.body);
	    this.getEmitter().subscribe(im_v2_const.EventType.roundVideoPlayer.playNext, this.handlePlayNextRequest);
	    this.getEmitter().subscribe(im_v2_const.EventType.roundVideoPlayer.onClickPlay, this.handleOtherVideoStarted);
	    if (this.startWithSound) {
	      this.switchToManualMode();
	    }
	  },
	  beforeUnmount() {
	    this.stopProgressAnimation();
	    this.getObserver().unobserve(this.$refs.body);
	    Playlist.getInstance().unregister(this.file);
	    this.getEmitter().unsubscribe(im_v2_const.EventType.roundVideoPlayer.playNext, this.handlePlayNextRequest);
	    this.getEmitter().unsubscribe(im_v2_const.EventType.roundVideoPlayer.onClickPlay, this.handleOtherVideoStarted);
	  },
	  methods: {
	    togglePlayMode() {
	      this.getEmitter().emit(im_v2_const.EventType.roundVideoPlayer.onClickPlay, {
	        fileId: this.file.id
	      });
	      if (this.playbackMode === PlaybackMode.autoplay) {
	        im_v2_lib_analytics.Analytics.getInstance().player.onPlay(this.file.id);
	        this.switchToManualMode();
	        return;
	      }
	      if (this.playbackState === PlaybackState.playing) {
	        im_v2_lib_analytics.Analytics.getInstance().player.onPause(this.file.id);
	        this.pauseVideo();
	      } else {
	        im_v2_lib_analytics.Analytics.getInstance().player.onPlay(this.file.id);
	        this.playVideo();
	      }
	    },
	    playVideo() {
	      void this.videoElement.play();
	    },
	    pauseVideo() {
	      this.videoElement.pause();
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
	      Playlist.getInstance().onFileEnded({
	        file: this.file,
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
	    handlePlayNextRequest(event) {
	      const {
	        fileId
	      } = event.getData();
	      if (fileId !== this.file.id) {
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
	    switchToAutoplayMode() {
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
	    }
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
	`
	};

	const Wave = {
	  verticalShift: 44,
	  activeVerticalShift: 19
	};

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
	    }
	  },
	  emits: ['change'],
	  data() {
	    return {
	      seekerOffset: 0
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
	    progressPosition() {
	      if (!this.loaded || this.timeCurrent === 0) {
	        return {
	          width: '100%'
	        };
	      }
	      const offset = Math.round(this.$refs.timeline.offsetWidth / 100 * this.progress);
	      return {
	        width: `${offset}px`
	      };
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
	    this.waveType = Math.floor(Math.random() * 5);
	  },
	  methods: {
	    setPosition() {
	      if (!this.loaded || !this.withSeeking) {
	        return;
	      }
	      const pixelPerPercent = this.$refs.timeline.offsetWidth / 100;
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
			:class="{'--with-seeking': withSeeking}"
			class="bx-im-player-timeline__container" 
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
	    }
	  },
	  computed: {
	    transcription() {
	      return this.$store.getters['files/getTranscription'](this.file.id);
	    },
	    text() {
	      var _this$transcription$t, _this$transcription;
	      return im_v2_lib_parser.Parser.decode({
	        text: (_this$transcription$t = (_this$transcription = this.transcription) == null ? void 0 : _this$transcription.transcriptText) != null ? _this$transcription$t : ''
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
	        return this.loc('IM_MESSAGE_FILE_TRANSCRIPTION_LIMIT_ERROR');
	      }
	      const code = ErrorMessageByType[this.file.type];
	      return this.loc(code);
	    },
	    needToShowDivider() {
	      return this.isOpened && Boolean(this.message.text);
	    },
	    needToShowDisclaimer() {
	      var _this$transcription2;
	      return !this.isError && Boolean((_this$transcription2 = this.transcription) == null ? void 0 : _this$transcription2.transcriptText);
	    },
	    message() {
	      return this.$store.getters['messages/getById'](this.messageId);
	    }
	  },
	  methods: {
	    loc(code) {
	      return this.$Bitrix.Loc.getMessage(code);
	    },
	    onLimitErrorLinkClick() {
	      const promoter = new ui_infoHelper.FeaturePromoter({
	        code: im_v2_const.SliderCode.buyMarketPlus
	      });
	      promoter.show();
	    }
	  },
	  template: `
		<div class="bx-im-transcription-text__container">
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
			<div v-if="needToShowDivider" class="bx-im-transcription-text__divider"></div>
		</div>
	`
	};

	const ID_KEY = 'im:audioplayer:id';

	// @vue/component
	const AudioPlayer = {
	  name: 'AudioPlayer',
	  components: {
	    MessageAvatar: im_v2_component_elements_avatar.MessageAvatar,
	    Timeline,
	    TranscriptionButton,
	    TranscriptionText
	  },
	  props: {
	    id: {
	      type: Number,
	      default: 0
	    },
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
	    }
	  },
	  data() {
	    return {
	      preload: 'none',
	      loaded: false,
	      loading: false,
	      state: im_v2_const.AudioPlaybackState.none,
	      timeCurrent: 0,
	      timeTotal: 0,
	      showContextButton: false,
	      currentRate: im_v2_const.AudioPlaybackRate['1'],
	      isTranscriptionOpened: false
	    };
	  },
	  computed: {
	    State: () => im_v2_const.AudioPlaybackState,
	    isPlaying() {
	      return this.state === im_v2_const.AudioPlaybackState.play;
	    },
	    labelTime() {
	      if (!this.loaded && !this.timeTotal) {
	        return '--:--';
	      }
	      let time = 0;
	      if (this.isPlaying) {
	        time = this.timeTotal - this.timeCurrent;
	      } else {
	        time = this.timeTotal;
	      }
	      return im_v2_lib_utils.Utils.date.formatMediaDurationTime(time);
	    },
	    AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
	    fileSize() {
	      return im_v2_lib_utils.Utils.file.formatFileSize(this.file.size);
	    },
	    getAudioPlayerIds() {
	      return this.$Bitrix.Data.get(ID_KEY, []);
	    },
	    currentRateLabel() {
	      return `${this.currentRate}x`;
	    },
	    metaInfo() {
	      return `${this.fileSize}, ${this.labelTime}`;
	    },
	    isTranscriptionAvailable() {
	      return this.withTranscription && this.file.isTranscribable && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.aiFileTranscriptionAvailable) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable);
	    }
	  },
	  watch: {
	    id(value) {
	      this.registerPlayer(value);
	    },
	    timeCurrent(value) {
	      const progress = Math.round(100 / this.timeTotal * value);
	      if (progress > 70) {
	        this.preloadNext();
	      }
	    }
	  },
	  created() {
	    this.localStorageInst = im_v2_lib_localStorage.LocalStorageManager.getInstance();
	    this.currentRate = this.getRateFromLS();
	    this.preloadRequestSent = false;
	    this.registeredId = 0;
	    this.registerPlayer(this.id);
	    this.getEmitter().subscribe(im_v2_const.EventType.audioPlayer.play, this.onPlay);
	    this.getEmitter().subscribe(im_v2_const.EventType.audioPlayer.stop, this.onStop);
	    this.getEmitter().subscribe(im_v2_const.EventType.audioPlayer.pause, this.onPause);
	    this.getEmitter().subscribe(im_v2_const.EventType.audioPlayer.preload, this.onPreload);
	  },
	  mounted() {
	    this.getObserver().observe(this.$refs.body);
	  },
	  beforeUnmount() {
	    this.unregisterPlayer();
	    this.getEmitter().unsubscribe(im_v2_const.EventType.audioPlayer.play, this.onPlay);
	    this.getEmitter().unsubscribe(im_v2_const.EventType.audioPlayer.stop, this.onStop);
	    this.getEmitter().unsubscribe(im_v2_const.EventType.audioPlayer.pause, this.onPause);
	    this.getEmitter().unsubscribe(im_v2_const.EventType.audioPlayer.preload, this.onPreload);
	    this.getObserver().unobserve(this.$refs.body);
	  },
	  methods: {
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
	    clickToButton() {
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
	      this.updateRate(this.getRateFromLS());
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
	    getRateFromLS() {
	      return this.localStorageInst.get(im_v2_const.LocalStorageKey.audioPlaybackRate) || im_v2_const.AudioPlaybackRate['1'];
	    },
	    setRateInLS(newRate) {
	      this.localStorageInst.set(im_v2_const.LocalStorageKey.audioPlaybackRate, newRate);
	    },
	    getNextPlaybackRate(currentRate) {
	      const rates = Object.values(im_v2_const.AudioPlaybackRate).sort();
	      const currentIndex = rates.indexOf(currentRate);
	      const nextIndex = (currentIndex + 1) % rates.length;
	      return rates[nextIndex];
	    },
	    changeRate() {
	      if ([im_v2_const.AudioPlaybackState.pause, im_v2_const.AudioPlaybackState.none].includes(this.state)) {
	        return;
	      }
	      const commonCurrentRate = this.getRateFromLS();
	      const newRate = this.getNextPlaybackRate(commonCurrentRate);
	      im_v2_lib_analytics.Analytics.getInstance().player.onChangeRate(this.file.chatId, newRate);
	      this.setRateInLS(newRate);
	      this.updateRate(newRate);
	    },
	    updateRate(newRate) {
	      this.currentRate = newRate;
	      this.source().playbackRate = newRate;
	    },
	    registerPlayer(id) {
	      if (id <= 0) {
	        return;
	      }
	      this.unregisterPlayer();
	      const audioIdArray = [...new Set([...this.getAudioPlayerIds, id])];
	      this.$Bitrix.Data.set(ID_KEY, audioIdArray.sort((a, b) => a - b));
	      this.registeredId = id;
	    },
	    unregisterPlayer() {
	      if (!this.registeredId) {
	        return;
	      }
	      this.$Bitrix.Data.get(ID_KEY, this.getAudioPlayerIds.filter(id => id !== this.registeredId));
	      this.registeredId = 0;
	    },
	    playNext() {
	      if (!this.registeredId) {
	        return;
	      }
	      const nextId = this.getAudioPlayerIds.filter(id => id > this.registeredId).slice(0, 1)[0];
	      if (nextId) {
	        this.getEmitter().emit(im_v2_const.EventType.audioPlayer.play, {
	          id: nextId,
	          start: true
	        });
	      }
	    },
	    preloadNext() {
	      if (this.preloadRequestSent || !this.registeredId) {
	        return;
	      }
	      this.preloadRequestSent = true;
	      const nextId = this.getAudioPlayerIds.filter(id => id > this.registeredId).slice(0, 1)[0];
	      if (nextId) {
	        this.getEmitter().emit(im_v2_const.EventType.audioPlayer.preload, {
	          id: nextId
	        });
	      }
	    },
	    onPlay(event) {
	      const data = event.getData();
	      if (data.id !== this.id) {
	        return;
	      }
	      if (data.start) {
	        this.stop();
	      }
	      this.play();
	    },
	    onStop(event) {
	      const data = event.getData();
	      if (data.initiator === this.id) {
	        return;
	      }
	      this.stop();
	    },
	    onPause(event) {
	      const data = event.getData();
	      if (data.initiator === this.id) {
	        return;
	      }
	      this.pause();
	    },
	    onPreload(event) {
	      const data = event.getData();
	      if (data.id !== this.id) {
	        return;
	      }
	      this.loadFile();
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
	          this.timeTotal = this.source().duration;
	          break;
	        case 'abort':
	        case 'error':
	          console.error('BxAudioPlayer: load failed', this.id, event);
	          this.loading = false;
	          this.state = im_v2_const.AudioPlaybackState.none;
	          this.timeTotal = 0;
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
	          if (this.isPlaying && this.timeCurrent >= this.timeTotal) {
	            this.playNext();
	          }
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
	          if (this.state === im_v2_const.AudioPlaybackState.stop) {
	            this.timeCurrent = 0;
	          }
	          if (this.id > 0) {
	            this.getEmitter().emit(im_v2_const.EventType.audioPlayer.pause, {
	              initiator: this.id
	            });
	          }
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
	    onTimelineClick(progress) {
	      this.play();
	      this.source().currentTime = this.timeTotal / 100 * progress;
	    },
	    getEmitter() {
	      return this.$Bitrix.eventEmitter;
	    }
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
					<div class="bx-im-transcribed-video-player__transcription-button">
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
				class="bx-im-transcribed-video-player__transcription-text"
			/>
		</div>
	`
	};

	exports.DefaultVideoPlayer = DefaultVideoPlayer;
	exports.RoundVideoPlayer = RoundVideoPlayer;
	exports.AudioPlayer = AudioPlayer;
	exports.TranscribedVideoPlayer = TranscribedVideoPlayer;

}((this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}),BX.UI.IconSet,BX,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Service,BX,BX,BX.Messenger.v2.Lib,BX.Event,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Lib,BX.UI,BX.UI.Vue3.Components,BX.Messenger.v2.Component.Animation,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib));
//# sourceMappingURL=registry.bundle.js.map
