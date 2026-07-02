export type CurrentUser = {
	id: string,
	name: string,
	color: string,
};

export type CollaborationContext = {
	readOnly: boolean,
	currentUser: CurrentUser,
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
};
