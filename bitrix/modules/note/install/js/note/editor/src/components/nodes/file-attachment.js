import { AttachmentNodeViewBaseComponent } from './attachment-base';
import { Text, Type } from 'main.core';

export const FileAttachmentNodeViewComponent = {
	extends: AttachmentNodeViewBaseComponent,
	computed: {
		fileUrl(): string
		{
			return this.showUrl || this.downloadUrl;
		},
		fileViewerAttrs(): Object
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

			attrs.href = this.fileUrl || '#';
			attrs.target = '_blank';
			attrs.rel = 'noopener noreferrer';

			return attrs;
		},
	},
	methods: {
		handleClick(event: Event): void
		{
			if (!this.fileUrl)
			{
				event.preventDefault();
			}
		},
	},
	// language=Vue
	template: `
		<a
			class="note-editor-file-attachment-inner note-editor-file-attachment-link"
			v-bind="fileViewerAttrs"
			:draggable="false"
			@click="handleClick"
		>
			<div class="note-editor-file-attachment-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
			</div>
			<div class="note-editor-file-attachment-text">
				<div class="note-editor-file-attachment-name">{{ fileName }}</div>
				<div class="note-editor-file-attachment-extra">{{ fileType }} · {{ fileSize }}</div>
			</div>
		</a>
	`,
};
