import { ajax, Type } from 'main.core';

const ACTION_LIST = 'note.infrastructure.RecycleBinController.list';
const ACTION_STATS = 'note.infrastructure.RecycleBinController.getStats';
const ACTION_RESTORE = 'note.infrastructure.RecycleBinController.restoreDocument';
const ACTION_RESTORE_ALL = 'note.infrastructure.RecycleBinController.restoreAll';
const ACTION_HARD_DELETE = 'note.infrastructure.RecycleBinController.hardDeleteDocument';
const ACTION_EMPTY = 'note.infrastructure.RecycleBinController.empty';

export const ORPHAN_TARGET_REQUIRED_CODE = 'NOTE_RECYCLE_BIN_ORPHAN_TARGET_REQUIRED';

export type TrashedActor = { id: number, name: string, isSystem?: boolean };

export type TrashedDocument = {
	id: number,
	documentId: number,
	title: string,
	parentId: number | null,
	collectionId: number,
	collectionTitle: string,
	orphan: boolean,
	trashedAt: string | null,
	trashedBy: TrashedActor | null,
	origin: string,
	canRestore: boolean,
	canHardDelete: boolean,
	excerpt: string,
	author: ?{ id: number, name: string, photoUrl: ?string, isSystem?: boolean },
};

export type TrashedListResult = {
	items: TrashedDocument[],
	nextCursor: ?Object,
	isAdmin: boolean,
};

export class RecycleBinServiceError extends Error
{
	code: string;

	constructor(message: string, code: string = '')
	{
		super(message);
		this.code = code;
	}
}

export class RecycleBinService
{
	async list({ limit = 50, afterCursor = null }: { limit?: number, afterCursor?: ?Object } = {}): Promise<TrashedListResult>
	{
		try
		{
			const response = await ajax.runAction(ACTION_LIST, {
				data: {
					limit,
					afterCursor: afterCursor || null,
				},
			});
			const data = response?.data ?? {};
			const documents = Array.isArray(data.items) ? data.items : [];

			return {
				items: documents.map((doc) => this.#normalizeItem(doc)),
				nextCursor: Type.isPlainObject(data.nextCursor) ? data.nextCursor : null,
				isAdmin: Boolean(data.isAdmin),
			};
		}
		catch (error)
		{
			throw this.#toServiceError(error);
		}
	}

	async restoreDocument(recycleBinId: number, targetCollectionId: ?number = null): Promise<{ documentId: number }>
	{
		try
		{
			const data = {
				recycleBinId,
			};
			if (targetCollectionId !== null && targetCollectionId !== undefined)
			{
				data.targetCollectionId = Number(targetCollectionId);
			}

			const response = await ajax.runAction(ACTION_RESTORE, { data });
			const payload = response?.data ?? {};

			return { documentId: Number(payload.documentId) || 0 };
		}
		catch (error)
		{
			throw this.#toServiceError(error);
		}
	}

	async getStats(): Promise<{ total: number, orphanCount: number }>
	{
		try
		{
			const response = await ajax.runAction(ACTION_STATS, { data: {} });
			const data = response?.data ?? {};

			return {
				total: Number(data.total) || 0,
				orphanCount: Number(data.orphanCount) || 0,
			};
		}
		catch (error)
		{
			throw this.#toServiceError(error);
		}
	}

	async restoreAll(
		{ orphanTargetCollectionId = null }: { orphanTargetCollectionId?: ?number } = {},
	): Promise<{ restoredCount: number, skippedOrphan: number }>
	{
		try
		{
			const data = {};
			if (orphanTargetCollectionId !== null && orphanTargetCollectionId !== undefined)
			{
				data.orphanTargetCollectionId = Number(orphanTargetCollectionId);
			}

			const response = await ajax.runAction(ACTION_RESTORE_ALL, { data });
			const payload = response?.data ?? {};

			return {
				restoredCount: Number(payload.restored) || 0,
				skippedOrphan: Number(payload.skippedOrphan) || 0,
			};
		}
		catch (error)
		{
			throw this.#toServiceError(error);
		}
	}

	async hardDeleteDocument(recycleBinId: number): Promise<{ documentId: number }>
	{
		try
		{
			const response = await ajax.runAction(ACTION_HARD_DELETE, {
				data: { recycleBinId },
			});
			const data = response?.data ?? {};

			return { documentId: Number(data.documentId) || 0 };
		}
		catch (error)
		{
			throw this.#toServiceError(error);
		}
	}

	async empty(): Promise<{ deletedCount: number }>
	{
		try
		{
			const response = await ajax.runAction(ACTION_EMPTY, { data: {} });
			const data = response?.data ?? {};

			return { deletedCount: Number(data.deleted) || 0 };
		}
		catch (error)
		{
			throw this.#toServiceError(error);
		}
	}

	#normalizeItem(doc: Object): TrashedDocument
	{
		return {
			id: Number(doc?.id) || 0,
			documentId: Number(doc?.documentId) || 0,
			title: String(doc?.title || ''),
			parentId: doc?.parentId == null ? null : Number(doc.parentId),
			collectionId: Number(doc?.collectionId) || 0,
			collectionTitle: String(doc?.collectionTitle || ''),
			orphan: Boolean(doc?.orphan),
			trashedAt: doc?.trashedAt ? String(doc.trashedAt) : null,
			trashedBy: Type.isPlainObject(doc?.trashedBy)
				? {
					id: Number(doc.trashedBy.id) || 0,
					name: String(doc.trashedBy.name || ''),
					isSystem: doc.trashedBy.isSystem === true,
				}
				: null,
			origin: String(doc?.origin || ''),
			canRestore: Boolean(doc?.canRestore),
			canHardDelete: Boolean(doc?.canHardDelete),
			excerpt: String(doc?.excerpt || ''),
			author: Type.isPlainObject(doc?.author)
				? {
					id: Number(doc.author.id) || 0,
					name: String(doc.author.name || ''),
					photoUrl: doc.author.photoUrl ? String(doc.author.photoUrl) : null,
					isSystem: doc.author.isSystem === true,
				}
				: null,
		};
	}

	#toServiceError(error: mixed): RecycleBinServiceError
	{
		if (Type.isPlainObject(error))
		{
			const errors = Array.isArray(error?.errors) ? error.errors : [];
			for (const item of errors)
			{
				if (!Type.isPlainObject(item))
				{
					continue;
				}

				const message = Type.isStringFilled(item.message) ? item.message : '';
				const code = Type.isStringFilled(item.code) ? item.code : '';
				if (message || code)
				{
					return new RecycleBinServiceError(message, code);
				}
			}

			if (Type.isStringFilled(error.message))
			{
				return new RecycleBinServiceError(error.message);
			}
		}

		return new RecycleBinServiceError('Recycle bin request failed');
	}
}
