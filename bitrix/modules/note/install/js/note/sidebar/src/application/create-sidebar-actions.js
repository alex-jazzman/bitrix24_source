
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

function createDndActions({ collectionDndService, documentDndService, favoriteDndService })
{
	return {
		startFavoriteDrag: (row, event) => favoriteDndService.startDrag(row, event),
		onFavoriteListDragOver: (event) => favoriteDndService.onListDragOver(event),
		onFavoriteListDrop: (event) => favoriteDndService.onListDrop(event),
		endFavoriteDrag: () => favoriteDndService.endDrag(),
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
			favoriteDndService.invalidateDragRectCache();
		},
	};
}

function createFileDropActions({ fileDropService })
{
	return {
		onSidebarFileDragEnter: (event) => fileDropService.onSidebarDragEnter(event),
		onSidebarFileDragOver: (event) => fileDropService.onSidebarDragOver(event),
		onSidebarFileDragLeave: (event) => fileDropService.onSidebarDragLeave(event),
		clearFileDrag: () => fileDropService.clearFileDrag(),
		onFileDragOverCollection: (collection) => fileDropService.resolveCollectionTarget(collection),
		onFileDropOnCollection: async (collection, event) => fileDropService.handleCollectionDrop(collection, event.dataTransfer.files),
		onFileDragOverDocument: (doc) => fileDropService.resolveDocumentTarget(doc),
		onFileDropOnDocument: async (doc, event) => fileDropService.handleDocumentDrop(doc, event.dataTransfer.files),
	};
}

export function createSidebarActions({
	collectionUseCases,
	documentUseCases,
	collectionDndService,
	documentDndService,
	favoriteDndService,
	fileDropService,
	messages,
	router,
	routeNames = {},
	setSidebarWidth = () => {},
	saveSidebarWidth = () => {},
	setSidebarMinWidth = () => {},
	setSidebarCollapsed = () => {},
	toggleSidebarCollapsed = () => false,
	saveSidebarState = () => {},
	setAiChatOpen = () => false,
	suppressSelectionScrollOnce = () => {},
	favoriteActions = {},
})
{
	return {
		// [TPL-02] The favorites block and all three stars go through the store, nothing else.
		...favoriteActions,
		canEditCollection: (collection) => collectionUseCases.canEditCollection(collection),
		canManageCollectionPermissions: (collection) => collectionUseCases.canManageCollectionPermissions(collection),
		canEditDocument: (doc) => documentUseCases.canEditDocument(doc),
		canManageDocument: (doc) => documentUseCases.canManageDocument(doc),
		openCollection: async (collection) => collectionUseCases.openCollection(collection),
		prefetchCollectionChildren: async (collection) => collectionUseCases.prefetchCollectionChildren(collection),
		isCollectionExpanded: (collectionId) => collectionUseCases.isCollectionExpanded(collectionId),
		toggleCollectionExpanded: async (collection) => collectionUseCases.toggleCollectionExpanded(collection),
		// Remembered the same way the width and the collapsed panel are: one write per press.
		toggleCollectionsSection: () => {
			collectionUseCases.toggleCollectionsSection();
			saveSidebarState();
		},
		toggleSharedSection: () => documentUseCases.toggleSharedSection(),
		ensureSharedLoaded: () => documentUseCases.ensureSharedLoaded(),
		loadMoreSharedTree: () => documentUseCases.loadMoreSharedTree(),
		toggleSharedDoc: (doc) => documentUseCases.toggleSharedDoc(doc),
		toggleSharedContainer: (collectionId) => documentUseCases.toggleSharedContainer(collectionId),
		prefetchSharedDocumentChildren: (doc) => documentUseCases.prefetchSharedDocumentChildren(doc),
		loadMoreSharedChildren: async (doc) => documentUseCases.loadMoreSharedChildren(doc),
		// Accessible-tree section forces DnD off; editing keeps its own per-doc gate.
		canManageSharedDocument: () => false,
		canEditSharedDocument: (doc) => documentUseCases.canEditDocument(doc),
		loadMoreCollections: async () => collectionUseCases.loadMoreCollections(),
		refreshCollections: async () => collectionUseCases.refreshCollections(),
		openDocument: async (doc) => documentUseCases.openDocument(doc),
		// Same navigation, minus the reveal: the row the user clicked is in frame already.
		openDocumentFromTree: async (doc) => {
			suppressSelectionScrollOnce();

			return documentUseCases.openDocument(doc);
		},
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
		...createDndActions({ collectionDndService, documentDndService, favoriteDndService }),
		...createFileDropActions({ fileDropService }),
		...createInlineEditActions({ collectionUseCases, documentUseCases }),
		setSidebarWidth: (width) => setSidebarWidth(width),
		saveSidebarWidth: (width) => saveSidebarWidth(width),
		setSidebarMinWidth: (minWidth) => setSidebarMinWidth(minWidth),
		setSidebarCollapsed: (collapsed) => setSidebarCollapsed(collapsed),
		toggleSidebarCollapsed: () => toggleSidebarCollapsed(),
		saveSidebarState: (payload) => saveSidebarState(payload),
		// [ALG-01] The only way the shell flips the rail panel state — mutation goes through
		// actions everywhere in the module.
		setAiChatOpen: (open) => setAiChatOpen(open),
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
