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

export interface CheckListFlatTreeItem {
	getCheckList(): CheckListFlatTree;
	setCheckList(checkList: CheckListFlatTree): void;
	getType(): string;
	updateListViewType(): void;
	createHashType(): string;
	getIndex(): number;
	getItem(): ChecklistItemData;
	getId(): ChecklistItemId;
	getCopiedId(): ChecklistItemId;
	setId(id: ChecklistItemId): void;
	getFieldId(): ChecklistItemId;
	getKey(): string;
	getNodeId(): ChecklistNodeId;
	setNodeId(id?: ChecklistNodeId): void;
	getParent(): CheckListFlatTreeItem | undefined;
	getParentId(): ChecklistItemId;
	setParentId(id: ChecklistItemId): void;
	getTitle(): string;
	setTitle(title?: string): void;
	hasItemTitle(): boolean;
	getSortIndex(): number;
	setSortIndex(sortIndex: number): void;
	getDisplaySortIndex(): string;
	setDisplaySortIndex(displaySortIndex: string): void;
	getDepth(): number;
	getTotalCount(): number;
	setTotalCount(totalCount: number): void;
	getCompletedCount(): number;
	setCompletedCount(completedCount: number): void;
	getAttachments(): Record<string, ChecklistAttachment | null>;
	getAttachmentsCount(): number;
	hasAttachments(): boolean;
	hasUploadingAttachments(): boolean;
	setAttachments(attachments: Record<string, ChecklistAttachment | null>): void;
	addAttachments(attachments: Record<string, ChecklistAttachment>): void;
	removeAttachment(id: ChecklistItemId): void;
	updateAttachment(attachment: ChecklistAttachment): void;
	getTaskId(): number;
	getUserId(): number;
	isRoot(): boolean;
	isFocused(): boolean;
	isAlwaysShow(): boolean;
	setAlwaysShow(value: boolean): void;
	isNew(): boolean;
	setIsNew(isNew: boolean): void;
	isFirstListDescendant(): boolean;
	getIsComplete(): boolean;
	setIsComplete(isComplete: boolean): void;
	getIsImportant(): boolean;
	getIsSelected(): boolean;
	focus(): void;
	blur(): void;
	checkCanAdd(): boolean;
	checkCanAddAccomplice(): boolean;
	checkCanUpdate(): boolean;
	checkCanRemove(): boolean;
	checkCanToggle(): boolean;
	checkCanTabIn(): boolean;
	checkCanTabOut(): boolean;
	shouldRemove(): boolean;
	hasAnotherCheckLists(): boolean;
	hasMembers(): boolean;
	getMembersCount(): number;
	getMembers(): ChecklistMember[];
	getPrepareMembers(): ChecklistPreparedMember[];
	getMembersIds(memberType: ChecklistMemberType): ChecklistItemId[];
	setMembers(members: Record<string, ChecklistMember>): void;
	addMembers(members: ChecklistMember[]): void;
	addMember(member: ChecklistMember): void;
	getMember(userId: ChecklistItemId): ChecklistMember | undefined;
	getFieldMembers(): Record<string, ChecklistMember>;
	clearMemberByType(memberType: ChecklistMemberType | ChecklistMemberShortType): void;
	hasAuditor(): boolean;
	hasAccomplice(): boolean;
	hasMemberType(memberType: ChecklistMemberShortType): boolean;
	getMemberType(type: ChecklistMemberType | ChecklistMemberShortType): ChecklistMemberShortType | ChecklistMemberType;
	getMoveIds(moveId?: ChecklistItemId): ChecklistItemId[];
	getDescendants(deep?: boolean): CheckListFlatTreeItem[];
	hasDescendants(): boolean;
	getDescendantsCount(deep?: boolean): number;
	toggleComplete(): void;
	toggleImportant(important: boolean): void;
	tabOut(): CheckListFlatTreeItem[];
	tabIn(): CheckListFlatTreeItem[];
	tabMoveUpdateCounter(items: CheckListFlatTreeItem[]): void;
	updateCompletedCount(): void;
	updateTotalCount(): void;
	countCompletedItems(recursively?: boolean): ChecklistCompletedCounters;
	updateComplete(complete: boolean): void;
	readonly fields: ChecklistItemFields;
	readonly action: ChecklistItemAction;
}

