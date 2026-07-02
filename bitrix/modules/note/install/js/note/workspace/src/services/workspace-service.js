import { ajax, Type } from 'main.core';

const ACTION_LIST = 'note.infrastructure.DocumentController.listByCollection';
const ACTION_ARCHIVE_COLLECTION = 'note.infrastructure.CollectionController.archive';
const ACTION_DELETE_COLLECTION = 'note.infrastructure.CollectionController.delete';

export type WorkspaceDocument = {
	id: number,
	parentId: number | null,
	title: string,
	position: number,
	updatedAt: ?string,
	excerpt: string,
	author: ?{ id: number, name: string, photoUrl: ?string, isSystem?: boolean },
};

export type WorkspaceCollectionMeta = {
	id: number,
	name: string,
	position: number,
	canEditCollection: boolean,
	canManagePermissions: boolean,
	policyLevel: string,
};

export type WorkspaceListResult = {
	items: WorkspaceDocument[],
	nextCursor: ?Object,
	collection: ?WorkspaceCollectionMeta,
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
