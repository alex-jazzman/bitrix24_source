import { Type } from 'main.core';

const MAX_BRANCH_LOAD_ITERATIONS = 100;

export class SidebarRouteSyncService
{
	#store: Object;
	#router: Object;
	#uiState: Object;
	#messages: Object;
	#emitAction: (action: string, payload?: Object) => void;
	#getRouteDocumentContext: () => Object | null;
	#hydrateFromInitialContext: (context: Object) => boolean;
	#documentRouteName: string;
	#homeRouteName: string;
	#sharedRouteName: string;
	#archiveRouteName: string;
	#recycleBinRouteName: string;
	#workspaceRouteName: string;
	#searchRouteName: string;

	constructor({
		store,
		router,
		uiState,
		messages,
		emitAction,
		getRouteDocumentContext = () => null,
		hydrateFromInitialContext = null,
		routeNames = {},
	}: {
		store: Object,
		router: Object,
		uiState: Object,
		messages: Object,
		emitAction: (action: string, payload?: Object) => void,
		getRouteDocumentContext?: () => Object | null,
		hydrateFromInitialContext?: ((context: Object) => boolean) | null,
		routeNames?: { document?: string, home?: string, shared?: string, archive?: string, recyclebin?: string, workspace?: string, search?: string },
	})
	{
		this.#store = store;
		this.#router = router;
		this.#uiState = uiState;
		this.#messages = messages;
		this.#emitAction = emitAction;
		this.#getRouteDocumentContext = getRouteDocumentContext;
		this.#hydrateFromInitialContext = hydrateFromInitialContext
			?? ((context) => store.actions.hydrateFromInitialContext(context));
		this.#documentRouteName = routeNames.document || 'document';
		this.#homeRouteName = routeNames.home || 'home';
		this.#sharedRouteName = routeNames.shared || 'shared';
		this.#archiveRouteName = routeNames.archive || 'archive';
		this.#recycleBinRouteName = routeNames.recyclebin || 'recyclebin';
		this.#workspaceRouteName = routeNames.workspace || 'workspace';
		this.#searchRouteName = routeNames.search || 'search';
	}

	async bootstrap({ skipInitialCollectionsLoad = false }: { skipInitialCollectionsLoad?: boolean } = {}): Promise<void>
	{
		if (skipInitialCollectionsLoad)
		{
			this.#subscribeToPullEvents();

			return;
		}

		try
		{
			await this.#store.actions.loadCollections(false);
		}
		catch
		{
			// store already handles load errors
		}

		this.#subscribeToPullEvents();
	}

	#subscribeToPullEvents(): void
	{
		const subscribe = this.#store.actions?.subscribeToPullEvents;
		if (typeof subscribe !== 'function')
		{
			return;
		}

		try
		{
			subscribe();
		}
		catch
		{
			// Pull subscription is best-effort — never break bootstrap.
		}
	}

	destroy(): void
	{
		const unsubscribe = this.#store.actions?.unsubscribeFromPullEvents;
		if (typeof unsubscribe !== 'function')
		{
			return;
		}

		try
		{
			unsubscribe();
		}
		catch
		{
			// Best-effort teardown — never throw on destroy.
		}
	}

