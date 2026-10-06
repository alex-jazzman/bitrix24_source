import { BaseEvent, EventEmitter } from 'main.core.events';
import { NoteEvent } from '../../services/note-events';
import { SidebarAccessibleTreeActions } from './actions/create-accessible-tree-actions';
import { SidebarCollectionActions } from './actions/create-collections-actions';
import { SidebarDocumentActions } from './actions/create-documents-actions';
import { SidebarErrorActions } from './actions/create-error-actions';
import { SidebarExpansionActions } from './actions/create-expansion-actions';
import { SidebarFavoriteActions } from './actions/create-favorites-actions';
import { SidebarHydrationActions } from './actions/create-hydration-actions';
import { PullCommand, SidebarPullActions } from './actions/create-pull-actions';
import { SidebarSelectionActions } from './actions/create-selection-actions';
import { SidebarStoreQueries } from './queries/create-sidebar-store-queries';
import { SidebarBranchUtils } from './shared/branch-utils';
import { keyOf, normalizeParentId, sharedKey, sharedRootKey } from './shared/keys';
import { SidebarStoreState } from './state/create-sidebar-store-state';

class SidebarStore
{
	state;
	actions;
	queries;

	constructor(api, { messages = {}, notify = () => {} } = {})
	{
		const bind = (instance, methodName) => instance[methodName].bind(instance);

		const internalState = new SidebarStoreState();
		const errorActions = new SidebarErrorActions();
		const queryService = new SidebarStoreQueries(internalState, keyOf);
		const branchUtils = new SidebarBranchUtils(internalState, keyOf);
		const setBranchDocs = (collectionId, parentId, list, options = {}) => {
			branchUtils.setBranchDocs(collectionId, parentId, list, options);
		};

		const removeBranch = (collectionId, parentId = null) => {
			branchUtils.removeBranch(collectionId, parentId);
		};

		const setError = (message) => {
			errorActions.setError(message);
		};

		// Late-bound: favoriteActions is constructed below, after the collaborators it needs.
		let favoriteActionsRef = null;
		// A rename has to reach the copy of the title the favorites block keeps, and both local patchers
		// are the choke points every rename passes through - local edit, pull, adopted event alike.
		const patchFavoriteTitle = (entityType, entityId, title) => (
			favoriteActionsRef?.patchFavoriteTitle(entityType, entityId, title) === true
		);

		const documentActions = new SidebarDocumentActions({
			api,
			state: internalState,
			queries: queryService,
			keyOf,
			normalizeParentId,
			setBranchDocs,
			removeBranch,
			setError,
			patchFavoriteTitle,
		});
		const hydrationActions = new SidebarHydrationActions({
			state: internalState,
			keyOf,
			normalizeParentId,
		});
		const accessibleTreeActions = new SidebarAccessibleTreeActions({
			api,
			state: internalState,
			sharedKey,
			sharedRootKey,
			setError,
			// Late-bound like patchFavoriteTitle above: the block is built below, and it is the other
			// reader of this namespace.
			onBranchesDropped: (branches) => favoriteActionsRef?.reloadOpenBranches(branches),
		});
		const applyDocumentAccessCascade = bind(accessibleTreeActions, 'applyDocumentAccessCascade');

		// Late-bound: pullActions is constructed below after the dispatch table is built.
		let pullActionsRef = null;
		const collectionActions = new SidebarCollectionActions({
			api,
			state: internalState,
			setError,
			setGlobalPermissions: bind(hydrationActions, 'setGlobalPermissions'),
			removeBranch,
			refreshCollectionWatches: () => pullActionsRef?.refreshCollectionWatches(),
			patchFavoriteTitle,
		});
		const ensureChildrenLoaded = bind(documentActions, 'ensureChildrenLoaded');

		const selectionActions = new SidebarSelectionActions({
			state: internalState,
			ensureChildrenLoaded,
		});

		const favoriteActions = new SidebarFavoriteActions({
			api,
			state: internalState,
			messages,
			notify,
			isFavorite: bind(queryService, 'isFavorite'),
			// [ALG-02] The block owns the expansion flags, not the branches: both namespaces are read
			// through their existing loaders, so a branch is never fetched twice.
			ensureChildrenLoaded,
			ensureAccessibleChildrenLoaded: (collectionId, parentId) => (
				accessibleTreeActions.prefetchSharedChildren({ collectionId, id: parentId })
			),
			isBranchLoaded: bind(queryService, 'isBranchLoaded'),
			isAccessibleBranchLoaded: bind(accessibleTreeActions, 'isSharedBranchHydrated'),
			// [API-06] Which documents an opened branch holds - the set whose coverage is asked for.
			getBranchDocs: (collectionId, parentId, isShared) => (
				isShared
					? accessibleTreeActions.getSharedChildren(collectionId, parentId)
					: queryService.getChildren(collectionId, parentId)
			),
			notifyStateOf: bind(queryService, 'favoriteNotify'),
		});
		favoriteActionsRef = favoriteActions;

		const expansionActions = new SidebarExpansionActions({
			state: internalState,
			getChildren: bind(queryService, 'getChildren'),
			ensureChildrenLoaded,
		});

		// Pull-router dispatch table. Phase 1 handlers are wired below.
		// The composition of the favorites block is decided outside it - by access and by the life of the
		// objects themselves - so the actions that decide it answer for the block too. Wrapped here at the
		// bind rather than in the dispatch table below, because the same functions are what the local
		// paths call: the initiator of a deletion never receives the push describing it.
		const alsoRefreshFavorites = (handler) => (params) => {
			const result = handler(params);
			favoriteActions.invalidateComposition();

			return result;
		};
		const applyDocumentUpdate = bind(documentActions, 'applyDocumentUpdate');
		const applyDocumentMove = bind(documentActions, 'applyDocumentMove');
		// To the bin and back: the server hides trashed documents from the list, so the row has to go
		// with the document and come back with it.
		const applyDocumentRemoval = alsoRefreshFavorites(bind(documentActions, 'applyDocumentRemoval'));
		const applyDocumentActive = alsoRefreshFavorites(bind(documentActions, 'applyDocumentActive'));
		const applyDocumentCreate = bind(documentActions, 'applyDocumentCreate');
		const applyCollectionCreate = bind(collectionActions, 'applyCollectionCreate');
		// A deleted knowledge base takes the favorite rows on it with it, and its documents go to the
		// bin; archiving only changes how the row reads, but the row has no other way to learn of it.
		const applyCollectionDelete = alsoRefreshFavorites(bind(collectionActions, 'applyCollectionDelete'));
		const applyCollectionArchive = alsoRefreshFavorites(bind(collectionActions, 'applyCollectionArchive'));
		const applyCollectionRestore = alsoRefreshFavorites(bind(collectionActions, 'applyCollectionRestore'));
		const applyCollectionUpdate = bind(collectionActions, 'applyCollectionUpdate');
		const applyCollectionMove = bind(collectionActions, 'applyCollectionMove');
		const applyCollectionCapabilities = bind(collectionActions, 'applyCollectionCapabilities');
		const applyCollectionListInvalidated = bind(collectionActions, 'applyCollectionListInvalidated');
		// Pull-driven applies: emit DOCUMENT_CHILDREN_CHANGED for affected parents so
		// editor children-block (note-app subscription) refreshes on remote events.
		const emitChildrenChanged = (collectionId, parentId) => {
			const pid = Number(parentId);
			const cid = Number(collectionId);
			if (!Number.isFinite(pid) || pid <= 0 || !Number.isFinite(cid) || cid <= 0)
			{
				return;
			}

			EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new BaseEvent({
				data: { parentId: pid, collectionId: cid },
			}));
		};

