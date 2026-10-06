import { ajax, Type } from 'main.core';
import { nextTick, reactive, watch } from 'ui.vue3';

import { createSidebarActions } from '../application/create-sidebar-actions';
import { CollectionDndService } from '../application/dnd/collection-dnd-service';
import { DocumentDndService } from '../application/dnd/document-dnd-service';
import { FavoriteDndService } from '../application/dnd/favorite-dnd-service';
import { FileDropService } from '../application/dnd/file-drop-service';
import { SidebarRouteSyncService } from '../application/route/sidebar-route-sync-service';
import { CollectionUseCases } from '../application/use-cases/collection-use-cases';
import { DocumentUseCases } from '../application/use-cases/document-use-cases';
import { createSidebarStore } from '../domain/sidebar-store';
import { buildSidebarMessages } from './messages';
import { createSidebarRootState } from './create-sidebar-root-state';
import { AjaxControllerClient } from '../services/ajax-controller-client';
import { DialogService } from '../services/dialog-service';
import { SidebarApi } from '../services/sidebar-api';

const AUTO_EXPAND_DELAY_MS = 500;
const SIDEBAR_DEFAULT_WIDTH = 280;
const SIDEBAR_MIN_WIDTH = 280;
const SIDEBAR_MAX_WIDTH = 540;

function createDragState()
{
	return reactive({
		docItem: null,
		docTarget: null,
		collectionItem: null,
		collectionTarget: null,
		// [P3] Order of the favorites block: its own pair, so a row of the block is never a target of
		// the document or knowledge base drag and the other way round.
		favoriteItem: null,
		favoriteTarget: null,
		// External OS-driven file drag (no local startDrag) has its own target shape { collectionId, parentId }.
		fileDragItem: false,
		fileDropTarget: null,
	});
}

function normalizeSidebarMinWidth(minWidth: mixed): number
{
	const numericMin = Number(minWidth);
	if (!Number.isFinite(numericMin))
	{
		return SIDEBAR_MIN_WIDTH;
	}

	return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, Math.ceil(numericMin)));
}

function normalizeSidebarWidth(width: mixed, minWidth: number = SIDEBAR_MIN_WIDTH): number
{
	const normalizedMin = normalizeSidebarMinWidth(minWidth);
	const normalizedWidth = Number(width);
	if (!Number.isFinite(normalizedWidth))
	{
		return Math.max(normalizedMin, SIDEBAR_DEFAULT_WIDTH);
	}

	return Math.max(normalizedMin, Math.min(SIDEBAR_MAX_WIDTH, Math.trunc(normalizedWidth)));
}

function normalizeSidebarCollapsed(collapsed: mixed): boolean
{
	return Boolean(collapsed);
}

// A saved block state, as it travels: the server answers with a boolean, the option itself holds 'Y'/'N',
// and a panel drawn before either arrives has its blocks open.
function normalizeSidebarSection(expanded: mixed): boolean
{
	if (expanded === undefined || expanded === null)
	{
		return true;
	}

	return expanded !== false && expanded !== 'N';
}

function createUiState(
	sidebarWidth: number = SIDEBAR_DEFAULT_WIDTH,
	sidebarCollapsed: boolean = false,
	isMobile: boolean = false,
	historyEnabled: boolean = false,
	notificationsEnabled: boolean = false,
	sharedTreeEnabled: boolean = false,
	collectionsSectionExpanded: boolean = true,
): Object
{
	return reactive({
		expandedCollections: {},
		collectionsSectionExpanded: normalizeSidebarSection(collectionsSectionExpanded),
		// [P2] Backend-owned flag: when on, the flat note.shared page/button is replaced by the
		// collapsible "Shared with me" sidebar section. Default off = safe rollback.
		sharedTreeEnabled: Boolean(sharedTreeEnabled),
		sidebarMinWidth: SIDEBAR_MIN_WIDTH,
		sidebarWidth: normalizeSidebarWidth(sidebarWidth, SIDEBAR_MIN_WIDTH),
		sidebarCollapsed: normalizeSidebarCollapsed(sidebarCollapsed),
		isMobile: Boolean(isMobile),
		// Bootstrap-level UI feature flags — surfaced on the sidebar root state so the pages that
		// inject it (document / workspace) can gate their history + notifications affordances.
		historyEnabled: Boolean(historyEnabled),
		notificationsEnabled: Boolean(notificationsEnabled),
		renamingDocId: null,
		renamingCollectionId: null,
		// [ALG-01] Whether the BitrixGPT rail panel is expanded. Owned by the shell, never by the
		// panel: the panel is mounted once and only its geometry collapses.
		aiChatOpen: false,
	});
}

