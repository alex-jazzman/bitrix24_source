import { ajax, Type } from 'main.core';

const ACTION_LIST = 'note.infrastructure.RecycleBinController.list';
const ACTION_STATS = 'note.infrastructure.RecycleBinController.getStats';
const ACTION_RESTORE = 'note.infrastructure.RecycleBinController.restoreDocument';
const ACTION_RESTORE_ALL = 'note.infrastructure.RecycleBinController.restoreAll';
const ACTION_HARD_DELETE = 'note.infrastructure.RecycleBinController.hardDeleteDocument';
const ACTION_EMPTY = 'note.infrastructure.RecycleBinController.empty';
const ACTION_RESTORE_MANY = 'note.infrastructure.RecycleBinController.restoreMany';
const ACTION_HARD_DELETE_MANY = 'note.infrastructure.RecycleBinController.hardDeleteMany';

export const ORPHAN_TARGET_REQUIRED_CODE = 'NOTE_RECYCLE_BIN_ORPHAN_TARGET_REQUIRED';

// DTO-01: outcome of a bulk operation. On limitExceeded the counters are all zero and nothing was applied.
export type BulkOutcome = {
	processedCount: number,
	skippedCount: number,
	skippedByAccessCount: number,
	skippedOrphanCount: number,
	limitExceeded: boolean,
};

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
	// Present on the orphan double-signal: the rejection carries the partial outcome alongside the code.
	outcome: ?BulkOutcome;

	constructor(message: string, code: string = '')
	{
		super(message);
		this.code = code;
		this.outcome = null;
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

	// API-03. Ids are recycle-bin record ids, NOT document ids.
	// Orphan double-signal: when targetCollectionId is null and orphans are present the backend both
	// rejects (code ORPHAN_TARGET_REQUIRED) AND returns the partial outcome; both are surfaced on the error.
	async restoreMany(recycleBinIds: number[], targetCollectionId: ?number = null): Promise<BulkOutcome>
	{
		try
		{
			const data = { recycleBinIds: this.#normalizeIds(recycleBinIds) };
			if (targetCollectionId !== null && targetCollectionId !== undefined)
			{
				data.targetCollectionId = Number(targetCollectionId);
			}

			const response = await ajax.runAction(ACTION_RESTORE_MANY, { data });

			return this.#parseOutcome(response?.data?.outcome);
		}
		catch (error)
		{
			throw this.#toBulkError(error);
		}
	}

	// API-04
	async hardDeleteMany(recycleBinIds: number[]): Promise<BulkOutcome>
	{
		try
		{
			const response = await ajax.runAction(ACTION_HARD_DELETE_MANY, {
				data: { recycleBinIds: this.#normalizeIds(recycleBinIds) },
			});

			return this.#parseOutcome(response?.data?.outcome);
		}
		catch (error)
		{
			throw this.#toBulkError(error);
		}
	}

	#parseOutcome(raw: mixed): BulkOutcome
	{
		const outcome = Type.isPlainObject(raw) ? raw : {};

		return {
			processedCount: Number(outcome.processedCount) || 0,
			skippedCount: Number(outcome.skippedCount) || 0,
			skippedByAccessCount: Number(outcome.skippedByAccessCount) || 0,
			skippedOrphanCount: Number(outcome.skippedOrphanCount) || 0,
			limitExceeded: outcome.limitExceeded === true,
		};
	}

	#normalizeIds(ids: mixed): number[]
	{
		const source = ids instanceof Set ? [...ids] : (Array.isArray(ids) ? ids : []);

		return source.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);
	}

	#toBulkError(error: mixed): RecycleBinServiceError
	{
		const wrapped = this.#toServiceError(error);
		// Keep the partial outcome from the rejection so the orphan retry does not discard progress.
		const rawOutcome = Type.isPlainObject(error) && Type.isPlainObject(error.data)
			? error.data.outcome
			: null;
		if (Type.isPlainObject(rawOutcome))
		{
			wrapped.outcome = this.#parseOutcome(rawOutcome);
		}

		return wrapped;
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
