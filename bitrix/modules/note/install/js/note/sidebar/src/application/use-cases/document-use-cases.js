import { Type } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { NoteAnalytics } from 'note.analytics';
import { NoteEvent } from '../../services/note-events';
import { openPickCollectionPopup } from '../../components/pick-collection-popup';
import { captureRowArrival, markSectionMotion } from '../../utils/drop-motion';
import type { SidebarDocument } from '../../type';
import type { SidebarApi } from '../../services/sidebar-api';

export class DocumentUseCases
{
	#api: SidebarApi;
	#dialog: Object;
	#store: Object;
	#uiState: Object;
	#messages: Object;
	#onFail: (error: mixed) => void;
	#router: Object;
	#documentRouteName: string;
	#homeRouteName: string;
	#workspaceRouteName: string;
	#isDragging: () => boolean;
	#getRouteDocumentContext: () => Object | null;
	#reloadRouteDocumentContext: (() => Promise<void>) | null;
	#openingDocumentId: number = 0;
	#handleExternalDocRenamed: Function;
	#handleExternalDocExcerptChanged: Function;
	#handleExternalFavoriteChanged: Function;
	#handleExternalNotifyChanged: Function;
	#handleBulkDocumentsRestored: Function;
	#handleBulkDocumentsChanged: Function;
	#prefetchTimer: ?TimeoutID = null;