function applyExpandedCollectionsFromContext(uiState: Object, context: mixed): void
{
	const expandedCollectionsState = uiState.expandedCollections;

	const expandedCollections = Type.isPlainObject(context?.expandedCollections)
		? context.expandedCollections
		: {}
	;
	for (const [rawCollectionId, rawIsExpanded] of Object.entries(expandedCollections))
	{
		const collectionId = Number(rawCollectionId);
		if (!Number.isInteger(collectionId) || collectionId <= 0 || !rawIsExpanded)
		{
			continue;
		}

		expandedCollectionsState[collectionId] = true;
	}

	if (Object.keys(expandedCollectionsState).length > 0)
	{
		return;
	}

	if (Boolean(context?.document?.isArchived))
	{
		return;
	}

	const fallbackCollectionId = Number(
		context?.selectedCollectionId
		?? context?.collectionId
		?? context?.document?.collectionId
		?? 0,
	);
	if (Number.isInteger(fallbackCollectionId) && fallbackCollectionId > 0)
	{
		expandedCollectionsState[fallbackCollectionId] = true;
	}
}

// The one allowed toast call of the module: always top-right. Only failures reach it - a gesture that
// worked is reported by the control that was pressed, not by a balloon.
function createNotifier(): (content: string) => void
{
	return (content) => {
		if (!Type.isStringFilled(content))
		{
			return;
		}

		BX.UI.Notification.Center.notify({ content, position: 'top-right' });
	};
}

async function scrollSelectedDocIntoView(docId: mixed): Promise<void>
{
	const normalizedId = Number(docId);
	if (!Number.isInteger(normalizedId) || normalizedId <= 0)
	{
		return;
	}

	await nextTick();
	const node = document.querySelector(`[data-doc-id="${normalizedId}"]`);
	if (node && Type.isFunction(node.scrollIntoView))
	{
		node.scrollIntoView({ block: 'center', behavior: 'smooth' });
	}
}

function createHydrateFromInitialContext(store: Object, uiState: Object): (context: mixed) => boolean
{
	return (context) => {
		const isHydrated = store.actions.hydrateFromInitialContext(context);
		if (!isHydrated)
		{
			return false;
		}

		applyExpandedCollectionsFromContext(uiState, context);

		return true;
	};
}

function createHydrateInitialCollections(store: Object): (payload: mixed) => boolean
{
	return (payload) => store.actions.hydrateInitialCollections(payload);
}

function createHydrationApi(store: Object, uiState: Object): Object
{
	return {
		hydrateFromInitialContext: createHydrateFromInitialContext(store, uiState),
		hydrateInitialCollections: createHydrateInitialCollections(store),
	};
}

