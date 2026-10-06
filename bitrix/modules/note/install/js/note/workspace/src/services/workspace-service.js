import { ajax, Type } from 'main.core';

const ACTION_LIST = 'note.infrastructure.DocumentController.listByCollection';
const ACTION_ARCHIVE_COLLECTION = 'note.infrastructure.CollectionController.archive';
const ACTION_DELETE_COLLECTION = 'note.infrastructure.CollectionController.delete';
const ACTION_RESOLVE_BULK = 'note.infrastructure.DocumentController.resolveBulkSelection';
const ACTION_ARCHIVE_MANY = 'note.infrastructure.DocumentController.archiveMany';
const ACTION_DELETE_MANY = 'note.infrastructure.DocumentController.deleteMany';
const ACTION_MOVE_MANY = 'note.infrastructure.DocumentController.moveMany';
const ACTION_ARCHIVE_ALL = 'note.infrastructure.DocumentController.archiveAllInCollection';
const ACTION_DELETE_ALL = 'note.infrastructure.DocumentController.deleteAllInCollection';

const SECTION_ACTIVE = 'active';

export type WorkspaceDocument = {
	id: number,
	parentId: number | null,
	title: string,
	position: number,
	updatedAt: ?string,
	excerpt: string,
	author: ?{ id: number, name: string, photoUrl: ?string, isSystem?: boolean },
	hasChildren: boolean,
};

export type WorkspaceCollectionMeta = {
	id: number,
	name: string,
	position: number,
	canEditCollection: boolean,
	canManagePermissions: boolean,
	policyLevel: string,
	hasDescription: boolean,
	mainDocumentId: number,
	subscribed: boolean,
};

export type WorkspaceListResult = {
	items: WorkspaceDocument[],
	nextCursor: ?Object,
	collection: ?WorkspaceCollectionMeta,
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
	hasNested: boolean,
};

export class WorkspaceService
{
	async list({
		collectionId,
		ownedByMe = false,
		limit = 50,
		afterCursor = null,
	}: {
		collectionId: number,
		ownedByMe?: boolean,
		limit?: number,
		afterCursor?: ?Object,
	}): Promise<WorkspaceListResult>
	{
		try
		{
			const response = await ajax.runAction(ACTION_LIST, {
				data: {
					collectionId,
					ownedByMe: ownedByMe ? 1 : 0,
					limit,
					afterCursor: afterCursor || null,
				},
			});
			const data = response?.data ?? {};
			const items = Array.isArray(data.items) ? data.items : [];

			return {
				items: items.map((doc) => ({
					id: Number(doc.id) || 0,
					parentId: doc.parentId == null ? null : Number(doc.parentId),
					title: String(doc.title || ''),
					position: Number(doc.position) || 0,
					updatedAt: doc.updatedAt ? String(doc.updatedAt) : null,
					excerpt: String(doc.excerpt || ''),
					hasChildren: doc.hasChildren === true,
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
				collection: this.#normalizeCollection(data.collection),
			};
		}
		catch (error)
		{
			const code = String(error?.errors?.[0]?.code || '');
			const wrapped = new Error(this.#extractErrorMessage(error));
			wrapped.code = code;
			throw wrapped;
		}
	}

	async archiveCollection(id: number): Promise<void>
	{
		try
		{
			await ajax.runAction(ACTION_ARCHIVE_COLLECTION, { data: { id: Number(id) } });
		}
		catch (error)
		{
			throw new Error(this.#extractErrorMessage(error));
		}
	}

	async deleteCollection(id: number): Promise<void>
	{
		try
		{
			await ajax.runAction(ACTION_DELETE_COLLECTION, { data: { id: Number(id) } });
		}
		catch (error)
		{
			throw new Error(this.#extractErrorMessage(error));
		}
	}

	// API-08 dry-run: returns the true affected volume (roots + descendants) for an explicit selection.
	async resolveBulkSelection(ids: number[], withNested: boolean): Promise<BulkResolution>
	{
		try
		{
			const response = await ajax.runAction(ACTION_RESOLVE_BULK, {
				data: {
					documentIds: this.#normalizeIds(ids),
					section: SECTION_ACTIVE,
					withNested: withNested ? 1 : 0,
				},
			});
			const data = response?.data ?? {};

			return {
				affectedCount: Number(data.affectedCount) || 0,
				limitExceeded: data.limitExceeded === true,
				hasNested: data.hasNested === true,
			};
		}
		catch (error)
		{
			throw this.#wrapError(error);
		}
	}

	// API-01
	async archiveDocuments(ids: number[], withNested: boolean): Promise<BulkOutcome>
	{
		return this.#runBulk(ACTION_ARCHIVE_MANY, {
			documentIds: this.#normalizeIds(ids),
			withNested: withNested ? 1 : 0,
		});
	}

	// API-02
	async deleteDocuments(ids: number[], withNested: boolean): Promise<BulkOutcome>
	{
		return this.#runBulk(ACTION_DELETE_MANY, {
			documentIds: this.#normalizeIds(ids),
			section: SECTION_ACTIVE,
			withNested: withNested ? 1 : 0,
		});
	}

	// API-05
	async moveDocuments(ids: number[], targetCollectionId: number, targetParentId: number | null): Promise<BulkOutcome>
	{
		return this.#runBulk(ACTION_MOVE_MANY, {
			documentIds: this.#normalizeIds(ids),
			targetCollectionId: Number(targetCollectionId),
			targetParentId: targetParentId == null ? null : Number(targetParentId),
		});
	}

	// API-06
	async archiveAllInCollection(collectionId: number): Promise<BulkOutcome>
	{
		return this.#runBulk(ACTION_ARCHIVE_ALL, { collectionId: Number(collectionId) });
	}

	// API-07
	async deleteAllInCollection(collectionId: number): Promise<BulkOutcome>
	{
		return this.#runBulk(ACTION_DELETE_ALL, { collectionId: Number(collectionId) });
	}

	async #runBulk(action: string, data: Object): Promise<BulkOutcome>
	{
		try
		{
			const response = await ajax.runAction(action, { data });
			const outcome = response?.data?.outcome ?? {};

			return {
				processedCount: Number(outcome.processedCount) || 0,
				skippedCount: Number(outcome.skippedCount) || 0,
				skippedByAccessCount: Number(outcome.skippedByAccessCount) || 0,
				skippedOrphanCount: Number(outcome.skippedOrphanCount) || 0,
				limitExceeded: outcome.limitExceeded === true,
			};
		}
		catch (error)
		{
			throw this.#wrapError(error);
		}
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

	#normalizeCollection(raw: mixed): ?WorkspaceCollectionMeta
	{
		if (!Type.isPlainObject(raw))
		{
			return null;
		}

		const id = Number(raw.id);
		if (!Number.isInteger(id) || id <= 0)
		{
			return null;
		}

		return {
			...raw,
			id,
			name: String(raw.name ?? ''),
			position: Number.isFinite(Number(raw.position)) ? Number(raw.position) : 0,
			canEditCollection: Boolean(raw.canEditCollection),
			canManagePermissions: Boolean(raw.canManagePermissions),
			policyLevel: String(raw.policyLevel ?? 'none'),
			hasDescription: Boolean(raw.hasDescription),
			mainDocumentId: Number(raw.mainDocumentId) || 0,
			subscribed: Boolean(raw.subscribed),
		};
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

		return 'Workspace list request failed';
	}
}
