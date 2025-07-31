/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,main_core,ui_vue3_directives_lazyload,im_v2_const,im_v2_lib_utils,im_v2_component_elements_progressbar) {
	'use strict';

	const MAX_WIDTH = 488;
	const MAX_HEIGHT = 340;
	const MIN_WIDTH = 200;
	const MIN_HEIGHT = 100;

	// @vue/component
	const ImageItem = {
	  name: 'ImageItem',
	  directives: {
	    lazyload: ui_vue3_directives_lazyload.lazyload
	  },
	  components: {
	    ProgressBar: im_v2_component_elements_progressbar.ProgressBar
	  },
	  props: {
	    /** @type ImModelFile */
	    file: {
	      type: Object,
	      required: true
	    },
	    isGallery: {
	      type: Boolean,
	      default: true
	    },
	    handleLoading: {
	      type: Boolean,
	      default: false
	    },
	    allowRemove: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['remove', 'cancelClick'],
	  computed: {
	    imageSize() {
	      if (this.isGallery) {
	        return {};
	      }
	      let newWidth = this.file.image.width;
	      let newHeight = this.file.image.height;
	      if (this.file.image.width > MAX_WIDTH || this.file.image.height > MAX_HEIGHT) {
	        const aspectRatio = this.file.image.width / this.file.image.height;
	        if (this.file.image.width > MAX_WIDTH) {
	          newWidth = MAX_WIDTH;
	          newHeight = Math.round(MAX_WIDTH / aspectRatio);
	        }
	        if (newHeight > MAX_HEIGHT) {
	          newWidth = Math.round(MAX_HEIGHT * aspectRatio);
	          newHeight = MAX_HEIGHT;
	        }
	      }
	      const sizes = {
	        width: Math.max(newWidth, MIN_WIDTH),
	        height: Math.max(newHeight, MIN_HEIGHT)
	      };
	      return {
	        width: `${sizes.width}px`,
	        height: `${sizes.height}px`,
	        'object-fit': sizes.width < 100 || sizes.height < 100 ? 'cover' : 'contain'
	      };
	    },
	    viewerAttributes() {
	      return im_v2_lib_utils.Utils.file.getViewerDataAttributes({
	        viewerAttributes: this.file.viewerAttrs,
	        previewImageSrc: this.file.urlPreview,
	        context: im_v2_const.FileViewerContext.dialog
	      });
	    },
	    canBeOpenedWithViewer() {
	      var _BX$UI;
	      return this.file.viewerAttrs && ((_BX$UI = BX.UI) == null ? void 0 : _BX$UI.Viewer);
	    },
	    imageTitle() {
	      const size = im_v2_lib_utils.Utils.file.formatFileSize(this.file.size);
	      return this.loc('IM_ELEMENTS_MEDIA_IMAGE_TITLE', {
	        '#NAME#': this.file.name,
	        '#SIZE#': size
	      });
	    },
	    isLoaded() {
	      return this.file.progress === 100;
	    },
	    isVideo() {
	      return this.file.type === im_v2_const.FileType.video;
	    },
	    showPlayIcon() {
	      return this.isVideo && (this.isLoaded || !this.handleLoading);
	    },
	    isAnimated() {
	      return this.file.extension === 'gif' || this.file.extension === 'webp';
	    },
	    previewSourceLink() {
	      if (this.isAnimated) {
	        return this.file.urlShow || this.file.urlDownload;
	      }
	      return this.file.urlPreview;
	    },
	    allowLazyLoad() {
	      return !this.previewSourceLink.startsWith('blob:');
	    },
	    withoutPreview() {
	      return !main_core.Type.isStringFilled(this.previewSourceLink);
	    },
	    progressBarSize() {
	      return this.isGallery ? im_v2_component_elements_progressbar.ProgressBarSize.S : im_v2_component_elements_progressbar.ProgressBarSize.L;
	    }
	  },
	  methods: {
	    download() {
	      if (this.file.progress !== 100 || this.canBeOpenedWithViewer) {
	        return;
	      }
	      window.open(this.file.urlDownload, '_blank');
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onRemoveClick() {
	      this.$emit('remove', {
	        file: this.file
	      });
	    },
	    onCancelClick(event) {
	      this.$emit('cancelClick', event);
	    }
	  },
	  template: `
		<div 
			v-bind="viewerAttributes" 
			class="bx-im-elements-media-gallery-image-item__container" 
			:class="{'--without-preview': withoutPreview}"
			@click="download"
			:style="imageSize"
		>
			<img
				v-if="allowLazyLoad"
				v-lazyload
				data-lazyload-dont-hide
				:data-lazyload-src="previewSourceLink"
				:title="imageTitle"
				:alt="file.name"
				class="bx-im-elements-media-gallery-image-item__source"
			/>
			<img
				v-else
				:src="previewSourceLink"
				:title="imageTitle"
				:alt="file.name"
				class="bx-im-elements-media-gallery-image-item__source"
			/>
			<ProgressBar 
				v-if="handleLoading" 
				:item="file" 
				:size="progressBarSize" 
				@cancelClick="onCancelClick"
			/>
			<div v-if="showPlayIcon" class="bx-im-elements-media-gallery-image-item__play-icon-container">
				<div class="bx-im-elements-media-gallery-image-item__play-icon"></div>
			</div>
			<div v-if="allowRemove" class="bx-im-elements-media-gallery-image-item__remove" @click="onRemoveClick">
				<div class="bx-im-elements-media-gallery-image-item__remove-icon"></div>
			</div>
		</div>
	`
	};

	const MediaComponents = Object.freeze({
	  image: 'ImageItem',
	  video: 'ImageItem'
	});

	// @vue/component
	const MediaItem = {
	  name: 'MediaItem',
	  components: {
	    ImageItem
	  },
	  props: {
	    /** @type { ImModelFile } */
	    file: {
	      type: Object,
	      required: true
	    },
	    allowRemove: {
	      type: Boolean,
	      default: false
	    },
	    handleLoading: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['remove', 'cancelClick'],
	  computed: {
	    componentName() {
	      return MediaComponents[this.file.type];
	    }
	  },
	  methods: {
	    onRemove(event) {
	      this.$emit('remove', event);
	    },
	    onCancel(event) {
	      this.$emit('cancelClick', event);
	    }
	  },
	  template: `
		<component
			:is="componentName"
			:file="file"
			:allowRemove="allowRemove"
			:handleLoading="handleLoading"
			@remove="onRemove"
			@cancelClick="onCancel"
		/>
	`
	};

	// @vue/component
	const MediaGallery = {
	  name: 'MediaGallery',
	  components: {
	    MediaItem
	  },
	  props: {
	    files: {
	      type: Array,
	      required: true
	    },
	    allowRemoveItem: {
	      type: Boolean,
	      default: false
	    },
	    handleLoading: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['removeItem', 'cancelClick'],
	  computed: {
	    firstFile() {
	      return this.files[0];
	    },
	    filesCount() {
	      return this.files.length;
	    },
	    isGallery() {
	      return this.filesCount > 1;
	    },
	    isSingleFile() {
	      return this.filesCount === 1;
	    },
	    isError() {
	      return this.filesCount === 0;
	    },
	    templateRows() {
	      if (this.filesCount >= 7) {
	        return '140px 80px 80px 58px';
	      }
	      if (this.filesCount >= 3) {
	        return '140px 80px 80px';
	      }
	      return '140px 80px';
	    },
	    galleryStyles() {
	      return {
	        gridTemplateRows: this.templateRows
	      };
	    }
	  },
	  methods: {
	    onRemoveItem(event) {
	      this.$emit('removeItem', event);
	    },
	    onCancel(event) {
	      this.$emit('cancelClick', event);
	    },
	    getMediaItemStyles(index) {
	      var _spanValues$this$file, _spanValues$this$file2;
	      const spanValues = {
	        10: ['1-4', '1-1', '1-2', '1-1', '1-1', '1-2', '1-1', '1-1', '1-2', '1-1'],
	        9: ['1-4', '1-1', '1-2', '1-1', '1-2', '1-2', '1-1', '1-2', '1-1'],
	        8: ['1-4', '1-2', '1-2', '1-1', '1-2', '1-1', '1-2', '1-2'],
	        7: ['1-4', '1-2', '1-2', '1-2', '1-2', '1-2', '1-2'],
	        6: ['1-4', '1-2', '1-2', '1-1', '1-2', '1-1'],
	        5: ['1-4', '1-2', '1-2', '1-2', '1-2'],
	        4: ['2-4', '1-1', '1-2', '1-1'],
	        3: ['2-4', '1-2', '1-2'],
	        2: ['2-2', '2-2']
	      };
	      const spanValue = (_spanValues$this$file = (_spanValues$this$file2 = spanValues[this.filesCount]) == null ? void 0 : _spanValues$this$file2[index]) != null ? _spanValues$this$file : '1-1';
	      const [rowSpan, colSpan] = spanValue.split('-');
	      return {
	        'grid-row-end': `span ${rowSpan}`,
	        'grid-column-end': `span ${colSpan}`
	      };
	    }
	  },
	  template: `
		<div class="bx-im-elements-media-gallery__container">
			<div v-if="isGallery" class="bx-im-elements-media-gallery__items" :style="galleryStyles">
				<MediaItem
					v-for="(file, index) in files"
					:key="file.id"
					:file="file"
					:allowRemove="allowRemoveItem"
					:handleLoading="handleLoading"
					:style="getMediaItemStyles(index)"
					@remove="onRemoveItem"
					@cancelClick="onCancel"
				/>
			</div>
			<div v-else-if="isSingleFile" class="bx-im-elements-media-gallery__single-file">
				<MediaItem
					:file="firstFile"
					:allowRemove="allowRemoveItem"
					:handleLoading="handleLoading"
					:isGallery="false"
					@remove="onRemoveItem"
					@cancelClick="onCancel"
				/>
			</div>
			<div v-else-if="isError" class="bx-im-elements-media-gallery__error">

			</div>
		</div>
	`
	};

	exports.MediaGallery = MediaGallery;
	exports.MediaItem = MediaItem;

}((this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}),BX,BX.Vue3.Directives,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Elements));
//# sourceMappingURL=media-gallery.bundle.js.map
