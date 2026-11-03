import { LayoutWidget } from '../../../../../../../../../../mobile/dev/janative/api';
import { ChecklistConditions, ChecklistDiskConfig } from '../../../../checklist/types';
import { ChecklistOnBlurParams, ChecklistChangeAttachmentsParams } from './list';

export type ChecklistItemSelectedOptions = ChecklistConditions;

export type BaseChecklistItemProps = {
	item: ChecklistItemView,
	isFocused?: boolean,
	parentWidget?: LayoutWidget,
	showToastNoRights?: () => void,
	onChange?: (shouldSave: boolean) => void,
	onBlur?: (params: ChecklistOnBlurParams) => void,
	onSubmit?: (item: ChecklistItemView) => void,
	onFocus?: (item: ChecklistItemView) => void,
	onRemove?: (params: ChecklistOnBlurParams) => void,
	onSelectionStylesChange?: (styles: string[]) => void,
};

export type MainChecklistItemProps = BaseChecklistItemProps & {
	diskConfig?: ChecklistDiskConfig,
	selectedOptions?: ChecklistItemSelectedOptions,
	onToggleComplete?: (item: ChecklistItemView) => void,
	onChangeAttachments?: (params: ChecklistChangeAttachmentsParams) => void,
	updateMenu?: (item: ChecklistItemView) => void,
	updateRowByKey?: (item: ChecklistItemView, shouldRender?: boolean) => Object,
	openUserSelectionManager?: (itemId: number | string, memberType: string) => void,
	openTariffRestrictionWidget?: (memberType: string) => void,
};

export type RootChecklistItemProps = BaseChecklistItemProps;

export type ChecklistTextFieldStyle = {
	textSize: number,
	header: boolean,
};
