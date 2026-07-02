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
	},
};
