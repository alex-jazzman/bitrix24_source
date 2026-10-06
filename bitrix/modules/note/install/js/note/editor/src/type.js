export type CurrentUser = {
	id: string,
	name: string,
	color: string,
	avatar: string | null,
};

export type CollaborationContext = {
	readOnly: boolean,
	currentUser: CurrentUser,
};

export type DocumentViewer = {
	userId: number,
	name: string,
	avatar: string | null,
	viewedAt: string,
};

// [#6] Initial "who viewed" snapshot bundled with the document bootstrap payload (see
// DocumentViewsSnapshotResolver) — ViewsWidgetComponent uses it as its base and skips its
// own getViews call on mount.
export type DocumentViewsSnapshot = {
	uniqueCount: number,
	viewers: Array<DocumentViewer>,
};

// [DTO-01] Backlinks counter bundled with the document bootstrap payload (see
// DocumentBacklinksSnapshotResolver) — BacklinksWidgetComponent adopts it instead of reading the
// count itself. `isCapped` means the server stopped counting at its cap.
export type DocumentBacklinksSnapshot = {
	count: number,
	isCapped: boolean,
};

export type DocumentChangeAuthor = {
	id: number,
	name: string,
	avatar: string | null,
};

// [#2] Bootstrap snapshot of the last content change — feeds ActivityLineComponent's chip
// (note.ui.document-history) via note.editor's own `lastChange` state/prop. `time` is an
// ISO 8601 string, formatted client-side (see activity-line.js's chipTimeText).
export type DocumentLastChange = {
	authors: Array<DocumentChangeAuthor>,
	time: string,
};

export type DocumentData = {
	id: number,
	collectionId: number,
	parentId: number | null,
	title: string,
	collectionTitle: string,
	markdown: Object | null,
	position: number,
	isArchived: boolean,
	archivedAt: string | null,
	isTrashed: boolean,
	recycleBinId: number | null,
	trashedAt: string | null,
	isOrphan: boolean,
	canRestore: boolean,
	canHardDelete: boolean,
	canEdit: boolean,
	canEditCollection: boolean,
	canManagePermissions: boolean,
	sharedAccess?: boolean,
	collaboration: CollaborationContext,
	views?: DocumentViewsSnapshot | null,
	backlinks?: DocumentBacklinksSnapshot | null,
	lastChange?: DocumentLastChange | null,
};
