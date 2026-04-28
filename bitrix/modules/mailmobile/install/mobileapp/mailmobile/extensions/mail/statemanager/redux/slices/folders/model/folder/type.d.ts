declare type FolderReduxModel = {
	id: number;
	name: string;
	type: string;
	path: string;
	isHidden: boolean;
	unreadCount: number;
	messageCount: number;
	parentId: number | null;
	hasChild: boolean;
};
