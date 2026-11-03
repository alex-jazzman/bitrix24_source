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
	computed: {
		videoUrl(): string
		{
			// `mediaUrl` is already checked by the base component, own `src` is not. A Disk video has
			// no `src` of its own and plays through `mediaUrl`; when Disk offers no source for the file
			// the block shows its meta without a player rather than an empty one.
			return sanitizeAttachmentUrl(this.attrs.src) || this.mediaUrl || '';
		},
		// Required by ResizableMediaMixin to gate handles/overlay.
		hasMedia(): boolean
		{
			return Boolean(this.videoUrl) && !this.isUnavailable;
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-video-inner" :class="{ 'note-editor-attachment--unavailable': isUnavailable, 'note-editor-attachment--deleted': isDeleted }">
			<div v-if="isDeleted" class="note-editor-video-meta">
				<div class="note-editor-video-name">{{ deletedMessage }}</div>
				<a v-if="restoreUrl" class="note-editor-file-attachment-restore" :href="restoreUrl" target="_blank" rel="noopener noreferrer">{{ restoreMessage }}</a>
			</div>
			<div v-else-if="isUnavailable" class="note-editor-video-meta">
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
					<!-- Size only, as under a file: the mime type repeats the extension in the name. -->
					<div v-if="!isResolving" class="note-editor-video-extra">{{ fileSize }}</div>
				</div>
			</template>
		</div>
	`,
};