	getRouteDocumentId(route: Object = this.#router?.currentRoute?.value): number
	{
		if (!route || route.name !== this.#documentRouteName)
		{
			return 0;
		}

		const docId = Number(route.params?.id);

		return Number.isInteger(docId) && docId > 0 ? docId : 0;
	}

	async syncFromRouteContext(
		withCollectionFallback: boolean = false,
		options: { previousRouteName?: string } = {},
	): Promise<void>
	{
		const previousRouteName = String(options?.previousRouteName || '');
		const currentRouteName = String(this.#router?.currentRoute?.value?.name || '');
		if (currentRouteName === this.#sharedRouteName)
		{
			this.#store.actions.setSharedView(true);

			return;
		}

		if (currentRouteName === this.#archiveRouteName)
		{
			this.#store.actions.setArchiveView(true);

			return;
		}

		if (currentRouteName === this.#recycleBinRouteName)
		{
			this.#store.actions.setRecycleBinView(true);

			return;
		}

		this.#store.actions.setSharedView(false);
		this.#store.actions.setArchiveView(false);
		this.#store.actions.setRecycleBinView(false);

		if (currentRouteName === this.#searchRouteName)
		{
			// Search page does not belong to any collection — clear selection so
			// no sidebar item gets highlighted as active.
			this.#store.actions.clearSelection();

			return;
		}

		if (currentRouteName === this.#workspaceRouteName)
		{
			await this.#syncWorkspaceRoute();

			return;
		}

		const context = this.#getRouteDocumentContext();
		const status = String(context?.status || 'idle');
		const routeDocId = Number(context?.docId || this.getRouteDocumentId());

		if (status === 'ready' && Type.isPlainObject(context?.document))
		{
			await this.#syncDocumentContext(context);

			return;
		}

		if (status === 'not_found' || status === 'error')
		{
			await this.#handleInvalidDocumentRoute();

			return;
		}

		if (status === 'loading' && Number.isInteger(routeDocId) && routeDocId > 0)
		{
			return;
		}

		await this.#ensureHomeCollectionSelected(withCollectionFallback, previousRouteName, currentRouteName);
		this.#store.actions.clearDocumentSelection();
	}

	async #syncWorkspaceRoute(): Promise<void>
	{
		const route = this.#router?.currentRoute?.value;
		const collectionId = Number(route?.params?.id);
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			this.#store.actions.clearSelection();

			return;
		}

		this.#store.actions.clearDocumentSelection();

		const currentSelectedId = Number(this.#store.state.selectedCollectionId.value);
		if (currentSelectedId === collectionId)
		{
			return;
		}

		this.#uiState.expandedCollections[collectionId] = true;
		await this.#store.actions.selectCollection(collectionId);
	}

	async #syncDocumentContext(context: Object): Promise<void>
	{
		const document = context.document;
		const docId = Number(document?.id);
		if (!Number.isInteger(docId) || docId <= 0)
		{
			await this.#handleInvalidDocumentRoute();

			return;
		}

		if (document?.sharedAccess === true)
		{
			this.#store.actions.clearSelection();
			this.#emitAction('onOpenDocument', { docId, collectionId: 0 });

			return;
		}

		if (document?.isTrashed === true)
		{
			// Trashed orphan documents may have collectionId === 0 (source collection gone).
			// Skip sidebar tree manipulation; editor renders trashed view from openContext.
			this.#store.actions.clearDocumentSelection();
			const rawCollectionId = Number(document?.collectionId);
			const trashedCollectionId = Number.isInteger(rawCollectionId) && rawCollectionId > 0
				? rawCollectionId
				: 0;
			this.#emitAction('onOpenDocument', { docId, collectionId: trashedCollectionId });

			return;
		}

		const collectionId = Number(document?.collectionId);
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			await this.#handleInvalidDocumentRoute();

			return;
		}

		// archived/trashed target is hidden from the sidebar tree, so skip expansion/selection for it
		const shouldExpandSidebarTree = !document?.isArchived && !document?.isTrashed;
		if (shouldExpandSidebarTree)
		{
			this.#uiState.expandedCollections[collectionId] = true;
		}

		if (Type.isPlainObject(context.openContext)
			&& this.#hydrateFromInitialContext(context.openContext))
		{
			this.#emitAction('onOpenDocument', { docId, collectionId });

			return;
		}

		await this.#store.actions.selectCollection(collectionId, { preserveDocumentSelection: true });

		if (shouldExpandSidebarTree)
		{
			await this.#ensureDocumentLoaded(collectionId, this.#toNullableInt(document.parentId), docId, 0);
			this.#expandAncestorDocs(collectionId, this.#toNullableInt(document.parentId));
			this.#store.actions.selectDocument(docId);
		}
		this.#emitAction('onOpenDocument', { docId, collectionId });
	}

	async #handleInvalidDocumentRoute(): Promise<void>
	{
		// Toast + redirect are owned by pages/document-page.js (single source of truth for unavailable docs).
		// This handler stays as a safety-net to clear sidebar selection and ensure the user leaves the doc route.
		this.#store.actions.clearDocumentSelection();
		if (this.#router.currentRoute.value.name === this.#documentRouteName)
		{
			await this.#router.replace({ name: this.#homeRouteName });
		}
	}

	async #ensureDocumentLoaded(
		collectionId: number,
		parentId: number | null,
		targetDocId: number,
		depth: number = 0,
	): Promise<void>
	{
		const normalizedParentId = this.#toNullableInt(parentId);
		const targetId = Number(targetDocId);
		if (
			depth >= MAX_BRANCH_LOAD_ITERATIONS
			|| !Number.isInteger(targetId)
			|| targetId <= 0
		)
		{
			return;
		}

		const hasTargetLoaded = () => this.#store.queries.getChildren(collectionId, normalizedParentId)
			.some((item) => Number(item.id) === targetId);

		if (hasTargetLoaded())
		{
			return;
		}

		await this.#store.actions.ensureChildrenLoaded(collectionId, normalizedParentId);
		if (hasTargetLoaded())
		{
			return;
		}

		if (!this.#store.queries.hasNextChildren(collectionId, normalizedParentId))
		{
			return;
		}

		await this.#store.actions.loadDocuments(collectionId, normalizedParentId, true);
		if (hasTargetLoaded())
		{
			return;
		}

		await this.#ensureDocumentLoaded(collectionId, normalizedParentId, targetId, depth + 1);
	}

	async #ensureHomeCollectionSelected(
		withCollectionFallback: boolean,
		previousRouteName: string = '',
		currentRouteName: string = '',
	): Promise<void>
	{
		if (
			!withCollectionFallback
			|| this.#store.state.selectedCollectionId.value
			|| this.#store.state.collections.value.length === 0
		)
		{
			return;
		}

		// Only redirect from HOME — other routes (search, etc.) fall through this
		// branch with status='idle' but must keep their URL intact.
		if (currentRouteName !== this.#homeRouteName)
		{
			return;
		}

		const firstId = Number(this.#store.state.collections.value[0].id);
		if (!Number.isInteger(firstId) || firstId <= 0)
		{
			return;
		}

		await this.#store.actions.selectCollection(firstId);

		// Loop guard: skip redirect when we just bounced back from workspace/document
		// (via workspace-page onNotFound/onArchived/onDeleted) — keep user on empty HomePage.
		if (
			previousRouteName === this.#workspaceRouteName
			|| previousRouteName === this.#documentRouteName
		)
		{
			return;
		}

		// The route name above is the one this pass started with, and selecting the collection is a
		// round trip: a knowledge base opened, a document opened or a search made while it was in
		// flight would be overridden by the redirect below. Asked again, of the router itself.
		if (this.#router?.currentRoute?.value?.name !== this.#homeRouteName)
		{
			return;
		}

		// And the list is read again for the same reason: the base picked before the round trip may
		// have been deleted or lost its access meanwhile, and redirecting onto it lands the reader on
		// "no rights or deleted" instead of a knowledge base.
		const stillListed = this.#store.state.collections.value
			.some((item) => Number(item?.id) === firstId);
		if (!stillListed)
		{
			return;
		}

		await this.#router.replace({
			name: this.#workspaceRouteName,
			params: { id: String(firstId) },
		});
	}

	#expandAncestorDocs(collectionId: number, parentId: number | null): void
	{
		const visited = new Set();
		let currentId = parentId;
		while (currentId !== null && currentId > 0 && !visited.has(currentId))
		{
			visited.add(currentId);
			this.#store.state.expandedDocs[currentId] = true;
			const parentDoc = this.#store.queries.findLoadedDocument(collectionId, currentId);
			currentId = this.#toNullableInt(parentDoc?.parentId);
		}
	}

	#toNullableInt(value: mixed): number | null
	{
		if (value === null || value === undefined || value === '')
		{
			return null;
		}

		return Number(value);
	}
}
