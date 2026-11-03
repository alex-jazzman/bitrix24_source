declare type ChecklistView = Object;
declare type ChecklistItemView = Object;

declare type ChecklistItemViewModelProps = {
	itemId: ChecklistItemId,
	checklistId: ChecklistItemId,
	context: ChecklistEntityContext,
	isRoot?: boolean,
	// ChecklistView instance (the item's owner)
	viewModel: Object,
};

declare type ChecklistViewModelProps = {
	checklistId: ChecklistItemId,
	context: ChecklistEntityContext,
	focusController?: ChecklistFocusController,
	userId?: number,
	taskId?: number,
	autoCompleteItem?: boolean,
};

declare type ChecklistViewModelListViewItem = {
	id: ChecklistItemId,
	key: string,
	type: string,
	nodeId: ChecklistNodeId,
};