		const pullDocumentCreate = async (params) => {
			const result = await applyDocumentCreate(params);
			emitChildrenChanged(params?.collectionId, params?.parentId);

			return result;
		};

		const pullDocumentMove = async (params) => {
			const result = await applyDocumentMove(params);
			emitChildrenChanged(params?.fromCollectionId ?? params?.collectionId, params?.fromParentId);
			emitChildrenChanged(params?.collectionId, params?.parentId);

			return result;
		};

		const pullDocumentActive = async (params) => {
			const result = await applyDocumentActive(params);
			emitChildrenChanged(params?.collectionId, params?.parentId);

			return result;
		};

		const pullDocumentRemoval = async (params) => {
			// Pre-compute affected parents from store before removal mutates it.
			const affectedParents = [];
			const ids = Array.isArray(params?.documentIds) ? params.documentIds : [];
			for (const rawId of ids)
			{
				const id = Number(rawId);
				if (!Number.isFinite(id) || id <= 0)
				{
					continue;
				}

				const found = queryService.findLoadedDocumentAnywhere(id);
				if (found && Number(found.parentId) > 0)
				{
					affectedParents.push({
						collectionId: Number(found.collectionId),
						parentId: Number(found.parentId),
					});
				}
			}

			const result = await applyDocumentRemoval(params);
			for (const ap of affectedParents)
			{
				emitChildrenChanged(ap.collectionId, ap.parentId);
			}

			return result;
		};

