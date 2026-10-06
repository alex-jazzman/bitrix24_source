import { LayoutWidget } from '../../../../../../../../mobile/dev/janative/api';
import { CheckListFlatTree, ChecklistAccessRestrictions } from '../types/common';
import { MoveToChecklistParams } from '../controller/types';

export type ChecklistMenuMoreActions = {
	onCreateChecklist?: () => void,
	onMoveToCheckList?: (params: MoveToChecklistParams) => void,
	onChangeSort?: () => void,
	onRemove?: () => void,
	onToggleCompletedItems?: (hideCompleted: boolean) => void,
};

export type ChecklistMenuMoreOptions = {
	actions?: ChecklistMenuMoreActions,
	accessRestrictions?: ChecklistAccessRestrictions,
};

export type ChecklistWidgetProps = {
	checklist?: CheckListFlatTree,
	parentWidget?: LayoutWidget,
	inLayout?: boolean,
	focusedItemId?: number | string,
	hideCompleted?: boolean,
	hideMoreMenu?: boolean,
	onSave?: (checklistId: number | string) => void,
	onClose?: (checklistId: number | string) => void,
	onCompletedChanged?: () => void,
	menuMore?: ChecklistMenuMoreOptions,
};

export type ChecklistMoreMenuState = {
	onlyMine?: boolean,
	hideCompleted?: boolean,
};

export type ChecklistFilterParams = ChecklistMoreMenuState;

export type ChecklistMoreMenuProps = {
	parentWidget?: LayoutWidget,
	onlyMine?: boolean,
	hideCompleted?: boolean,
	onCreateChecklist?: () => void,
	onHideCompleted?: (state: ChecklistMoreMenuState) => void,
	onShowOnlyMine?: (state: ChecklistMoreMenuState) => void,
	onChangeSort?: () => void,
	onRemove?: () => void,
	accessRestrictions?: ChecklistAccessRestrictions,
};

export type ChecklistMoreMenuSelectedActionParams = {
	state: ChecklistMoreMenuState,
	action: (state: ChecklistMoreMenuState) => void,
};
