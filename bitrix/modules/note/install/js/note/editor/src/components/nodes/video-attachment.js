import { sanitizeAttachmentUrl } from '../../utils/viewer-attrs';
import { AttachmentNodeViewBaseComponent } from './attachment-base';
import { ResizableMediaMixin } from './resizable-media-mixin';
import { MediaResizeControls } from './media-resize-controls';

export const VideoAttachmentNodeViewComponent = {
	extends: AttachmentNodeViewBaseComponent,
	mixins: [ResizableMediaMixin],
	components: {
		MediaResizeControls,
	},
	props: {
		defaultTypeMessage: {
			type: String,
			default: 'NOTE_EDITOR_FILE_ATTACHMENT_TYPE_VIDEO',
		},
	},
	computed: {
		videoUrl(): string
		{
			// `showUrl` is already checked by the base component, own `src` is not.
			return sanitizeAttachmentUrl(this.attrs.src) || this.showUrl || '';
		},
		// Required by ResizableMediaMixin to gate handles/overlay.
		hasMedia(): boolean
		{
			return Boolean(this.videoUrl) && !this.isUnavailable;
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-video-inner" :class="{ 'note-editor-attachment--unavailable': isUnavailable }">
			<div v-if="isUnavailable" class="note-editor-video-meta">
				<div class="note-editor-video-name">{{ unavailableMessage }}</div>
			</div>
			<template v-else>
				<div v-if="isResolving" class="note-editor-video-preview">
					<div class="note-editor-video-player note-editor-attachment-skeleton" aria-hidden="true"></div>
				</div>
				<div v-else-if="videoUrl" class="note-editor-video-attachment-preview" :class="{ 'note-editor-video-attachment-preview--resizing': dragging }">
					<video
						class="note-editor-video-player"
						:src="videoUrl"
						controls
						preload="metadata"
					></video>
					<MediaResizeControls
						:show-handles="showHandles"
						:show-overlay="showOverlay"
						:overlay-style="overlayStyle"
						:align="align"
						:align-titles="alignTitles"
						:on-start-resize="startResize"
						:on-set-align="setAlign"
						:on-replace="null"
					/>
				</div>
				<div class="note-editor-video-meta">
					<div class="note-editor-video-name">
						<span v-if="isResolving" class="note-editor-attachment-skeleton note-editor-attachment-skeleton--line" aria-hidden="true"></span>
						<template v-else>{{ fileName }}</template>
					</div>
					<div v-if="!isResolving" class="note-editor-video-extra">{{ fileType }} · {{ fileSize }}</div>
				</div>
			</template>
		</div>
	`,
};