		// Tree events reach a document-grant recipient on their personal channel, marked with
		// sharedScope: the collection namespace is not theirs to touch (they have no collection
		// access), so those payloads are applied to the accessible-tree namespace instead.
		const sharedScoped = (params) => params?.sharedScope === true;
		const applySharedUpsert = bind(accessibleTreeActions, 'applySharedDocumentUpsert');
		const applySharedUpdate = bind(accessibleTreeActions, 'applySharedDocumentUpdate');
		const applySharedRemoval = bind(accessibleTreeActions, 'applySharedDocumentRemoval');
		const routeByScope = (sharedHandler, collectionHandler) => (params) => (
			sharedScoped(params) ? sharedHandler(params) : collectionHandler(params)
		);

		const handlers = {
			[PullCommand.DOCUMENT_CREATE]: routeByScope(applySharedUpsert, pullDocumentCreate),
			[PullCommand.DOCUMENT_UPDATE]: routeByScope(applySharedUpdate, applyDocumentUpdate),
			[PullCommand.DOCUMENT_MOVE]: pullDocumentMove,
			[PullCommand.DOCUMENT_ARCHIVE]: routeByScope(applySharedRemoval, pullDocumentRemoval),
			[PullCommand.DOCUMENT_RESTORE]: routeByScope(applySharedUpsert, pullDocumentActive),
			[PullCommand.DOCUMENT_DELETE]: routeByScope(applySharedRemoval, pullDocumentRemoval),
			// Nothing left for the trees to do - the document left them when it went to the bin - but the
			// favorite rows pointing at it are deleted for good at this moment, server-side.
			[PullCommand.DOCUMENT_HARD_DELETE]: () => favoriteActions.invalidateComposition(),
			[PullCommand.COLLECTION_CREATE]: applyCollectionCreate,
			[PullCommand.COLLECTION_UPDATE]: applyCollectionUpdate,
			[PullCommand.COLLECTION_MOVE]: applyCollectionMove,
			[PullCommand.COLLECTION_ARCHIVE]: routeByScope(applySharedRemoval, applyCollectionArchive),
			[PullCommand.COLLECTION_RESTORE]: applyCollectionRestore,
			[PullCommand.COLLECTION_DELETE]: routeByScope(applySharedRemoval, applyCollectionDelete),
			[PullCommand.COLLECTION_CAPABILITIES]: alsoRefreshFavorites(applyCollectionCapabilities),
			[PullCommand.COLLECTION_LIST_INVALIDATED]: alsoRefreshFavorites(applyCollectionListInvalidated),
			[PullCommand.DOCUMENT_ACCESS_CASCADE]: alsoRefreshFavorites(applyDocumentAccessCascade),
			[PullCommand.FAVORITE_ADD]: bind(favoriteActions, 'applyFavoriteAdd'),
			[PullCommand.FAVORITE_REMOVE]: bind(favoriteActions, 'applyFavoriteRemove'),
			[PullCommand.FAVORITE_MOVE]: bind(favoriteActions, 'applyFavoriteMove'),
			[PullCommand.SUBSCRIPTION_SET]: bind(favoriteActions, 'applySubscriptionSet'),
			[PullCommand.SUBSCRIPTION_REMOVE]: bind(favoriteActions, 'applySubscriptionRemove'),
		};

		const pullActions = new SidebarPullActions({
			state: internalState,
			handlers,
		});
		pullActionsRef = pullActions;