// `isFavoritesSectionExpanded` is asked of the store rather than kept here: that flag lives there, because
// the rail of the collapsed panel opens the block its entry leads to. Everything the option holds is
// written on every save - CUserOptions replaces the whole value, so a save carrying only what changed
// would take the rest of the panel's state with it.
function createSidebarPersistenceHandlers(uiState: Object, isFavoritesSectionExpanded: () => boolean): Object
{
	const sidebarUiState = uiState;
	let pendingWrite = 0;
	// One gesture can change two of these at once: the entry of the collapsed rail expands the panel AND
	// opens the block it leads to. Written as two requests, each carrying the whole option, they raced -
	// whichever landed last decided, and the block came back closed. So the state is written once, after
	// the gesture that changed it is over, and what it writes is the state as it then stands.
	const flushWrite = () => {
		pendingWrite = 0;

		void ajax.runAction('main.userOption.saveOptions', {
			json: {
				newValues: [
					{
						c: 'note',
						n: 'sidebar',
						v: {
							width: sidebarUiState.sidebarWidth,
							collapsed: sidebarUiState.sidebarCollapsed ? 'Y' : 'N',
							favoritesOpen: isFavoritesSectionExpanded() ? 'Y' : 'N',
							collectionsOpen: sidebarUiState.collectionsSectionExpanded ? 'Y' : 'N',
						},
					},
				],
			},
		}).catch(() => {
			// Keep UI state even if persistence fails.
		});
	};
	const saveSidebarState = ({
		width = sidebarUiState.sidebarWidth,
		collapsed = sidebarUiState.sidebarCollapsed,
	} = {}) => {
		sidebarUiState.sidebarWidth = normalizeSidebarWidth(width, sidebarUiState.sidebarMinWidth);
		sidebarUiState.sidebarCollapsed = normalizeSidebarCollapsed(collapsed);

		if (pendingWrite !== 0)
		{
			return;
		}

		pendingWrite = setTimeout(flushWrite, 0);
	};

	const setSidebarWidth = (width) => {
		sidebarUiState.sidebarWidth = normalizeSidebarWidth(width, sidebarUiState.sidebarMinWidth);
	};

	const saveSidebarWidth = (width) => {
		const normalizedWidth = normalizeSidebarWidth(width, sidebarUiState.sidebarMinWidth);
		sidebarUiState.sidebarWidth = normalizedWidth;
		saveSidebarState({
			width: normalizedWidth,
			collapsed: sidebarUiState.sidebarCollapsed,
		});
	};

	const setSidebarMinWidth = (minWidth) => {
		const normalizedMin = normalizeSidebarMinWidth(minWidth);
		if (normalizedMin === sidebarUiState.sidebarMinWidth)
		{
			return;
		}

		sidebarUiState.sidebarMinWidth = normalizedMin;
		if (sidebarUiState.sidebarWidth < normalizedMin)
		{
			sidebarUiState.sidebarWidth = normalizedMin;
		}
	};

	const setSidebarCollapsed = (collapsed) => {
		sidebarUiState.sidebarCollapsed = normalizeSidebarCollapsed(collapsed);

		return sidebarUiState.sidebarCollapsed;
	};

	const toggleSidebarCollapsed = () => {
		sidebarUiState.sidebarCollapsed = !sidebarUiState.sidebarCollapsed;

		return sidebarUiState.sidebarCollapsed;
	};

	// Not persisted, unlike its neighbours: the panel always starts collapsed on a fresh page.
	const setAiChatOpen = (open) => {
		sidebarUiState.aiChatOpen = Boolean(open);

		return sidebarUiState.aiChatOpen;
	};

	return {
		saveSidebarState,
		setSidebarWidth,
		saveSidebarWidth,
		setSidebarMinWidth,
		setSidebarCollapsed,
		toggleSidebarCollapsed,
		setAiChatOpen,
	};
}

