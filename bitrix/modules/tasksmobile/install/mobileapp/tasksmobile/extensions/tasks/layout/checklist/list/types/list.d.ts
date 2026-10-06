import { LayoutWidget } from '../../../../../../../../../../mobile/dev/janative/api';
import {
	CheckListFlatTree,
	CheckListFlatTreeItem,
	ChecklistConditions,
	ChecklistMemberType,
	ChecklistDiskConfig,
} from '../../../../checklist/types/common';

export type ChecklistReloadParams = ChecklistConditions;

export type ChecklistMoveToChecklistRequest = {
	moveIds: Array<number | string>,
	toCheckListId: number | string,
	sourceChecklistId: number | string,
};

export type ChecklistProps = {
	checklist: CheckListFlatTree,
	parentWidget?: LayoutWidget,
	focusedItemId?: number | string,
	onlyMine?: boolean,
	hideCompleted?: boolean,
	diskConfig?: ChecklistDiskConfig,
	groupId?: number | string,
	checklists?: CheckListFlatTree[],
	onChange?: () => void,
	onSave?: () => void,
	onMoveToCheckList?: (params: ChecklistMoveToChecklistRequest) => Promise<Object>,
};

export type ChecklistUpdateRowsParams = {
	itemIds: Array<number | string>,
	animation?: string,
	saveFocus?: boolean,
	shouldRender?: boolean,
};

export type ChecklistOnBlurParams = {
	item: CheckListFlatTreeItem,
	forceDelete?: boolean,
};

export type ChecklistRemoveItemParams = {
	item: CheckListFlatTreeItem,
};

export type ChecklistChangeMembersParams = {
	members: Object[],
	item: CheckListFlatTreeItem,
	memberType: ChecklistMemberType,
};

export type ChecklistChangeAttachmentsParams = {
	item: CheckListFlatTreeItem,
	shouldRender?: boolean,
};

export type ChecklistMoveItemParams = {
	checklistId: number | string,
	moveIds: Array<number | string>,
};

export type ChecklistChangeUsersParams = {
	item: CheckListFlatTreeItem,
	memberType: ChecklistMemberType,
};
