import { ajax, Type } from 'main.core';

const ACTION_LIST = 'note.infrastructure.DocumentController.listSharedWithMe';

export type SharedDocument = {
	id: number,
	parentId: number | null,
	title: string,
	position: number,
	updatedAt: ?string,
	hasChildren: boolean,
	excerpt: string,
	author: ?{ id: number, name: string, photoUrl: ?string, isSystem?: boolean },
};

export type SharedListResult = {
	items: SharedDocument[],
	nextCursor: ?Object,
};

export class SharedService
{
	async list({ limit = 50, afterCursor = null }: { limit?: number, afterCursor?: ?Object } = {}): Promise<SharedListResult>
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
			const documents = Array.isArray(data.documents) ? data.documents : [];

			return {
				items: documents.map((doc) => ({
					id: Number(doc.id) || 0,
					parentId: doc.parentId == null ? null : Number(doc.parentId),
					title: String(doc.title || ''),
					position: Number(doc.position) || 0,
					updatedAt: doc.updatedAt ? String(doc.updatedAt) : null,
					hasChildren: Boolean(doc.hasChildren),
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

		return 'Shared list request failed';
	}
}
