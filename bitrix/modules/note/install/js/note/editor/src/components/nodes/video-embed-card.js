import { Loc, Type } from 'main.core';
import { AttachmentNodeViewBaseComponent } from './attachment-base';
import { ResizableMediaMixin } from './resizable-media-mixin';
import { MediaResizeControls } from './media-resize-controls';
import { isAllowedEmbedSrc } from '../../extensions/attachments/video-embed-parser';

// Iframe permissions mirror video-embed.js (kept in sync). No `sandbox`: the player-host whitelist
// checked on the src being framed is the security boundary, and players need scripts + same-origin.
const IFRAME_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';

// Node-view component for the external video embed. Reuses the shared resize/align machinery
// (ResizableMediaMixin + MediaResizeControls) so the player resizes and floats exactly like an image.
export const VideoEmbedNodeViewComponent = {
	extends: AttachmentNodeViewBaseComponent,
	mixins: [ResizableMediaMixin],
	components: {
		MediaResizeControls,
	},
	data(): Object
	{
		return {
			iframeAllow: IFRAME_ALLOW,
		};
	},
	computed: {
		embedSrc(): string
		{
			// A collaborative patch can carry any attrs into the node, so the whitelist has to hold
			// here, where the iframe is built, not only where the src was resolved.
			return isAllowedEmbedSrc(this.attrs.src) ? this.attrs.src : '';
		},
		// Required by ResizableMediaMixin to gate handles/overlay.
		hasMedia(): boolean
		{
			return Type.isStringFilled(this.embedSrc);
		},
		// A frame with no name of its own is announced as just "frame", and a document with
		// several videos in it gives no way to tell them apart.
		frameTitle(): string
		{
			return Loc.getMessage('NOTE_EDITOR_VIDEO_EMBED_FRAME');
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-video-embed-inner">
			<div
				class="note-editor-video-embed-preview"
				:class="{ 'note-editor-video-embed-preview--resizing': dragging }"
			>
				<div class="note-editor-video-embed__frame">
					<iframe
						v-if="hasMedia"
						class="note-editor-video-embed__iframe"
						:src="embedSrc"
						:title="frameTitle"
						frameborder="0"
						:allow="iframeAllow"
						allowfullscreen="true"
						loading="lazy"
						referrerpolicy="strict-origin-when-cross-origin"
					></iframe>
				</div>
				<!-- Cross-origin iframes swallow clicks, so without this shield the node can't be
					 selected (to resize/align) by clicking the video. Shown only while editing and
					 unselected; once selected it's removed so the player becomes interactive. -->
				<div
					v-if="editable && !selected"
					class="note-editor-video-embed__shield"
				></div>
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
		</div>
	`,
};
