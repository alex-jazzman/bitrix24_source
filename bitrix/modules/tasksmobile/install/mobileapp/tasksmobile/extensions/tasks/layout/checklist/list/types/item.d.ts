import { LayoutWidget } from '../../../../../../../../../../mobile/dev/janative/api';
import { CheckListFlatTreeItem, ChecklistConditions, ChecklistDiskConfig } from '../../../../checklist/types/common';
import { ChecklistOnBlurParams, ChecklistChangeAttachmentsParams } from './list';

export type ChecklistItemSelectedOptions = ChecklistConditions;

export type BaseChecklistItemProps = {
	item: CheckListFlatTreeItem,
	isFocused?: boolean,
	parentWidget?: LayoutWidget,
	showToastNoRights?: () => void,
	onChange?: (shouldSave: boolean) => void,
	onBlur?: (params: ChecklistOnBlurParams) => void,
	onSubmit?: (item: CheckListFlatTreeItem) => void,
	onFocus?: (item: CheckListFlatTreeItem) => void,
	onRemove?: (params: ChecklistOnBlurParams) => void,
	onSelectionStylesChange?: (styles: string[]) => void,
};

export type MainChecklistItemProps = BaseChecklistItemProps & {
	diskConfig?: ChecklistDiskConfig,
	selectedOptions?: ChecklistItemSelectedOptions,
	onToggleComplete?: (item: CheckListFlatTreeItem) => void,
	onChangeAttachments?: (params: ChecklistChangeAttachmentsParams) => void,
	updateMenu?: (item: CheckListFlatTreeItem) => void,
	updateRowByKey?: (item: CheckListFlatTreeItem, shouldRender?: boolean) => Object,
	openUserSelectionManager?: (itemId: number | string, memberType: string) => void,
	openTariffRestrictionWidget?: (memberType: string) => void,
};

export type RootChecklistItemProps = BaseChecklistItemProps;

export type ChecklistTextFieldStyle = {
	textSize: number,
	header: boolean,
};
