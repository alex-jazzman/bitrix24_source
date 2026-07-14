import { AttachmentNodeViewBaseComponent } from './attachment-base';
import { Text, Type } from 'main.core';

export const ImageAttachmentNodeViewComponent = {
	extends: AttachmentNodeViewBaseComponent,
	props: {
		defaultTypeMessage: {
			type: String,
			default: 'NOTE_EDITOR_FILE_ATTACHMENT_TYPE_IMAGE',
		},
	},
	computed: {
		imageUrl(): string
		{
			return this.showUrl || this.downloadUrl;
		},
		hasImage(): boolean
		{
			return Type.isStringFilled(this.imageUrl);
		},
		imageViewerAttrs(): Object
		{
			const attrs = {};
			if (Type.isPlainObject(this.viewerAttrs))
			{
				Object.entries(this.viewerAttrs).forEach(([key, value]) => {
					const normalizedKey = String(key).startsWith('data-')
						? String(key)
						: `data-${Text.toKebabCase(key)}`
					;

					attrs[normalizedKey] = value;
				});
			}

			attrs['data-viewer'] = true;
			if (Type.isStringFilled(this.fileName))
			{
				attrs['data-title'] = this.fileName;
			}

			attrs.href = this.hasImage ? this.imageUrl : '#';
			if (this.hasImage)
			{
				attrs['data-viewer-preview'] = this.imageUrl;
			}
			attrs.target = '_blank';
			attrs.rel = 'noopener noreferrer';

			return attrs;
		},
	},
	methods: {
		handleClick(event: Event): void
		{
			if (!this.hasImage)
			{
				event.preventDefault();
			}
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-image-attachment-inner" :class="{ 'note-editor-attachment--unavailable': isUnavailable }">
			<div v-if="isUnavailable" class="note-editor-image-attachment-empty">{{ unavailableMessage }}</div>
			<div v-else-if="isResolving" class="note-editor-image-attachment-loading note-editor-attachment-skeleton" aria-hidden="true"></div>
			<div v-else class="note-editor-image-attachment-preview">
				<a
					class="note-editor-attachment-tile-link note-editor-image-attachment-link"
					v-bind="imageViewerAttrs"
					:draggable="false"
					@click="handleClick"
				>
					<img
						v-if="hasImage"
						class="note-editor-image-attachment-image"
						:src="imageUrl"
						:alt="fileName"
						loading="lazy"
						draggable="false"
					/>
					<span v-else class="note-editor-image-attachment-empty">{{ fileName }}</span>
				</a>
			</div>
		</div>
	`,
};
