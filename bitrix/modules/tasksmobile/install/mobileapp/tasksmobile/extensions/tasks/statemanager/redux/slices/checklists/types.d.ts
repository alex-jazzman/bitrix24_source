declare type ChecklistEntityType = 'task' | 'template' | 'dod';

declare type RestError = {
	code?: string | number | null,
	message?: string,
	customData?: unknown,
};

declare type RunActionResponse = {
	status: string,
	data: any,
	errors: RestError[],
};

declare type ChecklistItemId = number | string;

declare type ChecklistNodeId = number | string;

declare type ChecklistEntityRef = {
	entityType: ChecklistEntityType,
	entityId: number | string,
};

declare type ChecklistMemberV2 = {
	id: number,
	name?: string,
	image?: string,
};

declare type ChecklistAttachmentV2 = {
	id: number | string,
	fileId?: number | string,
	name?: string,
	url?: string,
	type?: string,
	isUploading?: boolean,
};

declare type ChecklistItemActions = {
	modify?: boolean,
	remove?: boolean,
	toggle?: boolean,
	add?: boolean,
	addAccomplice?: boolean,
};

declare type ChecklistV2Raw = {
	id: number,
	nodeId: string,
	entityId?: number,
	entityType?: ChecklistEntityType,
	title?: string,
	parentId: number,
	parentNodeId?: string | null,
	sortIndex?: number,
	isComplete?: boolean,
	isImportant?: boolean,
	accomplices?: ChecklistMemberV2[],
	auditors?: ChecklistMemberV2[],
	attachments?: ChecklistAttachmentV2[],
	actions?: ChecklistItemActions,
	collapsed?: boolean,
	expanded?: boolean,
	copiedId?: number | null,
	creator?: ChecklistMemberV2,
};

declare type ChecklistReduxModel = ChecklistEntityRef & {
	id: ChecklistItemId,
	nodeId: string,
	serverId: number | null,
	title: string,
	sortIndex: number,
	collapsed: boolean,
	expanded: boolean,
	isComplete: boolean,
	actions: ChecklistItemActions,
	createdBy: number | null,
	isNew: boolean,
};

declare type ChecklistItemContent = {
	title: string,
	sortIndex: number,
	isComplete: boolean,
	isImportant: boolean,
	accomplices: ChecklistMemberV2[],
	auditors: ChecklistMemberV2[],
	attachments: ChecklistAttachmentV2[],
};

declare type ChecklistItemReduxModel = ChecklistItemContent & ChecklistEntityRef & {
	id: ChecklistItemId,
	nodeId: string,
	serverId: number | null,
	checklistId: ChecklistItemId,
	parentId: ChecklistItemId,
	parentNodeId: string | null,
	displaySortIndex: string,
	actions: ChecklistItemActions,
	copiedId: number | null,
	isNew: boolean,
};

declare type ChecklistItemSaveDTO = ChecklistItemContent & {
	id?: number,
	nodeId: string,
	parentId: number,
	parentNodeId: string | null,
	copiedId?: number,
};

declare type ChecklistMemberFields = {
	ID: number | string,
	TYPE: string,
	NAME: string,
};

declare type ChecklistMembersMap = { [id: string]: ChecklistMemberFields };

declare type ChecklistAttachmentsMap = { [token: string]: number | string };

declare type ChecklistItemRequestData = {
	NODE_ID: ChecklistNodeId,
	PARENT_NODE_ID: ChecklistNodeId,
	PARENT_ID: number | null,
	TITLE: string,
	SORT_INDEX: number,
	IS_COMPLETE: number,
	IS_IMPORTANT: number,
	ID?: number,
	COPIED_ID?: ChecklistItemId,
	ATTACHMENTS?: ChecklistAttachmentsMap,
	MEMBERS?: ChecklistMembersMap,
};

declare type RunActionParams = {
	action: string,
	options: object,
	json?: boolean,
};

declare type ChecklistGetParams = ChecklistEntityRef;

declare type ChecklistSaveParams = ChecklistEntityRef & {
	payload: ChecklistItemSaveDTO[],
	skipNotification?: boolean,
};

declare type ChecklistToggleBatchParams = ChecklistEntityRef & {
	serverIds: number[],
	isComplete: boolean,
};

declare type ChecklistExpandStateParams = ChecklistEntityRef & {
	checklistId: ChecklistItemId,
};

declare type NewChecklistParams = ChecklistEntityRef & {
	title?: string,
	sortIndex?: number,
	createdBy?: number | null,
};

declare type NewItemParams = ChecklistEntityRef & {
	checklistId: ChecklistItemId,
	parentId: ChecklistItemId,
	sortIndex?: number,
	title?: string,
};

declare type SplitFlatListResult = {
	checklists: ChecklistReduxModel[],
	items: ChecklistItemReduxModel[],
};

declare type ChecklistFetchMergeMaps = {
	storeIdRemap: Record<string, string>,
	responseServerIds: Set<number>,
};

declare type ChecklistParentResolvers = {
	resolveParentId: (parentId: ChecklistItemId) => number | null,
	resolveParentNodeId: (parentId: ChecklistItemId) => ChecklistItemId | null,
};

declare type BuildItemFieldsOptions = {
	flagsAsInt?: boolean,
	alwaysCollections?: boolean,
	mapAttachments?: (attachments: ChecklistAttachmentV2[]) => ChecklistAttachmentsMap,
};

declare type ChecklistEntityArg = Omit<ChecklistEntityRef, 'entityType'> & {
	entityType?: ChecklistEntityType,
};

declare type ChecklistRefArg = ChecklistEntityArg & {
	checklistId: ChecklistItemId,
};

declare type SaveChecklistsArg = ChecklistEntityArg & {
	skipNotification?: boolean,
};

declare type ChecklistToggleArg = ChecklistEntityArg & {
	isComplete: boolean,
};

declare type ToggleItemsArg = ChecklistToggleArg & {
	itemIds: ChecklistItemId[],
	serverIds: number[],
};

declare type ChecklistCounters = {
	completed: number,
	uncompleted: number,
};

declare type ChecklistStatsDetail = ChecklistCounters & {
	title: string,
};

declare type ChecklistStats = ChecklistCounters & {
	checklistDetails: ChecklistStatsDetail[],
};

declare type ChecklistEntityContext = ChecklistEntityRef & {
	userId?: number | null,
	canEditChecklist?: boolean,
	canAddChecklist?: boolean,
};

declare type ChecklistFocusController = {
	getFocusedItemId?: () => (ChecklistItemId | null | undefined),
	isFocused?: (id: ChecklistItemId) => boolean,
	focus?: (id: ChecklistItemId) => void,
	blur?: (id: ChecklistItemId) => void,
};