		this.state = {
			collections: internalState.collections,
			collectionsLoading: internalState.collectionsLoading,
			collectionsHasNextPage: internalState.collectionsHasNextPage,
			globalPermissions: internalState.globalPermissions,
			selectedCollectionId: internalState.selectedCollectionId,
			selectedDocId: internalState.selectedDocId,
			selectedSharedView: internalState.selectedSharedView,
			selectedArchiveView: internalState.selectedArchiveView,
			selectedRecycleBinView: internalState.selectedRecycleBinView,
			expandedDocs: internalState.expandedDocs,
			currentRootDocs: queryService.currentRootDocs,
			sharedSectionExpanded: internalState.sharedSectionExpanded,
			sharedLoading: internalState.sharedLoading,
			sharedHydrated: internalState.sharedHydrated,
			sharedHasNextPage: internalState.sharedHasNextPage,
			sharedCursor: internalState.sharedCursor,
			sharedContainers: internalState.sharedContainers,
			favorites: internalState.favorites,
			favoritesSectionExpanded: internalState.favoritesSectionExpanded,
			favoritesLoading: internalState.favoritesLoading,
			favoritesFilterReloading: internalState.favoritesFilterReloading,
			favoritesHydrated: internalState.favoritesHydrated,
			favoritesHasNextPage: internalState.favoritesHasNextPage,
			favoritesOnlyNotified: internalState.favoritesOnlyNotified,
			favoritesError: internalState.favoritesError,
			favoritesExpandedDocs: queryService.favoritesExpandedDocs,
		};

		this.actions = {
			setError,
			hydrateFromInitialContext: bind(hydrationActions, 'hydrateFromInitialContext'),
			hydrateInitialCollections: bind(hydrationActions, 'hydrateInitialCollections'),
			setGlobalPermissions: bind(hydrationActions, 'setGlobalPermissions'),
			invalidateChildren: bind(documentActions, 'invalidateChildren'),
			invalidateBranch: bind(documentActions, 'invalidateBranch'),
			invalidateAllChildren: bind(documentActions, 'invalidateAllChildren'),
			setParentHasChildrenLocal: bind(documentActions, 'setParentHasChildrenLocal'),
			insertDocumentLocal: bind(documentActions, 'insertDocumentLocal'),
			updateDocumentLocal: bind(documentActions, 'updateDocumentLocal'),
			applyDocumentUpdate,
			applyDocumentMove,
			applyDocumentPositions: bind(documentActions, 'applyDocumentPositions'),
			applyDocumentRemoval,
			applyDocumentActive,
			applyDocumentCreate,
			removeDocumentLocal: bind(documentActions, 'removeDocumentLocal'),
			moveDocumentLocal: bind(documentActions, 'moveDocumentLocal'),
			loadDocuments: bind(documentActions, 'loadDocuments'),
			prefetchChildren: bind(documentActions, 'prefetchChildren'),
			ensureChildrenLoaded,
			insertCollectionLocal: bind(collectionActions, 'insertCollectionLocal'),
			updateCollectionLocal: bind(collectionActions, 'updateCollectionLocal'),
			applyCollectionCreate,
			applyCollectionDelete,
			applyCollectionArchive,
			applyCollectionRestore,
			applyCollectionUpdate,
			applyCollectionMove,
			applyCollectionCapabilities,
			applyCollectionListInvalidated,
			patchCollectionCapabilities: bind(collectionActions, 'patchCollectionCapabilities'),
			removeCollectionLocal: bind(collectionActions, 'removeCollectionLocal'),
			moveCollectionLocal: bind(collectionActions, 'moveCollectionLocal'),
			applyCollectionPositions: bind(collectionActions, 'applyCollectionPositions'),
			loadCollections: bind(collectionActions, 'loadCollections'),
			selectCollection: bind(selectionActions, 'selectCollection'),
			selectDocument: bind(selectionActions, 'selectDocument'),
			clearSelection: bind(selectionActions, 'clearSelection'),
			clearDocumentSelection: bind(selectionActions, 'clearDocumentSelection'),
			setSharedView: bind(selectionActions, 'setSharedView'),
			setArchiveView: bind(selectionActions, 'setArchiveView'),
			setRecycleBinView: bind(selectionActions, 'setRecycleBinView'),
			toggleDocExpanded: bind(expansionActions, 'toggleDocExpanded'),
			clearCollectionExpandedDocs: bind(expansionActions, 'clearCollectionExpandedDocs'),
			subscribeToPullEvents: bind(pullActions, 'subscribeToPullEvents'),
			unsubscribeFromPullEvents: bind(pullActions, 'unsubscribeFromPullEvents'),
			toggleSharedSection: bind(accessibleTreeActions, 'toggleSharedSection'),
			ensureSharedLoaded: bind(accessibleTreeActions, 'ensureSharedLoaded'),
			loadMoreSharedTree: bind(accessibleTreeActions, 'loadMoreSharedTree'),
			toggleSharedDocExpanded: bind(accessibleTreeActions, 'toggleSharedDocExpanded'),
			toggleSharedContainer: bind(accessibleTreeActions, 'toggleSharedContainer'),
			prefetchSharedChildren: bind(accessibleTreeActions, 'prefetchSharedChildren'),
			loadMoreSharedChildren: bind(accessibleTreeActions, 'loadMoreSharedChildren'),
			applyDocumentAccessCascade,
			hydrateFavorites: bind(favoriteActions, 'hydrateFavorites'),
			loadFavoritesPage: bind(favoriteActions, 'loadFavoritesPage'),
			reloadFavorites: bind(favoriteActions, 'reloadFavorites'),
			retryFavorites: bind(favoriteActions, 'retryFavorites'),
			setFavoritesFilter: bind(favoriteActions, 'setFavoritesFilter'),
			setFavoritesSectionExpanded: bind(favoriteActions, 'setFavoritesSectionExpanded'),
			toggleFavoritesSection: bind(favoriteActions, 'toggleFavoritesSection'),
			toggleFavorite: bind(favoriteActions, 'toggleFavorite'),
			applyExternalFavorite: bind(favoriteActions, 'applyExternalFavorite'),
			applyExternalNotify: bind(favoriteActions, 'applyExternalNotify'),
			moveFavoriteRow: bind(favoriteActions, 'moveFavoriteRow'),
			toggleFavoriteExpanded: bind(favoriteActions, 'toggleFavoriteExpanded'),
			retryFavoriteBranch: bind(favoriteActions, 'retryFavoriteBranch'),
			refreshFavoriteCoverage: bind(favoriteActions, 'refreshFavoriteCoverage'),
			toggleFavoriteNotify: bind(favoriteActions, 'toggleFavoriteNotify'),
			setFavoriteNotify: bind(favoriteActions, 'setFavoriteNotify'),
			clearFavoriteNotify: bind(favoriteActions, 'clearFavoriteNotify'),
		};

