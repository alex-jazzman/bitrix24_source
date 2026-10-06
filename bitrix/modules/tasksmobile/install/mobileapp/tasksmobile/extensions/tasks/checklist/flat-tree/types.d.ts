import { ChecklistItemData, CheckListFlatTreeItem, ChecklistDiskConfig } from '../types/common';

export type CheckListFlatTreeProps = {
	checklist?: ChecklistItemData,
	checklistFlatTree?: ChecklistItemData[],
	autoCompleteItem?: boolean,
	userId?: number,
	taskId?: number | string,
	groupId?: number,
	diskConfig?: ChecklistDiskConfig,
	hideCompleted?: boolean,
};

export type BuildDefaultListParams = {
	addBlankItem?: boolean,
	items?: CheckListFlatTreeItem[],
	number?: number,
	autoCompleteItem?: boolean,
	userId?: number,
	taskId?: number | string,
	groupId?: number,
	diskConfig?: ChecklistDiskConfig,
	hideCompleted?: boolean,
};
