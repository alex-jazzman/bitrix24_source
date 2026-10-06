import { LayoutWidget } from '../../../../../../../../mobile/dev/janative/api';
import { ChecklistItemData } from '../types/common';

export type ChecklistOpenPreparedParams = {
	taskId: number,
	userId: number,
	checklistTree: ChecklistItemData,
	checklistId: number,
	parentWidget?: LayoutWidget,
	inLayout?: boolean,
	hideCompleted?: boolean,
	onChange?: (controller: Object) => void,
	groupId?: number | null,
};
