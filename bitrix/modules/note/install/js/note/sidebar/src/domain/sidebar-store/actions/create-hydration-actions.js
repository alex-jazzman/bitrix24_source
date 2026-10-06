import { Type } from 'main.core';
import type { Collection, SidebarDocument, GlobalPermissions } from '../../../type';

type BranchKey = { collectionId: number, parentId: number | null };

export class SidebarHydrationActions
{
	#state;
	#keyOf;
	#normalizeParentId;

	constructor({
		state,
		keyOf,
		normalizeParentId,
	})
	{
		this.#state = state;
		this.#keyOf = keyOf;
		this.#normalizeParentId = normalizeParentId;
	}

	hydrateFromInitialContext(context: mixed): boolean
	{
		if (!Type.isPlainObject(context))
		{
			return false;
		}

		const normalizedDocument = this.#normalizeDocument(context.document);
		if (!normalizedDocument)
		{
			return false;
		}

		const selectedCollectionId = this.#toPositiveInt(
			context.selectedCollectionId
			?? context.collectionId
			?? normalizedDocument.collectionId,
		);
		const selectedDocId = this.#toPositiveInt(context.selectedDocId ?? normalizedDocument.id);
		if (selectedCollectionId === null || selectedDocId === null)
		{
			return false;
		}

		this.#hydrateBranches(context.branches, selectedCollectionId);
		this.#hydrateExpandedDocs(context.expandedDocs);

		this.#state.selectedCollectionId.value = selectedCollectionId;
		this.#state.selectedDocId.value = selectedDocId;

		return true;
	}

	hydrateInitialCollections(payload: mixed): boolean
	{
		if (!Type.isPlainObject(payload))
		{
			return false;
		}

		this.setGlobalPermissions(payload.permissions);

		const rawItems = Array.isArray(payload.items) ? payload.items : [];
		const collections = rawItems
			.map((item) => this.#normalizeCollection(item))
			.filter((item) => item !== null)
		;

		this.#state.collections.value = collections;
		this.#state.collectionsCursor.value = payload.nextCursor ?? null;
		this.#state.collectionsHasNextPage.value = payload.nextCursor !== null && payload.nextCursor !== undefined;
		this.#state.collectionsLoading.value = false;

		return true;
	}

	setGlobalPermissions(rawPermissions: mixed): void
	{
		const normalized = this.#normalizeGlobalPermissions(rawPermissions);
		this.#state.globalPermissions.canEditCollections = normalized.canEditCollections;
		this.#state.globalPermissions.canEditGlobalPermissions = normalized.canEditGlobalPermissions;
		this.#state.globalPermissions.canImport = normalized.canImport;
		this.#state.globalPermissions.canImportWiki = normalized.canImportWiki;
		this.#state.globalPermissions.hasManageableCollection = normalized.hasManageableCollection;
	}

	#hydrateBranches(rawBranches: mixed, fallbackCollectionId: number): void
	{
		if (!Type.isPlainObject(rawBranches))
		{
			return;
		}

		for (const [rawKey, rawDocuments] of Object.entries(rawBranches))
		{
			const branchMeta = this.#parseBranchKey(rawKey, fallbackCollectionId);
			if (!branchMeta)
			{
				continue;
			}

			const documents = Array.isArray(rawDocuments)
				? rawDocuments
					.map((item) => this.#normalizeDocument(item))
					.filter((item) => item !== null)
				: []
			;

			const key = this.#keyOf(branchMeta.collectionId, branchMeta.parentId);
			this.#state.docsByParent[key] = documents;
			this.#state.docsOffsetByParent[key] = documents.length;
			this.#state.docsLoadingByParent[key] = false;
			this.#state.docsHasNextPageByParent[key] = false;
			this.#state.docsHydratedByParent[key] = true;
			this.#state.docsStaleByParent[key] = false;
		}
	}

	#hydrateExpandedDocs(rawExpandedDocs: mixed): void
	{
		if (!Type.isPlainObject(rawExpandedDocs))
		{
			return;
		}

		for (const [rawDocId, rawIsExpanded] of Object.entries(rawExpandedDocs))
		{
			const docId = this.#toPositiveInt(rawDocId);
			if (docId === null || !rawIsExpanded)
			{
				continue;
			}

			this.#state.expandedDocs[docId] = true;
		}
	}

#parseBranchKey(rawKey: string, fallbackCollectionId: number): BranchKey | null
	{
		if (!Type.isStringFilled(rawKey))
		{
			return null;
		}

		const [rawCollectionId, rawParentToken] = rawKey.split(':');
		const collectionId = this.#toPositiveInt(rawCollectionId) ?? fallbackCollectionId;
		if (collectionId === null)
		{
			return null;
		}

		if (rawParentToken === 'root')
		{
			return { collectionId, parentId: null };
		}

		const parentId = this.#normalizeParentId(rawParentToken);
		if (parentId === null)
		{
			return null;
		}

		return {
			collectionId,
			parentId,
		};
	}

	#normalizeCollection(rawCollection: mixed): Collection | null
	{
		if (!Type.isPlainObject(rawCollection))
		{
			return null;
		}

		const id = this.#toPositiveInt(rawCollection.id);
		if (id === null)
		{
			return null;
		}

		const name = String(rawCollection.name ?? '').trim();

		return {
			...rawCollection,
			id,
			name: name === '' ? `#${id}` : name,
			position: Number.isFinite(Number(rawCollection.position))
				? Number(rawCollection.position)
				: 0,
			canEditCollection: Boolean(rawCollection.canEditCollection),
			canManagePermissions: Boolean(rawCollection.canManagePermissions),
			hasDescription: Boolean(rawCollection.hasDescription),
			mainDocumentId: Number(rawCollection.mainDocumentId) || 0,
		};
	}

	#normalizeDocument(rawDocument: mixed): SidebarDocument | null
	{
		if (!Type.isPlainObject(rawDocument))
		{
			return null;
		}

		const id = this.#toPositiveInt(rawDocument.id);
		const collectionId = this.#toPositiveInt(rawDocument.collectionId);
		if (id === null || collectionId === null)
		{
			return null;
		}

		return {
			...rawDocument,
			id,
			collectionId,
			parentId: this.#normalizeParentId(rawDocument.parentId),
			title: String(rawDocument.title ?? ''),
			collectionTitle: String(rawDocument.collectionTitle ?? ''),
			position: Number.isFinite(Number(rawDocument.position))
				? Number(rawDocument.position)
				: 0,
			hasChildren: Boolean(rawDocument.hasChildren),
			isArchived: Boolean(rawDocument.isArchived),
		};
	}

	#toPositiveInt(value: mixed): number | null
	{
		const parsed = Number(value);
		if (!Number.isInteger(parsed) || parsed <= 0)
		{
			return null;
		}

		return parsed;
	}

	#normalizeGlobalPermissions(rawPermissions: mixed): GlobalPermissions
	{
		if (!Type.isPlainObject(rawPermissions))
		{
			return {
				canEditCollections: false,
				canEditGlobalPermissions: false,
				canImport: false,
				canImportWiki: false,
				hasManageableCollection: false,
			};
		}

		return {
			canEditCollections: Boolean(rawPermissions.canEditCollections),
			canEditGlobalPermissions: Boolean(rawPermissions.canEditGlobalPermissions),
			canImport: Boolean(rawPermissions.canImport),
			canImportWiki: Boolean(rawPermissions.canImportWiki),
			hasManageableCollection: Boolean(rawPermissions.hasManageableCollection),
		};
	}
}
