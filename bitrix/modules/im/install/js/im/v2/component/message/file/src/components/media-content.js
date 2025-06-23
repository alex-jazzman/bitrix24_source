import { MessageStatus } from 'im.v2.component.message.elements';
import { MediaGallery } from 'im.v2.component.elements.media-gallery';
import { FileType } from 'im.v2.const';

import { VideoItem } from './items/video';

import '../css/items/media-content.css';

import type { ImModelMessage, ImModelFile } from 'im.v2.model';

// @vue/component
export const MediaContent = {
	name: 'MediaContent',
	components: { VideoItem, MessageStatus, MediaGallery },
	props: {
		item: {
			type: Object,
			required: true,
		},
	},
	emits: ['cancelClick'],
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		files(): Array<ImModelFile>
		{
			return this.message.files.map((fileId) => {
				return this.$store.getters['files/get'](fileId);
			});
		},
		filesCount(): number
		{
			return this.files.length;
		},
		firstFile(): ?ImModelFile
		{
			return this.files[0];
		},
		firstFileId(): ?ImModelFile['id']
		{
			return this.firstFile?.id;
		},
		hasText(): boolean
		{
			return this.message.text.length > 0;
		},
		hasAttach(): boolean
		{
			return this.message.attach.length > 0;
		},
		onlyMedia(): boolean
		{
			return !this.hasText && !this.hasAttach;
		},
		isSingleVideo(): boolean
		{
			return (
				this.filesCount === 1
				&& this.firstFile.type === FileType.video
			);
		},
	},
	methods: {
		onCancel(event)
		{
			this.$emit('cancelClick', event);
		},
	},
	template: `
		<div class="bx-im-message-media-content__container">
			<div v-if="isSingleVideo" class="bx-im-message-media-content__single-video">
				<VideoItem
					:id="firstFileId"
					:message="message"
					@cancelClick="onCancel"
				/>
			</div>
			<div v-else class="bx-im-message-media-content__gallery">
				<MediaGallery
					:files="files"
					:handleLoading="true"
					@cancelClick="onCancel"
				/>
			</div>
			<div v-if="onlyMedia" class="bx-im-message-media-content__status-container">
				<MessageStatus :item="message" :isOverlay="true" />
			</div>
		</div>
	`,
};
