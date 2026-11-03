export type ChecklistItemId = number | string;

export type ChecklistNodeId = number | string;

export type ChecklistMemberShortType = 'A' | 'U';

export type ChecklistMemberType = 'accomplice' | 'auditor';

export type ChecklistMember = {
	id: ChecklistItemId,
	type: ChecklistMemberShortType,
	name: string,
	image?: string,
};

export type ChecklistPreparedMember = Omit<ChecklistMember, 'type'> & {
	type: ChecklistMemberType,
};

export type ChecklistAttachment = {
	id: ChecklistItemId,
	name?: string,
	url?: string,
	type?: string,
	fileId?: number,
	serverFileId?: string,
	token?: string,
	isUploading?: boolean,
};

export type ChecklistItemAction = {
	add: boolean,
	addAccomplice: boolean,
	modify: boolean,
	remove: boolean,
	toggle: boolean,
};

export type ChecklistItemFields = {
	id: ChecklistItemId,
	title: string,
	parentId: ChecklistItemId,
	sortIndex: number,
	displaySortIndex: string,
	isComplete: boolean,
	isImportant: boolean,
	isSelected: boolean,
	isCollapse: boolean,
	completedCount: number,
	totalCount: number,
	members: Record<string, ChecklistMember>,
	attachments: Record<string, ChecklistAttachment | null>,
	copiedId?: ChecklistItemId,
	parentNodeId?: ChecklistNodeId,
	parentCopiedId?: ChecklistItemId,
};

export type ChecklistItemData = {
	id: ChecklistItemId,
	key: string,
	type: string,
	nodeId: ChecklistNodeId,
	focused: boolean,
	isNew: boolean,
	isRoot?: boolean,
	alwaysShow?: boolean,
	index?: number,
	action: ChecklistItemAction,
	fields: ChecklistItemFields,
	descendants: ChecklistItemData[],
};

export type ChecklistItemFieldsDraft = Partial<Omit<ChecklistItemFields, 'sortIndex'>> & {
	sortIndex?: number | string,
};

export type ChecklistItemDraft = Partial<Omit<ChecklistItemData, 'action' | 'fields' | 'descendants'>> & {
	action?: Partial<ChecklistItemAction>,
	fields?: ChecklistItemFieldsDraft,
	descendants?: ChecklistItemData[],
};

export type ChecklistCompletedCounters = {
	completedCount: number,
	totalCount: number,
};

export type ChecklistConditions = {
	onlyMine?: boolean,
	hideCompleted?: boolean,
};

export type ChecklistDiskConfig = {
	folderId: number,
};

export type ChecklistAccessRestrictions = {
	add: boolean,
	update: boolean,
	remove: boolean,
	addAccomplice: boolean,
};