export interface CheckListFlatTree {
	getFlatTree(): ChecklistItemData[];
	getChecklist(): CheckListFlatTreeItem[];
	getChecklistItems(): CheckListFlatTreeItem[];
	getTreeItems(): CheckListFlatTreeItem[];
	getTreeItem(item: ChecklistItemData): CheckListFlatTreeItem | null;
	getFilteredItems(conditions: ChecklistConditions): CheckListFlatTreeItem[];
	getItemById(id: ChecklistItemId): CheckListFlatTreeItem | undefined;
	getItemByIndex(index: number): CheckListFlatTreeItem;
	getIndexById(id: ChecklistItemId): number;
	getLastItem(): CheckListFlatTreeItem;
	getRootItem(): CheckListFlatTreeItem;
	findRootItem(): CheckListFlatTreeItem | undefined;
	getId(): ChecklistItemId;
	getFocusedItemId(): ChecklistItemId | undefined;
	getLength(): number;
	getSiblings(item: CheckListFlatTreeItem): CheckListFlatTreeItem[];
	getPrevSiblingById(id: ChecklistItemId): CheckListFlatTreeItem | null;
	getDescendants(id: ChecklistItemId, deep?: boolean): CheckListFlatTreeItem[];
	getDescendantsCount(id: ChecklistItemId, deep?: boolean): number;
	getInsertPosition(item: CheckListFlatTreeItem): number;
	addNewItem(prevItem: CheckListFlatTreeItem): CheckListFlatTreeItem;
	insertItemToChecklist(prevItem: CheckListFlatTreeItem, position: number): CheckListFlatTreeItem;
	addMovedItem(item: CheckListFlatTreeItem, moveIds?: Array<number | string>): void;
	removeItem(item: CheckListFlatTreeItem): string[];
	removeById(id: ChecklistItemId): number;
	hasItem(item: CheckListFlatTreeItem): boolean;
	updateIndexes(id: ChecklistItemId): void;
	updateCounters(item: CheckListFlatTreeItem): void;
	updateCompletedItems(): void;
	getCompleteCount(): number;
	getUncompleteCount(): number;
	getRequestData(): ChecklistItemRequestData[];
	getAccessRestrictions(): ChecklistAccessRestrictions;
	canAdd(): boolean;
	canUpdate(): boolean;
	canRemove(): boolean;
	canAddAccomplice(): boolean;
	isAutoCompleteItem(): boolean;
	setConditions(conditions: ChecklistConditions, reload?: boolean): void;
	setCollapsed(nodeId: ChecklistNodeId, isCollapse: boolean): void;
	shouldFilterOnlyMine(item: CheckListFlatTreeItem): boolean;
	shouldFilterHideCompleted(item: CheckListFlatTreeItem): boolean;
	getUserId(): number;
	setUserId(userId: number | string): void;
	getTaskId(): number;
	setTaskId(taskId: number | string): void;
}

export type ChecklistMemberRequestData = {
	ID: ChecklistItemId,
	TYPE: ChecklistMemberShortType,
	NAME: string,
};

export type ChecklistItemRequestData = {
	NODE_ID: ChecklistNodeId,
	PARENT_NODE_ID: ChecklistNodeId,
	PARENT_ID: number | null,
	TITLE: string,
	SORT_INDEX: number,
	IS_COMPLETE: number,
	IS_IMPORTANT: number,
	ID?: number,
	COPIED_ID?: ChecklistItemId,
	ATTACHMENTS?: Record<string, string>,
	MEMBERS?: Record<string, ChecklistMemberRequestData>,
};
