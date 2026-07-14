import { MediaGallery } from 'im.v2.component.elements.media-gallery';
import { type ImModelFile } from 'im.v2.model';
import { type GalleryBlockType } from 'im.v2.const';

import { BaseBlock } from '../base/base';

import './gallery.css';

// @vue/component
export const GalleryBlock = {
	name: 'GalleryBlock',
	components: { BaseBlock, MediaGallery },
	props: {
		message: {
			type: Object,
			required: true,
		},
		block: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		galleryBlock(): GalleryBlockType
		{
			return this.block;
		},
		mediaFiles(): ImModelFile[]
		{
			return this.galleryBlock.fileIds.map((fileId) => {
				return this.$store.getters['files/get'](fileId);
			}).filter((file): boolean => {
				return file !== null;
			});
		},
		hasMediaFiles(): boolean
		{
			return this.mediaFiles.length > 0;
		},
	},
	template: `
		<BaseBlock
			v-if="hasMediaFiles"
			:message="message"
			:block="galleryBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-gallery-card__container">
				<MediaGallery
					:files="mediaFiles"
					:viewerGroupBy="galleryBlock.id"
				/>
			</div>
		</BaseBlock>
	`,
};
