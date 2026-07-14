import { AttachmentNodeViewBaseComponent } from './attachment-base';

export const VideoAttachmentNodeViewComponent = {
	extends: AttachmentNodeViewBaseComponent,
	props: {
		defaultTypeMessage: {
			type: String,
			default: 'NOTE_EDITOR_FILE_ATTACHMENT_TYPE_VIDEO',
		},
	},
	computed: {
		videoUrl(): string
		{
			return this.attrs.src || this.showUrl || '';
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-video-inner" :class="{ 'note-editor-attachment--unavailable': isUnavailable }">
			<div v-if="videoUrl && !isUnavailable" class="note-editor-video-preview">
				<video
					class="note-editor-video-player"
					:src="videoUrl"
					controls
					preload="metadata"
				></video>
			</div>
			<div class="note-editor-video-meta">
				<div class="note-editor-video-name">
					<span v-if="isResolving" class="note-editor-attachment-skeleton note-editor-attachment-skeleton--line" aria-hidden="true"></span>
					<template v-else>{{ isUnavailable ? unavailableMessage : fileName }}</template>
				</div>
				<div v-if="!isUnavailable && !isResolving" class="note-editor-video-extra">{{ fileType }} · {{ fileSize }}</div>
			</div>
		</div>
	`,
};
