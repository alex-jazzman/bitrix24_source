import { LayoutWidget } from '../../../../../../../../../../mobile/dev/janative/api';
import { CheckListFlatTreeItem } from '../../../../checklist/types/common';

export type ItemTextFieldProps = {
	item: CheckListFlatTreeItem,
	isFocused?: boolean,
	parentWidget?: LayoutWidget,
	enable?: boolean,
	placeholder?: string,
	header?: boolean,
	textSize?: number,
	style?: Object,
	showToastNoRights?: () => void,
	onBlur?: () => void,
	onFocus?: () => void,
	onSubmit?: () => void,
	onChangeText?: (text: string, isFocused: boolean, shouldSave?: boolean) => void,
	onSelectionStylesChange?: (styles: string[]) => void,
};

export type ItemTextFieldState = {
	completed: boolean,
};

export type ChecklistLinkClickParams = {
	url: string,
};
