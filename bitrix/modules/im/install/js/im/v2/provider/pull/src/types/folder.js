import { type ImModelFolder } from 'im.v2.model';

export type FolderCreateParams = {
	folder: ImModelFolder,
};

export type FolderUpdateParams = {
	folder: ImModelFolder,
};

export type FolderDeleteParams = {
	folderId: number,
};

export type FolderSortParams = {
	folderIds: number[],
};

export type FolderChatAddParams = {
	folder: ImModelFolder,
};

export type FolderChatDeleteParams = {
	folder: ImModelFolder,
};
