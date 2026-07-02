export type Collection = {
	id: number,
	name: string,
	position: number,
	canEditCollection: boolean,
	canManagePermissions: boolean,
};

export type SidebarDocument = {
	id: number,
	collectionId: number,
	parentId: number | null,
	title: string,
	collectionTitle: string,
	position: number,
	hasChildren: boolean,
	isArchived: boolean,
};

export type GlobalPermissions = {
	canEditCollections: boolean,
	canEditGlobalPermissions: boolean,
	canImport: boolean,
	hasManageableCollection: boolean,
};
