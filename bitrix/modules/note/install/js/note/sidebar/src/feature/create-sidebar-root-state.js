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

	return {
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
		get sidebarWidth() { return uiState.sidebarWidth; },
		get sidebarCollapsed() { return uiState.sidebarCollapsed; },
		get isMobile() { return Boolean(uiState.isMobile); },
		get sidebarEffectiveWidth()
		{
			return uiState.sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : uiState.sidebarWidth;
		},
		expandedDocs: store.state.expandedDocs,
		get currentRootDocs() { return store.state.currentRootDocs.value; },
		get docDragItem() { return dragState.docItem; },
		get docDropTarget() { return dragState.docTarget; },
		get collectionDragItem() { return dragState.collectionItem; },
		get collectionDropTarget() { return dragState.collectionTarget; },
		get renamingDocId() { return uiState.renamingDocId; },
		get renamingCollectionId() { return uiState.renamingCollectionId; },
		getChildren: store.queries.getChildren,
		isLoadingChildren: store.queries.isLoadingChildren,
		hasNextChildren: store.queries.hasNextChildren,
		getRootDocs: (collectionId) => store.queries.getChildren(collectionId, null),
		isRootLoading: (collectionId) => store.queries.isLoadingChildren(collectionId, null),
		hasRootNextPage: (collectionId) => store.queries.hasNextChildren(collectionId, null),
	};
}
