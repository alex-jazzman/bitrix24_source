/**
 * One file of a message, in the shape the window of the files draws it. The attributes of the viewer
 * come from the server ready to be hung on a node - nothing here builds them.
 */
export type AttachmentFile = {
	name: string,
	/** Formatted by the server; nothing here counts bytes. */
	size: string,
	/** `null` for a file that is no longer downloadable: it is listed, not linked. */
	url: string | null,
	viewerAttrs: Record<string, unknown> | null,
	icon: string,
};

export type AttachmentListResponse = {
	attachments: unknown[],
};

export type ArchiveUrlResponse = {
	available: boolean,
	archiveUrl: string | null,
};
