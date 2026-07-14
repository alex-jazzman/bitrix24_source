export const NoteEvent = {
	DOCUMENT_RENAMED: 'Note:documentRenamed',
	COLLECTION_RENAMED: 'Note:collectionRenamed',
	DOCUMENT_CHILDREN_CHANGED: 'Note:documentChildrenChanged',
	DOCUMENTS_BULK_RESTORED: 'Note:documentsBulkRestored',
	// Cross-route bus: sidebar re-emits selected pull commands so other pages
	// (e.g. /shared/) can react without subscribing to BX.PULL directly.
	PULL_EVENT: 'Note:pullEvent',
	// Editor → app: after a push-driven capability refetch, app-level
	// routeDocumentContext.document needs the new recycleBinId/canRestore/etc
	// so menu actions (restoreFromTrash, hardDelete) can read them.
	DOCUMENT_ACCESS_SYNCED: 'Note:documentAccessSynced',
};
