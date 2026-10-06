import { Type } from 'main.core';
import type { Collection, SidebarDocument, GlobalPermissions } from '../type';

const PAGE_SIZE = 50;
// Mirror of SubscriptionController::MAX_STATES_BATCH - the ceiling the endpoint silently trims to.
const STATES_BATCH_SIZE = 200;

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

type MoveDocumentResult = {
	id: number,
	position: number,
	affectedPositions: { id: number, position: number }[],
};

type ApiClient = {
	run(action: string, data?: Object): Promise<mixed>,
};

// [DTO-01] Cursor and target of the favorites list. entityType is the server's own wording.
type FavoriteCursor = { position: number, id: number };
type FavoriteTarget = { entityType: string, entityId: number };
type FavoriteNotifyState = {
	mode: string | null,
	subscribed: boolean,
	muted: boolean,
	inherited: boolean,
	inheritedSource: string | null,
	notified: boolean,
};
type FavoriteRow = {
	id: number,
	entityType: string,
	entityId: number,
	title: string,
	position: number,
	collectionId: number,
	parentId: number | null,
	hasChildren: boolean,
	expandVia: string,
	notify: FavoriteNotifyState,
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

	// [API-03] Pruned tree of documents reachable via document-level grants only (no collection VIEW),
	// grouped by container collection. Flat keyset pagination over the whole accessible set; the
	// cursor is {collectionId, id}, NOT per-parent — the client rebuilds the hierarchy from parentId.
	async listAccessibleTree(
		{ limit = PAGE_SIZE, afterCursor = null }: { limit?: number, afterCursor?: Object | null } = {},
	): Promise<{ containers: Object[], nextCursor: Object | null }>
	{
		const params: Object = { limit };
		if (afterCursor !== null && Type.isPlainObject(afterCursor))
		{
			params.afterCursor = afterCursor;
		}

		const data: mixed = await this.#client.run('note.infrastructure.DocumentController.listAccessibleTree', params);
		if (!Type.isPlainObject(data) || !Array.isArray(data.containers))
		{
			return { containers: [], nextCursor: null };
		}

		const containers = data.containers
			.map((container) => this.#normalizeAccessibleContainer(container))
			.filter((container) => container !== null)
		;
		const nextCursor = this.#normalizeAccessibleCursor(data.nextCursor);

		return { containers, nextCursor };
	}

	// [API-03b] Direct children of one node of the accessible tree. Separate from listByParent,
	// which gates on collection VIEW — a right this section's users do not hold by definition.
	// The cursor is per-parent {position, id}, exactly like the collection tree's.
	async listAccessibleChildren(
		collectionId: number,
		parentId: number,
		{ limit = PAGE_SIZE, cursor = null }: { limit?: number, cursor?: Object | null } = {},
	): Promise<{ items: SidebarDocument[], hasNextPage: boolean, nextCursor: Object | null }>
	{
		const params: Object = { collectionId, parentId, limit };
		if (cursor !== null && Type.isPlainObject(cursor))
		{
			params.afterCursor = cursor;
		}

		const data: mixed = await this.#client.run('note.infrastructure.DocumentController.listAccessibleChildren', params);
		if (!Type.isPlainObject(data) || !Array.isArray(data.documents))
		{
			return { items: [], hasNextPage: false, nextCursor: null };
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

	#normalizeAccessibleContainer(row: mixed): { collectionId: number, title: string, nodes: SidebarDocument[] } | null
	{
		if (!Type.isPlainObject(row))
		{
			return null;
		}

		const collectionId = this.#toPositiveInt(row.collectionId);
		if (collectionId === null)
		{
			return null;
		}

		const rawNodes = Array.isArray(row.nodes) ? row.nodes : [];
		const nodes = rawNodes
			.map((node) => this.#normalizeDocument({ ...node, collectionId }))
			.filter((node) => node !== null)
		;

		return {
			collectionId,
			title: String(row.title ?? ''),
			nodes,
		};
	}

	#normalizeAccessibleCursor(cursor: mixed): { collectionId: number, id: number } | null
	{
		if (!Type.isPlainObject(cursor))
		{
			return null;
		}

		const collectionId = this.#toPositiveInt(cursor.collectionId);
		const id = this.#toPositiveInt(cursor.id);
		if (collectionId === null || id === null)
		{
			return null;
		}

		return { collectionId, id };
	}

	// [API-04] One page of the personal favorites list. The end of the list is nextCursor === null:
	// the server refills a page whose rows the access filter dropped, so a short page is not the end.
	async listFavorites(
		{ limit = PAGE_SIZE, afterCursor = null, onlyNotified = false }: {
			limit?: number,
			afterCursor?: FavoriteCursor | null,
			onlyNotified?: boolean,
		} = {},
	): Promise<{ items: FavoriteRow[], hasNextPage: boolean, nextCursor: FavoriteCursor | null }>
	{
		// The flag travels as 1/0: a urlencoded `false` reaches the server as a truthy string.
		const params: Object = { limit, onlyNotified: onlyNotified === true ? 1 : 0 };
		if (Type.isPlainObject(afterCursor))
		{
			params.afterCursor = afterCursor;
		}

		const data: mixed = await this.#client.run('note.infrastructure.FavoriteController.list', params);

		return this.normalizeFavoritePage(data);
	}

	// [TPL-02] One mapper for both sources of a page: the list action and the payload the page carries
	// for the first one. Public because the store hydrates from the second without going through here.
	normalizeFavoritePage(
		data: mixed,
	): { items: FavoriteRow[], hasNextPage: boolean, nextCursor: FavoriteCursor | null }
	{
		if (!Type.isPlainObject(data) || !Array.isArray(data.items))
		{
			return { items: [], hasNextPage: false, nextCursor: null };
		}

		const nextCursor = this.#normalizeFavoriteCursor(data.nextCursor);

		return {
			items: data.items
				.map((item) => this.#normalizeFavoriteRow(item))
				.filter((item) => item !== null),
			hasNextPage: nextCursor !== null,
			nextCursor,
		};
	}

	// [API-01] position is the ordinal of the insertion point (1 - first row); null puts the row first.
	// `item` is the finished row, in the shape `list` hands out - null when the object is not visible to
	// the caller any more (no rights, trashed, deleted), which is the caller's cue to re-read the list.
	async addFavorite(
		target: FavoriteTarget,
		position: number | null = null,
	): Promise<{
		id: number | null,
		position: number | null,
		affectedPositions: { id: number, position: number }[],
		item: FavoriteRow | null,
	}>
	{
		const data: mixed = await this.#client.run('note.infrastructure.FavoriteController.add', {
			entityType: target.entityType,
			entityId: target.entityId,
			position: this.#toNullableInt(position),
		});
		if (!Type.isPlainObject(data))
		{
			return { id: null, position: null, affectedPositions: [], item: null };
		}

		return {
			id: this.#toPositiveInt(data.id),
			position: this.#toInt(data.position),
			affectedPositions: this.#normalizeAffectedPositions(data.affectedPositions),
			item: this.normalizeFavoriteItem(data.item),
		};
	}

	// One row of the block from a source other than a page of the list: the answer to an add and the
	// push of one. Public for the same reason normalizeFavoritePage is - the store applies both.
	normalizeFavoriteItem(item: mixed): FavoriteRow | null
	{
		return this.#normalizeFavoriteRow(item);
	}

	// [API-02] Reports the state that was taken away: the position of the row and its notification depth.
	async removeFavorite(
		target: FavoriteTarget,
	): Promise<{ position: number | null, notifyMode: string | null } | null>
	{
		const data: mixed = await this.#client.run('note.infrastructure.FavoriteController.remove', {
			entityType: target.entityType,
			entityId: target.entityId,
		});
		if (!Type.isPlainObject(data) || !Type.isPlainObject(data.removed))
		{
			return null;
		}

		return {
			position: this.#toInt(data.removed.position),
			notifyMode: this.#normalizeNotifyMode(data.removed.notifyMode),
		};
	}

	// [API-03] Reorders one row of the personal list; the response carries the recomputed positions.
	async moveFavorite(
		target: FavoriteTarget,
		position: number | null,
	): Promise<{ position: number | null, affectedPositions: { id: number, position: number }[] }>
	{
		const data: mixed = await this.#client.run('note.infrastructure.FavoriteController.move', {
			entityType: target.entityType,
			entityId: target.entityId,
			position: this.#toNullableInt(position),
		});
		if (!Type.isPlainObject(data))
		{
			return { position: null, affectedPositions: [] };
		}

		return {
			position: this.#toInt(data.position),
			affectedPositions: this.#normalizeAffectedPositions(data.affectedPositions),
		};
	}

	// [API-05] Subscription depth. The server invariant refuses a depth on an object that is not in the
	// favorites list, so the row has to be there first (FAVORITE_REQUIRED).
	setSubscription(target: FavoriteTarget, mode: string): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.SubscriptionController.set', {
			scope: target.entityType,
			entityId: target.entityId,
			mode,
		});
	}

	// [API-05] Removes the caller's own subscription row - both "off" and lifting a mute.
	removeSubscription(target: FavoriteTarget): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.SubscriptionController.remove', {
			scope: target.entityType,
			entityId: target.entityId,
		});
	}

	// [API-06] Coverage states of the documents of one knowledge base. Documents the user cannot see are
	// absent from the answer, so an absent key means "no bell", not "no coverage".
	//
	// Asked in batches: the endpoint answers for STATES_BATCH_SIZE ids and drops the rest without saying
	// so. A branch is read whole on every page it grows by, so past that many rows the tail would keep
	// its bells hidden - and nothing on either side would report it.
	async getSubscriptionStates(
		collectionId: number,
		documentIds: number[],
	): Promise<{ [string]: FavoriteNotifyState }>
	{
		const ids = (Array.isArray(documentIds) ? documentIds : [])
			.map((id) => this.#toPositiveInt(id))
			.filter((id) => id !== null)
		;
		if (ids.length === 0)
		{
			return {};
		}

		const batches = [];
		for (let offset = 0; offset < ids.length; offset += STATES_BATCH_SIZE)
		{
			batches.push(ids.slice(offset, offset + STATES_BATCH_SIZE));
		}

		const answers = await Promise.all(batches.map((batch) => this.#client.run(
			'note.infrastructure.SubscriptionController.getStates',
			{ collectionId, documentIds: batch },
		)));

		const states = {};
		for (const data: mixed of answers)
		{
			if (!Type.isPlainObject(data) || !Type.isPlainObject(data.states))
			{
				continue;
			}

			for (const [rawId, rawState] of Object.entries(data.states))
			{
				const id = this.#toPositiveInt(rawId);
				if (id !== null)
				{
					states[String(id)] = this.#normalizeNotifyState(rawState);
				}
			}
		}

		return states;
	}

	#normalizeFavoriteRow(row: mixed): FavoriteRow | null
	{
		if (!Type.isPlainObject(row))
		{
			return null;
		}

		const id = this.#toPositiveInt(row.id);
		const entityId = this.#toPositiveInt(row.entityId);
		const collectionId = this.#toPositiveInt(row.collectionId);
		const entityType = row.entityType === 'collection' || row.entityType === 'document' ? row.entityType : null;
		if (id === null || entityId === null || collectionId === null || entityType === null)
		{
			return null;
		}

		return {
			...row,
			id,
			entityType,
			entityId,
			title: String(row.title ?? ''),
			position: this.#toInt(row.position) ?? 0,
			collectionId,
			parentId: this.#toNullableInt(row.parentId),
			hasChildren: Boolean(row.hasChildren),
			expandVia: row.expandVia === 'accessibleTree' ? 'accessibleTree' : 'tree',
			notify: this.#normalizeNotifyState(row.notify),
		};
	}

	// [DTO-02] Coverage state of one row. Absent state reads as "no notifications" - the safe default.
	#normalizeNotifyState(notify: mixed): FavoriteNotifyState
	{
		const source = Type.isPlainObject(notify) ? notify : {};
		const inheritedSource = source.inheritedSource === 'subtree' || source.inheritedSource === 'collection'
			? source.inheritedSource
			: null
		;

		return {
			mode: this.#normalizeNotifyMode(source.mode),
			subscribed: Boolean(source.subscribed),
			muted: Boolean(source.muted),
			inherited: Boolean(source.inherited),
			inheritedSource,
			notified: Boolean(source.notified),
		};
	}

	#normalizeNotifyMode(mode: mixed): string | null
	{
		return ['self', 'subtree', 'all', 'muted'].includes(mode) ? mode : null;
	}

	#normalizeFavoriteCursor(cursor: mixed): FavoriteCursor | null
	{
		if (!Type.isPlainObject(cursor))
		{
			return null;
		}

		const position = this.#toInt(cursor.position);
		const id = this.#toPositiveInt(cursor.id);
		if (position === null || id === null)
		{
			return null;
		}

		return { position, id };
	}

	#normalizeAffectedPositions(rawList: mixed): { id: number, position: number }[]
	{
		const entries = [];
		for (const entry of Array.isArray(rawList) ? rawList : [])
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

			entries.push({ id: entryId, position: entryPosition });
		}

		return entries;
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

		return {
			position: this.#toInt(data.position),
			affectedPositions: this.#normalizeAffectedPositions(data.affectedPositions),
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

	async createDocument(
		collectionId: number,
		title: string,
		parentId: number | null = null,
		markdown: string = '',
	): Promise<SidebarDocument>
	{
		const data: RawDocumentResponse = await this.#client.run('note.infrastructure.DocumentController.create', {
			collectionId,
			parentId,
			title,
			markdown,
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

	deleteDocument(id: number, withNested: boolean = true): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.DocumentController.delete', {
			id,
			withNested: withNested ? 1 : 0,
		});
	}

	archiveDocument(id: number, withNested: boolean = true): Promise<mixed>
	{
		return this.#client.run('note.infrastructure.DocumentController.archive', {
			id,
			withNested: withNested ? 1 : 0,
		});
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

	async moveDocument(
		id: number,
		collectionId: number,
		parentId: number | null,
		position: number | null,
	): Promise<MoveDocumentResult>
	{
		const data: mixed = await this.#client.run('note.infrastructure.DocumentController.move', {
			id,
			collectionId,
			parentId,
			position: this.#toNullableInt(position),
		});
		if (!Type.isPlainObject(data))
		{
			throw new TypeError('Invalid moveDocument response');
		}

		const responseId = this.#toPositiveInt(data.id);
		const persistedPosition = this.#toInt(data.position);
		const affectedPositions = this.#normalizeAffectedPositions(data.affectedPositions);
		const movedDocumentPosition = affectedPositions.find((entry) => entry.id === responseId)?.position ?? null;
		if (
			responseId !== id
			|| persistedPosition === null
			|| !Array.isArray(data.affectedPositions)
			|| affectedPositions.length !== data.affectedPositions.length
			|| movedDocumentPosition !== persistedPosition
		)
		{
			throw new TypeError('Invalid moveDocument response');
		}

		return {
			id: responseId,
			position: persistedPosition,
			affectedPositions,
		};
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
