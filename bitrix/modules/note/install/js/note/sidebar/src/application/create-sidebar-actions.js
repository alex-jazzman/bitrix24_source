
function createInlineEditActions({ collectionUseCases, documentUseCases })
{
	return {
		confirmRenameCollection: (id, name) => collectionUseCases.confirmRenameCollection(id, name),
		cancelRenameCollection: () => collectionUseCases.cancelRenameCollection(),
		confirmRenameDocument: (id, title, collectionId) => {
			return documentUseCases.confirmRenameDocument(id, title, collectionId);
		},
		cancelRenameDocument: () => documentUseCases.cancelRenameDocument(),
	};
}

function createDndActions({ collectionDndService, documentDndService })
{
	return {
		startCollectionDrag: (collection, event) => collectionDndService.startDrag(collection, event),
		onCollectionDragOver: (collection, event) => collectionDndService.onDragOver(collection, event),
		onCollectionDrop: async (collection, event) => collectionDndService.onDrop(collection, event),
		onCollectionListDragOver: (event) => collectionDndService.onListDragOver(event),
		onCollectionListDrop: async (event) => collectionDndService.onListDrop(event),
		onCollectionViewportDragOver: (event) => collectionDndService.onViewportDragOver(event),
		onCollectionViewportDrop: async (event) => collectionDndService.onViewportDrop(event),
		endCollectionDrag: () => collectionDndService.endDrag(),
		startDocDrag: (doc, event) => documentDndService.startDrag(doc, event),
		onDocBranchDragEnter: (payload) => documentDndService.onBranchDragEnter(payload),
		onDocBranchDragOver: (payload) => documentDndService.onBranchDragOver(payload),
		onDocBranchDrop: async (payload) => documentDndService.onBranchDrop(payload),
		onDocCollectionDragOver: (collection, event) => documentDndService.onCollectionDragOver(collection, event),
		onDocCollectionDrop: async (collection, event) => documentDndService.onCollectionDrop(collection, event),
		onDocViewportDragOver: (event) => documentDndService.onViewportDragOver(event),
		onDocViewportDrop: async (event) => documentDndService.onViewportDrop(event),
		endDocDrag: () => documentDndService.clearDrag(),
		invalidateDndRectCache: () => {
			collectionDndService.invalidateDragRectCache();
			documentDndService.invalidateDragRectCache();
		},
	};
}

export function createSidebarActions({
	collectionUseCases,
	documentUseCases,
	collectionDndService,
	documentDndService,
	messages,
	router,
	routeNames = {},
	setSidebarWidth = () => {},
	saveSidebarWidth = () => {},
	setSidebarMinWidth = () => {},
	setSidebarCollapsed = () => {},
	toggleSidebarCollapsed = () => false,
	saveSidebarState = () => {},
})
{
	return {
		canEditCollection: (collection) => collectionUseCases.canEditCollection(collection),
		canManageCollectionPermissions: (collection) => collectionUseCases.canManageCollectionPermissions(collection),
		canEditDocument: (doc) => documentUseCases.canEditDocument(doc),
		canManageDocument: (doc) => documentUseCases.canManageDocument(doc),
		openCollection: async (collection) => collectionUseCases.openCollection(collection),
		prefetchCollectionChildren: async (collection) => collectionUseCases.prefetchCollectionChildren(collection),
		isCollectionExpanded: (collectionId) => collectionUseCases.isCollectionExpanded(collectionId),
		toggleCollectionExpanded: async (collection) => collectionUseCases.toggleCollectionExpanded(collection),
		toggleCollectionsSection: () => collectionUseCases.toggleCollectionsSection(),
		loadMoreCollections: async () => collectionUseCases.loadMoreCollections(),
		refreshCollections: async () => collectionUseCases.refreshCollections(),
		openDocument: async (doc) => documentUseCases.openDocument(doc),
		prefetchDocumentChildren: async (doc) => documentUseCases.prefetchDocumentChildren(doc),
		toggleDoc: async (doc) => documentUseCases.toggleDoc(doc),
		loadMoreChildren: async (doc) => documentUseCases.loadMoreChildren(doc),
		createCollection: async () => collectionUseCases.createCollection(),
		createDocument: async () => documentUseCases.createDocument(),
		createDocumentFromSidebar: async () => documentUseCases.createDocumentFromSidebar(),
		createDocumentForCollection: async (collection) => documentUseCases.createDocumentForCollection(collection),
		createChildDocument: async (doc) => documentUseCases.createChildDocument(doc),
		renameCollection: async (collection) => collectionUseCases.renameCollection(collection),
		deleteCollection: async (collection) => collectionUseCases.deleteCollection(collection),
		renameDocument: async (doc) => documentUseCases.renameDocument(doc),
		deleteDocument: async (doc) => documentUseCases.deleteDocument(doc),
		archiveDocument: async (doc) => documentUseCases.archiveDocument(doc),
		restoreDocument: async (doc) => documentUseCases.restoreDocument(doc),
		...createDndActions({ collectionDndService, documentDndService }),
		...createInlineEditActions({ collectionUseCases, documentUseCases }),
		setSidebarWidth: (width) => setSidebarWidth(width),
		saveSidebarWidth: (width) => saveSidebarWidth(width),
		setSidebarMinWidth: (minWidth) => setSidebarMinWidth(minWidth),
		setSidebarCollapsed: (collapsed) => setSidebarCollapsed(collapsed),
		toggleSidebarCollapsed: () => toggleSidebarCollapsed(),
		saveSidebarState: (payload) => saveSidebarState(payload),
		navigateToSearch: (query) => {
			if (router && routeNames.search)
			{
				router.push({ name: routeNames.search, query: { q: query } });
			}
		},
		navigateToShared: () => {
			if (router && routeNames.shared)
			{
				router.push({ name: routeNames.shared });
			}
		},
		navigateToArchive: () => {
			if (router && routeNames.archive)
			{
				router.push({ name: routeNames.archive });
			}
		},
		navigateToRecycleBin: () => {
			if (router && routeNames.recyclebin)
			{
				router.push({ name: routeNames.recyclebin });
			}
		},
		navigateToWorkspace: (collectionId) => {
			const id = Number(collectionId);
			if (!router || !routeNames.workspace || !Number.isInteger(id) || id <= 0)
			{
				return;
			}

			router.push({ name: routeNames.workspace, params: { id } });
		},
	};
}
