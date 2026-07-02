import { Type } from 'main.core';
import { DocumentService } from '../application/document-service';

/* eslint-disable no-param-reassign */

export function collectReferencedFileIdsFromContent(content: Object): number[]
{
	const fileIds = [];

	const collectFromNode = (node) => {
		if (!Type.isPlainObject(node))
		{
			return;
		}

		const attrs = Type.isPlainObject(node.attrs) ? node.attrs : {};
		const fileId = Number(attrs.fileId);
		if (Number.isInteger(fileId) && fileId > 0)
		{
			fileIds.push(fileId);
		}

		const childNodes = Array.isArray(node.content) ? node.content : [];
		for (const childNode of childNodes)
		{
			collectFromNode(childNode);
		}
	};

	collectFromNode(content);

	return [...new Set(
		fileIds.filter((id) => Number.isInteger(id) && id > 0),
	)].sort((left, right) => left - right);
}

export async function persistDocument({ documentId, title, markdown }: {
	documentId: number,
	title: string,
	markdown: Object,
}): Promise<void>
{
	const referencedFileIds = collectReferencedFileIdsFromContent(markdown);

	await DocumentService.update({
		id: documentId,
		title,
		markdown,
		referencedFileIds,
		contentFormat: 'json',
	});
}

export async function saveDocument({ documentId, title, markdown, state }: {
	documentId: number,
	title: string,
	markdown: Object,
	state: Object,
}): Promise<void>
{
	await persistDocument({ documentId, title, markdown });
	state.title = title;
	state.titleDraft = title;
}

export async function finalizeFileSnapshot(documentId: number, referencedFileIds: number[]): Promise<void>
{
	if (!Number.isInteger(documentId) || documentId <= 0)
	{
		return;
	}

	try
	{
		await DocumentService.finalizeFileSnapshot({
			documentId,
			referencedFileIds,
		});
	}
	catch
	{
		// Best-effort cleanup: do not block cancel flow if snapshot finalize fails.
	}
}
