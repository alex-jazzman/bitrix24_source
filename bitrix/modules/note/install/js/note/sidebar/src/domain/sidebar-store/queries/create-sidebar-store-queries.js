import { computed } from 'ui.vue3';
import type { Collection, SidebarDocument } from '../../../type';

export class SidebarStoreQueries
{
	#state;
	#keyOf: (collectionId: number, parentId: number | null) => string;
	currentRootDocs: Object;

	constructor(state: Object, keyOf: (collectionId: number, parentId: number | null) => string)
	{
		this.#state = state;
		this.#keyOf = keyOf;
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
