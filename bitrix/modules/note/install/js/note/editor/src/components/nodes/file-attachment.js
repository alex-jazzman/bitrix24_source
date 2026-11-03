import { AttachmentNodeViewBaseComponent } from './attachment-base';
import { Type } from 'main.core';

export const FileAttachmentNodeViewComponent = {
	extends: AttachmentNodeViewBaseComponent,
	computed: {
		fileUrl(): string
		{
			return this.showUrl || this.downloadUrl;
		},
		fileViewerAttrs(): Object
		{
			// Component-owned attributes go last so node data can never override them.
			const attrs = { ...this.viewerDataAttrs };

			attrs['data-viewer'] = true;
			// What the viewer READS, as opposed to where the block points. For a file of ours the two
			// coincide; for a file on Disk the link is Disk's own HTML page, and a viewer told to read a
			// page shows the page's markup instead of the file — a `.md` opens as portal page source,
			// because Disk types it as `code` and the code viewer fetches this very url.
			const sourceUrl = this.mediaUrl || this.fileUrl;
			if (sourceUrl)
			{
				attrs['data-src'] = sourceUrl;
			}

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
		<div v-if="isDeleted" class="note-editor-file-attachment-inner note-editor-attachment--deleted">
			<div class="note-editor-file-attachment-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
			</div>
			<div class="note-editor-file-attachment-text">
				<div class="note-editor-file-attachment-name">{{ deletedMessage }}</div>
				<div v-if="restoreUrl" class="note-editor-file-attachment-extra">
					<a class="note-editor-file-attachment-restore" :href="restoreUrl" target="_blank" rel="noopener noreferrer">{{ restoreMessage }}</a>
				</div>
			</div>
		</div>
		<a
			v-else
			class="note-editor-file-attachment-inner note-editor-file-attachment-link"
			:class="{ 'note-editor-attachment--unavailable': isUnavailable }"
			v-bind="fileViewerAttrs"
			:draggable="false"
			@click="handleClick"
		>
			<div class="note-editor-file-attachment-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
			</div>
			<div class="note-editor-file-attachment-text">
				<div class="note-editor-file-attachment-name">
					<span v-if="isResolving" class="note-editor-attachment-skeleton note-editor-attachment-skeleton--line" aria-hidden="true"></span>
					<template v-else>{{ isUnavailable ? unavailableMessage : fileName }}</template>
				</div>
				<!-- Size only: the mime type says nothing the file name does not, and for an office
				document it is a line of vendor gibberish wider than the block itself. -->
				<div v-if="!isUnavailable && !isResolving" class="note-editor-file-attachment-extra">{{ fileSize }}</div>
			</div>
		</a>
	`,
};
