import { computed } from 'ui.vue3';
import { favoriteExpandKey, favoriteKey } from '../shared/keys';
import type { Collection, SidebarDocument } from '../../../type';

export class SidebarStoreQueries
{
	#state;
	#keyOf: (collectionId: number, parentId: number | null) => string;
	#treeFavoriteFlags: Object;
	#favoriteRowsByKey: Object;
	currentRootDocs: Object;
	favoritesExpandedDocs: Object;

	constructor(state: Object, keyOf: (collectionId: number, parentId: number | null) => string)
	{
		this.#state = state;
		this.#keyOf = keyOf;
		// [P2] The block's expansion space as TreeNode reads expansion: by document id - but one map per
		// top-level row, because that is the scope a place belongs to (see favoriteExpandKey). Rows
		// nested in a branch of the block are ordinary tree rows, and this is what lets them share one
		// component with the tree while answering to the block's own flags, without a document opened
		// under one row opening the same document under another.
		this.favoritesExpandedDocs = computed(() => {
			const byScope = {};
			for (const [key, value] of Object.entries(this.#state.favoritesExpanded))
			{
				const separator = key.lastIndexOf('/');
				if (value !== true || separator < 0)
				{
					continue;
				}

				const scope = key.slice(0, separator);
				const [entityType, entityId] = key.slice(separator + 1).split(':');
				if (entityType !== 'document')
				{
					continue;
				}

				byScope[scope] = byScope[scope] ?? {};
				byScope[scope][entityId] = true;
			}

			return byScope;
		});
		// Both of the maps below answer a question every rendered row asks on every reactivity tick.
		// Kept as keyed maps rather than a scan per row: with the sidebar loaded the scan is over all
		// loaded documents, so a row-by-row lookup is quadratic in the size of the tree.
		this.#treeFavoriteFlags = computed(() => {
			const flags = {};
			// Regular buckets last: the same document reachable both ways answers from the tree the star
			// of the block was drawn in, which is the order findLoadedDocumentAnywhere kept.
			for (const buckets of [this.#state.sharedDocsByParent, this.#state.docsByParent])
			{
				for (const docs of Object.values(buckets))
				{
					if (!Array.isArray(docs))
					{
						continue;
					}

					for (const doc of docs)
					{
						flags[String(Number(doc.id))] = doc.isFavorite === true;
					}
				}
			}

			return flags;
		});
		this.#favoriteRowsByKey = computed(() => {
			const rows = {};
			for (const item of this.#state.favorites.value)
			{
				rows[favoriteKey(item.entityType, Number(item.entityId))] = item;
			}

			return rows;
		});
		this.currentRootDocs = computed(() => {
			if (!this.#state.selectedCollectionId.value)
			{
				return [];
			}

			return this.getChildren(this.#state.selectedCollectionId.value, null);
		});
	}

	getChildren(collectionId: number, parentId: number | null = null): SidebarDocument[]
	{
		const key = this.#keyOf(collectionId, parentId);

		return this.#state.docsByParent[key] || [];
	}

	findLoadedDocument(collectionId: number, docId: number): SidebarDocument | null
	{
		const normalizedCollectionId = Number(collectionId);
		const normalizedDocId = Number(docId);
		const keyPrefix = `${normalizedCollectionId}:`;
		for (const [key, docs] of Object.entries(this.#state.docsByParent))
		{
			if (!key.startsWith(keyPrefix) || !Array.isArray(docs))
			{
				continue;
			}

			const found = docs.find((doc) => Number(doc.id) === normalizedDocId);
			if (found)
			{
				return found;
			}
		}

		return null;
	}

	findLoadedDocumentAnywhere(docId: number): SidebarDocument | null
	{
		const normalizedDocId = Number(docId);
		if (!Number.isInteger(normalizedDocId) || normalizedDocId <= 0)
		{
			return null;
		}

		for (const docs of Object.values(this.#state.docsByParent))
		{
			if (!Array.isArray(docs))
			{
				continue;
			}

			const found = docs.find((doc) => Number(doc.id) === normalizedDocId);
			if (found)
			{
				return found;
			}
		}

		return null;
	}

	isDocumentLoadedAnywhere(docId: number): boolean
	{
		return this.findLoadedDocumentAnywhere(docId) !== null;
	}

	// Returns ancestors from the closest-to-root to the direct parent (the document itself excluded).
	// Walks docsByParent: keys are `${collectionId}:${parentId}`. Stops if the chain breaks.
	getAncestorsForDocument(docId: number): Array<{ id: number, title: string }>
	{
		const startId = Number(docId);
		if (!Number.isInteger(startId) || startId <= 0)
		{
			return [];
		}

		const ancestors = [];
		const visited = new Set();
		let currentId = startId;

		while (currentId > 0 && !visited.has(currentId))
		{
			visited.add(currentId);

			let foundDoc = null;
			let parentId = 0;
			for (const [key, docs] of Object.entries(this.#state.docsByParent))
			{
				if (!Array.isArray(docs))
				{
					continue;
				}

				const found = docs.find((doc) => Number(doc.id) === currentId);
				if (!found)
				{
					continue;
				}

				foundDoc = found;
				const colonIndex = key.indexOf(':');
				const parentPart = colonIndex >= 0 ? key.slice(colonIndex + 1) : '';
				parentId = parentPart === 'root' ? 0 : (Number(parentPart) || 0);
				break;
			}

			if (!foundDoc)
			{
				break;
			}

			if (currentId !== startId)
			{
				ancestors.unshift({
					id: Number(foundDoc.id),
					title: String(foundDoc.title || ''),
				});
			}

			currentId = parentId;
		}

		return ancestors;
	}

	findCollection(collectionId: number): Collection | null
	{
		const normalizedId = Number(collectionId);
		if (!Number.isInteger(normalizedId) || normalizedId <= 0)
		{
			return null;
		}

		const collections = this.#state.collections.value;
		if (!Array.isArray(collections))
		{
			return null;
		}

		return collections.find((collection) => Number(collection.id) === normalizedId) || null;
	}

	// [TPL-02] The star of any row. Two sources feed the answer: the index the block keeps (loaded
	// pages, optimistic toggles, pull events) and, for objects no loaded page mentions, the isFavorite
	// flag the server puts on the entity itself (TPL-01). The index wins - it is the fresher of the two.
	isFavorite(entityType: string, entityId: number): boolean
	{
		const id = Number(entityId);
		if (!Number.isInteger(id) || id <= 0)
		{
			return false;
		}

		const indexed = this.#state.favoriteIndex[favoriteKey(entityType, id)];
		if (indexed !== undefined)
		{
			return indexed === true;
		}

		if (entityType === 'collection')
		{
			return this.findCollection(id)?.isFavorite === true;
		}

		return this.#treeFavoriteFlags.value[String(id)] === true;
	}

	// [P2] Expansion of a top-level block row. Nested rows are answered by favoritesExpandedDocs.
	isFavoriteExpanded(entityType: string, entityId: number): boolean
	{
		return this.#state.favoritesExpanded[favoriteExpandKey(entityType, entityId)] === true;
	}

	// [DTO-02] Notification state of one object. A row of the block answers from the list it came
	// with; a document nested in an opened branch answers from the coverage map (API-06). Objects
	// neither the list nor an opened branch mentions have no state - and no bell.
	favoriteNotify(entityType: string, entityId: number): Object | null
	{
		const id = Number(entityId);
		if (!Number.isInteger(id) || id <= 0)
		{
			return null;
		}

		const row = this.#favoriteRowsByKey.value[favoriteKey(entityType, id)];
		if (row !== undefined)
		{
			return row.notify ?? null;
		}

		return entityType === 'document' ? this.#state.favoritesCoverage[String(id)] ?? null : null;
	}

	isFavoriteNotifyPending(entityType: string, entityId: number): boolean
	{
		return this.#state.favoritesNotifyPending[favoriteKey(entityType, Number(entityId))] === true;
	}

	// [ERR-005] The failure of a branch belongs to the PLACE that opened it, so it is asked for by the
	// same key the loader wrote it under - scope included (see favoriteExpandKey). Asked without the
	// scope, the failure of a nested branch was never found and its row stood open over nothing.
	favoriteBranchError(entityType: string, entityId: number, scope: string = ''): string | null
	{
		return this.#state.favoritesBranchError[favoriteExpandKey(entityType, entityId, scope)] ?? null;
	}

	isLoadingChildren(collectionId: number, parentId: number | null = null): boolean
	{
		const key = this.#keyOf(collectionId, parentId);

		return Boolean(this.#state.docsLoadingByParent[key]);
	}

	hasNextChildren(collectionId: number, parentId: number | null = null): boolean
	{
		const key = this.#keyOf(collectionId, parentId);

		return Boolean(this.#state.docsHasNextPageByParent[key]);
	}

	isChildrenHydrated(collectionId: number, parentId: number | null = null): boolean
	{
		const key = this.#keyOf(collectionId, parentId);

		return Boolean(this.#state.docsHydratedByParent[key]) && !this.#state.docsStaleByParent[key];
	}

	isBranchLoaded(collectionId: number, parentId: number | null = null): boolean
	{
		const key = this.#keyOf(collectionId, parentId);

		return Boolean(this.#state.docsHydratedByParent[key]) || Array.isArray(this.#state.docsByParent[key]);
	}
}
