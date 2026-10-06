export const NoteEvent = {
	DOCUMENT_RENAMED: 'Note:documentRenamed',
	COLLECTION_RENAMED: 'Note:collectionRenamed',
	DOCUMENT_CHILDREN_CHANGED: 'Note:documentChildrenChanged',
	DOCUMENTS_BULK_RESTORED: 'Note:documentsBulkRestored',
	// Workspace → sidebar: a bulk archive/delete/move ran on the current page. The
	// initiator is excluded from the pull fan-out, so the sidebar tree must be
	// refreshed locally the same way a bulk restore refreshes it.
	DOCUMENTS_BULK_CHANGED: 'Note:documentsBulkChanged',
	// Cross-route bus: sidebar re-emits selected pull commands so other pages
	// (e.g. /shared/) can react without subscribing to BX.PULL directly.
	PULL_EVENT: 'Note:pullEvent',
	// Editor → app: after a push-driven capability refetch, app-level
	// routeDocumentContext.document needs the new recycleBinId/canRestore/etc
	// so menu actions (restoreFromTrash, hardDelete) can read them.
	DOCUMENT_ACCESS_SYNCED: 'Note:documentAccessSynced',
	// Editor → sidebar: materialization is the one moment the client learns the stored text of a
	// document changed, and there is deliberately no pull event for it, so the fresh card preview
	// reaches the loaded branches through this local event.
	// Payload: `{ documentId, collectionId, excerpt }`.
	DOCUMENT_EXCERPT_CHANGED: 'Note:documentExcerptChanged',
	// Bell (editor) / collection toggle (workspace) → app bus: a subscription was added or
	// removed. Retained as a general event; no in-app listener at present.
	SUBSCRIPTION_CHANGED: 'Note:subscriptionChanged',
	// Star (sidebar row, activity line, knowledge base page) -> every other star of the same object.
	// The pull event says the same thing a moment later, but the stars of one page have to agree
	// within the frame of the press, so the flag travels locally first.
	// Payload: `{ entityType, entityId, isFavorite }`.
	FAVORITE_CHANGED: 'Note:favoriteChanged',
	// [EVENT-01] The only public way in and out of the BitrixGPT panel. Payload
	// `{ desired?: 'open' | 'close' }`; without `desired` the shell toggles the current state. The
	// single listener is the note.app shell, which owns that state.
	AI_CHAT_TOGGLE_REQUESTED: 'Note:aiChatToggleRequested',
	// [EVENT-02] Who occupies the right rail: `{ owner: NoteRailOwner | null }`. Every resident
	// announces itself, and anyone seeing a foreign owner collapses.
	RAIL_OCCUPANCY_CHANGED: 'Note:railOccupancyChanged',
};

// [EVENT-02] The three residents of the single right rail. The chat belongs to the app shell, the
// other two to the document page — the vocabulary lives here, next to the event, rather than with
// either side.
export const NoteRailOwner = Object.freeze({
	AI_CHAT: 'aiChat',
	HISTORY: 'history',
	HOTKEYS: 'hotkeys',
});
