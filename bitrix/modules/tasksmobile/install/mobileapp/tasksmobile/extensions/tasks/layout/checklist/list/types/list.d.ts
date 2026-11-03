import { LayoutWidget } from '../../../../../../../../../../mobile/dev/janative/api';
import {
	ChecklistConditions,
	ChecklistDiskConfig,
	ChecklistMemberType,
} from '../../../../checklist/types';

export type ChecklistReloadParams = ChecklistConditions;

export type ChecklistMoveToChecklistRequest = {
	moveIds: Array<number | string>,
	toCheckListId: number | string,
	sourceChecklistId: number | string,
};

export type ChecklistProps = {
	checklist: ChecklistView,
	parentWidget?: LayoutWidget,
	focusedItemId?: number | string,
	onlyMine?: boolean,
	hideCompleted?: boolean,
	diskConfig?: ChecklistDiskConfig,
	groupId?: number | string,
	checklists?: ChecklistView[],
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
	item: ChecklistItemView,
	forceDelete?: boolean,
};

export type ChecklistRemoveItemParams = {
	item: ChecklistItemView,
};

export type ChecklistChangeMembersParams = {
	members: Object[],
	item: ChecklistItemView,
	memberType: ChecklistMemberType,
};

export type ChecklistChangeAttachmentsParams = {
	item: ChecklistItemView,
	shouldRender?: boolean,
};

export type ChecklistMoveItemParams = {
	checklistId: number | string,
	moveIds: Array<number | string>,
};

export type ChecklistChangeUsersParams = {
	item: ChecklistItemView,
	memberType: ChecklistMemberType,
};
