import type { ImModelFile } from 'im.v2.model';

import { MediaItem } from './media-item';

import './css/media-gallery.css';

type GalleryStyles = {
	gridTemplateRows: string,
};

// @vue/component
export const MediaGallery = {
	name: 'MediaGallery',
	components: { MediaItem },
	props: {
		files: {
			type: Array,
			required: true,
		},
		allowRemoveItem: {
			type: Boolean,
			default: false,
		},
		handleLoading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['removeItem', 'cancelClick'],
	computed: {
		firstFile(): ImModelFile
		{
			return this.files[0];
		},
		filesCount(): number
		{
			return this.files.length;
		},
		isGallery(): boolean
		{
			return this.filesCount > 1;
		},
		isSingleFile(): boolean
		{
			return this.filesCount === 1;
		},
		isError(): boolean
		{
			return this.filesCount === 0;
		},
		templateRows(): string
		{
			if (this.filesCount >= 7)
			{
				return '140px 80px 80px 58px';
			}

			if (this.filesCount >= 3)
			{
				return '140px 80px 80px';
			}

			return '140px 80px';
		},
		galleryStyles(): GalleryStyles
		{
			return {
				gridTemplateRows: this.templateRows,
			};
		},
	},
	methods: {
		onRemoveItem(event: { file: ImModelFile })
		{
			this.$emit('removeItem', event);
		},
		onCancel(event: { file: ImModelFile })
		{
			this.$emit('cancelClick', event);
		},
		getMediaItemStyles(index: number): { [key: string]: string }
		{
			const spanValues = {
				10: ['1-4', '1-1', '1-2', '1-1', '1-1', '1-2', '1-1', '1-1', '1-2', '1-1'],
				9: ['1-4', '1-1', '1-2', '1-1', '1-2', '1-2', '1-1', '1-2', '1-1'],
				8: ['1-4', '1-2', '1-2', '1-1', '1-2', '1-1', '1-2', '1-2'],
				7: ['1-4', '1-2', '1-2', '1-2', '1-2', '1-2', '1-2'],
				6: ['1-4', '1-2', '1-2', '1-1', '1-2', '1-1'],
				5: ['1-4', '1-2', '1-2', '1-2', '1-2'],
				4: ['2-4', '1-1', '1-2', '1-1'],
				3: ['2-4', '1-2', '1-2'],
				2: ['2-2', '2-2'],
			};

			const spanValue = spanValues[this.filesCount]?.[index] ?? '1-1';
			const [rowSpan, colSpan] = spanValue.split('-');

			return {
				'grid-row-end': `span ${rowSpan}`,
				'grid-column-end': `span ${colSpan}`,
			};
		},
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
	`,
};
