import { LayoutWidget } from '../../../../../../../../mobile/dev/janative/api';
import {
	CheckListFlatTree,
	ChecklistItemData,
	ChecklistDiskConfig,
	ChecklistItemRequestData,
} from '../types/common';

export type ChecklistControllerProps = {
	taskId?: number | string,
	groupId?: number,
	userId?: number,
	checklistTree?: ChecklistItemData,
	diskConfig?: ChecklistDiskConfig,
	hideCompleted?: boolean,
	hideMoreMenu?: boolean,
	autoCompleteItem?: boolean,
	inLayout?: boolean,
	onChange?: (controller: Object) => void,
	onClose?: () => void,
	parentWidget?: LayoutWidget,
};

export type ChecklistTaskParams = Pick<
	ChecklistControllerProps,
	'userId' | 'taskId' | 'groupId' | 'diskConfig' | 'hideCompleted' | 'autoCompleteItem'
>;

export type ChecklistReduxDetail = {
	title: string,
	completed: number,
	uncompleted: number,
};

export type ChecklistReduxData = {
	completed: number,
	uncompleted: number,
	checklistDetails: ChecklistReduxDetail[],
};

export type ChecklistSaveParams = {
	taskId: number | string,
	items: ChecklistItemRequestData[],
};

export type ChecklistToggleCompletedParams = {
	value: boolean,
	userId: number,
};

export type MakeChecklistFlatTreesParams = {
	rawChecklistTree?: ChecklistItemData,
	userId?: number,
	taskId?: number,
};

export type OpenChecklistParams = {
	checklist?: CheckListFlatTree,
	focusedItemId?: number | string,
	parentWidget?: LayoutWidget,
};

export type MoveToChecklistParams = {
	moveIds?: Array<number | string>,
	toCheckListId?: number | string,
	sourceChecklistId?: number | string,
	open?: boolean,
};

export type SetChecklistsParams = {
	checklistsFlatTree?: ChecklistItemData[][],
	checklistsTree?: ChecklistItemData,
	clear?: boolean,
};

export type AddToWidgetMapParams = {
	checklistId: number | string,
	checklistWidget: Object,
};
