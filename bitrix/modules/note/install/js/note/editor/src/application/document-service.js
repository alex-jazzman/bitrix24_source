import { ajax } from 'main.core';

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

	static async saveYjsState(
		{ documentId, yjsState }: { documentId: number, yjsState: string },
	): Promise<Object>
	{
		return ajax.runAction('note.infrastructure.CollaborationSyncController.saveYjsState', {
			data: {
				documentId: Number(documentId),
				yjsState,
			},
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
