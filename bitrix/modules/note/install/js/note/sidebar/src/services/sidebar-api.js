import { Type } from 'main.core';
import type { Collection, SidebarDocument, GlobalPermissions } from '../type';

const PAGE_SIZE = 50;

type CollectionCursor = { position: number, id: number };
type ListCollectionsParams = { limit?: number, cursor?: CollectionCursor | null };
type ListCollectionsResult = {
	items: Collection[],
	hasNextPage: boolean,
	nextCursor: CollectionCursor | null,
	permissions: GlobalPermissions | null,
};

type RawCollectionListResponse = {
	items: Object[],
	nextCursor?: Object | null,
	permissions?: Object,
};

type RawDocumentListResponse = {
	documents: Object[],
	nextOffset?: number,
};

type RawDocumentResponse = {
	id?: number | string,
	collectionId?: number | string,
	parentId?: number | string | null,
	title?: string,
	position?: number | string,
	hasChildren?: boolean,
	isArchived?: boolean,
};

type RawCollectionResponse = {
	id?: number | string,
	name?: string,
	position?: number | string,
	canEditCollection?: boolean,
	canManagePermissions?: boolean,
};

type ApiClient = {
	run(action: string, data?: Object): Promise<mixed>,
};

export class SidebarApi
{
	#client: ApiClient;

	constructor(client: ApiClient)
	{
		this.#client = client;
	}

	async listCollections(
		{ limit = PAGE_SIZE, cursor = null }: ListCollectionsParams = {},
	): Promise<ListCollectionsResult>
	{
		const params: Object = { limit };
		if (cursor !== null && Type.isPlainObject(cursor))
		{
			params.afterPosition = cursor.position;
			params.afterId = cursor.id;
		}

		const data: RawCollectionListResponse = await this.#client.run('note.infrastructure.CollectionController.list', params);
		if (!Type.isPlainObject(data) || !Array.isArray(data.items))
		{
			return { items: [], hasNextPage: false, nextCursor: null, permissions: null };
		}

		const normalizedItems = data.items
			.map((item) => this.#normalizeCollection(item))
			.filter((item) => item !== null)
		;

		const nextCursor = Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;

		return {
			items: normalizedItems,
			hasNextPage: nextCursor !== null,
			nextCursor,
			permissions: this.#normalizeGlobalPermissions(data.permissions),
		};
	}

	async listDocumentsByParent(
		collectionId: number,
		parentId: number | null = null,
		{ limit = PAGE_SIZE, cursor = null }: { limit?: number, cursor?: Object | null } = {},
	): Promise<{ items: SidebarDocument[], hasNextPage: boolean, nextCursor: Object | null }>
	{
		try
		{
			const params: Object = {
				collectionId,
				parentId,
				limit,
			};
			if (cursor !== null && Type.isPlainObject(cursor))
			{
				params.afterPosition = cursor.position;
				params.afterId = cursor.id;
			}

			const data: RawDocumentListResponse = await this.#client.run('note.infrastructure.DocumentController.listByParent', params);

			if (!Type.isPlainObject(data) || !Array.isArray(data.documents))
			{
				throw new TypeError('Invalid listByParent response');
			}

			const nextCursor = Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;

			return {
				items: data.documents
					.map((item) => this.#normalizeDocument(item))
					.filter((item) => item !== null),
				hasNextPage: nextCursor !== null,
				nextCursor,
			};
		}
		catch
		{
			const allDocs = await this.#loadParentFromTree(collectionId, parentId);

			return {
				items: allDocs,
				hasNextPage: false,
				nextCursor: null,
			};
		}
	}

	async createCollection(name: string): Promise<Collection>
	{
		const data: RawCollectionResponse = await this.#client.run('note.infrastructure.CollectionController.create', { name, position: 0 });
		const normalized = this.#normalizeCollection(data);
		if (normalized)
		{
			return normalized;
		}

		const id = this.#toPositiveInt(data?.id);

		return {
			id: id ?? 0,
			name: String(name || ''),
			position: 0,
		};
	}

	updateCollection(id: number, name: string): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.CollectionController.update', { id, name });
	}

	deleteCollection(id: number): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.CollectionController.delete', { id });
	}

