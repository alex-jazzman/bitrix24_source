import { SidebarCollectionActions } from './actions/create-collections-actions';
import { SidebarDocumentActions } from './actions/create-documents-actions';
import { SidebarErrorActions } from './actions/create-error-actions';
import { SidebarExpansionActions } from './actions/create-expansion-actions';
import { SidebarHydrationActions } from './actions/create-hydration-actions';
import { SidebarSelectionActions } from './actions/create-selection-actions';
import { SidebarStoreQueries } from './queries/create-sidebar-store-queries';
import { SidebarBranchUtils } from './shared/branch-utils';
import { keyOf, normalizeParentId } from './shared/keys';
import { SidebarStoreState } from './state/create-sidebar-store-state';

class SidebarStore
{
	state;
	actions;
	queries;

	constructor(api)
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

		const documentActions = new SidebarDocumentActions({
			api,
			state: internalState,
			queries: queryService,
			keyOf,
			normalizeParentId,
			setBranchDocs,
			removeBranch,
			setError,
		});
		const hydrationActions = new SidebarHydrationActions({
			state: internalState,
			keyOf,
			normalizeParentId,
		});

		const collectionActions = new SidebarCollectionActions({
			api,
			state: internalState,
			setError,
			setGlobalPermissions: bind(hydrationActions, 'setGlobalPermissions'),
			removeBranch,
		});
		const ensureChildrenLoaded = bind(documentActions, 'ensureChildrenLoaded');

		const selectionActions = new SidebarSelectionActions({
			state: internalState,
			ensureChildrenLoaded,
		});

		const expansionActions = new SidebarExpansionActions({
			state: internalState,
			getChildren: bind(queryService, 'getChildren'),
			ensureChildrenLoaded,
		});

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
		};

		this.actions = {
			setError,
			hydrateFromInitialContext: bind(hydrationActions, 'hydrateFromInitialContext'),
			hydrateInitialCollections: bind(hydrationActions, 'hydrateInitialCollections'),
			setGlobalPermissions: bind(hydrationActions, 'setGlobalPermissions'),
			invalidateChildren: bind(documentActions, 'invalidateChildren'),
			invalidateAllChildren: bind(documentActions, 'invalidateAllChildren'),
			setParentHasChildrenLocal: bind(documentActions, 'setParentHasChildrenLocal'),
			insertDocumentLocal: bind(documentActions, 'insertDocumentLocal'),
			updateDocumentLocal: bind(documentActions, 'updateDocumentLocal'),
			removeDocumentLocal: bind(documentActions, 'removeDocumentLocal'),
			moveDocumentLocal: bind(documentActions, 'moveDocumentLocal'),
			loadDocuments: bind(documentActions, 'loadDocuments'),
			prefetchChildren: bind(documentActions, 'prefetchChildren'),
			ensureChildrenLoaded,
			insertCollectionLocal: bind(collectionActions, 'insertCollectionLocal'),
			updateCollectionLocal: bind(collectionActions, 'updateCollectionLocal'),
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
		};
	}
}

export function createSidebarStore(api)
{
	return new SidebarStore(api);
}
