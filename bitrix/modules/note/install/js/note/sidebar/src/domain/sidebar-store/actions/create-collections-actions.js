import { PAGE_SIZE, REFRESH_DEBOUNCE_JITTER_MS, REFRESH_DEBOUNCE_MIN_MS } from '../shared/constants';
import type { Collection, GlobalPermissions } from '../../../type';
import type { SidebarApi } from '../../../services/sidebar-api';

export class SidebarCollectionActions
{
	#api: SidebarApi;
	#state;
	#setError: (message: string) => void;
	#setGlobalPermissions: (permissions: GlobalPermissions) => void;
	#removeBranch: (collectionId: number, parentId: number | null) => void;
	#refreshCollectionWatches: () => void;
	#patchFavoriteTitle: (entityType: string, entityId: number, title: mixed) => boolean;
	#capabilityRefreshTimers: Map<number, TimeoutID>;
	#listRefetchTimer: TimeoutID | null;

	constructor({
		api,
		state,
		setError,
		setGlobalPermissions,
		removeBranch,
		refreshCollectionWatches,
		patchFavoriteTitle = () => false,
	}: {
		api: SidebarApi,
		state: Object,
		setError: (message: string) => void,
		setGlobalPermissions: (permissions: GlobalPermissions) => void,
		removeBranch: (collectionId: number, parentId: number | null) => void,
		refreshCollectionWatches?: () => void,
		patchFavoriteTitle?: (entityType: string, entityId: number, title: mixed) => boolean,
	})
	{
		this.#api = api;
		this.#state = state;
		this.#setError = setError;
		this.#setGlobalPermissions = setGlobalPermissions;
		this.#removeBranch = removeBranch;
		this.#patchFavoriteTitle = patchFavoriteTitle;
		this.#refreshCollectionWatches = typeof refreshCollectionWatches === 'function' ? refreshCollectionWatches : () => {};
		this.#capabilityRefreshTimers = new Map();
		this.#listRefetchTimer = null;
	}

	insertCollectionLocal(collection: mixed): Collection | null
	{
		if (!collection)
		{
			return null;
		}

		const normalizedId = Number(collection.id);
		if (!Number.isFinite(normalizedId) || normalizedId <= 0)
		{
			return null;
		}

		const nextItem = {
			...collection,
			id: normalizedId,
			name: String(collection.name || ''),
			position: Number.isFinite(Number(collection.position)) ? Number(collection.position) : 0,
		};

		this.#state.collections.value = this.#mergeCollections(
			this.#state.collections.value,
			[nextItem],
		);

