export type Layout = {
	name: string,
	entityId: string,
	contextId: number,
	params: LayoutParams,
};

type LayoutParams = FolderLayoutParams;

export type FolderLayoutParams = { folderId: number };
