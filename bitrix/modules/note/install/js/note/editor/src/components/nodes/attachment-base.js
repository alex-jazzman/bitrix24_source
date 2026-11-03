import { Loc } from 'main.core';
import { normalizeFileSize } from '../../utils/file-size';
import { buildViewerDataAttrs, sanitizeAttachmentUrl } from '../../utils/viewer-attrs';

export const AttachmentNodeViewBaseComponent = {
	props: {
		attrs: {
			type: Object,
			required: true,
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
		// Where an <img>/<video> may read the bytes from, as opposed to where the block points.
		// For a file of ours the two coincide, so the show url stands in when there is no inline one.
		// For a file on Disk they do not: `showUrl` is Disk's HTML page for the file and its download
		// url is served as an attachment, so neither may stand in — a player pointed at a page is an
		// empty player. Only `inlineUrl` serves bytes there, and a Disk file without one has nothing
		// to show at all.
		mediaUrl(): string
		{
			const inlineUrl = sanitizeAttachmentUrl(this.attrs.inlineUrl);
			if (this.diskObjectId !== null)
			{
				return inlineUrl || '';
			}

			return inlineUrl || this.showUrl || this.downloadUrl;
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
		// Disk attachment: the object id the token carries, filled instead of fileId.
		diskObjectId(): number | null
		{
			const value = Number(this.attrs.diskObjectId);

			return Number.isInteger(value) && value > 0 ? value : null;
		},
		// A Disk attachment whose file sits in Disk's trash can. The block stays where it is — the
		// document must not reshape itself because somebody deleted a file elsewhere.
		isDeleted(): boolean
		{
			return Boolean(this.attrs.deleted);
		},
		// The restore action appears only when the server said this reader may restore it, and it
		// leads into Disk's trash can: the module performs no restore of its own.
		restoreUrl(): string
		{
			return this.attrs.canRestore === true
				? (sanitizeAttachmentUrl(this.attrs.restoreUrl) || '')
				: ''
			;
		},
		// An id present but no URL yet and not flagged failed: the resolver is in flight.
		// Render a skeleton instead of the "Untitled" name fallback during this window.
		isResolving(): boolean
		{
			return (this.fileId !== null || this.diskObjectId !== null)
				&& !this.showUrl
				&& !this.downloadUrl
				&& !this.isUnavailable
			;
		},
		unavailableMessage(): string
		{
			return Loc.getMessage('NOTE_EDITOR_FILE_ATTACHMENT_UNAVAILABLE');
		},
		deletedMessage(): string
		{
			return Loc.getMessage('NOTE_EDITOR_FILE_ATTACHMENT_DELETED');
		},
		restoreMessage(): string
		{
			return Loc.getMessage('NOTE_EDITOR_FILE_ATTACHMENT_RESTORE');
		},
	},
};
