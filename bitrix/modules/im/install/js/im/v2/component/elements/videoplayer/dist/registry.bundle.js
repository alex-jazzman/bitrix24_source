/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,ui_fonts_opensans,main_polyfill_intersectionobserver,ui_iconSet_api_vue,im_v2_lib_utils,im_v2_component_animation,main_core_events,im_v2_const) {
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
	  onFileEnded(file) {
	    const nextFile = babelHelpers.classPrivateFieldLooseBase(this, _getNextFile)[_getNextFile](file);
	    if (!nextFile) {
	      return;
	    }
	    main_core_events.EventEmitter.emit(im_v2_const.EventType.roundVideoPlayer.playNext, {
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
	    RoundProgressBar
	  },
	  props: {
	    item: {
	      type: Object,
	      required: true
	    }
	  },
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
	    isMuted() {
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
	    }
	  },
	  created() {
	    Playlist.getInstance().register(this.file);
	  },
	  mounted() {
	    this.getObserver().observe(this.$refs.body);
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.roundVideoPlayer.playNext, this.handlePlayNextRequest);
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.roundVideoPlayer.onClickPlay, this.handleOtherVideoStarted);
	  },
	  beforeUnmount() {
	    this.stopProgressAnimation();
	    this.getObserver().unobserve(this.$refs.body);
	    Playlist.getInstance().unregister(this.file);
	    main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.roundVideoPlayer.playNext, this.handlePlayNextRequest);
	    main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.roundVideoPlayer.onClickPlay, this.handleOtherVideoStarted);
	  },
	  methods: {
	    togglePlayMode() {
	      main_core_events.EventEmitter.emit(im_v2_const.EventType.roundVideoPlayer.onClickPlay, {
	        fileId: this.file.id
	      });
	      if (this.playbackMode === PlaybackMode.autoplay) {
	        this.switchToManualMode();
	        return;
	      }
	      if (this.playbackState === PlaybackState.playing) {
	        this.pauseVideo();
	      } else {
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
	      Playlist.getInstance().onFileEnded(this.file);
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
	    }
	  },
	  template: `
		<div class="bx-im-round-video-player__container">
			<FadeAnimation :duration="200">
				<div v-if="isMuted" class="bx-im-round-video-player__mute">
					<BIcon
						:name="OutlineIcons.SOUND_OFF"
						:color="Color.white"
						:size="MUTE_ICON_SIZE"
					/>
				</div>
			</FadeAnimation>
			<FadeAnimation :duration="200">
				<div class="bx-im-round-video-player__time-container">
					<div class="bx-im-round-video-player__time">{{ formattedTime }}</div>
				</div>
			</FadeAnimation>
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

	exports.DefaultVideoPlayer = DefaultVideoPlayer;
	exports.RoundVideoPlayer = RoundVideoPlayer;

}((this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}),BX,BX,BX.UI.IconSet,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Animation,BX.Event,BX.Messenger.v2.Const));
//# sourceMappingURL=registry.bundle.js.map