function createStoreProxy(store: Object): Object
{
	return {
		ensureChildrenLoaded: (collectionId, parentId) => store.actions.ensureChildrenLoaded(collectionId, parentId),
		findCollection: (collectionId) => store.queries.findCollection(collectionId),
		findLoadedDocument: (collectionId, docId) => store.queries.findLoadedDocument(collectionId, docId),
		findLoadedDocumentAnywhere: (docId) => store.queries.findLoadedDocumentAnywhere(docId),
		getAncestorsForDocument: (docId) => store.queries.getAncestorsForDocument(docId),
		hasNextChildren: (collectionId, parentId) => store.queries.hasNextChildren(collectionId, parentId),
		loadMoreChildren: (collectionId, parentId) => store.actions.loadDocuments(collectionId, parentId, true),
		// Shared counterparts: a document reached through a document-level grant has no collection
		// branch to read, its children live in the accessible-tree namespace.
		ensureSharedChildrenLoaded: (collectionId, parentId) => store.actions.prefetchSharedChildren({
			collectionId,
			id: parentId,
		}),
		loadMoreSharedChildren: (collectionId, parentId) => store.actions.loadMoreSharedChildren({
			collectionId,
			id: parentId,
		}),
		isDocumentLoaded: (docId) => store.queries.isDocumentLoadedAnywhere(docId),
		setSharedView: (active) => store.actions.setSharedView(active),
		setArchiveView: (active) => store.actions.setArchiveView(active),
		setRecycleBinView: (active) => store.actions.setRecycleBinView(active),
		insertCollectionLocal: (collection) => store.actions.insertCollectionLocal(collection),
		updateCollectionLocal: (collectionId, patch) => store.actions.updateCollectionLocal(Number(collectionId), patch),
		removeCollectionLocal: (collectionId) => store.actions.removeCollectionLocal(Number(collectionId)),
		isCollectionSelected: (collectionId) => (
			Number(store.state.selectedCollectionId.value) === Number(collectionId)
		),
		clearCollectionSelection: () => store.actions.clearSelection(),
		// [P4.T6] The page of a knowledge base re-reads the block when the server turns a subscription
		// down for an object that is not in the list any more.
		reloadFavorites: () => store.actions.reloadFavorites(),
		// [TPL-01] Star of the knowledge base page: one implementation of the gesture for every star.
		toggleFavorite: (target, hint) => store.actions.toggleFavorite(target, hint),
	};
}

function createSidebarState(store: Object, uiState: Object, dragState: Object, routeSyncService: Object): Object
{
	return createSidebarRootState({
		store,
		uiState,
		dragState,
		getRouteDocumentId: () => routeSyncService.getRouteDocumentId(),
	});
}

