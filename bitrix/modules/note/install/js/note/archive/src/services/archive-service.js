import { ajax, Type } from 'main.core';

const ACTION_LIST = 'note.infrastructure.DocumentController.listArchived';
const ACTION_RESTORE = 'note.infrastructure.DocumentController.restore';
const ACTION_RESTORE_ALL = 'note.infrastructure.DocumentController.restoreAll';
const ACTION_DELETE_ALL = 'note.infrastructure.DocumentController.deleteAllArchived';

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
