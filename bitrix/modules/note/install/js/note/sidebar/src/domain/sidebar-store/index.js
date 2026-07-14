import { BaseEvent, EventEmitter } from 'main.core.events';
import { NoteEvent } from '../../services/note-events';
import { SidebarCollectionActions } from './actions/create-collections-actions';
import { SidebarDocumentActions } from './actions/create-documents-actions';
import { SidebarErrorActions } from './actions/create-error-actions';
import { SidebarExpansionActions } from './actions/create-expansion-actions';
import { SidebarHydrationActions } from './actions/create-hydration-actions';
import { PullCommand, SidebarPullActions } from './actions/create-pull-actions';
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

		// Late-bound: pullActions is constructed below after the dispatch table is built.
		let pullActionsRef = null;
		const collectionActions = new SidebarCollectionActions({
			api,
			state: internalState,
			setError,
			setGlobalPermissions: bind(hydrationActions, 'setGlobalPermissions'),
			removeBranch,
			refreshCollectionWatches: () => pullActionsRef?.refreshCollectionWatches(),
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

		// Pull-router dispatch table. Phase 1 handlers are wired below;
		// noop slots reserve commands that arrive earlier than their phase ships.
		const noop = () => {};
		const applyDocumentUpdate = bind(documentActions, 'applyDocumentUpdate');
		const applyDocumentMove = bind(documentActions, 'applyDocumentMove');
		const applyDocumentRemoval = bind(documentActions, 'applyDocumentRemoval');
		const applyDocumentActive = bind(documentActions, 'applyDocumentActive');
		const applyDocumentCreate = bind(documentActions, 'applyDocumentCreate');
		const applyCollectionCreate = bind(collectionActions, 'applyCollectionCreate');
		const applyCollectionDelete = bind(collectionActions, 'applyCollectionDelete');
		const applyCollectionArchive = bind(collectionActions, 'applyCollectionArchive');
		const applyCollectionRestore = bind(collectionActions, 'applyCollectionRestore');
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

		const handlers = {
			[PullCommand.DOCUMENT_CREATE]: pullDocumentCreate,
			[PullCommand.DOCUMENT_UPDATE]: applyDocumentUpdate,
			[PullCommand.DOCUMENT_MOVE]: pullDocumentMove,
			[PullCommand.DOCUMENT_ARCHIVE]: pullDocumentRemoval,
			[PullCommand.DOCUMENT_RESTORE]: pullDocumentActive,
			[PullCommand.DOCUMENT_DELETE]: pullDocumentRemoval,
			[PullCommand.DOCUMENT_HARD_DELETE]: noop,
			[PullCommand.COLLECTION_CREATE]: applyCollectionCreate,
			[PullCommand.COLLECTION_UPDATE]: applyCollectionUpdate,
			[PullCommand.COLLECTION_MOVE]: applyCollectionMove,
			[PullCommand.COLLECTION_ARCHIVE]: applyCollectionArchive,
			[PullCommand.COLLECTION_RESTORE]: applyCollectionRestore,
			[PullCommand.COLLECTION_DELETE]: applyCollectionDelete,
			[PullCommand.COLLECTION_CAPABILITIES]: applyCollectionCapabilities,
			[PullCommand.COLLECTION_LIST_INVALIDATED]: applyCollectionListInvalidated,
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
