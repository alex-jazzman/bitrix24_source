import { normalizeDocumentForStore, sortDocuments } from '../shared/document-utils';
import { PAGE_SIZE } from '../shared/constants';
import type { SidebarDocument } from '../../../type';
import type { SidebarApi } from '../../../services/sidebar-api';
import type { SidebarStoreQueries } from '../queries/create-sidebar-store-queries';

export class SidebarDocumentActions
{
	#api: SidebarApi;
	#state;
	#queries: SidebarStoreQueries;
	#keyOf: (collectionId: number, parentId: number | null) => string;
	#normalizeParentId: (value: mixed) => number | null;
	#setBranchDocs: (collectionId: number, parentId: number | null, list: SidebarDocument[]) => void;
	#removeBranch: (collectionId: number, parentId: number | null) => void;
	#setError: (message: string) => void;

	constructor({
		api,
		state,
		queries,
		keyOf,
		normalizeParentId,
		setBranchDocs,
		removeBranch,
		setError,
	}: {
		api: SidebarApi,
		state: Object,
		queries: SidebarStoreQueries,
		keyOf: (collectionId: number, parentId: number | null) => string,
		normalizeParentId: (value: mixed) => number | null,
		setBranchDocs: (collectionId: number, parentId: number | null, list: SidebarDocument[]) => void,
		removeBranch: (collectionId: number, parentId: number | null) => void,
		setError: (message: string) => void,
	})
	{
		this.#api = api;
		this.#state = state;
		this.#queries = queries;
		this.#keyOf = keyOf;
		this.#normalizeParentId = normalizeParentId;
		this.#setBranchDocs = setBranchDocs;
		this.#removeBranch = removeBranch;
		this.#setError = setError;
	}

	invalidateChildren(collectionId: number, parentId: number | null = null): void
	{
		const key = this.#keyOf(collectionId, parentId);
		this.#state.docsHydratedByParent[key] = false;
		this.#state.docsStaleByParent[key] = true;
		this.#state.docsOffsetByParent[key] = 0;
		this.#state.docsCursorByParent[key] = null;
		this.#state.docsHasNextPageByParent[key] = true;
	}

	// Hard reset for a branch: drop cached docs in addition to cursor/hydration flags.
	// Used by realtime handlers when the server signals a branch needs full refetch.
	invalidateBranch(collectionId: number, parentId: number | null = null): void
	{
		const key = this.#keyOf(collectionId, parentId);
		this.#state.docsByParent[key] = [];
		this.#state.docsHydratedByParent[key] = false;
		this.#state.docsStaleByParent[key] = true;
		this.#state.docsOffsetByParent[key] = 0;
		this.#state.docsCursorByParent[key] = null;
		this.#state.docsHasNextPageByParent[key] = true;
	}

