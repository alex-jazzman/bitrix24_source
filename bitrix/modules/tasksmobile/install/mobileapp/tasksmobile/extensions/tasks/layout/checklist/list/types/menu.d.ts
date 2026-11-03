import { ChecklistMemberType } from '../../../../checklist/types';
import { LayoutWidget } from '../../../../../../../../../../mobile/dev/janative/api';
import { Icon } from '../../../../../../../../../../mobile/dev/janative/types/enum/icon';

export type ChecklistActionsMenuProps = {
	item: ChecklistItemView,
	ref?: (ref: Object) => void,
	parentWidget?: LayoutWidget,
	onTextFormat?: (type: string, item: CheckListFlatTreeItem | null) => void,
	onToggleImportant: () => void,
	onAddFile: (targetRef: Object) => void,
	onBlur: () => void,
	onMoveToCheckList?: (moveIds: Array<number | string>, targetRef: Object) => void,
	openTariffRestrictionWidget: (memberType: ChecklistMemberType) => void,
	openUserSelectionManager: (itemId: number | string, memberType: ChecklistMemberType) => void,
	onTabMove?: (item: ChecklistItemView, direction: string) => void,
};

export type ChecklistActionsMenuToggleParams = {
	show: boolean,
};

export type ChecklistIconViewProps = {
	id: string,
	color: Color,
	icon: Icon,
	size: number,
	disabled?: boolean,
	useRef?: boolean,
	style?: Object,
	onClick?: (targetRef: Object) => void,
};

export type ChecklistsMenuProps = {
	parentWidget?: LayoutWidget,
	moveItemToChecklist?: (checklistId: number | string | undefined) => void,
	checklists?: ChecklistView[],
	sourceChecklistId?: string | number,
	targetRef?: Object,
};

export type ChecklistMenuAction = {
	id: string,
	title: string,
	isCustomIconColor: boolean,
	iconName: string,
	onItemSelected: () => void,
};

export type ChecklistPermissions = {
	canTabOut: boolean,
	canTabIn: boolean,
	canAdd: boolean,
	canUpdate: boolean,
	canAddAccomplice: boolean,
	hasAnotherCheckLists: boolean,
};
