import { LayoutWidget } from '../../../../../../../../../../mobile/dev/janative/api';

export type ChecklistToastParams = {
	message?: string,
	buttonText?: string,
	onButtonTap?: () => void,
	iconName?: string,
	layoutWidget?: LayoutWidget,
};

export type ChecklistEmptyToastParams = {
	layoutWidget: LayoutWidget,
	hideCompleted?: boolean,
	lastActive?: boolean,
};

export type ChecklistMovedToastParams = {
	layoutWidget: LayoutWidget,
	onButtonTap?: () => void,
};

export type ChecklistNoRightsToastParams = {
	layoutWidget: LayoutWidget,
	params?: Object,
};