	archiveCollection(id: number): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.CollectionController.archive', { id });
	}

	async getMyCollectionAccess(id: number): Promise<{
		collectionId: number,
		level: string,
		policyLevel: string,
		canEditCollection: boolean,
		canManagePermissions: boolean,
	} | null>
	{
		const data: mixed = await this.#client.run('note.infrastructure.CollectionController.getMyAccess', { id });
		if (!Type.isPlainObject(data))
		{
			return null;
		}

		return {
			collectionId: Number(data.collectionId) || id,
			level: typeof data.level === 'string' ? data.level : 'none',
			policyLevel: typeof data.policyLevel === 'string' ? data.policyLevel : 'none',
			canEditCollection: Boolean(data.canEditCollection),
			canManagePermissions: Boolean(data.canManagePermissions),
		};
	}

	async moveCollection(
		id: number,
		position: number | null,
	): Promise<{ position: number | null, affectedPositions: { id: number, position: number }[] }>
	{
		const data: mixed = await this.#client.run('note.infrastructure.CollectionController.move', { id, position });
		if (!Type.isPlainObject(data))
		{
			return { position: null, affectedPositions: [] };
		}

		const rawList = Array.isArray(data.affectedPositions) ? data.affectedPositions : [];
		const affectedPositions = [];
		for (const entry of rawList)
		{
			if (!Type.isPlainObject(entry))
			{
				continue;
			}
			const entryId = this.#toPositiveInt(entry.id);
			const entryPosition = this.#toInt(entry.position);
			if (entryId === null || entryPosition === null)
			{
				continue;
			}
			affectedPositions.push({ id: entryId, position: entryPosition });
		}

		return {
			position: this.#toInt(data.position),
			affectedPositions,
		};
	}

	async listManageableCollections(limit: number = 2): Promise<{ items: { id: number, name: string }[], hasMore: boolean }>
	{
		const data: mixed = await this.#client.run(
			'note.infrastructure.CollectionController.listManageableShort',
			{ limit },
		);

		if (!Type.isPlainObject(data) || !Array.isArray(data.items))
		{
			return { items: [], hasMore: false };
		}

		const items = data.items
			.map((item) => {
				if (!Type.isPlainObject(item))
				{
					return null;
				}
				const id = this.#toPositiveInt(item.id);
				if (id === null)
				{
					return null;
				}

				return { id, name: String(item.name ?? '') };
			})
			.filter((item) => item !== null)
		;

		return { items, hasMore: Boolean(data.hasMore) };
	}

	async createDocument(collectionId: number, title: string, parentId: number | null = null): Promise<SidebarDocument>
	{
		const data: RawDocumentResponse = await this.#client.run('note.infrastructure.DocumentController.create', {
			collectionId,
			parentId,
			title,
		});

		const normalized = this.#normalizeDocument(data);
		if (normalized)
		{
			return normalized;
		}

		const id = this.#toPositiveInt(data?.id);

		return {
			id: id ?? 0,
			collectionId: this.#toPositiveInt(collectionId) ?? 0,
			parentId: this.#toNullableInt(parentId),
			title: String(title || ''),
			position: 0,
			hasChildren: false,
			isArchived: false,
		};
	}

	updateDocument(id: number, title: string): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.DocumentController.update', { id, title });
	}

	deleteDocument(id: number): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.DocumentController.delete', { id });
	}

	archiveDocument(id: number): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.DocumentController.archive', { id });
	}

	restoreDocument(id: number): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.DocumentController.restore', { id });
	}

	restoreAllDocuments(): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.DocumentController.restoreAll', {});
	}

	async listArchivedDocuments(
		{ limit = PAGE_SIZE, cursor = null }: { limit?: number, cursor?: Object | null } = {},
	): Promise<{ items: Object[], hasNextPage: boolean, nextCursor: Object | null }>
	{
		const params: Object = { limit };
		if (cursor !== null && Type.isPlainObject(cursor))
		{
			params.afterCursor = cursor;
		}

		const data: Object = await this.#client.run('note.infrastructure.DocumentController.listArchived', params);
		if (!Type.isPlainObject(data) || !Array.isArray(data.items))
		{
			return { items: [], hasNextPage: false, nextCursor: null };
		}

		const nextCursor = Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;

		return {
			items: data.items,
			hasNextPage: nextCursor !== null,
			nextCursor,
		};
	}

	moveDocument(id: number, collectionId: number, parentId: number | null, position: number): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.DocumentController.move', {
			id,
			collectionId,
			parentId,
			position,
		});
	}

	async #loadParentFromTree(collectionId: number, parentId: number | null): Promise<SidebarDocument[]>
	{
		const tree = await this.#client.run('note.infrastructure.DocumentController.getTree', { collectionId });
		if (!Array.isArray(tree))
		{
			return [];
		}

		const docs = this.#collectTreeDocumentsByParent(tree, parentId ?? null);
		this.#sortDocumentsByPosition(docs);

		return docs;
	}

	#collectTreeDocumentsByParent(tree: Object[], targetParentId: number | null): SidebarDocument[]
	{
		const docs = [];
		const stack = [...tree];
		while (stack.length > 0)
		{
			const node = stack.pop();
			const normalizedNode = this.#normalizeTreeNode(node, targetParentId);
			if (normalizedNode)
			{
				docs.push(normalizedNode);
			}

			this.#pushNodeChildren(stack, node);
		}

		return docs;
	}

	#normalizeTreeNode(node: mixed, targetParentId: number | null): SidebarDocument | null
	{
		if (!Type.isPlainObject(node))
		{
			return null;
		}

		const nodeParentId = node.parentId ?? null;
		if (nodeParentId !== targetParentId)
		{
			return null;
		}

		const children = Array.isArray(node.children) ? node.children : [];

		return this.#normalizeDocument({
			...node,
			hasChildren: children.length > 0,
		});
	}

	#pushNodeChildren(stack: Object[], node: mixed): void
	{
		if (!Type.isPlainObject(node))
		{
			return;
		}

		const children = Array.isArray(node.children) ? node.children : [];
		for (let i = children.length - 1; i >= 0; i -= 1)
		{
			stack.push(children[i]);
		}
	}

	#sortDocumentsByPosition(documents: SidebarDocument[]): void
	{
		documents.sort((a, b) => {
			const leftPos = Number(a.position || 0);
			const rightPos = Number(b.position || 0);
			if (leftPos !== rightPos)
			{
				return rightPos - leftPos;
			}

			return Number(b.id || 0) - Number(a.id || 0);
		});
	}

	#normalizeCollection(row: mixed): Collection | null
	{
		if (!Type.isPlainObject(row))
		{
			return null;
		}

		const id = this.#toPositiveInt(row.id);
		if (id === null)
		{
			return null;
		}

		return {
			...row,
			id,
			name: String(row.name ?? ''),
			position: this.#toInt(row.position) ?? 0,
			canEditCollection: Boolean(row.canEditCollection),
			canManagePermissions: Boolean(row.canManagePermissions),
		};
	}

	#normalizeDocument(row: mixed): SidebarDocument | null
	{
		if (!Type.isPlainObject(row))
		{
			return null;
		}

		const id = this.#toPositiveInt(row.id);
		const collectionId = this.#toPositiveInt(row.collectionId);
		if (id === null || collectionId === null)
		{
			return null;
		}

		return {
			...row,
			id,
			collectionId,
			parentId: this.#toNullableInt(row.parentId),
			title: String(row.title ?? ''),
			position: this.#toInt(row.position) ?? 0,
			hasChildren: Boolean(row.hasChildren),
			isArchived: Boolean(row.isArchived),
		};
	}

	#toPositiveInt(value: mixed): number | null
	{
		const normalized = this.#toInt(value);
		if (normalized === null || normalized <= 0)
		{
			return null;
		}

		return normalized;
	}

	#toNullableInt(value: mixed): number | null
	{
		if (value === null || value === undefined || value === '')
		{
			return null;
		}

		return this.#toInt(value);
	}

	#toInt(value: mixed): number | null
	{
		const parsed = Number(value);
		if (!Number.isFinite(parsed))
		{
			return null;
		}

		return Math.trunc(parsed);
	}

	#normalizeGlobalPermissions(rawPermissions: mixed): GlobalPermissions | null
	{
		if (!Type.isPlainObject(rawPermissions))
		{
			return null;
		}

		return {
			canEditCollections: Boolean(rawPermissions.canEditCollections),
			canEditGlobalPermissions: Boolean(rawPermissions.canEditGlobalPermissions),
			canImport: Boolean(rawPermissions.canImport),
			hasManageableCollection: Boolean(rawPermissions.hasManageableCollection),
		};
	}
}
