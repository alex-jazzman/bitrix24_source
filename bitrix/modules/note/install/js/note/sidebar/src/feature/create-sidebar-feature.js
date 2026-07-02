import { ajax, Type } from 'main.core';
import { nextTick, reactive, watch } from 'ui.vue3';

import { createSidebarActions } from '../application/create-sidebar-actions';
import { CollectionDndService } from '../application/dnd/collection-dnd-service';
import { DocumentDndService } from '../application/dnd/document-dnd-service';
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

function createUiState(
	sidebarWidth: number = SIDEBAR_DEFAULT_WIDTH,
	sidebarCollapsed: boolean = false,
	isMobile: boolean = false,
): Object
{
	return reactive({
		expandedCollections: {},
		collectionsSectionExpanded: true,
		sidebarMinWidth: SIDEBAR_MIN_WIDTH,
		sidebarWidth: normalizeSidebarWidth(sidebarWidth, SIDEBAR_MIN_WIDTH),
		sidebarCollapsed: normalizeSidebarCollapsed(sidebarCollapsed),
		isMobile: Boolean(isMobile),
		renamingDocId: null,
		renamingCollectionId: null,
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

function createSidebarPersistenceHandlers(uiState: Object): Object
{
	const sidebarUiState = uiState;
	const saveSidebarState = ({
		width = sidebarUiState.sidebarWidth,
		collapsed = sidebarUiState.sidebarCollapsed,
	} = {}) => {
		const normalizedWidth = normalizeSidebarWidth(width, sidebarUiState.sidebarMinWidth);
		const normalizedCollapsed = normalizeSidebarCollapsed(collapsed);
		sidebarUiState.sidebarWidth = normalizedWidth;
		sidebarUiState.sidebarCollapsed = normalizedCollapsed;

		void ajax.runAction('main.userOption.saveOptions', {
			json: {
				newValues: [
					{
						c: 'note',
						n: 'sidebar',
						v: {
							width: normalizedWidth,
							collapsed: normalizedCollapsed ? 'Y' : 'N',
						},
					},
				],
			},
		}).catch(() => {
			// Keep UI state even if persistence fails.
		});
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

	return {
		saveSidebarState,
		setSidebarWidth,
		saveSidebarWidth,
		setSidebarMinWidth,
		setSidebarCollapsed,
		toggleSidebarCollapsed,
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
		isDocumentLoaded: (docId) => store.queries.isDocumentLoadedAnywhere(docId),
		setSharedView: (active) => store.actions.setSharedView(active),
		setArchiveView: (active) => store.actions.setArchiveView(active),
		setRecycleBinView: (active) => store.actions.setRecycleBinView(active),
		insertCollectionLocal: (collection) => store.actions.insertCollectionLocal(collection),
		removeCollectionLocal: (collectionId) => store.actions.removeCollectionLocal(Number(collectionId)),
		isCollectionSelected: (collectionId) => (
			Number(store.state.selectedCollectionId.value) === Number(collectionId)
		),
		clearCollectionSelection: () => store.actions.clearSelection(),
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
}: Object): Object
{
	const isDragging = () => Boolean(dragState.docItem || dragState.collectionItem);
	const hydrationApi = createHydrationApi(store, uiState);
	watch(
		() => store.state.selectedDocId.value,
		(newId) => {
			void scrollSelectedDocIntoView(newId);
		},
		{ flush: 'post' },
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
	const persistenceHandlers = createSidebarPersistenceHandlers(uiState);
	const actions = createSidebarActions({
		collectionUseCases,
		documentUseCases,
		collectionDndService,
		documentDndService,
		messages,
		router,
		routeNames,
		setSidebarWidth: persistenceHandlers.setSidebarWidth,
		saveSidebarWidth: persistenceHandlers.saveSidebarWidth,
		setSidebarMinWidth: persistenceHandlers.setSidebarMinWidth,
		setSidebarCollapsed: persistenceHandlers.setSidebarCollapsed,
		toggleSidebarCollapsed: persistenceHandlers.toggleSidebarCollapsed,
		saveSidebarState: persistenceHandlers.saveSidebarState,
	});
	const state = createSidebarState(store, uiState, dragState, routeSyncService);
	const storeProxy = createStoreProxy(store);

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
	const uiState = createUiState(initialSidebarWidth, initialSidebarCollapsed, Boolean(isMobile));
	const store = createSidebarStore(api);
	const messages = buildSidebarMessages();
	const onFail = (error) => {
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
	});
}
