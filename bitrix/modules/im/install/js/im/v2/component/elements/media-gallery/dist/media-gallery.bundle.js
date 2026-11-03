/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, ui_iconSet_api_core, ui_vue3_directives_lazyload, im_v2_const, im_v2_lib_utils, im_v2_component_elements_progressbar, im_v2_component_elements_iconButton) {
	'use strict';

	const MAX_HEIGHT = 590;

	// @vue/component
	const MediaGalleryItem = {
		name: 'MediaGalleryItem',
		directives: {
			lazyload: ui_vue3_directives_lazyload.lazyload
		},
		components: {
			ProgressBar: im_v2_component_elements_progressbar.ProgressBar,
			IconButton: im_v2_component_elements_iconButton.IconButton
		},
		props: {
			/** @type ImModelFile */
			file: {
				type: Object,
				required: true
			},
			size: {
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
			allowCancel: {
				type: Boolean,
				default: true
			},
			allowRemove: {
				type: Boolean,
				default: false
			},
			removeButtonLabel: {
				type: String,
				default: ''
			},
			allowSorting: {
				type: Boolean,
				default: false
			},
			gridNavigation: {
				type: Boolean,
				default: false
			},
			// Opt-in id of the hint the consumer keeps for the Delete shortcut. Announced together with the
			// shortcut itself, so a consumer that mounts the gallery without grid navigation gets neither.
			describedById: {
				type: String,
				default: null
			},
			viewerGroupBy: {
				type: String || null,
				default: null
			},
			highlightDropzonePosition: {
				type: String || null,
				default: null
			}
		},
		emits: ['remove', 'cancelClick', 'itemDragStart', 'itemDragEnd', 'itemDragOver', 'itemDragLeave', 'itemDrop'],
		data() {
			return {
				isDraggable: false,
				dragEvents: {}
			};
		},
		computed: {
			removeIconName: () => ui_iconSet_api_core.Outline.CROSS_L,
			removeIconColor: () => im_v2_const.Color.white,
			removeButtonAriaLabel() {
				if (this.removeButtonLabel) {
					return this.removeButtonLabel.replace('#FILE_NAME#', () => this.file.name);
				}
				return this.file.name;
			},
			viewerAttributes() {
				if (this.file.viewerAttrs) {
					return im_v2_lib_utils.Utils.file.getViewerDataAttributes({
						viewerAttributes: this.file.viewerAttrs,
						previewImageSrc: this.file.urlPreview,
						context: im_v2_const.FileViewerContext.dialog
					});
				}
				return im_v2_lib_utils.Utils.file.getViewerDataAttributes({
					viewerAttributes: {
						viewer: true,
						viewerResized: true,
						viewerType: this.file.type,
						title: this.file.name,
						src: this.file.urlDownload,
						viewerGroupBy: this.viewerGroupBy
					},
					previewImageSrc: this.file.urlPreview,
					context: im_v2_const.FileViewerContext.dialog
				});
			},
			canBeOpenedWithViewer() {
				return this.file.viewerAttrs && BX.UI?.Viewer;
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
				return [im_v2_const.FileStatus.wait, im_v2_const.FileStatus.done].includes(this.file.status);
			},
			previewSourceLink() {
				if (this.file.extension === 'gif') {
					return this.file.urlShow || this.file.urlDownload;
				}
				return this.file.urlPreview || this.file.urlShow || this.file.urlDownload;
			},
			allowLazyLoad() {
				return !this.previewSourceLink.startsWith('blob:');
			},
			withoutPreview() {
				return !main_core.Type.isStringFilled(this.previewSourceLink);
			},
			containerStyle() {
				return {
					width: `${this.size.width}px`,
					height: `${Math.min(this.size.height, MAX_HEIGHT)}px`
				};
			},
			hasImageGap() {
				const image = this.file.image;
				// a raw file has no preview dimensions yet, a document never gets them: nothing to fill
				if (!main_core.Type.isNumber(image?.width) || !main_core.Type.isNumber(image?.height)) {
					return false;
				}
				const ratio = Math.min(this.size.width / image.width, this.size.height / image.height);
				const imageWidth = image.width * ratio;
				const imageHeight = image.height * ratio;
				return Math.floor(this.size.width) > Math.floor(imageWidth) || Math.floor(this.size.height) > Math.floor(imageHeight);
			},
			useBlur() {
				return this.hasImageGap;
			},
			blurStyle() {
				return {
					backgroundImage: `url("${this.previewSourceLink}")`
				};
			},
			draggableClasses() {
				const classes = {};
				if (this.highlightDropzonePosition) {
					classes[`--dropzone-${this.highlightDropzonePosition}`] = true;
				}
				classes['--draggable'] = this.isDraggable;
				return classes;
			},
			progressbarSize() {
				if (this.size.width > 100 && this.size.height > 90) {
					return im_v2_component_elements_progressbar.ProgressBarSize.L;
				}
				return im_v2_component_elements_progressbar.ProgressBarSize.S;
			}
		},
		methods: {
			download() {
				if (this.file.progress !== 100 || this.canBeOpenedWithViewer) {
					return;
				}
				const url = this.file.urlDownload ?? this.file.urlShow;
				window.open(url, '_blank');
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			},
			onRemoveClick(event) {
				event.stopPropagation();
				this.$emit('remove', {
					file: this.file
				});
			},
			onCancelClick(event) {
				this.$emit('cancelClick', event);
			},
			onDragStart(event) {
				this.$emit('itemDragStart', {
					file: this.file,
					event
				});
				this.isDraggable = true;
			},
			onDragEnd(event) {
				this.$emit('itemDragEnd', {
					file: this.file,
					event
				});
				event.target.removeAttribute('draggable');
				this.isDraggable = false;
			},
			onDragOver(event) {
				this.$emit('itemDragOver', {
					file: this.file,
					event
				});
			},
			onDragLeave(event) {
				this.$emit('itemDragLeave', {
					file: this.file,
					event
				});
			},
			onDrop(event) {
				this.$emit('itemDrop', {
					file: this.file,
					event
				});
				this.isDraggable = false;
			},
			onMouseDown(event) {
				this.$refs.dragElement.setAttribute('draggable', 'true');
			},
			getHandleStatus() {
				if (this.isVideo) {
					return [im_v2_const.FileStatus.preparing, im_v2_const.FileStatus.progress, im_v2_const.FileStatus.upload];
				}
				return [im_v2_const.FileStatus.progress, im_v2_const.FileStatus.upload];
			},
			getStatusMap() {
				if (this.isVideo) {
					return {
						[im_v2_const.FileStatus.preparing]: {
							iconClass: ui_iconSet_api_core.Outline.CLOUD
						}
					};
				}
				return {};
			}
		},
		template: `
		<div
			v-bind="viewerAttributes"
			class="bx-im-elements-media-gallery__item"
			:class="{'--without-preview': withoutPreview, ...this.draggableClasses}"
			:role="gridNavigation ? 'gridcell' : null"
			:aria-label="gridNavigation ? file.name : null"
			:aria-keyshortcuts="gridNavigation ? 'Delete' : null"
			:aria-describedby="gridNavigation ? describedById : null"
			:data-testid="'im-media-gallery-item-' + file.id"
			:data-id="file.id"
			:tabindex="gridNavigation ? -1 : null"
			@click="download"
			:style="containerStyle"
			@dragstart="onDragStart"
			@dragend="onDragEnd"
			@dragover="onDragOver"
			@dragleave="onDragLeave"
			@drop="onDrop"
			ref="dragElement"
			draggable="false"
		>
			<div
				class="bx-im-elements-media-gallery__item-drag"
				v-if="allowSorting"
				:aria-hidden="gridNavigation ? 'true' : null"
				@mousedown="onMouseDown"
			>
				<div class="bx-im-elements-media-gallery__item-drag-icon"></div>
			</div>
			<div
				class="bx-im-elements-media-gallery__item-inner"
			>
				<img
					v-if="allowLazyLoad"
					v-lazyload
					data-lazyload-dont-hide
					:data-lazyload-src="previewSourceLink"
					:title="imageTitle"
					:alt="file.name"
					class="bx-im-elements-media-gallery__item-source"
					draggable="false"
				/>
				<img
					v-else
					:src="previewSourceLink"
					:title="imageTitle"
					:alt="file.name"
					class="bx-im-elements-media-gallery__item-source"
					draggable="false"
				/>
				<div
					v-if="useBlur"
					class="bx-im-elements-media-gallery__item-blur"
					:style="blurStyle"
				></div>
				<div v-if="isVideo && showPlayIcon" class="bx-im-elements-media-gallery__item-play">
					<div class="bx-im-elements-media-gallery__item-play-icon"></div>
				</div>
			</div>
			<IconButton
				v-if="allowRemove && gridNavigation"
				class="bx-im-elements-media-gallery__item-remove"
				data-testid="im-media-gallery-item-remove-btn"
				:iconName="removeIconName"
				:iconColor="removeIconColor"
				:iconSize="20"
				:label="removeButtonAriaLabel"
				:tabindex="-1"
				@click.stop="onRemoveClick"
			/>
			<div
				v-else-if="allowRemove"
				class="bx-im-elements-media-gallery__item-remove"
				data-testid="im-media-gallery-item-remove-btn"
				@click.stop="onRemoveClick"
			>
				<div class="bx-im-elements-media-gallery__item-remove-icon"></div>
			</div>
			<ProgressBar
				v-if="handleLoading && !isLoaded"
				:item="file"
				:size="progressbarSize"
				:handleStatus="getHandleStatus()"
				:statusMap="getStatusMap()"
				:allowCancel="allowCancel"
				@cancelClick="onCancelClick"
			/>
		</div>

	`
	};

	const RATIO_THRESHOLD = 4;
	const RATIO_FALLBACK = 3;
	const MIN_PREVIEW_WIDTH = 70;
	const MIN_PREVIEW_HEIGHT = 58;
	const FALLBACK_WIDTH = 1600;
	const FALLBACK_HEIGHT = 900;
	const FALLBACK_SIZE = {
		width: FALLBACK_WIDTH,
		height: FALLBACK_HEIGHT
	};

	// @vue/component
	const MediaGalleryRow = {
		name: 'MediaGalleryRow',
		components: {
			MediaGalleryItem
		},
		props: {
			/** @type { Array<ImModelFile> } */
			files: {
				type: Array,
				required: true
			},
			allowRemoveItem: {
				type: Boolean,
				default: false
			},
			removeItemLabel: {
				type: String,
				default: ''
			},
			allowSorting: {
				type: Boolean,
				default: false
			},
			gridNavigation: {
				type: Boolean,
				default: false
			},
			describedById: {
				type: String,
				default: null
			},
			handleLoading: {
				type: Boolean,
				default: false
			},
			allowCancelItem: {
				type: Boolean,
				default: true
			},
			width: {
				type: Number,
				required: true
			},
			spacingSize: {
				type: Number,
				default: 1
			},
			viewerGroupBy: {
				type: String || null,
				default: null
			},
			highlightDropzone: {
				type: Object,
				default: () => {
					return {};
				}
			}
		},
		emits: ['remove', 'cancelClick', 'itemDragStart', 'itemDragEnd', 'itemDragOver', 'itemDragLeave', 'itemDrop'],
		computed: {
			totalRatio() {
				return this.files.reduce((acc, file) => {
					const size = this.getSafeSize(file);
					return acc + this.getSafeRatio(size);
				}, 0);
			},
			spacing() {
				return this.files.length - 1;
			},
			availableContainerWidth() {
				return this.width - this.spacing * this.spacingSize;
			},
			sizes() {
				const height = this.availableContainerWidth / this.totalRatio;
				return this.files.map(file => {
					const size = this.getSafeSize(file);
					const width = this.getSafeRatio(size) * height;
					return {
						width: Math.max(width, MIN_PREVIEW_WIDTH),
						height: Math.max(height, MIN_PREVIEW_HEIGHT)
					};
				});
			}
		},
		methods: {
			getSafeSize(file) {
				if (main_core.Type.isNumber(file.image?.width) && main_core.Type.isNumber(file.image?.height)) {
					return {
						width: file.image?.width,
						height: file.image?.height
					};
				}
				return FALLBACK_SIZE;
			},
			getSafeRatio(size) {
				const abnormalRatio = Math.max(size.width / size.height, size.height / size.width);
				if (abnormalRatio > RATIO_THRESHOLD) {
					if (size.height > size.width) {
						return 1 / RATIO_FALLBACK;
					}
					return RATIO_FALLBACK;
				}
				return size.width / size.height;
			},
			onRemove(event) {
				this.$emit('remove', event);
			},
			onCancel(event) {
				this.$emit('cancelClick', event);
			},
			onItemDragStart(event) {
				this.$emit('itemDragStart', event);
			},
			onItemDragEnd(event) {
				this.$emit('itemDragEnd', event);
			},
			onItemDragOver(event) {
				this.$emit('itemDragOver', event);
			},
			onItemDragLeave(event) {
				this.$emit('itemDragLeave', event);
			},
			onItemDrop(event) {
				this.$emit('itemDrop', event);
			},
			getHighlightDropzonePosition(file) {
				if (file.id === this.highlightDropzone.fileId) {
					return this.highlightDropzone.position;
				}
				return null;
			}
		},
		template: `
		<div class="bx-im-elements-media-gallery__row" :role="gridNavigation ? 'row' : null">
			<MediaGalleryItem
				v-for="(file, index) in files"
				:key="file.id"
				:file="file"
				:size="sizes[index]"
				:allowRemove="allowRemoveItem"
				:removeButtonLabel="removeItemLabel"
				:allowSorting="allowSorting"
				:gridNavigation="gridNavigation"
				:describedById="describedById"
				:handleLoading="handleLoading"
				:allowCancel="allowCancelItem"
				:highlightDropzonePosition="getHighlightDropzonePosition(file)"
				viewerGroupBy="viewerGroupBy"
				@remove="onRemove"
				@cancelClick="onCancel"
				@itemDragStart="onItemDragStart"
				@itemDragEnd="onItemDragEnd"
				@itemDragOver="onItemDragOver"
				@itemDragLeave="onItemDragLeave"
				@itemDrop="onItemDrop"
			/>
		</div>
	`
	};

	const rowsLayouts = {
		1: [1],
		2: [2],
		3: [3],
		4: [2, 2],
		5: [2, 3],
		6: [2, 2, 2],
		7: [2, 3, 2],
		8: [2, 3, 3],
		9: [2, 3, 2, 2],
		10: [2, 3, 2, 3]
	};

	// @vue/component
	const MediaGallery = {
		name: 'MediaGallery',
		components: {
			MediaGalleryRow
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
			removeItemLabel: {
				type: String,
				default: ''
			},
			allowSorting: {
				type: Boolean,
				default: false
			},
			// Opt-in ARIA grid roving (row/gridcell + focusable tiles) for consumers that drive it with a
			// FocusZone. Off by default, so the feed and message builder galleries keep their plain markup.
			gridNavigation: {
				type: Boolean,
				default: false
			},
			// id of the hint about the Delete shortcut, kept by the consumer that drives the grid
			describedById: {
				type: String,
				default: null
			},
			handleLoading: {
				type: Boolean,
				default: false
			},
			// an upload nobody may stop leaves the loader of an item telling the progress and nothing more
			allowCancelItem: {
				type: Boolean,
				default: true
			},
			width: {
				type: Number,
				default: 376
			},
			viewerGroupBy: {
				type: String || null,
				default: null
			},
			highlightDropzone: {
				type: Object,
				default: () => {
					return {};
				}
			}
		},
		emits: ['removeItem', 'cancelClick', 'itemDragStart', 'itemDragEnd', 'itemDragOver', 'itemDragLeave', 'itemDrop'],
		computed: {
			rows() {
				const lengths = rowsLayouts[this.files.length];
				let cursor = 0;
				return lengths.map(rowSize => {
					const row = this.files.slice(cursor, cursor + rowSize);
					cursor += rowSize;
					return row;
				});
			}
		},
		methods: {
			onRemoveItem(event) {
				this.$emit('removeItem', event);
			},
			onCancel(event) {
				this.$emit('cancelClick', event);
			},
			onItemDragStart(event) {
				this.$emit('itemDragStart', event);
			},
			onItemDragEnd(event) {
				this.$emit('itemDragEnd', event);
			},
			onItemDragOver(event) {
				this.$emit('itemDragOver', event);
			},
			onItemDragLeave(event) {
				this.$emit('itemDragLeave', event);
			},
			onItemDrop(event) {
				this.$emit('itemDrop', event);
			}
		},
		template: `
		<div class="bx-im-elements-media-gallery" :role="gridNavigation ? 'presentation' : null">
			<MediaGalleryRow
				v-for="(row) in rows"
				:files="row"
				:allowRemoveItem="allowRemoveItem"
				:removeItemLabel="removeItemLabel"
				:allowSorting="allowSorting"
				:gridNavigation="gridNavigation"
				:describedById="describedById"
				:handleLoading="handleLoading"
				:allowCancelItem="allowCancelItem"
				:width="width"
				:highlightDropzone="highlightDropzone"
				@remove="onRemoveItem"
				@cancelClick="onCancel"
				@itemDragStart="onItemDragStart"
				@itemDragEnd="onItemDragEnd"
				@itemDragOver="onItemDragOver"
				@itemDragLeave="onItemDragLeave"
				@itemDrop="onItemDrop"
			/>
		</div>
	`
	};

	exports.MediaGallery = MediaGallery;
	exports.MediaGalleryItem = MediaGalleryItem;
	exports.MediaGalleryRow = MediaGalleryRow;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX, BX.UI.IconSet, BX.Vue3.Directives, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements);
//# sourceMappingURL=media-gallery.bundle.js.map
