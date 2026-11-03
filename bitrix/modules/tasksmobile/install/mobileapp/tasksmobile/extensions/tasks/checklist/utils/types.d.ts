import { LayoutWidget } from '../../../../../../../../mobile/dev/janative/api';
import { ChecklistItemData } from '../types';

export type ChecklistOpenPreparedParams = {
	taskId: number,
	userId: number,
	checklistTree: ChecklistItemData,
	checklistServerId: number,
	parentWidget?: LayoutWidget,
	inLayout?: boolean,
	hideCompleted?: boolean,
	onChange?: (controller: Object) => void,
	groupId?: number | null,
};
