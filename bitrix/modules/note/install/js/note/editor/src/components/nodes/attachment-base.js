import { Loc } from 'main.core';
import { normalizeFileSize } from '../../utils/file-size';
import { buildViewerDataAttrs, sanitizeAttachmentUrl } from '../../utils/viewer-attrs';

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
		editable: {
			type: Boolean,
			default: false,
		},
		selected: {
			type: Boolean,
			default: false,
		},
		onResize: {
			type: Function,
			default: null,
		},
		onResizeActive: {
			type: Function,
			default: null,
		},
		onResizeProgress: {
			type: Function,
			default: null,
		},
		onAlign: {
			type: Function,
			default: null,
		},
		onReplace: {
			type: Function,
			default: null,
		},
	},
	computed: {
		width(): number | null
		{
			const value = Number(this.attrs.width);

			return Number.isFinite(value) && value > 0 ? value : null;
		},
		align(): string
		{
			const value = this.attrs.align;

			return (value === 'left' || value === 'right') ? value : 'center';
		},
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
		// An url that fails the check degrades to '' — the same value these properties already
		// return when the attribute is missing, so the existing "no url" branches take over.
		downloadUrl(): string
		{
			return sanitizeAttachmentUrl(this.attrs.downloadUrl) || '';
		},
		showUrl(): string
		{
			return sanitizeAttachmentUrl(this.attrs.showUrl) || '';
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
		// Single filtering point for viewer attributes: descendants must never read
		// `attrs.viewerAttrs` directly, it is author-controlled document data.
		viewerDataAttrs(): Object
		{
			return buildViewerDataAttrs(this.attrs.viewerAttrs);
		},
		isUnavailable(): boolean
		{
			return Boolean(this.attrs.unavailable);
		},
		// fileId present but no URL yet and not flagged failed: the resolver is in flight.
		// Render a skeleton instead of the "Untitled" name fallback during this window.
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