function createSidebarRuntime({
	router,
	emitAction,
	getRouteDocumentContext,
	reloadRouteDocumentContext,
	routeNames,
	api,
	dialog,
	dragState,
	uiState,
	store,
	messages,
	onFail,
	initialFavorites,
}: Object): Object
{
	const isDragging = () => Boolean(dragState.docItem || dragState.collectionItem);
	const hydrationApi = createHydrationApi(store, uiState);
	// A row clicked in the tree is already in frame: scrolling it to the centre would only jerk the
	// panel away from where the pointer is. Only navigation coming from outside the tree - a direct
	// link, initial context, search, favourites, a link inside a document - has to reveal the row.
	let skipNextSelectionScroll = false;
	watch(
		() => store.state.selectedDocId.value,
		(newId) => {
			if (skipNextSelectionScroll)
			{
				skipNextSelectionScroll = false;

				return;
			}

			void scrollSelectedDocIntoView(newId);
		},
		{ flush: 'post' },
	);
	// Prune expandedCollections for ids no longer present (NONE→VIEW must enter collapsed).
	watch(
		() => store.state.collections.value.map((c) => Number(c?.id)),
		(currentIds) => {
			const presentIds = new Set(currentIds.filter((id) => Number.isInteger(id) && id > 0));
			for (const key of Object.keys(uiState.expandedCollections))
			{
				if (!presentIds.has(Number(key)))
				{
					delete uiState.expandedCollections[key];
				}
			}
		},
	);
	const routeSyncService = new SidebarRouteSyncService({
		store,
		router,
		uiState,
		messages,
		emitAction,
		getRouteDocumentContext,
		routeNames,
		hydrateFromInitialContext: hydrationApi.hydrateFromInitialContext,
	});
	const persistenceHandlers = createSidebarPersistenceHandlers(
		uiState,
		() => store.state.favoritesSectionExpanded.value,
	);
	const collectionUseCases = new CollectionUseCases({
		api,
		dialog,
		store,
		uiState,
		messages,
		onFail,
		emitAction,
		isDragging,
		router,
		routeNames,
		getRouteDocumentContext,
		saveSidebarState: persistenceHandlers.saveSidebarState,
	});
	const documentUseCases = new DocumentUseCases({
		api,
		dialog,
		store,
		uiState,
		messages,
		onFail,
		router,
		routeNames,
		isDragging,
		getRouteDocumentContext,
		reloadRouteDocumentContext,
	});
	const collectionDndService = new CollectionDndService({
		dragState,
		store,
		api,
		onFail,
	});
	const documentDndService = new DocumentDndService({
		dragState,
		store,
		api,
		onFail,
		uiState,
		autoExpandDelayMs: AUTO_EXPAND_DELAY_MS,
	});
	const favoriteDndService = new FavoriteDndService({
		dragState,
		store,
	});
	const fileDropService = new FileDropService({
		dragState,
		store,
		documentUseCases,
		onFail,
		messages,
	});
	const actions = createSidebarActions({
		collectionUseCases,
		documentUseCases,
		collectionDndService,
		documentDndService,
		favoriteDndService,
		fileDropService,
		messages,
		router,
		routeNames,
		setSidebarWidth: persistenceHandlers.setSidebarWidth,
		saveSidebarWidth: persistenceHandlers.saveSidebarWidth,
		setSidebarMinWidth: persistenceHandlers.setSidebarMinWidth,
		setSidebarCollapsed: persistenceHandlers.setSidebarCollapsed,
		toggleSidebarCollapsed: persistenceHandlers.toggleSidebarCollapsed,
		saveSidebarState: persistenceHandlers.saveSidebarState,
		setAiChatOpen: persistenceHandlers.setAiChatOpen,
		suppressSelectionScrollOnce: () => {
			skipNextSelectionScroll = true;
		},
		favoriteActions: {
			toggleFavorite: (target, hint) => store.actions.toggleFavorite(target, hint),
			loadFavoritesPage: () => store.actions.loadFavoritesPage(),
			reloadFavorites: () => store.actions.reloadFavorites(),
			retryFavorites: () => store.actions.retryFavorites(),
			setFavoritesFilter: (onlyNotified) => store.actions.setFavoritesFilter(onlyNotified),
			// Both of these are how the block is opened and closed, so both are where the state is
			// remembered - by the same route the width and the collapsed panel take.
			setFavoritesSectionExpanded: (expanded) => {
				// The filter forces the block open on every press, and most of those presses find it open
				// already: only a state that changed is worth a write.
				const wasExpanded = store.state.favoritesSectionExpanded.value;
				store.actions.setFavoritesSectionExpanded(expanded);
				if (store.state.favoritesSectionExpanded.value !== wasExpanded)
				{
					persistenceHandlers.saveSidebarState();
				}
			},
			toggleFavoritesSection: () => {
				store.actions.toggleFavoritesSection();
				persistenceHandlers.saveSidebarState();
			},
			toggleFavoriteExpanded: (item) => store.actions.toggleFavoriteExpanded(item),
			retryFavoriteBranch: (item) => store.actions.retryFavoriteBranch(item),
			refreshFavoriteCoverage: (params) => store.actions.refreshFavoriteCoverage(params),
			toggleFavoriteNotify: (target) => store.actions.toggleFavoriteNotify(target),
			setFavoriteNotify: (target, mode) => store.actions.setFavoriteNotify(target, mode),
			clearFavoriteNotify: (target) => store.actions.clearFavoriteNotify(target),
		},
	});
	const state = createSidebarState(store, uiState, dragState, routeSyncService);
	const storeProxy = createStoreProxy(store);

	// The block is painted with the rest of the sidebar, and hiding an empty one (AC-027) needs a
	// confirmed empty page - so its first page is there from the start: taken from the page when the
	// server rendered it in (TPL-02), read up front otherwise.
	if (!store.actions.hydrateFavorites(initialFavorites))
	{
		void store.actions.loadFavoritesPage();
	}

	return {
		state,
		actions,
		store: storeProxy,
		messages,
		bootstrap: async (options = {}) => routeSyncService.bootstrap(options),
		syncFromRouteContext: async (withCollectionFallback = false, options = {}) => (
			routeSyncService.syncFromRouteContext(withCollectionFallback, options)
		),
		hydrateInitialCollections: hydrationApi.hydrateInitialCollections,
		hydrateFromInitialContext: hydrationApi.hydrateFromInitialContext,
		...storeProxy,
		destroy: () => {
			routeSyncService.destroy();
			// The use cases hold global EventEmitter subscriptions, which outlive the mount unless they
			// are taken down here.
			documentUseCases.destroy();
			collectionUseCases.destroy();
		},
	};
}

