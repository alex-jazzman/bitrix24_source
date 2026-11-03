import { Type } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { lazyload } from 'ui.vue3.directives.lazyload';
import { FileType, FileViewerContext, FileStatus, Color } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { ProgressBar, ProgressBarSize } from 'im.v2.component.elements.progressbar';
import { IconButton } from 'im.v2.component.elements.icon-button';

import './css/media-gallery-item.css';

const MAX_HEIGHT = 590;

// @vue/component
export const MediaGalleryItem = {
	name: 'MediaGalleryItem',
	directives: { lazyload },
	components: { ProgressBar, IconButton },
	props: {
		/** @type ImModelFile */
		file: {
			type: Object,
			required: true,
		},
		size: {
			type: Object,
			required: true,
		},
		isGallery: {
			type: Boolean,
			default: true,
		},
		handleLoading: {
			type: Boolean,
			default: false,
		},
		allowCancel: {
			type: Boolean,
			default: true,
		},
		allowRemove: {
			type: Boolean,
			default: false,
		},
		removeButtonLabel: {
			type: String,
			default: '',
		},
		allowSorting: {
			type: Boolean,
			default: false,
		},
		gridNavigation: {
			type: Boolean,
			default: false,
		},
		// Opt-in id of the hint the consumer keeps for the Delete shortcut. Announced together with the
		// shortcut itself, so a consumer that mounts the gallery without grid navigation gets neither.
		describedById: {
			type: String,
			default: null,
		},
		viewerGroupBy: {
			type: String || null,
			default: null,
		},
		highlightDropzonePosition: {
			type: String || null,
			default: null,
		},
	},
	emits: ['remove', 'cancelClick', 'itemDragStart', 'itemDragEnd', 'itemDragOver', 'itemDragLeave', 'itemDrop'],
	data()
	{
		return {
			isDraggable: false,
			dragEvents: {},
		};
	},
	computed: {
		removeIconName: () => Outline.CROSS_L,
		removeIconColor: () => Color.white,
		removeButtonAriaLabel(): string
		{
			if (this.removeButtonLabel)
			{
				return this.removeButtonLabel.replace('#FILE_NAME#', () => this.file.name);
			}

			return this.file.name;
		},
		viewerAttributes(): Object
		{
			if (this.file.viewerAttrs)
			{
				return Utils.file.getViewerDataAttributes({
					viewerAttributes: this.file.viewerAttrs,
					previewImageSrc: this.file.urlPreview,
					context: FileViewerContext.dialog,
				});
			}

			return Utils.file.getViewerDataAttributes({
				viewerAttributes: {
					viewer: true,
					viewerResized: true,
					viewerType: this.file.type,
					title: this.file.name,
					src: this.file.urlDownload,
					viewerGroupBy: this.viewerGroupBy,
				},
				previewImageSrc: this.file.urlPreview,
				context: FileViewerContext.dialog,
			});
		},
		canBeOpenedWithViewer(): boolean
		{
			return this.file.viewerAttrs && BX.UI?.Viewer;
		},
		imageTitle(): string
		{
			const size = Utils.file.formatFileSize(this.file.size);

			return this.loc(
				'IM_ELEMENTS_MEDIA_IMAGE_TITLE',
				{
					'#NAME#': this.file.name,
					'#SIZE#': size,
				},
			);
		},
		isLoaded(): boolean
		{
			return this.file.progress === 100;
		},
		isVideo(): boolean
		{
			return this.file.type === FileType.video;
		},
		showPlayIcon(): boolean
		{
			return [FileStatus.wait, FileStatus.done].includes(this.file.status);
		},
		previewSourceLink(): string
		{
			if (this.file.extension === 'gif')
			{
				return this.file.urlShow || this.file.urlDownload;
			}

			return this.file.urlPreview || this.file.urlShow || this.file.urlDownload;
		},
		allowLazyLoad(): boolean
		{
			return !this.previewSourceLink.startsWith('blob:');
		},
		withoutPreview(): boolean
		{
			return !Type.isStringFilled(this.previewSourceLink);
		},
		containerStyle(): { width: string, height: string }
		{
			return {
				width: `${this.size.width}px`,
				height: `${Math.min(this.size.height, MAX_HEIGHT)}px`,
			};
		},
		hasImageGap(): boolean
		{
			const image = this.file.image;
			// a raw file has no preview dimensions yet, a document never gets them: nothing to fill
			if (!Type.isNumber(image?.width) || !Type.isNumber(image?.height))
			{
				return false;
			}

			const ratio: number = Math.min(
				this.size.width / image.width,
				this.size.height / image.height,
			);
			const imageWidth = image.width * ratio;
			const imageHeight = image.height * ratio;

			return (
				Math.floor(this.size.width) > Math.floor(imageWidth)
				|| Math.floor(this.size.height) > Math.floor(imageHeight)
			);
		},
		useBlur(): boolean
		{
			return this.hasImageGap;
		},
		blurStyle(): any
		{
			return {
				backgroundImage: `url("${this.previewSourceLink}")`,
			};
		},
		draggableClasses(): { [key: string]: boolean }
		{
			const classes = {};

			if (this.highlightDropzonePosition)
			{
				classes[`--dropzone-${this.highlightDropzonePosition}`] = true;
			}

			classes['--draggable'] = this.isDraggable;

			return classes;
		},
		progressbarSize(): any
		{
			if (this.size.width > 100 && this.size.height > 90)
			{
				return ProgressBarSize.L;
			}

			return ProgressBarSize.S;
		},
	},
	methods: {
		download()
		{
			if (this.file.progress !== 100 || this.canBeOpenedWithViewer)
			{
				return;
			}

			const url = this.file.urlDownload ?? this.file.urlShow;
			window.open(url, '_blank');
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		onRemoveClick(event)
		{
			event.stopPropagation();
			this.$emit('remove', { file: this.file });
		},
		onCancelClick(event)
		{
			this.$emit('cancelClick', event);
		},
		onDragStart(event)
		{
			this.$emit('itemDragStart', { file: this.file, event });

			this.isDraggable = true;
		},
		onDragEnd(event)
		{
			this.$emit('itemDragEnd', { file: this.file, event });
			event.target.removeAttribute('draggable');
			this.isDraggable = false;
		},
		onDragOver(event)
		{
			this.$emit('itemDragOver', { file: this.file, event });
		},
		onDragLeave(event)
		{
			this.$emit('itemDragLeave', { file: this.file, event });
		},
		onDrop(event)
		{
			this.$emit('itemDrop', { file: this.file, event });

			this.isDraggable = false;
		},
		onMouseDown(event)
		{
			this.$refs.dragElement.setAttribute('draggable', 'true');
		},
		getHandleStatus(): Array<string>
		{
			if (this.isVideo)
			{
				return [
					FileStatus.preparing,
					FileStatus.progress,
					FileStatus.upload,
				];
			}

			return [
				FileStatus.progress,
				FileStatus.upload,
			];
		},
		getStatusMap(): { [key: string]: { iconClass?: string, labelText?: string } }
		{
			if (this.isVideo)
			{
				return {
					[FileStatus.preparing]: {
						iconClass: Outline.CLOUD,
					},
				};
			}

			return {};
		},
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

	`,
};
