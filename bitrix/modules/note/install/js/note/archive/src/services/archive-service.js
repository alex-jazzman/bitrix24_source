import { ajax, Type } from 'main.core';

const ACTION_LIST = 'note.infrastructure.DocumentController.listArchived';
const ACTION_RESTORE = 'note.infrastructure.DocumentController.restore';
const ACTION_RESTORE_ALL = 'note.infrastructure.DocumentController.restoreAll';
const ACTION_DELETE_ALL = 'note.infrastructure.DocumentController.deleteAllArchived';
const ACTION_RESOLVE_BULK = 'note.infrastructure.DocumentController.resolveBulkSelection';
const ACTION_RESTORE_MANY = 'note.infrastructure.DocumentController.restoreMany';
const ACTION_DELETE_MANY = 'note.infrastructure.DocumentController.deleteMany';

const SECTION_ARCHIVE = 'archive';

export type ArchivedDocument = {
	id: number,
	parentId: number | null,
	title: string,
	collectionId: number,
	collectionTitle: string,
	archivedAt: string | null,
	archivedBy: ?{ id: number, name: string, isSystem?: boolean },
	canRestore: boolean,
	excerpt: string,
	author: ?{ id: number, name: string, photoUrl: ?string, isSystem?: boolean },
};

export type ArchivedListResult = {
	items: ArchivedDocument[],
	nextCursor: ?Object,
};

// DTO-01: outcome of a bulk operation. On limitExceeded the counters are all zero and nothing was applied.
export type BulkOutcome = {
	processedCount: number,
	skippedCount: number,
	skippedByAccessCount: number,
	skippedOrphanCount: number,
	limitExceeded: boolean,
};

export type BulkResolution = {
	affectedCount: number,
	limitExceeded: boolean,
};

export class ArchiveService
{
	async list({ limit = 50, afterCursor = null }: { limit?: number, afterCursor?: ?Object } = {}): Promise<ArchivedListResult>
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
				items: documents.map((doc) => ({
					id: Number(doc.id) || 0,
					parentId: doc.parentId == null ? null : Number(doc.parentId),
					title: String(doc.title || ''),
					collectionId: Number(doc.collectionId) || 0,
					collectionTitle: String(doc.collectionTitle || ''),
					archivedAt: doc.archivedAt ? String(doc.archivedAt) : null,
					archivedBy: Type.isPlainObject(doc.archivedBy)
						? {
							id: Number(doc.archivedBy.id) || 0,
							name: String(doc.archivedBy.name || ''),
							isSystem: doc.archivedBy.isSystem === true,
						}
						: null,
					canRestore: Boolean(doc.canRestore),
					excerpt: String(doc.excerpt || ''),
					author: Type.isPlainObject(doc.author)
						? {
							id: Number(doc.author.id) || 0,
							name: String(doc.author.name || ''),
							photoUrl: doc.author.photoUrl ? String(doc.author.photoUrl) : null,
							isSystem: doc.author.isSystem === true,
						}
						: null,
				})),
				nextCursor: Type.isPlainObject(data.nextCursor) ? data.nextCursor : null,
			};
		}
		catch (error)
		{
			throw new Error(this.#extractErrorMessage(error));
		}
	}

	async restore(id: number): Promise<void>
	{
		try
		{
			await ajax.runAction(ACTION_RESTORE, {
				data: { id },
			});
		}
		catch (error)
		{
			throw new Error(this.#extractErrorMessage(error));
		}
	}

	async restoreAll(): Promise<{ restoredCount: number, restoredCollections: Array<Object> }>
	{
		try
		{
			const response = await ajax.runAction(ACTION_RESTORE_ALL, { data: {} });
			const data = response?.data ?? {};

			return {
				restoredCount: Number(data.restoredCount) || 0,
				restoredCollections: Array.isArray(data.restoredCollections) ? data.restoredCollections : [],
			};
		}
		catch (error)
		{
			throw new Error(this.#extractErrorMessage(error));
		}
	}

	async deleteAll(): Promise<{ deletedCount: number }>
	{
		try
		{
			const response = await ajax.runAction(ACTION_DELETE_ALL, { data: {} });
			const data = response?.data ?? {};

			return {
				deletedCount: Number(data.deletedCount) || 0,
			};
		}
		catch (error)
		{
			throw new Error(this.#extractErrorMessage(error));
		}
	}

	// API-08 dry-run: true affected volume (roots + descendants) for an explicit archive selection.
	async resolveBulkSelection(ids: number[], withNested: boolean): Promise<BulkResolution>
	{
		try
		{
			const response = await ajax.runAction(ACTION_RESOLVE_BULK, {
				data: {
					documentIds: this.#normalizeIds(ids),
					section: SECTION_ARCHIVE,
					withNested: withNested ? 1 : 0,
				},
			});
			const data = response?.data ?? {};

			return {
				affectedCount: Number(data.affectedCount) || 0,
				limitExceeded: data.limitExceeded === true,
			};
		}
		catch (error)
		{
			throw this.#wrapError(error);
		}
	}

	// API-03
	async restoreMany(ids: number[]): Promise<BulkOutcome>
	{
		return this.#runBulk(ACTION_RESTORE_MANY, {
			documentIds: this.#normalizeIds(ids),
		});
	}

	// API-02
	async deleteMany(ids: number[], withNested: boolean): Promise<BulkOutcome>
	{
		return this.#runBulk(ACTION_DELETE_MANY, {
			documentIds: this.#normalizeIds(ids),
			section: SECTION_ARCHIVE,
			withNested: withNested ? 1 : 0,
		});
	}

	async #runBulk(action: string, data: Object): Promise<BulkOutcome>
	{
		try
		{
			const response = await ajax.runAction(action, { data });

			return this.#parseOutcome(response?.data?.outcome);
		}
		catch (error)
		{
			throw this.#wrapError(error);
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

	#wrapError(error: mixed): Error
	{
		const code = String(error?.errors?.[0]?.code || error?.code || '');
		const wrapped = new Error(this.#extractErrorMessage(error));
		wrapped.code = code;

		return wrapped;
	}

	#extractErrorMessage(error: mixed): string
	{
		if (Type.isPlainObject(error))
		{
			const firstError = error?.errors?.[0]?.message;
			if (Type.isStringFilled(firstError))
			{
				return firstError;
			}
			if (Type.isStringFilled(error.message))
			{
				return error.message;
			}
		}

		return 'Archive request failed';
	}
}
