import { Type } from 'main.core';
import { lazyload } from 'ui.vue3.directives.lazyload';

import { FileType, FileViewerContext } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { ImModelMessage } from 'im.v2.model';

import { ProgressBar } from './progress-bar';

import '../../css/items/gallery-item.css';

import type { ImModelFile } from 'im.v2.model';

const MAX_WIDTH = 488;
const MAX_HEIGHT = 340;
const MIN_WIDTH = 200;
const MIN_HEIGHT = 100;

// @vue/component
export const GalleryItem = {
	name: 'GalleryItem',
	directives: { lazyload },
	components: { ProgressBar },
	props:
	{
		id: {
			type: [String, Number],
			required: true,
		},
		message: {
			type: Object,
			required: true,
		},
		isGallery: {
			type: Boolean,
			default: false,
		},
		handleLoading: {
			type: Boolean,
			default: true,
		},
		removable: {
			type: Boolean,
			default: false,
		},
		previewMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['onRemoveClick'],
	computed:
	{
		messageItem(): ImModelMessage
		{
			return this.message;
		},
		file(): ImModelFile
		{
			return this.$store.getters['files/get'](this.id, true);
		},
		imageSize(): {width: string, height: string, backgroundSize: string}
		{
			if (this.isGallery)
			{
				return {};
			}

			let newWidth = this.file.image.width;
			let newHeight = this.file.image.height;

			if (this.file.image.width > MAX_WIDTH || this.file.image.height > MAX_HEIGHT)
			{
				const aspectRatio = this.file.image.width / this.file.image.height;

				if (this.file.image.width > MAX_WIDTH)
				{
					newWidth = MAX_WIDTH;
					newHeight = Math.round(MAX_WIDTH / aspectRatio);
				}

				if (newHeight > MAX_HEIGHT)
				{
					newWidth = Math.round(MAX_HEIGHT * aspectRatio);
					newHeight = MAX_HEIGHT;
				}
			}

			const sizes = {
				width: Math.max(newWidth, MIN_WIDTH),
				height: Math.max(newHeight, MIN_HEIGHT),
			};

			if (this.previewMode && sizes.width > sizes.height)
			{
				return {
					width: `${sizes.width}px`,
					'object-fit': (sizes.width < 100 || sizes.height < 100) ? 'cover' : 'contain',
				};
			}

			return {
				width: `${sizes.width}px`,
				height: `${sizes.height}px`,
				'object-fit': (sizes.width < 100 || sizes.height < 100) ? 'cover' : 'contain',
			};
		},
		viewerAttributes(): Object
		{
			return Utils.file.getViewerDataAttributes({
				viewerAttributes: this.file.viewerAttrs,
				previewImageSrc: this.sourceLink,
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
		isForward(): boolean
		{
			return Type.isStringFilled(this.messageItem.forward.id);
		},
		isVideo(): boolean
		{
			return this.file.type === FileType.video;
		},
		sourceLink(): string
		{
			return this.file.urlPreview;
		},
		allowLazyLoad(): boolean
		{
			return !this.sourceLink.startsWith('blob:');
		},
	},
	methods:
	{
		download()
		{
			if (this.file.progress !== 100 || this.canBeOpenedWithViewer)
			{
				return;
			}

			window.open(this.file.urlDownload, '_blank');
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		onRemoveClick()
		{
			this.$emit('onRemoveClick', { file: this.file });
		},
	},
	template: `
		<div
			class="bx-im-gallery-item__container" 
			:class="{'--with-forward': isForward}"
			@click="download"
			:style="imageSize"
		>
			<img
				v-if="allowLazyLoad"
				v-bind="viewerAttributes"
				v-lazyload
				data-lazyload-dont-hide
				:data-lazyload-src="sourceLink"
				:title="imageTitle"
				:alt="file.name"
				class="bx-im-gallery-item__source"
				draggable="false"
			/>
			<img
				v-else
				v-bind="viewerAttributes"
				:src="sourceLink"
				:title="imageTitle"
				:alt="file.name"
				class="bx-im-gallery-item__source"
				draggable="false"
			/>
			<ProgressBar v-if="handleLoading && !isLoaded" :item="file" :messageId="messageItem.id" :withLabels="!isGallery" />
			<div v-if="isVideo" class="bx-im-gallery-item__play-icon-container">
				<div class="bx-im-gallery-item__play-icon"></div>
			</div>
			<div v-if="removable" class="bx-im-gallery-item__remove" @click="onRemoveClick">
				<div class="bx-im-gallery-item__remove-icon"></div>
			</div>
		</div>
	`,
};
