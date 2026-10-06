import { computed } from 'ui.vue3';

const SIDEBAR_COLLAPSED_WIDTH = 48;

export function createSidebarRootState({ store, uiState, dragState, getRouteDocumentId }: {
	store: Object,
	uiState: Object,
	dragState: Object,
	getRouteDocumentId: () => number,
}): Object
{
	const documentsLoading = computed(() => {
		if (!store.state.selectedCollectionId.value)
		{
			return false;
		}

		return store.queries.isLoadingChildren(store.state.selectedCollectionId.value, null);
	});

	const hasManageableCollection = computed(() => {
		const items = store.state.collections.value;
		if (!Array.isArray(items))
		{
			return false;
		}

		return items.some((collection) => Boolean(collection?.canEditCollection));
	});

	const permissions = computed(() => ({
		...store.state.globalPermissions,
		hasManageableCollection: hasManageableCollection.value,
	}));

	// [TPL-02] Everything the favorites block and the stars are allowed to read.
	const favorites = {
		get items() { return store.state.favorites.value; },
		// Whether the block itself stands open, as opposed to `isExpanded` below, which answers for a row.
		get sectionExpanded() { return store.state.favoritesSectionExpanded.value; },
		get isLoading() { return store.state.favoritesLoading.value; },
		get isLoaded() { return store.state.favoritesHydrated.value; },
		// Whether the read in flight is the one a filter switch asked for - the only one the block stays
		// on screen for while it holds nothing.
		get isFilterReloading() { return store.state.favoritesFilterReloading.value; },
		get hasNextPage() { return store.state.favoritesHasNextPage.value; },
		get onlyNotified() { return store.state.favoritesOnlyNotified.value; },
		get error() { return store.state.favoritesError.value; },
		isFavorite: (entityType, entityId) => store.queries.isFavorite(entityType, entityId),
		// [P2] Expansion inside the block: the flag of a top-level row, and the same space projected onto
		// document ids for the tree rows nested under it - one map per top-level row, because a place in
		// the block is what carries the flag, not the object (see favoriteExpandKey).
		get expandedDocsByRow() { return store.state.favoritesExpandedDocs.value; },
		// [P3] Drag of the block: the row being carried and the gap it would go into.
		get dragItem() { return dragState.favoriteItem; },
		get dropTarget() { return dragState.favoriteTarget; },
		isExpanded: (entityType, entityId) => store.queries.isFavoriteExpanded(entityType, entityId),
		// [DTO-02] Notification state of a row of the block or of a document inside one of its branches,
		// and whether a write on it is still on the wire.
		notifyOf: (entityType, entityId) => store.queries.favoriteNotify(entityType, entityId),
		isNotifyPending: (entityType, entityId) => store.queries.isFavoriteNotifyPending(entityType, entityId),
		branchError: (entityType, entityId, scope) => store.queries.favoriteBranchError(entityType, entityId, scope),
	};

	return {
		favorites,
		get collections() { return store.state.collections.value; },
		get collectionsLoading() { return store.state.collectionsLoading.value; },
		get collectionsHasNextPage() { return store.state.collectionsHasNextPage.value; },
		get permissions() { return permissions.value; },
		get documentsLoading() { return documentsLoading.value; },
		get selectedCollectionId() { return store.state.selectedCollectionId.value; },
		get selectedDocId() { return getRouteDocumentId() || store.state.selectedDocId.value; },
		get selectedSharedView() { return store.state.selectedSharedView.value; },
		get selectedArchiveView() { return store.state.selectedArchiveView.value; },
		get selectedRecycleBinView() { return store.state.selectedRecycleBinView.value; },
		get collectionsSectionExpanded() { return uiState.collectionsSectionExpanded; },
		get sharedTreeEnabled() { return Boolean(uiState.sharedTreeEnabled); },
		get sharedSectionExpanded() { return store.state.sharedSectionExpanded.value; },
		get sharedLoading() { return store.state.sharedLoading.value; },
		get sharedHydrated() { return store.state.sharedHydrated.value; },
		get sharedHasNextPage() { return store.state.sharedHasNextPage.value; },
		get sharedCursor() { return store.state.sharedCursor.value; },
		get sharedContainers() { return store.state.sharedContainers.value; },
		get sidebarWidth() { return uiState.sidebarWidth; },
		get sidebarCollapsed() { return uiState.sidebarCollapsed; },
		get isMobile() { return Boolean(uiState.isMobile); },
		get historyEnabled() { return Boolean(uiState.historyEnabled); },
		get notificationsEnabled() { return Boolean(uiState.notificationsEnabled); },
		get sidebarEffectiveWidth()
		{
			return uiState.sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : uiState.sidebarWidth;
		},
		get aiChatOpen() { return Boolean(uiState.aiChatOpen); },
		expandedDocs: store.state.expandedDocs,
		get currentRootDocs() { return store.state.currentRootDocs.value; },
		get docDragItem() { return dragState.docItem; },
		get docDropTarget() { return dragState.docTarget; },
		get collectionDragItem() { return dragState.collectionItem; },
		get collectionDropTarget() { return dragState.collectionTarget; },
		get fileDragItem() { return dragState.fileDragItem; },
		get fileDropTarget() { return dragState.fileDropTarget; },
		get renamingDocId() { return uiState.renamingDocId; },
		get renamingCollectionId() { return uiState.renamingCollectionId; },
		getChildren: store.queries.getChildren,
		isLoadingChildren: store.queries.isLoadingChildren,
		hasNextChildren: store.queries.hasNextChildren,
		getRootDocs: (collectionId) => store.queries.getChildren(collectionId, null),
		isRootLoading: (collectionId) => store.queries.isLoadingChildren(collectionId, null),
		hasRootNextPage: (collectionId) => store.queries.hasNextChildren(collectionId, null),
		getSharedChildren: store.queries.getSharedChildren,
		isSharedChildrenLoading: store.queries.isSharedChildrenLoading,
		hasNextSharedChildren: store.queries.hasNextSharedChildren,
		getSharedRootDocs: (collectionId) => store.queries.getSharedChildren(collectionId, null),
		isSharedContainerExpanded: (collectionId) => store.queries.isSharedContainerExpanded(collectionId),
	};
}
