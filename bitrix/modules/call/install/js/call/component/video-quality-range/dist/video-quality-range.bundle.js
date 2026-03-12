/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports,ui_vue3) {
	'use strict';

	// @vue/component
	const VideoQualitySlider = {
	  name: 'VideoQualitySlider',
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    videoQualityList: {
	      type: Array,
	      required: true
	    },
	    defaultHeight: {
	      type: Number,
	      default: 0
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['change'],
	  // eslint-disable-next-line flowtype/require-return-type
	  data() {
	    return {
	      currentIndex: 0,
	      isDragging: false,
	      dragRect: null
	    };
	  },
	  computed: {
	    // eslint-disable-next-line flowtype/require-return-type
	    thumbStyle() {
	      const position = this.getThumbPosition();
	      return {
	        left: `${position}%`
	      };
	    },
	    // eslint-disable-next-line flowtype/require-return-type
	    marks() {
	      if (this.videoQualityList.length < 2) {
	        return [];
	      }
	      return this.videoQualityList.map((item, index) => ({
	        index,
	        position: index / (this.videoQualityList.length - 1) * 100
	      }));
	    }
	  },
	  watch: {
	    defaultHeight: {
	      handler(height) {
	        const index = this.videoQualityList.findIndex(item => item.height === height);
	        if (index !== -1) {
	          this.currentIndex = index;
	        }
	      },
	      immediate: true
	    }
	  },
	  beforeUnmount() {
	    // eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
	    document.removeEventListener('mousemove', this.handleMouseMove);
	    // eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
	    document.removeEventListener('mouseup', this.handleMouseUp);
	    // eslint-disable-next-line @bitrix24/bitrix24-rules/no-style
	    document.body.style.userSelect = '';
	  },
	  methods: {
	    // eslint-disable-next-line flowtype/require-return-type
	    getThumbPosition() {
	      if (this.videoQualityList.length < 2) {
	        return 0;
	      }
	      return this.currentIndex / (this.videoQualityList.length - 1) * 100;
	    },
	    getLabelPosition(index) {
	      if (this.videoQualityList.length < 2) {
	        return '0%';
	      }
	      return `${index / (this.videoQualityList.length - 1) * 100}%`;
	    },
	    // eslint-disable-next-line flowtype/require-return-type
	    getLabelStyle(index) {
	      const position = this.getLabelPosition(index);
	      return {
	        left: position,
	        transform: 'none'
	      };
	    },
	    getClosestIndex(percentage) {
	      const index = Math.round(percentage / 100 * (this.videoQualityList.length - 1));
	      return Math.max(0, Math.min(this.videoQualityList.length - 1, index));
	    },
	    handleTrackClick(e) {
	      if (this.disabled) {
	        return;
	      }
	      const rect = this.$refs.track.getBoundingClientRect();
	      const x = e.clientX - rect.left;
	      const percentage = x / rect.width * 100;
	      const index = this.getClosestIndex(percentage);
	      if (index !== this.currentIndex) {
	        this.currentIndex = index;
	        this.$emit('change', this.videoQualityList[index].value);
	      }
	    },
	    handleLabelClick(index) {
	      if (this.disabled) {
	        return;
	      }
	      if (index !== this.currentIndex) {
	        this.currentIndex = index;
	        this.$emit('change', this.videoQualityList[index].value);
	      }
	    },
	    handleThumbMouseDown(e) {
	      if (e.button !== 0) {
	        return;
	      }
	      if (this.disabled) {
	        return;
	      }
	      this.isDragging = true;
	      this.dragRect = this.$refs.track.getBoundingClientRect();

	      // eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
	      document.addEventListener('mousemove', this.handleMouseMove);
	      // eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
	      document.addEventListener('mouseup', this.handleMouseUp);
	      // eslint-disable-next-line @bitrix24/bitrix24-rules/no-style
	      document.body.style.userSelect = 'none';
	      e.preventDefault();
	    },
	    handleMouseMove(e) {
	      if (!this.isDragging) {
	        return;
	      }
	      const x = e.clientX - this.dragRect.left;
	      const percentage = Math.max(0, Math.min(100, x / this.dragRect.width * 100));
	      const index = this.getClosestIndex(percentage);
	      if (index !== this.currentIndex) {
	        this.currentIndex = index;
	      }
	    },
	    handleMouseUp() {
	      if (this.isDragging) {
	        this.$emit('change', this.videoQualityList[this.currentIndex].value);
	      }
	      this.isDragging = false;
	      this.dragRect = null;
	      // eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
	      document.removeEventListener('mousemove', this.handleMouseMove);
	      // eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
	      document.removeEventListener('mouseup', this.handleMouseUp);
	      // eslint-disable-next-line @bitrix24/bitrix24-rules/no-style
	      document.body.style.userSelect = '';
	    }
	  },
	  template: `
		<div class="bx-2-call-view-video-quality-container" :class="{ 'is-disabled': disabled }">
			<div class="bx-2-call-view-video-quality-title">
				<div class="bx-2-call-view-video-quality-title-icon"></div>
				<span class="bx-2-call-view-video-quality-title-text">{{ title }}</span>
			</div>

			<div class="bx-2-call-view-video-quality">
				<div
					ref="track"
					class="bx-2-call-view-video-quality-track"
					@click="handleTrackClick"
				>
					<div
						v-for="mark in marks"
						:key="mark.index"
						class="bx-2-call-view-video-quality-mark"
						:style="{ left: mark.position + '%' }"
					></div>
	
					<div
						class="bx-2-call-view-video-quality-thumb"
						:style="thumbStyle"
						@mousedown="handleThumbMouseDown"
					></div>
				</div>

				<div class="bx-2-call-view-video-quality-labels">
					<div
						v-for="(item, index) in videoQualityList"
						:key="item.value"
						class="bx-2-call-view-video-quality-label"
						:class="{ active: currentIndex === index }"
						:style="getLabelStyle(index)"
						@click="handleLabelClick(index)"
					>
						{{ item.label }}
					</div>
				</div>
			</div>
		</div>
	`
	};

	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _config = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("config");
	var _disabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("disabled");
	class VideoQualityRange {
	  constructor(config) {
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _config, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _disabled, {
	      writable: true,
	      value: ui_vue3.ref(false)
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _config)[_config] = {
	      container: config.container,
	      title: config.title,
	      videoQualityList: config.videoQualityList,
	      defaultHeight: config.defaultHeight,
	      onVideoQualityChanged: config.onVideoQualityChanged
	    };
	    babelHelpers.classPrivateFieldLooseBase(this, _disabled)[_disabled].value = Boolean(config.disabled);
	  }
	  init() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _application)[_application]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _config)[_config].container;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = ui_vue3.BitrixVue.createApp({
	      name: 'VideoQualityRangeApp',
	      components: {
	        VideoQualitySlider
	      },
	      setup: () => ({
	        title: babelHelpers.classPrivateFieldLooseBase(this, _config)[_config].title,
	        videoQualityList: babelHelpers.classPrivateFieldLooseBase(this, _config)[_config].videoQualityList,
	        defaultHeight: babelHelpers.classPrivateFieldLooseBase(this, _config)[_config].defaultHeight,
	        disabled: babelHelpers.classPrivateFieldLooseBase(this, _disabled)[_disabled],
	        handleChange: value => {
	          var _babelHelpers$classPr, _babelHelpers$classPr2;
	          (_babelHelpers$classPr = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _config)[_config]).onVideoQualityChanged) == null ? void 0 : _babelHelpers$classPr.call(_babelHelpers$classPr2, value);
	        }
	      }),
	      template: `
				<VideoQualitySlider
					:title="title"
					:video-quality-list="videoQualityList"
					:default-height="defaultHeight"
					:disabled="disabled"
					@change="handleChange"
				/>
			`
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].mount(babelHelpers.classPrivateFieldLooseBase(this, _config)[_config].container);
	    return babelHelpers.classPrivateFieldLooseBase(this, _config)[_config].container;
	  }
	  setDisabled(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _disabled)[_disabled].value = Boolean(value);
	  }
	  destroy() {
	    var _babelHelpers$classPr3;
	    (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _application)[_application]) == null ? void 0 : _babelHelpers$classPr3.unmount();
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = null;
	  }
	}

	exports.VideoQualityRange = VideoQualityRange;

}((this.BX.Call.Component = this.BX.Call.Component || {}),BX.Vue3));
//# sourceMappingURL=video-quality-range.bundle.js.map
