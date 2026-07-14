import { Loc, Type } from 'main.core';
import { normalizeFileSize } from '../../utils/file-size';

export const AttachmentNodeViewBaseComponent = {
	props: {
		attrs: {
			type: Object,
			required: true,
		},
		defaultTypeMessage: {
			type: String,
			default: 'NOTE_EDITOR_FILE_ATTACHMENT_TYPE_FILE',
		},
	},
	computed: {
		fileName(): string
		{
			return this.attrs.name || Loc.getMessage('NOTE_EDITOR_FILE_ATTACHMENT_UNTITLED');
		},
		fileType(): string
		{
			return this.attrs.mimeType || Loc.getMessage(this.defaultTypeMessage);
		},
		fileSize(): string
		{
			return normalizeFileSize(this.attrs.size);
		},
		downloadUrl(): string
		{
			return this.attrs.downloadUrl || '';
		},
		showUrl(): string
		{
			return this.attrs.showUrl || '';
		},
		fileId(): number | null
		{
			const value = Number(this.attrs.fileId);

			return Number.isInteger(value) && value > 0 ? value : null;
		},
		documentId(): number | null
		{
			const value = Number(this.attrs.documentId);

			return Number.isInteger(value) && value > 0 ? value : null;
		},
		viewerAttrs(): Object
		{
			return Type.isPlainObject(this.attrs.viewerAttrs)
				? this.attrs.viewerAttrs
				: {}
			;
		},
		isUnavailable(): boolean
		{
			return Boolean(this.attrs.unavailable);
		},
		// fileId present but no URL yet and not flagged failed: the resolver is in flight.
		// Render a skeleton instead of the "Без названия" name fallback during this window.
		isResolving(): boolean
		{
			return this.fileId !== null && !this.showUrl && !this.downloadUrl && !this.isUnavailable;
		},
		unavailableMessage(): string
		{
			return Loc.getMessage('NOTE_EDITOR_FILE_ATTACHMENT_UNAVAILABLE');
		},
	},
};
