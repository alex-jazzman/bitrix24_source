import { ajax, Type } from 'main.core';

type UpdateParams = {
	id: number,
	title: string,
	markdown: string,
	referencedFileIds?: number[],
	contentFormat?: string,
};

type CompactParams = {
	documentId: number,
	markdown: string,
	processedUpToId: number,
	yjsState?: string | null,
};

type FinalizeParams = {
	documentId: number,
	referencedFileIds?: number[],
};

export class DocumentService
{
	static async update(
		{ id, title, markdown, referencedFileIds = [], contentFormat = null }: UpdateParams,
	): Promise<Object>
	{
		const normalizedReferencedFileIds = Array.isArray(referencedFileIds)
			? referencedFileIds
				.map((fileId) => Number(fileId))
				.filter((fileId) => Number.isInteger(fileId) && fileId > 0)
			: []
		;

		const data = {
			id: Number(id),
			title,
			markdown: JSON.stringify(markdown),
			referencedFileIds: [...new Set(normalizedReferencedFileIds)].sort((left, right) => left - right),
		};

		if (contentFormat)
		{
			data.contentFormat = contentFormat;
		}

		return ajax.runAction('note.infrastructure.DocumentController.update', { data });
	}

	static async loadPatches(
		{ documentId }: { documentId: number },
	): Promise<Object>
	{
		return ajax.runAction('note.infrastructure.CollaborationSyncController.loadPatches', {
			data: {
				documentId: Number(documentId),
			},
		});
	}

	static async loadForCollaboration(
		{ documentId }: { documentId: number },
	): Promise<Object>
	{
		return ajax.runAction('note.infrastructure.CollaborationSyncController.loadForCollaboration', {
			data: {
				documentId: Number(documentId),
			},
		});
	}

	static async savePatch(
		{ documentId, patch, cursor = null }: { documentId: number, patch: string, cursor?: Object | null },
	): Promise<Object>
	{
		const data: Object = {
			documentId: Number(documentId),
			patch,
		};

		if (cursor !== null)
		{
			data.cursor = JSON.stringify(cursor);
		}

		return ajax.runAction('note.infrastructure.CollaborationSyncController.savePatch', {
			data,
		});
	}

	static async compact(
		{ documentId, markdown, processedUpToId, yjsState = null }: CompactParams,
	): Promise<Object>
	{
		const data: Object = {
			documentId: Number(documentId),
			markdown,
			processedUpToId: Number(processedUpToId),
		};

		if (yjsState !== null)
		{
			data.yjsState = yjsState;
		}

		return ajax.runAction('note.infrastructure.CollaborationSyncController.compact', {
			data,
		});
	}

	static async materialize(
		{ documentId, markdown, uptoId }: { documentId: number, markdown: string, uptoId: number },
	): Promise<Object>
	{
		return ajax.runAction('note.infrastructure.CollaborationSyncController.materialize', {
			data: {
				documentId: Number(documentId),
				markdown,
				uptoId: Number(uptoId),
			},
		});
	}

	/**
	 * `rebuiltFromMarkdown` states that this baseline was built from the markdown the load response had
	 * just served, not from a Y.Doc this session was already holding. It is what lets a document demoted
	 * by an out-of-band overwrite come back into the collaborative format. Sent as 1/0: the request is
	 * urlencoded, where a plain false would arrive as the string "false".
	 *
	 * `markdownChecksum` names the text that statement is about - crc32 of its UTF-8 bytes as an unsigned
	 * decimal. The server weighs it against the markdown it holds at the moment of the write and refuses
	 * the statement without it, so a claim made for a text a second overwrite has since replaced is not
	 * taken at its word. Omitted from the request when there is nothing to name, which keeps a document
	 * being created exactly as it was.
	 */
	static async saveYjsState(
		{ documentId, yjsState, rebuiltFromMarkdown = false, markdownChecksum = null }: {
			documentId: number,
			yjsState: string,
			rebuiltFromMarkdown?: boolean,
			markdownChecksum?: string | null,
		},
	): Promise<Object>
	{
		const data: Object = {
			documentId: Number(documentId),
			yjsState,
			rebuiltFromMarkdown: rebuiltFromMarkdown === true ? 1 : 0,
		};

		if (Type.isStringFilled(markdownChecksum))
		{
			data.markdownChecksum = markdownChecksum;
		}

		return ajax.runAction('note.infrastructure.CollaborationSyncController.saveYjsState', {
			data,
		});
	}

	static async sendAwareness(
		{ documentId, data }: { documentId: number, data: Object },
	): Promise<Object>
	{
		return ajax.runAction('note.infrastructure.CollaborationSyncController.sendAwareness', {
			data: {
				documentId: Number(documentId),
				awareness: JSON.stringify(data),
			},
		});
	}

	static async resolveFileUrls(
		{ documentId, fileIds }: { documentId: number, fileIds: number[] },
	): Promise<Object>
	{
		return ajax.runAction('note.infrastructure.FileController.resolveFileUrlsBatch', {
			data: {
				documentId: Number(documentId),
				fileIds,
			},
		});
	}

	static async finalizeFileSnapshot(
		{ documentId, referencedFileIds = [] }: FinalizeParams,
	): Promise<Object>
	{
		const normalizedReferencedFileIds = Array.isArray(referencedFileIds)
			? referencedFileIds
				.map((fileId) => Number(fileId))
				.filter((fileId) => Number.isInteger(fileId) && fileId > 0)
			: []
		;

		return ajax.runAction('note.infrastructure.FileController.finalizeSnapshot', {
			data: {
				documentId: Number(documentId),
				referencedFileIds: [...new Set(normalizedReferencedFileIds)].sort((left, right) => left - right),
			},
		});
	}
}
