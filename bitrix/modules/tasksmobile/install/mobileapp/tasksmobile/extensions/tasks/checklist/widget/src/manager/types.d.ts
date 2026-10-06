import { LayoutWidget } from '../../../../../../../../../../mobile/dev/janative/api';
import { CheckListFlatTree } from '../../../types/common';

export type ChecklistBottomSheetProps = {
	layoutType?: string,
	parentWidget?: LayoutWidget,
	checklist?: CheckListFlatTree,
	component?: Object,
	focusedItemId?: number | string,
	highlightMoreButton?: boolean,
	onSave?: () => void,
	onClose?: () => void,
	onShowMoreMenu?: (() => void) | null,
};

export type ChecklistLayoutUpdateParams = {
	highlightMoreButton?: boolean,
};

export type ChecklistLayoutChangeParams = {
	alert?: Object,
};