		this.queries = {
			getChildren: bind(queryService, 'getChildren'),
			findCollection: bind(queryService, 'findCollection'),
			findLoadedDocument: bind(queryService, 'findLoadedDocument'),
			findLoadedDocumentAnywhere: bind(queryService, 'findLoadedDocumentAnywhere'),
			isDocumentLoadedAnywhere: bind(queryService, 'isDocumentLoadedAnywhere'),
			getAncestorsForDocument: bind(queryService, 'getAncestorsForDocument'),
			isLoadingChildren: bind(queryService, 'isLoadingChildren'),
			hasNextChildren: bind(queryService, 'hasNextChildren'),
			isChildrenHydrated: bind(queryService, 'isChildrenHydrated'),
			isBranchLoaded: bind(queryService, 'isBranchLoaded'),
			getSharedChildren: bind(accessibleTreeActions, 'getSharedChildren'),
			isSharedChildrenLoading: bind(accessibleTreeActions, 'isSharedChildrenLoading'),
			hasNextSharedChildren: bind(accessibleTreeActions, 'hasNextSharedChildren'),
			isSharedContainerExpanded: bind(accessibleTreeActions, 'isSharedContainerExpanded'),
			isFavorite: bind(queryService, 'isFavorite'),
			isFavoriteExpanded: bind(queryService, 'isFavoriteExpanded'),
			favoriteBranchError: bind(queryService, 'favoriteBranchError'),
			favoriteNotify: bind(queryService, 'favoriteNotify'),
			isFavoriteNotifyPending: bind(queryService, 'isFavoriteNotifyPending'),
		};
	}
}

export function createSidebarStore(api, options = {})
{
	return new SidebarStore(api, options);
}
