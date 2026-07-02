import { MessengerModel, PayloadData } from '../../base';

export type FolderType = 'system' | 'personal';

export type FolderCode = 'default' | 'tasksTask' | 'copilot'
	| 'openChannel' | 'collab' | 'openlines' | null;

export interface FolderModelState {
	id: number;
	parentChatId: number;
	type: FolderType;
	code: FolderCode;
	title: string;
	sort: number;
	chatIds: Array<number>;
	recentSection: string | null;
}

declare type FolderModelCollection = {
	collection: Record<number, FolderModelState>;
	sortedIds: Array<number>;
}

export type FolderModel = MessengerModel<FolderModelCollection>;

export type FolderModelActions =
	| 'folderModel/set'
	| 'folderModel/setFromLocalDatabase'
	| 'folderModel/add'
	| 'folderModel/addFromPull'
	| 'folderModel/update'
	| 'folderModel/delete'
	| 'folderModel/sort'
	| 'folderModel/setChats'
;

export type FolderModelMutations =
	| 'folderModel/add'
	| 'folderModel/update'
	| 'folderModel/delete'
	| 'folderModel/sort'
	| 'folderModel/setChats'
	| 'folderModel/setState'
;

export interface FolderSetData extends PayloadData {
	folderList: Array<FolderModelState>;
}

export interface FolderAddData extends PayloadData {
	folder: FolderModelState;
}

export interface FolderUpdateData extends PayloadData {
	id: number;
	fields: Partial<FolderModelState>;
}

export interface FolderDeleteData extends PayloadData {
	id: number;
}

export interface FolderSortData extends PayloadData {
	sortedIds: Array<number>;
}

export interface FolderChatsData extends PayloadData {
	folderId: number;
	chatIds: Array<number>;
}

export interface FolderAddPayload {
	folder: FolderModelState;
}

export interface FolderChatsPayload {
	folderId: number;
	chatIds: Array<number>;
}