	constructor({
		api,
		dialog,
		store,
		uiState,
		messages,
		onFail,
		router,
		routeNames = {},
		isDragging = () => false,
		getRouteDocumentContext,
		reloadRouteDocumentContext = null,
	}: Object)
	{
		this.#api = api;
		this.#dialog = dialog;
		this.#store = store;
		this.#uiState = uiState;
		this.#messages = messages;
		this.#onFail = onFail;
		this.#router = router;
		this.#documentRouteName = routeNames.document || 'document';
		this.#homeRouteName = routeNames.home || 'home';
		this.#workspaceRouteName = routeNames.workspace || 'workspace';
		this.#isDragging = isDragging;
		this.#getRouteDocumentContext = getRouteDocumentContext || (() => null);
		this.#reloadRouteDocumentContext = reloadRouteDocumentContext;

		this.#handleExternalDocRenamed = (event) => {
			const { id, title, collectionId } = event.getData();
			this.#store.actions.updateDocumentLocal(
				Number(id),
				{ title },
				{ collectionId: Number(collectionId) },
			);
		};
		EventEmitter.subscribe(NoteEvent.DOCUMENT_RENAMED, this.#handleExternalDocRenamed);

		// The editor has just materialized the text and brought back its card preview: adopt it in the
		// loaded branches instead of asking for the list again. An empty string is the preview of a document
		// whose text was deleted, so the type decides whether to patch, not the truthiness.
		this.#handleExternalDocExcerptChanged = (event) => {
			const { documentId, collectionId, excerpt } = event?.getData?.() ?? {};
			if (typeof excerpt !== 'string')
			{
				return;
			}

			this.#store.actions.updateDocumentLocal(
				Number(documentId),
				{ excerpt },
				{ collectionId: Number(collectionId) },
			);
		};
		EventEmitter.subscribe(NoteEvent.DOCUMENT_EXCERPT_CHANGED, this.#handleExternalDocExcerptChanged);

		// A star pressed outside the sidebar (activity line of the editor, knowledge base page): adopt the
		// flag now instead of waiting for the pull round-trip, the same way a rename is adopted.
		this.#handleExternalFavoriteChanged = (event) => {
			this.#store.actions.applyExternalFavorite(event.getData() || {});
		};
		EventEmitter.subscribe(NoteEvent.FAVORITE_CHANGED, this.#handleExternalFavoriteChanged);

		// Same for the bell: pressed in the editor or on the knowledge base page, it has to reach the row
		// of the block now rather than on the pull round-trip.
		this.#handleExternalNotifyChanged = (event) => {
			this.#store.actions.applyExternalNotify(event?.getData?.() ?? {});
		};
		EventEmitter.subscribe(NoteEvent.SUBSCRIPTION_CHANGED, this.#handleExternalNotifyChanged);

		this.#handleBulkDocumentsRestored = async (event) => {
			const data = event.getData() || {};
			const restoredCollections = Array.isArray(data.restoredCollections) ? data.restoredCollections : [];
			restoredCollections.forEach((collection) => this.#ensureCollectionInStore(collection));

			await this.#refreshLoadedBranches();
		};
		EventEmitter.subscribe(NoteEvent.DOCUMENTS_BULK_RESTORED, this.#handleBulkDocumentsRestored);

		this.#handleBulkDocumentsChanged = async () => {
			// Bulk archive/delete/move on the workspace page: same broad refresh as a
			// restore — the initiator never receives the corresponding pull payload.
			await this.#refreshLoadedBranches();
		};
		EventEmitter.subscribe(NoteEvent.DOCUMENTS_BULK_CHANGED, this.#handleBulkDocumentsChanged);
	}

	// Every subscription of the constructor, undone. The sidebar is mounted more than once in a session,
	// and these listeners are global: one left behind keeps the store of the dead mount alive and goes on
	// answering into it, so a single star pressed elsewhere costs a reactive update - and, for the bulk
	// events, a full re-read of every loaded branch - once per mount there has ever been.
	destroy(): void
	{
		clearTimeout(this.#prefetchTimer);
		this.#prefetchTimer = null;

		EventEmitter.unsubscribe(NoteEvent.DOCUMENT_RENAMED, this.#handleExternalDocRenamed);
		EventEmitter.unsubscribe(NoteEvent.DOCUMENT_EXCERPT_CHANGED, this.#handleExternalDocExcerptChanged);
		EventEmitter.unsubscribe(NoteEvent.FAVORITE_CHANGED, this.#handleExternalFavoriteChanged);
		EventEmitter.unsubscribe(NoteEvent.SUBSCRIPTION_CHANGED, this.#handleExternalNotifyChanged);
		EventEmitter.unsubscribe(NoteEvent.DOCUMENTS_BULK_RESTORED, this.#handleBulkDocumentsRestored);
		EventEmitter.unsubscribe(NoteEvent.DOCUMENTS_BULK_CHANGED, this.#handleBulkDocumentsChanged);
	}

	// Invalidate every hydrated branch and eagerly reload the expanded collections so the
	// user sees the new tree state without having to re-interact.
	async #refreshLoadedBranches(): Promise<void>
	{
		this.#store.actions.invalidateAllChildren();

		const expandedCollectionIds = Object.keys(this.#uiState.expandedCollections)
			.filter((id) => this.#uiState.expandedCollections[id])
			.map((id) => Number(id))
			.filter((id) => Number.isInteger(id) && id > 0)
		;
		await Promise.all(
			expandedCollectionIds.map((id) => this.#store.actions.ensureChildrenLoaded(id, null)),
		);
	}

	canEditDocument(doc: SidebarDocument): boolean
	{
		const collectionId = Number(doc?.collectionId);

		return this.#canEditCollection(collectionId);
	}

	canManageDocument(doc: SidebarDocument): boolean
	{
		const collectionId = Number(doc?.collectionId);
		if (this.#canEditCollection(collectionId))
		{
			return true;
		}

		// archived/shared docs: collection isn't in sidebar store, trust the per-doc flag from backend
		return Boolean(doc?.canEditCollection);
	}

	canManageDocumentPermissions(doc: SidebarDocument): boolean
	{
		const collectionId = Number(doc?.collectionId);

		return this.#canManagePermissionsInCollection(collectionId);
	}

	// [P2] Accessible-tree ("Shared with me") section. DnD is forced off here; TreeNode couples the
	// create-child affordance to the same canManage gate, so with DnD off create-child is off in this
	// section too — a deliberate trade-off since TreeNode must stay untouched (only props change).
	async toggleSharedSection(): Promise<void>
	{
		await this.#store.actions.toggleSharedSection();
	}

	async ensureSharedLoaded(): Promise<void>
	{
		await this.#store.actions.ensureSharedLoaded();
	}

	async loadMoreSharedTree(): Promise<void>
	{
		await this.#store.actions.loadMoreSharedTree();
	}

	toggleSharedDoc(doc: SidebarDocument): void
	{
		this.#store.actions.toggleSharedDocExpanded(doc);
	}

	toggleSharedContainer(collectionId: number): void
	{
		this.#store.actions.toggleSharedContainer(collectionId);
	}

	// Same debounce as prefetchDocumentChildren: a hover across the tree must not fire a request
	// per row, and an already-loaded branch is served from the namespace.
	prefetchSharedDocumentChildren(doc: SidebarDocument | null): void
	{
		clearTimeout(this.#prefetchTimer);

		if (!doc)
		{
			return;
		}

		const collectionId = Number(doc.collectionId);
		const parentId = Number(doc.id);
		const hasLoadedChildren = this.#store.queries.getSharedChildren(collectionId, parentId).length > 0;
		if (!doc.hasChildren && !hasLoadedChildren)
		{
			return;
		}

		this.#prefetchTimer = setTimeout(() => {
			void this.#store.actions.prefetchSharedChildren(doc);
		}, 300);
	}

	async loadMoreSharedChildren(doc: SidebarDocument): Promise<void>
	{
		await this.#store.actions.loadMoreSharedChildren(doc);
	}

	async openDocument(doc: SidebarDocument): Promise<void>
	{
		const documentId = Number(doc.id);
		if (!Number.isInteger(documentId) || documentId <= 0)
		{
			return;
		}

		if (this.#openingDocumentId === documentId)
		{
			return;
		}

		if (this.#getRouteDocumentId() === documentId)
		{
			return;
		}

		this.#openingDocumentId = documentId;
		try
		{
			await this.#router.push({
				name: this.#documentRouteName,
				params: { id: documentId },
			});
		}
		finally
		{
			if (this.#openingDocumentId === documentId)
			{
				this.#openingDocumentId = 0;
			}
		}
	}

	prefetchDocumentChildren(doc: SidebarDocument | null): void
	{
		clearTimeout(this.#prefetchTimer);

		if (!doc || this.#isDragging())
		{
			return;
		}

		const collectionId = Number(doc.collectionId);
		const parentId = Number(doc.id);
		const hasLoadedChildren = this.#store.queries.getChildren(collectionId, parentId).length > 0;
		if (!doc.hasChildren && !hasLoadedChildren)
		{
			return;
		}

		this.#prefetchTimer = setTimeout(() => {
			this.#store.actions.prefetchChildren(collectionId, parentId);
		}, 300);
	}

	async toggleDoc(doc: SidebarDocument): Promise<void>
	{
		await this.#store.actions.toggleDocExpanded(doc);
	}

	async loadMoreChildren(doc: SidebarDocument): Promise<void>
	{
		await this.#store.actions.loadDocuments(
			Number(doc.collectionId),
			doc.id === null || doc.id === undefined ? null : Number(doc.id),
			true,
		);
	}

	async createDocument(): Promise<void>
	{
		const collectionId = this.#store.state.selectedCollectionId.value;
		if (!collectionId)
		{
			return;
		}

		if (!this.#canEditCollection(collectionId))
		{
			return;
		}

		await this.confirmCreateDocument(collectionId, null, this.#messages.promptDocumentName);
	}

	async createDocumentFromSidebar(): Promise<void>
	{
		try
		{
			const { items, hasMore } = await this.#api.listManageableCollections(2);
			if (Array.isArray(items) && items.length === 1 && !hasMore)
			{
				await this.#createDocumentInCollection(Number(items[0].id));

				return;
			}

			const canCreateCollection = Boolean(
				this.#store.state.globalPermissions?.canEditCollections,
			);
			const picked = await openPickCollectionPopup({
				api: this.#api,
				store: this.#store,
				canCreateCollection,
				onFail: this.#onFail,
			});

			if (!picked)
			{
				return;
			}

			await this.#createDocumentInCollection(Number(picked.collectionId));
		}
		catch (error)
		{
			this.#onFail(error);
		}
	}

	async #createDocumentInCollection(collectionId: number): Promise<void>
	{
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			return;
		}

		await this.#store.actions.selectCollection(collectionId);
		this.#uiState.expandedCollections[collectionId] = true;
		await this.confirmCreateDocument(collectionId, null, this.#messages.promptDocumentName);
	}

	async createDocumentForCollection(collection: Object | null): Promise<void>
	{
		if (!collection)
		{
			return;
		}

		if (!this.#canEditCollection(Number(collection.id)))
		{
			return;
		}

		await this.#store.actions.selectCollection(collection.id);
		this.#uiState.expandedCollections[Number(collection.id)] = true;
		await this.confirmCreateDocument(Number(collection.id), null, this.#messages.promptDocumentName);
	}

	async createChildDocument(doc: SidebarDocument | null): Promise<void>
	{
		if (!doc)
		{
			return;
		}

		const collectionId = Number(doc.collectionId);
		if (!this.#canEditCollection(collectionId))
		{
			return;
		}

		const parentId = Number(doc.id);
		this.#store.state.expandedDocs[parentId] = true;
		await this.confirmCreateDocument(collectionId, parentId, this.#messages.promptDocumentName);
	}

	async confirmCreateDocument(collectionId: number, parentId: number | null, title: string): Promise<void>
	{
		if (!title)
		{
			return;
		}

		try
		{
			const doc = await this.#api.createDocument(collectionId, title, parentId);
			const nextPosition = this.#store.queries.getChildren(collectionId, parentId).length + 1;
			// The list as it stands before the row joins it: the rows under the place it takes have a row of
			// height to give up, and the section a row of height to grow by. Left to the render alone, both
			// happened in a single frame.
			const arrival = captureRowArrival(parentId);
			const insertedDoc = this.#store.actions.insertDocumentLocal(
				{
					...doc,
					collectionId,
					parentId,
					title,
					position: Number(doc?.position || nextPosition),
					hasChildren: Boolean(doc?.hasChildren ?? false),
				},
				{ forceCreateBranch: true },
			);
			arrival?.play();
			markSectionMotion(document.querySelector('.sidebar'));
			EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new BaseEvent({
				data: { id: Number(insertedDoc?.id || doc?.id), title, collectionId },
			}));

			if (parentId !== null)
			{
				EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new BaseEvent({
					data: { parentId, collectionId },
				}));
			}

			if (Number(insertedDoc?.id) > 0)
			{
				await this.openDocument(insertedDoc);
				const routeContext = this.#getRouteDocumentContext();
				if (routeContext)
				{
					routeContext.autoEdit = true;
				}
			}
		}
		catch (error)
		{
			this.#onFail(error);
		}
	}

	// Standalone from confirmCreateDocument: throws on failure so the caller (file drop
	// service) can keep processing the rest of a multi-file set without a shared onFail.
	async createDocumentFromMarkdownFile(
		collectionId: number,
		parentId: number | null,
		title: string,
		markdown: string,
		{ open = false }: { open?: boolean } = {},
	): Promise<SidebarDocument>
	{
		if (parentId !== null)
		{
			this.#store.state.expandedDocs[parentId] = true;
		}
		else
		{
			this.#uiState.expandedCollections[collectionId] = true;
		}

		const doc = await this.#api.createDocument(collectionId, title, parentId, markdown);
		const nextPosition = this.#store.queries.getChildren(collectionId, parentId).length + 1;
		const insertedDoc = this.#store.actions.insertDocumentLocal(
			{
				...doc,
				collectionId,
				parentId,
				title,
				position: Number(doc?.position || nextPosition),
				hasChildren: Boolean(doc?.hasChildren ?? false),
			},
			{ forceCreateBranch: true },
		);
		EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new BaseEvent({
			data: { id: Number(insertedDoc?.id || doc?.id), title, collectionId },
		}));

		if (parentId !== null)
		{
			EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new BaseEvent({
				data: { parentId, collectionId },
			}));
		}

		if (open && Number(insertedDoc?.id) > 0)
		{
			await this.openDocument(insertedDoc);
			const routeContext = this.#getRouteDocumentContext();
			if (routeContext)
			{
				routeContext.autoEdit = true;
			}
		}

		return insertedDoc;
	}

	renameDocument(doc: SidebarDocument): void
	{
		if (!this.canEditDocument(doc))
		{
			return;
		}

		this.#uiState.renamingDocId = Number(doc.id);
	}

	async confirmRenameDocument(docId: number, newTitle: string, collectionId: number): Promise<void>
	{
		this.#uiState.renamingDocId = null;
		if (!newTitle)
		{
			return;
		}

		try
		{
			await this.#api.updateDocument(Number(docId), newTitle);
			NoteAnalytics.documentUpdated(true);
			this.#store.actions.updateDocumentLocal(
				Number(docId),
				{ title: newTitle },
				{ collectionId: Number(collectionId) },
			);
			EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new BaseEvent({
				data: { id: Number(docId), title: newTitle, collectionId: Number(collectionId) },
			}));
		}
		catch (error)
		{
			NoteAnalytics.documentUpdated(false);
			this.#onFail(error);
		}
	}

	cancelRenameDocument(): void
	{
		this.#uiState.renamingDocId = null;
	}

	async restoreDocument(doc: SidebarDocument): Promise<void>
	{
		if (!this.canManageDocument(doc))
		{
			return;
		}

		const documentId = Number(doc.id);
		if (!Number.isInteger(documentId) || documentId <= 0)
		{
			return;
		}

		try
		{
			const restored = await this.#api.restoreDocument(documentId);

			if (restored && Number(restored.id) > 0)
			{
				this.#ensureCollectionInStore(restored.restoredCollection);

				const restoredDoc = {
					...restored,
					id: Number(restored.id),
					collectionId: Number(restored.collectionId),
					parentId: restored.parentId === null || restored.parentId === undefined || restored.parentId === ''
						? null
						: Number(restored.parentId),
					title: String(restored.title ?? doc.title ?? ''),
					position: Number(restored.position ?? doc.position ?? 0),
					hasChildren: Boolean(restored.hasChildren ?? doc.hasChildren ?? false),
					isArchived: false,
				};
				const inserted = this.#store.actions.insertDocumentLocal(restoredDoc, { forceCreateBranch: true });

				// Expand the collection and ancestor chain so the restored doc is visible.
				this.#uiState.expandedCollections[restoredDoc.collectionId] = true;
				let ancestorId = restoredDoc.parentId;
				const visited = new Set();
				while (Number.isInteger(ancestorId) && ancestorId > 0 && !visited.has(ancestorId))
				{
					visited.add(ancestorId);
					this.#store.state.expandedDocs[ancestorId] = true;
					const ancestorDoc = this.#store.queries.findLoadedDocument(restoredDoc.collectionId, ancestorId);
					ancestorId = ancestorDoc?.parentId === null || ancestorDoc?.parentId === undefined
						? null
						: Number(ancestorDoc.parentId);
				}

				if (restoredDoc.parentId !== null)
				{
					EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new BaseEvent({
						data: { parentId: restoredDoc.parentId, collectionId: restoredDoc.collectionId },
					}));
				}

				if (inserted)
				{
					EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new BaseEvent({
						data: {
							id: restoredDoc.id,
							title: restoredDoc.title,
							collectionId: restoredDoc.collectionId,
						},
					}));
				}
			}

			if (this.#getRouteDocumentId() === documentId && this.#reloadRouteDocumentContext)
			{
				await this.#reloadRouteDocumentContext();
			}
		}
		catch (error)
		{
			this.#onFail(error);
		}
	}

	async archiveDocument(doc: SidebarDocument): Promise<void>
	{
		if (!this.canManageDocument(doc))
		{
			return;
		}

		// Offer the "with nested" choice only when the node actually has children; the
		// checkbox defaults to ON (cascade), unchecking it lifts the children one level up.
		const hasChildren = this.#resolveHasChildren(doc);
		const { confirmed, withNested } = await this.#dialog.confirmArchive({
			message: this.#messages.confirmArchiveDocument,
			title: this.#messages.confirmArchiveDocumentTitle,
			confirmText: this.#messages.archiveConfirm,
			offerNested: hasChildren,
			nestedLabel: this.#messages.archiveWithNested,
			nestedDefault: true,
		});
		if (!confirmed)
		{
			return;
		}

		try
		{
			await this.#api.archiveDocument(Number(doc.id), withNested);
			const collectionId = Number(doc.collectionId);
			const parentId = this.#toNullableInt(doc.parentId);
			const shouldLeaveDocumentPage = this.#isRouteDocumentInSubtree(Number(doc.id), collectionId);
			this.#store.actions.removeDocumentLocal(collectionId, parentId, Number(doc.id));

			// Without cascade the direct children were re-hung onto this node's parent
			// (grandparent, or root when parentId is null) — refetch that branch so they resurface.
			if (!withNested && hasChildren)
			{
				this.#store.actions.invalidateBranch(collectionId, parentId);
				await this.#store.actions.loadDocuments(collectionId, parentId, false);
			}

			if (parentId !== null)
			{
				EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new BaseEvent({
					data: { parentId, collectionId },
				}));
			}

			if (shouldLeaveDocumentPage)
			{
				await this.#redirectAfterDocumentRemoval(collectionId);
			}
		}
		catch (error)
		{
			this.#onFail(error);
		}
	}

	async deleteDocument(doc: SidebarDocument): Promise<void>
	{
		if (!this.canManageDocument(doc))
		{
			return;
		}

		// Offer the "with nested" choice only when the node actually has children; the
		// checkbox defaults to ON (cascade), unchecking it lifts the children one level up.
		const hasChildren = this.#resolveHasChildren(doc);
		const { confirmed, withNested } = await this.#dialog.confirmDelete({
			message: this.#messages.confirmDeleteDocument,
			title: this.#messages.confirmDeleteDocumentTitle,
			confirmText: this.#messages.delete,
			offerNested: hasChildren,
			nestedLabel: this.#messages.deleteWithNested,
			nestedDefault: true,
		});
		if (!confirmed)
		{
			return;
		}

		try
		{
			await this.#api.deleteDocument(Number(doc.id), withNested);
			const collectionId = Number(doc.collectionId);
			const parentId = this.#toNullableInt(doc.parentId);
			const shouldLeaveDocumentPage = this.#isRouteDocumentInSubtree(Number(doc.id), collectionId);
			this.#store.actions.removeDocumentLocal(collectionId, parentId, Number(doc.id));

			// Without cascade the direct children were re-hung onto this node's parent
			// (grandparent, or root when parentId is null) — refetch that branch so they resurface.
			if (!withNested && hasChildren)
			{
				this.#store.actions.invalidateBranch(collectionId, parentId);
				await this.#store.actions.loadDocuments(collectionId, parentId, false);
			}

			if (parentId !== null)
			{
				EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new BaseEvent({
					data: { parentId, collectionId },
				}));
			}

			if (shouldLeaveDocumentPage)
			{
				await this.#redirectAfterDocumentRemoval(collectionId);
			}
		}
		catch (error)
		{
			this.#onFail(error);
		}
	}

	async #redirectAfterDocumentRemoval(collectionId: number): Promise<void>
	{
		this.#store.actions.clearDocumentSelection();
		const targetRoute = this.#findCollection(collectionId)
			? { name: this.#workspaceRouteName, params: { id: collectionId } }
			: { name: this.#homeRouteName };
		await this.#router.replace(targetRoute);
	}

	#toNullableInt(value: mixed): number | null
	{
		if (value === null || value === undefined || value === '')
		{
			return null;
		}

		return Number(value);
	}

	// The `get` bootstrap payload (a document already loaded in the sidebar tree) omits
	// hasChildren, while getOpenContext includes it. Trust an explicit boolean on the doc,
	// otherwise fall back to the sidebar store, which carries the flag from list/tree responses.
	#resolveHasChildren(doc: SidebarDocument): boolean
	{
		if (typeof doc?.hasChildren === 'boolean')
		{
			return doc.hasChildren;
		}

		const stored = this.#store.queries.findLoadedDocumentAnywhere(Number(doc?.id));

		return Boolean(stored?.hasChildren);
	}

	#getRouteDocumentId(): number
	{
		const route = this.#router?.currentRoute?.value;
		if (!route || route.name !== this.#documentRouteName)
		{
			return 0;
		}

		const docId = Number(route.params?.id);

		return Number.isInteger(docId) && docId > 0 ? docId : 0;
	}

	#isRouteDocumentInSubtree(rootDocId: number, collectionId: number): boolean
	{
		const normalizedRootId = Number(rootDocId);
		const normalizedCollectionId = Number(collectionId);
		const routeDocId = this.#getRouteDocumentId();
		if (
			!Number.isInteger(normalizedRootId) || normalizedRootId <= 0
			|| !Number.isInteger(normalizedCollectionId) || normalizedCollectionId <= 0
			|| routeDocId <= 0
		)
		{
			return false;
		}

		if (routeDocId === normalizedRootId)
		{
			return true;
		}

		const routeContext = this.#getRouteDocumentContext();
		const routeDoc = routeContext?.document ?? null;
		if (!routeDoc || Number(routeDoc.collectionId) !== normalizedCollectionId)
		{
			return false;
		}

		const visited = new Set([routeDocId]);
		let parentId = this.#toNullableInt(routeDoc.parentId);
		while (parentId !== null && Number.isInteger(parentId) && parentId > 0 && !visited.has(parentId))
		{
			if (parentId === normalizedRootId)
			{
				return true;
			}
			visited.add(parentId);
			const parent = this.#store.queries.findLoadedDocument(normalizedCollectionId, parentId);
			if (!parent)
			{
				return false;
			}
			parentId = this.#toNullableInt(parent.parentId);
		}

		return false;
	}

	#ensureCollectionInStore(restoredCollection: mixed): void
	{
		if (!Type.isPlainObject(restoredCollection))
		{
			return;
		}

		const collectionId = Number(restoredCollection.id);
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			return;
		}

		if (this.#findCollection(collectionId))
		{
			return;
		}

		this.#store.actions.insertCollectionLocal({
			...restoredCollection,
			id: collectionId,
		});

		// Restored collections must appear collapsed so the user doesn't see
		// an expanded node with no loaded children until hover triggers prefetch.
		delete this.#uiState.expandedCollections[collectionId];
	}

	#findCollection(collectionId: number): Object | null
	{
		const normalizedCollectionId = Number(collectionId);
		if (!Number.isInteger(normalizedCollectionId) || normalizedCollectionId <= 0)
		{
			return null;
		}

		return this.#store.state.collections.value.find((item) => Number(item.id) === normalizedCollectionId) ?? null;
	}

	#canEditCollection(collectionId: number): boolean
	{
		return Boolean(this.#findCollection(collectionId)?.canEditCollection);
	}

	#canManagePermissionsInCollection(collectionId: number): boolean
	{
		return Boolean(this.#findCollection(collectionId)?.canManagePermissions);
	}
}
