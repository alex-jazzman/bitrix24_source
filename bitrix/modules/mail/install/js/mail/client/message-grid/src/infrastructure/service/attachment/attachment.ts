import { ajax, Type } from 'main.core';

import { type AttachmentFile, type ArchiveUrlResponse, type AttachmentListResponse } from './types';

/** The files of a message are fetched from the component of the screen: its actions answer both grids. */
const Component = 'bitrix:mail.client.message.list';

/** mirrors Bitrix\Mail\Internal\Service\Attachment\FileIcon::FALLBACK for an answer without an icon */
const FallbackIcon = 'empty';

type Transport = {
	runComponentAction<T>(
		component: string,
		action: string,
		config: { mode: 'class', data: Record<string, unknown> },
	): Promise<{ data?: T }>,
};

const transport = ajax as Transport;

function mapFile(raw: unknown): AttachmentFile
{
	const file: Record<string, unknown> = Type.isObjectLike(raw) ? raw : {};
	const { name, size, url, viewerAttrs, icon } = file;

	return {
		name: Type.isStringFilled(name) ? name : '',
		size: Type.isStringFilled(size) ? size : '',
		url: Type.isStringFilled(url) ? url : null,
		viewerAttrs: Type.isObjectLike(viewerAttrs) ? viewerAttrs : null,
		// the server resolves the icon, so the row and this window name the type of a file the same way
		icon: Type.isStringFilled(icon) ? icon : FallbackIcon,
	};
}

export const AttachmentApi = {
	async getFiles(messageId: number): Promise<AttachmentFile[]>
	{
		const response = await transport.runComponentAction<AttachmentListResponse>(
			Component,
			'getAttachments',
			{ mode: 'class', data: { messageId } },
		);

		const attachments = response.data?.attachments;

		return Type.isArray(attachments) ? attachments.map((raw: unknown): AttachmentFile => mapFile(raw)) : [];
	},

	/**
	 * An archive the server declines to build answers with `available` false and no address - the
	 * window then has nothing to offer and takes the footer down.
	 */
	async getArchiveUrl(messageId: number): Promise<ArchiveUrlResponse>
	{
		const response = await transport.runComponentAction<ArchiveUrlResponse>(
			Component,
			'getAttachmentsArchiveUrl',
			{ mode: 'class', data: { messageId } },
		);

		const data = response.data;
		const archiveUrl = data?.archiveUrl;

		return {
			available: data?.available === true,
			archiveUrl: Type.isStringFilled(archiveUrl) ? archiveUrl : null,
		};
	},
};