		return nextItem;
	}

	#sortCollections(items: Array<Object>): Array<Object>
	{
		return [...items].sort((a, b) => {
			const leftPos = Number(a?.position || 0);
			const rightPos = Number(b?.position || 0);
			if (leftPos !== rightPos)
			{
				return rightPos - leftPos;
			}

			return Number(b?.id || 0) - Number(a?.id || 0);
		});
	}

	#mergeCollections(base: Array<Object>, incoming: Array<Object>): Array<Object>
	{
		const byId = new Map();
		for (const item of base)
		{
			const id = Number(item?.id);
			if (Number.isInteger(id) && id > 0)
			{
				byId.set(id, item);
			}
		}
		for (const item of incoming)
		{
			const id = Number(item?.id);
			if (!Number.isInteger(id) || id <= 0)
			{
				continue;
			}
			byId.set(id, byId.has(id) ? { ...byId.get(id), ...item } : item);
		}

		return this.#sortCollections([...byId.values()]);
	}

	updateCollectionLocal(collectionId: number, patch: Object = {}): boolean
	{
		const normalizedId = Number(collectionId);
		if (!Number.isFinite(normalizedId) || normalizedId <= 0)
		{
			return false;
		}

		const index = this.#state.collections.value.findIndex((item) => Number(item.id) === normalizedId);
		if (index < 0)
		{
			return false;
		}

		const next = [...this.#state.collections.value];
		next[index] = { ...next[index], ...patch };
		this.#state.collections.value = next;
		// The row of the favorites block keeps its own copy of the name (see patchFavoriteTitle).
		this.#patchFavoriteTitle('collection', normalizedId, patch.name);

		return true;
	}

	async applyCollectionCreate(): Promise<void>
	{
		await this.loadCollections(false);
		this.#refreshCollectionWatches();
	}

	applyCollectionDelete(params: Object): boolean
	{
		if (!params)
		{
			return false;
		}

		const collectionId = Number(params.collectionId);
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			return false;
		}

		return this.removeCollectionLocal(collectionId);
	}

	applyCollectionArchive(params: Object): boolean
	{
		if (!params)
		{
			return false;
		}

		const collectionId = Number(params.collectionId);
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			return false;
		}

		// Archived collection lives on under /note/archive/ — lazy-refetch when user opens that view.
		return this.removeCollectionLocal(collectionId);
	}

	applyCollectionRestore(params: Object): Collection | null
	{
		if (!params)
		{
			return null;
		}

		const collectionId = Number(params.collectionId);
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			return null;
		}

		const inserted = this.insertCollectionLocal({
			id: collectionId,
			name: typeof params.name === 'string' ? params.name : '',
			position: Number.isFinite(Number(params.position)) ? Number(params.position) : 0,
			policyLevel: Number.isFinite(Number(params.policyLevel)) ? Number(params.policyLevel) : 0,
		});

		if (inserted)
		{
			this.#refreshCollectionWatches();
		}

		return inserted;
	}

	applyCollectionCapabilities(params: Object): void
	{
		const collectionId = Number(params?.collectionId);
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			return;
		}

		this.#scheduleCapabilityRefresh(collectionId);
	}

	applyCollectionListInvalidated(): void
	{
		this.#scheduleListRefetch();
	}

	patchCollectionCapabilities(
		collectionId: number,
		capabilities: { level?: string, policyLevel?: string, canEditCollection?: boolean, canManagePermissions?: boolean },
	): boolean
	{
		const normalizedId = Number(collectionId);
		if (!Number.isInteger(normalizedId) || normalizedId <= 0)
		{
			return false;
		}

		const patch = {};
		if (typeof capabilities.policyLevel === 'string')
		{
			patch.policyLevel = capabilities.policyLevel;
		}
		if (typeof capabilities.canEditCollection === 'boolean')
		{
			patch.canEditCollection = capabilities.canEditCollection;
		}
		if (typeof capabilities.canManagePermissions === 'boolean')
		{
			patch.canManagePermissions = capabilities.canManagePermissions;
		}

		if (Object.keys(patch).length === 0)
		{
			return false;
		}

		return this.updateCollectionLocal(normalizedId, patch);
	}

	#scheduleCapabilityRefresh(collectionId: number): void
	{
		const existing = this.#capabilityRefreshTimers.get(collectionId);
		if (existing)
		{
			clearTimeout(existing);
		}

		const delay = REFRESH_DEBOUNCE_MIN_MS + Math.floor(Math.random() * REFRESH_DEBOUNCE_JITTER_MS);
		const timer = setTimeout(() => {
			this.#capabilityRefreshTimers.delete(collectionId);
			this.#fetchAndApplyCapabilities(collectionId);
		}, delay);
		this.#capabilityRefreshTimers.set(collectionId, timer);
	}

	async #fetchAndApplyCapabilities(collectionId: number): Promise<void>
	{
		try
		{
			const access = await this.#api.getMyCollectionAccess(collectionId);
			if (!access)
			{
				return;
			}

			if (access.level === 'none')
			{
				// Lost-access path: collection drops out of the sidebar; /shared/ takes over via list-invalidation.
				this.removeCollectionLocal(collectionId);

				return;
			}

			this.patchCollectionCapabilities(collectionId, {
				policyLevel: access.policyLevel,
				canEditCollection: access.canEditCollection,
				canManagePermissions: access.canManagePermissions,
			});
		}
		catch (error)
		{
			console.warn('[NOTE PULL SIDEBAR] capability refresh failed', collectionId, error);
		}
	}

	#scheduleListRefetch(): void
	{
		if (this.#listRefetchTimer)
		{
			clearTimeout(this.#listRefetchTimer);
		}

		const delay = REFRESH_DEBOUNCE_MIN_MS + Math.floor(Math.random() * REFRESH_DEBOUNCE_JITTER_MS);
		this.#listRefetchTimer = setTimeout(() => {
			this.#listRefetchTimer = null;
			this.loadCollections(false)
				.then(() => this.#refreshCollectionWatches())
				.catch((error) => console.warn('[NOTE PULL SIDEBAR] list refetch failed', error))
			;
		}, delay);
	}

	applyCollectionUpdate(params: Object): boolean
	{
		if (!params)
		{
			return false;
		}

		const collectionId = Number(params.collectionId);
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			return false;
		}

		const patch = {};
		if (typeof params.name === 'string')
		{
			patch.name = params.name;
		}

		if (Object.keys(patch).length === 0)
		{
			return false;
		}

		return this.updateCollectionLocal(collectionId, patch);
	}

	removeCollectionLocal(collectionId: number): boolean
	{
		const normalizedId = Number(collectionId);
		if (!Number.isFinite(normalizedId) || normalizedId <= 0)
		{
			return false;
		}

		const nextCollections = this.#state.collections.value.filter((item) => Number(item.id) !== normalizedId);
		if (nextCollections.length === this.#state.collections.value.length)
		{
			return false;
		}

		this.#state.collections.value = nextCollections;
		this.#state.collectionsCursor.value = null;

		const keyPrefix = `${normalizedId}:`;
		const docIdsToCollapse = [];
		for (const [key, docs] of Object.entries(this.#state.docsByParent))
		{
			if (!key.startsWith(keyPrefix))
			{
				continue;
			}

			if (Array.isArray(docs))
			{
				for (const doc of docs)
				{
					const docId = Number(doc?.id);
					if (Number.isInteger(docId) && docId > 0)
					{
						docIdsToCollapse.push(docId);
					}
				}
			}

			const [, parentToken] = key.split(':');
			const parentId = parentToken === 'root' ? null : Number(parentToken);
			this.#removeBranch(normalizedId, parentId);
		}

		for (const docId of docIdsToCollapse)
		{
			delete this.#state.expandedDocs[docId];
		}

		if (this.#state.selectedCollectionId.value === normalizedId)
		{
			this.#state.selectedCollectionId.value = null;
			this.#state.selectedDocId.value = null;
		}

		return true;
	}

	moveCollectionLocal(dragId: number, targetId: number, placement: string): void
	{
		const list = this.#state.collections.value.filter((item) => Number(item.id) !== dragId);
		const dragItem = this.#state.collections.value.find((item) => Number(item.id) === dragId);
		if (!dragItem)
		{
			return;
		}

		const targetIndex = list.findIndex((item) => Number(item.id) === targetId);
		if (targetIndex < 0)
		{
			return;
		}

		// Synthesise a position above/below the target so the optimistic order matches the
		// upcoming server response. The server returns authoritative values via applyCollectionPositions.
		const beforeItem = placement === 'before'
			? list[targetIndex - 1] ?? null
			: list[targetIndex];
		const afterItem = placement === 'before'
			? list[targetIndex]
			: list[targetIndex + 1] ?? null;
		const beforePos = beforeItem ? Number(beforeItem.position) : null;
		const afterPos = afterItem ? Number(afterItem.position) : null;

		let optimisticPosition;
		if (beforePos !== null && afterPos !== null)
		{
			optimisticPosition = Math.floor((beforePos + afterPos) / 2);
		}
		else if (beforePos !== null)
		{
			optimisticPosition = beforePos - 1;
		}
		else if (afterPos !== null)
		{
			optimisticPosition = afterPos + 1;
		}
		else
		{
			optimisticPosition = Number(dragItem.position) || 0;
		}

		const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
		list.splice(insertIndex, 0, { ...dragItem, position: optimisticPosition });
		this.#state.collections.value = this.#sortCollections(list);
		this.#state.collectionsCursor.value = null;
	}

	applyCollectionPositions(entries: Array<{ id: number, position: number }>): void
	{
		if (!Array.isArray(entries) || entries.length === 0)
		{
			return;
		}

		const patchById = new Map();
		for (const entry of entries)
		{
			const id = Number(entry?.id);
			const position = Number(entry?.position);
			if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(position))
			{
				continue;
			}
			patchById.set(id, position);
		}

		if (patchById.size === 0)
		{
			return;
		}

		const next = this.#state.collections.value.map((item) => {
			const id = Number(item?.id);
			return patchById.has(id) ? { ...item, position: patchById.get(id) } : item;
		});
		this.#state.collections.value = this.#sortCollections(next);
	}

	async applyCollectionMove(params: Object): Promise<void>
	{
		if (!params)
		{
			return;
		}

		if (params.requestRefetch === true)
		{
			await this.loadCollections(false);

			return;
		}

		const entries = Array.isArray(params.affectedPositions) ? params.affectedPositions : [];
		if (entries.length > 0)
		{
			this.applyCollectionPositions(entries);
		}
	}

	async loadCollections(append: boolean = false): Promise<void>
	{
		this.#state.collectionsLoading.value = true;

		try
		{
			const effectiveAppend = append && this.#state.collectionsCursor.value !== null;
			const cursor = effectiveAppend ? this.#state.collectionsCursor.value : null;
			const response = await this.#api.listCollections({ limit: PAGE_SIZE, cursor });
			if (this.#setGlobalPermissions && response?.permissions)
			{
				this.#setGlobalPermissions(response.permissions);
			}
			this.#state.collections.value = this.#mergeCollections(
				this.#state.collections.value,
				response.items,
			);
			this.#state.collectionsCursor.value = response.nextCursor;
			this.#state.collectionsHasNextPage.value = response.hasNextPage;
		}
		catch (error)
		{
			this.#setError(error?.message || 'Collections loading failed');
		}
		finally
		{
			this.#state.collectionsLoading.value = false;
		}
	}
}