	invalidateAllChildren(): void
	{
		for (const key of Object.keys(this.#state.docsHydratedByParent))
		{
			this.#state.docsHydratedByParent[key] = false;
			this.#state.docsStaleByParent[key] = true;
			this.#state.docsOffsetByParent[key] = 0;
			this.#state.docsCursorByParent[key] = null;
			this.#state.docsHasNextPageByParent[key] = true;
		}
	}

	// Cascade reset for an entire collection — used when a cascade push requests refetch
	// and the loaded sub-branches under the root must also be invalidated.
	invalidateCollectionTree(collectionId: number): void
	{
		const cid = Number(collectionId);
		if (!Number.isFinite(cid) || cid <= 0)
		{
			return;
		}
		const prefix = `${cid}:`;
		for (const key of Object.keys(this.#state.docsByParent))
		{
			if (!key.startsWith(prefix))
			{
				continue;
			}
			this.#state.docsByParent[key] = [];
			this.#state.docsHydratedByParent[key] = false;
			this.#state.docsStaleByParent[key] = true;
			this.#state.docsOffsetByParent[key] = 0;
			this.#state.docsCursorByParent[key] = null;
			this.#state.docsHasNextPageByParent[key] = true;
		}
	}

	// Drop child-branch caches keyed by every id in `parentIds` — used after cascade
	// archive/delete so loaded sub-branches under each removed doc are also flushed.
	invalidateBranchesByParentIds(collectionId: number, parentIds: Array<number>): void
	{
		const cid = Number(collectionId);
		if (!Number.isFinite(cid) || cid <= 0 || !Array.isArray(parentIds))
		{
			return;
		}
		for (const rawId of parentIds)
		{
			const pid = Number(rawId);
			if (!Number.isFinite(pid) || pid <= 0)
			{
				continue;
			}
			const key = this.#keyOf(cid, pid);
			if (this.#state.docsByParent[key] === undefined)
			{
				continue;
			}
			this.#state.docsByParent[key] = [];
			this.#state.docsHydratedByParent[key] = false;
			this.#state.docsStaleByParent[key] = true;
			this.#state.docsOffsetByParent[key] = 0;
			this.#state.docsCursorByParent[key] = null;
			this.#state.docsHasNextPageByParent[key] = true;
		}
	}

	#setParentHasChildren(collectionId: number, parentId: number | null, value: boolean): void
	{
		const normalizedParentId = this.#normalizeParentId(parentId);
		if (normalizedParentId === null)
		{
			return;
		}

		const changed = this.#updateDocumentInCollection(collectionId, (doc) => {
			if (Number(doc.id) !== Number(normalizedParentId) || Boolean(doc.hasChildren) === Boolean(value))
			{
				return doc;
			}

			return { ...doc, hasChildren: Boolean(value) };
		});
	}

	setParentHasChildrenLocal(collectionId: number, parentId: number | null, value: boolean): void
	{
		this.#setParentHasChildren(collectionId, parentId, value);
	}

	insertDocumentLocal(doc: mixed, options: { forceCreateBranch?: boolean } = {}): SidebarDocument | null
	{
		const normalized = normalizeDocumentForStore(doc, this.#normalizeParentId);
		if (!normalized)
		{
			return null;
		}

		const parentId = this.#normalizeParentId(normalized.parentId);
		if (!this.#queries.isBranchLoaded(normalized.collectionId, parentId) && !options.forceCreateBranch)
		{
			if (parentId !== null)
			{
				this.#setParentHasChildren(normalized.collectionId, parentId, true);
			}

			return normalized;
		}

		const key = this.#keyOf(normalized.collectionId, parentId);
		const docs = [...(this.#state.docsByParent[key] || [])];
		const existingIndex = docs.findIndex((item) => Number(item.id) === Number(normalized.id));
		if (existingIndex >= 0)
		{
			docs[existingIndex] = { ...docs[existingIndex], ...normalized };
		}
		else
		{
			docs.push(normalized);
		}

		this.#setBranchDocs(normalized.collectionId, parentId, sortDocuments(docs));
		if (parentId !== null)
		{
			this.#setParentHasChildren(normalized.collectionId, parentId, true);
		}

		return normalized;
	}

	// Applies a documentUpdate push payload to local docs. Idempotent:
	// patches by id across every loaded branch via updateDocumentLocal.
	applyDocumentUpdate(params: Object): boolean
	{
		if (!params || typeof params !== 'object')
		{
			return false;
		}

		const documentId = Number(params.documentId);
		if (!Number.isFinite(documentId) || documentId <= 0)
		{
			return false;
		}

		const patch = {};
		if (typeof params.title === 'string' && params.title !== '')
		{
			patch.title = params.title;
		}
		if (Object.keys(patch).length === 0)
		{
			return false;
		}

		const collectionId = Number(params.collectionId);
		const options = Number.isFinite(collectionId) && collectionId > 0 ? { collectionId } : {};

		return this.updateDocumentLocal(documentId, patch, options);
	}

	// forceCreateBranch is intentionally absent: materialising a collapsed
	// branch from a single sibling would mask the rest until full reload.
	applyDocumentCreate(params: Object): boolean
	{
		if (!params || typeof params !== 'object')
		{
			return false;
		}

		const documentId = Number(params.documentId);
		const collectionId = Number(params.collectionId);
		if (!Number.isFinite(documentId) || documentId <= 0)
		{
			return false;
		}
		if (!Number.isFinite(collectionId) || collectionId <= 0)
		{
			return false;
		}

		const parentId = this.#normalizeParentId(params.parentId);
		const position = Number.isFinite(Number(params.position)) ? Number(params.position) : 0;
		const title = typeof params.title === 'string' ? params.title : '';
		const hasChildren = params.hasChildren === true;

		const inserted = this.insertDocumentLocal({
			id: documentId,
			collectionId,
			parentId,
			position,
			title,
			hasChildren,
		});

		return inserted !== null;
	}

	// Applies a documentRestore push payload. Idempotent:
	// upserts the doc into the loaded branch by id. For Phase 1 wired to
	// DOCUMENT_RESTORE only — Phase 2 will add DOCUMENT_CREATE.
	applyDocumentActive(params: Object): boolean
	{
		if (!params || typeof params !== 'object')
		{
			return false;
		}

		const documentId = Number(params.documentId);
		const collectionId = Number(params.collectionId);
		if (!Number.isFinite(documentId) || documentId <= 0)
		{
			return false;
		}
		if (!Number.isFinite(collectionId) || collectionId <= 0)
		{
			return false;
		}

		const parentId = this.#normalizeParentId(params.parentId);
		const position = Number.isFinite(Number(params.position)) ? Number(params.position) : 0;
		const title = typeof params.title === 'string' ? params.title : '';
		const hasChildren = params.hasChildren === true;

		const inserted = this.insertDocumentLocal(
			{
				id: documentId,
				collectionId,
				parentId,
				position,
				title,
				hasChildren,
			},
			{ forceCreateBranch: true },
		);

		return inserted !== null;
	}

	// Applies a documentArchive / documentDelete push payload. Both events
	// share the same "remove these ids from sidebar" shape — only the editor
	// reacts differently (archived vs recycle-bin freeze).
	async applyDocumentRemoval(params: Object): Promise<boolean>
	{
		if (!params || typeof params !== 'object')
		{
			return false;
		}

		const collectionId = Number(params.collectionId);
		if (!Number.isFinite(collectionId) || collectionId <= 0)
		{
			return false;
		}

		if (params.requestRefetch === true)
		{
			// Tree-wide invalidate: the cascade may have pruned sub-branches that were already
			// hydrated under collapsed parents — a root-only reset would leave stale child caches.
			this.invalidateCollectionTree(collectionId);
			await this.loadDocuments(collectionId, null, false);

			return true;
		}

		const documentIds = Array.isArray(params.documentIds) ? params.documentIds : null;
		if (!documentIds || documentIds.length === 0)
		{
			return false;
		}

		let removed = false;
		for (const rawId of documentIds)
		{
			const documentId = Number(rawId);
			if (!Number.isFinite(documentId) || documentId <= 0)
			{
				continue;
			}

			const located = this.#queries.findLoadedDocumentAnywhere(documentId);
			const parentId = located ? this.#normalizeParentId(located.parentId) : null;
			if (this.removeDocumentLocal(collectionId, parentId, documentId))
			{
				removed = true;
			}
		}

		// Each removed doc may itself parent a hydrated branch — drop those caches so a later
		// expand doesn't render documents already swept by the cascade.
		this.invalidateBranchesByParentIds(collectionId, documentIds);

		return removed;
	}

	// Applies a list of {id, position} entries across loaded branches and
	// resorts those branches. Symmetric with applyCollectionPositions.
	applyDocumentPositions(entries: Array<{ id: number, position: number }>): boolean
	{
		if (!Array.isArray(entries) || entries.length === 0)
		{
			return false;
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
			return false;
		}

		let changed = false;
		for (const [key, docs] of Object.entries(this.#state.docsByParent))
		{
			if (!Array.isArray(docs))
			{
				continue;
			}

			let branchChanged = false;
			const nextDocs = docs.map((doc) => {
				const id = Number(doc?.id);
				if (!patchById.has(id))
				{
					return doc;
				}

				branchChanged = true;

				return { ...doc, position: patchById.get(id) };
			});
			if (!branchChanged)
			{
				continue;
			}

			this.#state.docsByParent[key] = sortDocuments(nextDocs);
			changed = true;
		}

		return changed;
	}

	// Applies a documentMove push payload. Handles two shapes:
	// - requestRefetch=true: fall back to invalidate+reload of both branches.
	// - Standard: optimistic move + applyDocumentPositions for siblings.
	async applyDocumentMove(params: Object): Promise<boolean>
	{
		if (!params || typeof params !== 'object')
		{
			return false;
		}

		const documentId = Number(params.documentId);
		const toCollectionId = Number(params.collectionId);
		if (
			!Number.isFinite(documentId) || documentId <= 0
			|| !Number.isFinite(toCollectionId) || toCollectionId <= 0
		)
		{
			return false;
		}

		const fromCollectionId = Number.isFinite(Number(params.fromCollectionId))
			? Number(params.fromCollectionId)
			: toCollectionId;
		const toParentId = this.#normalizeParentId(params.parentId);
		const fromParentId = this.#normalizeParentId(params.fromParentId);

		if (params.requestRefetch === true)
		{
			this.invalidateBranch(fromCollectionId, fromParentId);
			if (fromCollectionId !== toCollectionId || fromParentId !== toParentId)
			{
				this.invalidateBranch(toCollectionId, toParentId);
			}

			const reloads = [this.loadDocuments(fromCollectionId, fromParentId, false)];
			if (fromCollectionId !== toCollectionId || fromParentId !== toParentId)
			{
				reloads.push(this.loadDocuments(toCollectionId, toParentId, false));
			}
			await Promise.all(reloads);

			return true;
		}

		const fallbackDoc = {
			id: documentId,
			collectionId: toCollectionId,
			parentId: toParentId,
			position: Number.isFinite(Number(params.position)) ? Number(params.position) : 0,
			title: typeof params.title === 'string' ? params.title : '',
			hasChildren: Boolean(params.hasChildren),
		};

		const moved = this.moveDocumentLocal({
			docId: documentId,
			fromCollectionId,
			fromParentId,
			toCollectionId,
			toParentId,
			fallbackDoc,
		});

		if (Array.isArray(params.affectedPositions) && params.affectedPositions.length > 0)
		{
			this.applyDocumentPositions(params.affectedPositions);
		}

		// Server tells us authoritatively whether fromParent still has children —
		// covers the case where receiver never loaded that branch, so local
		// `handleParentBecameEmpty` can't decide.
		if (fromParentId !== null && typeof params.fromParentHasChildren === 'boolean')
		{
			this.#setParentHasChildren(fromCollectionId, fromParentId, params.fromParentHasChildren);
		}

		return moved !== null;
	}

	updateDocumentLocal(docId: number, patch: Object = {}, options: { collectionId?: number } = {}): boolean
	{
		const normalizedDocId = Number(docId);
		if (!Number.isFinite(normalizedDocId) || normalizedDocId <= 0)
		{
			return false;
		}

		const normalizedCollectionId = Number(options.collectionId || 0);
		const keyPrefix = normalizedCollectionId > 0 ? `${normalizedCollectionId}:` : '';
		let changed = false;

		for (const [key, docs] of Object.entries(this.#state.docsByParent))
		{
			if (!Array.isArray(docs) || (keyPrefix && !key.startsWith(keyPrefix)))
			{
				continue;
			}

			let branchChanged = false;
			const nextDocs = docs.map((currentDoc) => {
				if (Number(currentDoc.id) !== normalizedDocId)
				{
					return currentDoc;
				}

				branchChanged = true;

				return { ...currentDoc, ...patch };
			});
			if (!branchChanged)
			{
				continue;
			}

			this.#state.docsByParent[key] = nextDocs;
			changed = true;
		}

		return changed;
	}

	removeDocumentLocal(collectionId: number, parentId: number | null, docId: number): boolean
	{
		const normalizedCollectionId = Number(collectionId);
		const normalizedParentId = this.#normalizeParentId(parentId);
		const normalizedDocId = Number(docId);
		if (
			!Number.isFinite(normalizedCollectionId)
			|| normalizedCollectionId <= 0
			|| !Number.isFinite(normalizedDocId)
			|| normalizedDocId <= 0
		)
		{
			return false;
		}

		const descendants = this.#collectLoadedDescendantIds(normalizedCollectionId, normalizedDocId);
		const idsToDelete = new Set([normalizedDocId, ...descendants]);
		const keyPrefix = `${normalizedCollectionId}:`;
		let removed = false;

		for (const [key, docs] of Object.entries(this.#state.docsByParent))
		{
			if (!key.startsWith(keyPrefix) || !Array.isArray(docs))
			{
				continue;
			}

			const nextDocs = docs.filter((item) => !idsToDelete.has(Number(item.id)));
			if (nextDocs.length === docs.length)
			{
				continue;
			}

			this.#state.docsByParent[key] = nextDocs;
			this.#state.docsOffsetByParent[key] = nextDocs.length;
			removed = true;
		}

		for (const id of idsToDelete)
		{
			delete this.#state.expandedDocs[id];
			this.#removeBranch(normalizedCollectionId, id);
		}

		if (removed)
		{
			this.#handleParentBecameEmpty(normalizedCollectionId, normalizedParentId);
		}

		return removed;
	}

	moveDocumentLocal({
		docId,
		fromCollectionId,
		fromParentId,
		toCollectionId,
		toParentId,
		placement = 'inside',
		targetId = null,
		fallbackDoc = null,
	}: {
		docId: number,
		fromCollectionId: number,
		fromParentId: number | null,
		toCollectionId: number,
		toParentId: number | null,
		placement?: string,
		targetId?: number | null,
		fallbackDoc?: SidebarDocument | null,
	}): SidebarDocument | null
	{
		const normalizedDocId = Number(docId);
		const fromCollection = Number(fromCollectionId);
		const toCollection = Number(toCollectionId);
		const fromParent = this.#normalizeParentId(fromParentId);
		const toParent = this.#normalizeParentId(toParentId);

		const collectionChanged = fromCollection !== toCollection;
		const descendantsToInvalidate = collectionChanged
			? this.#collectLoadedDescendantIds(fromCollection, normalizedDocId)
			: null;

		let movedDoc = this.#extractDocumentFromBranch(fromCollection, fromParent, normalizedDocId);
		if (!movedDoc)
		{
			movedDoc = this.#queries.findLoadedDocument(fromCollection, normalizedDocId);
		}

		movedDoc = normalizeDocumentForStore(
			movedDoc || fallbackDoc,
			this.#normalizeParentId,
			{
				id: normalizedDocId,
				collectionId: toCollection,
				parentId: toParent,
			},
		);
		if (!movedDoc)
		{
			return null;
		}

		const nextDoc = {
			...movedDoc,
			collectionId: toCollection,
			parentId: toParent,
		};

		this.#insertDocumentIntoBranch(nextDoc, toCollection, toParent, placement, targetId);

		this.#handleParentBecameEmpty(fromCollection, fromParent);

		if (toParent !== null)
		{
			this.#setParentHasChildren(toCollection, toParent, true);
		}

		if (descendantsToInvalidate)
		{
			for (const descId of descendantsToInvalidate)
			{
				this.#removeBranch(fromCollection, descId);
				delete this.#state.expandedDocs[descId];
			}
		}

		return nextDoc;
	}

	async loadDocuments(collectionId: number, parentId: number | null = null, append: boolean = false): Promise<void>
	{
		const key = this.#keyOf(collectionId, parentId);
		if (!append && this.#state.docsRequestByParent[key])
		{
			await this.#state.docsRequestByParent[key];

			return;
		}

		const request = this.#loadDocumentsRequest(collectionId, parentId, append, key);
		if (append)
		{
			await request;

			return;
		}

		this.#state.docsRequestByParent[key] = request;
		try
		{
			await request;
		}
		finally
		{
			if (this.#state.docsRequestByParent[key] === request)
			{
				delete this.#state.docsRequestByParent[key];
			}
		}
	}

	async prefetchChildren(collectionId: number, parentId: number | null = null): Promise<void>
	{
		if (this.#queries.isChildrenHydrated(collectionId, parentId))
		{
			return;
		}

		await this.loadDocuments(collectionId, parentId, false);
	}

	async ensureChildrenLoaded(collectionId: number, parentId: number | null = null): Promise<void>
	{
		await this.prefetchChildren(collectionId, parentId);
	}

	#updateDocumentInCollection(collectionId: number, updater: (doc: SidebarDocument) => SidebarDocument): boolean
	{
		const keyPrefix = `${Number(collectionId)}:`;
		let changed = false;
		for (const [key, docs] of Object.entries(this.#state.docsByParent))
		{
			if (!key.startsWith(keyPrefix) || !Array.isArray(docs))
			{
				continue;
			}

			let branchChanged = false;
			const nextDocs = docs.map((doc) => {
				const nextDoc = updater(doc);
				if (nextDoc !== doc)
				{
					branchChanged = true;
				}

				return nextDoc;
			});
			if (!branchChanged)
			{
				continue;
			}

			this.#state.docsByParent[key] = nextDocs;
			changed = true;
		}

		return changed;
	}

	#collectLoadedDescendantIds(collectionId: number, docId: number): Set<number>
	{
		const descendants = new Set();
		const stack = [Number(docId)];
		while (stack.length > 0)
		{
			const currentId = stack.pop();
			if (!Number.isFinite(currentId))
			{
				continue;
			}

			const children = this.#queries.getChildren(collectionId, currentId);
			for (const child of children)
			{
				const childId = Number(child.id);
				if (!Number.isFinite(childId) || descendants.has(childId))
				{
					continue;
				}

				descendants.add(childId);
				stack.push(childId);
			}
		}

		return descendants;
	}

	#extractDocumentFromBranch(collectionId: number, parentId: number | null, docId: number): SidebarDocument | null
	{
		const key = this.#keyOf(collectionId, parentId);
		const docs = this.#state.docsByParent[key];
		if (!Array.isArray(docs))
		{
			return null;
		}

		const index = docs.findIndex((item) => Number(item.id) === Number(docId));
		if (index < 0)
		{
			return null;
		}

		const removed = docs[index];
		const nextDocs = [...docs.slice(0, index), ...docs.slice(index + 1)];
		this.#state.docsByParent[key] = nextDocs;
		this.#state.docsOffsetByParent[key] = nextDocs.length;

		return removed;
	}

	#handleParentBecameEmpty(collectionId: number, parentId: number | null): boolean
	{
		const normalizedCollectionId = Number(collectionId);
		const normalizedParentId = this.#normalizeParentId(parentId);
		if (
			!Number.isFinite(normalizedCollectionId)
			|| normalizedCollectionId <= 0
			|| normalizedParentId === null
		)
		{
			return false;
		}

		if (!this.#queries.isBranchLoaded(normalizedCollectionId, normalizedParentId))
		{
			return false;
		}

		const siblings = this.#queries.getChildren(normalizedCollectionId, normalizedParentId);
		if (siblings.length > 0)
		{
			return false;
		}

		this.#setParentHasChildren(normalizedCollectionId, normalizedParentId, false);
		delete this.#state.expandedDocs[normalizedParentId];

		return true;
	}

	#insertDocumentIntoBranch(
		doc: SidebarDocument,
		collectionId: number,
		parentId: number | null,
		placement: string = 'inside',
		targetId: number | null = null,
	): boolean
	{
		if (!this.#queries.isBranchLoaded(collectionId, parentId))
		{
			return false;
		}

		const key = this.#keyOf(collectionId, parentId);
		const docs = [...(this.#state.docsByParent[key] || [])].filter((item) => Number(item.id) !== Number(doc.id));
		let insertIndex = docs.length;
		if ((placement === 'before' || placement === 'after') && Number.isFinite(Number(targetId)))
		{
			const targetIndex = docs.findIndex((item) => Number(item.id) === Number(targetId));
			if (targetIndex >= 0)
			{
				insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
			}
		}

		docs.splice(insertIndex, 0, doc);
		this.#setBranchDocs(collectionId, parentId, docs);

		return true;
	}

	#mergeDocs(base: Array<Object>, incoming: Array<Object>): Array<SidebarDocument>
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

		return sortDocuments([...byId.values()]);
	}

	async #loadDocumentsRequest(
		collectionId: number,
		parentId: number | null,
		append: boolean,
		key: string,
	): Promise<void>
	{
		this.#state.docsLoadingByParent[key] = true;

		try
		{
			const hasCursor = (this.#state.docsCursorByParent[key] || null) !== null;
			const effectiveAppend = append && hasCursor;
			const cursor = effectiveAppend ? this.#state.docsCursorByParent[key] : null;
			const response = await this.#api.listDocumentsByParent(collectionId, parentId, { limit: PAGE_SIZE, cursor });
			this.#state.docsByParent[key] = effectiveAppend
				? this.#mergeDocs(this.#state.docsByParent[key] || [], response.items)
				: sortDocuments(response.items);
			this.#state.docsOffsetByParent[key] = this.#state.docsByParent[key].length;
			this.#state.docsCursorByParent[key] = response.nextCursor || null;
			this.#state.docsHasNextPageByParent[key] = response.hasNextPage;
			this.#state.docsHydratedByParent[key] = true;
			this.#state.docsStaleByParent[key] = false;
		}
		catch (error)
		{
			this.#setError(error?.message || 'Documents loading failed');
		}
		finally
		{
			this.#state.docsLoadingByParent[key] = false;
		}
	}
}
