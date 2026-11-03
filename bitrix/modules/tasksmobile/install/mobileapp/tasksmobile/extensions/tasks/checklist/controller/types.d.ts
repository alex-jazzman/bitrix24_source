import { LayoutWidget } from '../../../../../../../../mobile/dev/janative/api';
import { ChecklistDiskConfig } from '../types';

export type ChecklistControllerProps = {
	taskId?: number | string,
	groupId?: number,
	userId?: number,
	diskConfig?: ChecklistDiskConfig,
	hideCompleted?: boolean,
	hideMoreMenu?: boolean,
	autoCompleteItem?: boolean,
	inLayout?: boolean,
	onChange?: (controller: Object) => void,
	onClose?: () => void,
	parentWidget?: LayoutWidget,
	entityType?: 'task' | 'template' | 'dod',
	entityId?: number | string,
};

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

export type OpenChecklistParams = {
	checklist?: ChecklistView,
	focusedItemId?: number | string,
	parentWidget?: LayoutWidget,
};

export type MoveToChecklistParams = {
	moveIds?: Array<number | string>,
	toCheckListId?: number | string,
	sourceChecklistId?: number | string,
	open?: boolean,
};

export type CreateNewChecklistParams = {
	title?: string,
};