export function createSidebarFeature({
	router,
	emitAction = () => {},
	getRouteDocumentContext = () => null,
	reloadRouteDocumentContext = null,
	routeNames = { home: 'home', document: 'document', search: 'search', shared: 'shared', archive: 'archive', recyclebin: 'recyclebin' },
	sidebarOptions = null,
	isMobile = false,
	historyEnabled = false,
	notificationsEnabled = false,
	sharedTreeEnabled = false,
	initialFavorites = null,
}: Object): Object
{
	const api = new SidebarApi(new AjaxControllerClient());
	const dialog = new DialogService();
	const dragState = createDragState();
	const initialSidebarWidth = normalizeSidebarWidth(
		Type.isPlainObject(sidebarOptions) ? sidebarOptions.width : SIDEBAR_DEFAULT_WIDTH,
	);
	const initialSidebarCollapsed = normalizeSidebarCollapsed(
		Type.isPlainObject(sidebarOptions) ? sidebarOptions.collapsed : false,
	);
	// The two blocks the panel remembers. "Shared with me" is not among them on purpose: it is closed by
	// default and reads its tree only when opened, so remembering it open would mean a request on every
	// load of the page.
	const initialFavoritesOpen = normalizeSidebarSection(
		Type.isPlainObject(sidebarOptions) ? sidebarOptions.favoritesOpen : undefined,
	);
	const uiState = createUiState(
		initialSidebarWidth,
		initialSidebarCollapsed,
		Boolean(isMobile),
		Boolean(historyEnabled),
		Boolean(notificationsEnabled),
		Boolean(sharedTreeEnabled),
		normalizeSidebarSection(
			Type.isPlainObject(sidebarOptions) ? sidebarOptions.collectionsOpen : undefined,
		),
	);
	const messages = buildSidebarMessages();
	const store = createSidebarStore(api, { messages, notify: createNotifier() });
	// Straight onto the state the block is drawn from, before anything renders: the block belongs to the
	// store (the rail reaches it from outside the component), so this is where its saved state lands.
	store.actions.setFavoritesSectionExpanded(initialFavoritesOpen);
	const onFail = (error) => {
		// A move blocked because it would escalate subtree access gets its own "needs moderator"
		// message; everything else falls back to the server text or a generic error.
		if (error?.code === 'NOTE_MOVE_ACCESS_ESCALATION')
		{
			store.actions.setError(messages.moveAccessEscalation);

			return;
		}
		store.actions.setError(error?.message || messages.errorGeneric);
	};

	return createSidebarRuntime({
		router,
		emitAction,
		getRouteDocumentContext,
		reloadRouteDocumentContext,
		routeNames,
		api,
		dialog,
		dragState,
		uiState,
		store,
		messages,
		onFail,
		initialFavorites,
	});
}
