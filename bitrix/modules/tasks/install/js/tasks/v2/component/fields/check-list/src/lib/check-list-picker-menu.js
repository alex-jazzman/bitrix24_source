import { type MenuItemOptions } from 'ui.system.menu';

import { CheckListBbCode } from 'tasks.v2.lib.check-list-bb-code';
import { type CheckListModel } from 'tasks.v2.model.check-list';

type CreateNewMenuItem = {
	id: string,
	title: string,
	sectionCode?: string | null,
	onClick: () => void,
};

type BuildCheckListPickerMenuItemsParams = {
	checkLists: CheckListModel[],
	excludedCheckListId?: number | string | null,
	existingItemIdPrefix: string,
	onSelectCheckList: (checkList: CheckListModel) => void,
	createNewItem: CreateNewMenuItem,
};

/**
 * Builds picker menu items: one per checklist (minus the excluded one) plus a "create new" item.
 */
export function buildCheckListPickerMenuItems(params: BuildCheckListPickerMenuItemsParams): MenuItemOptions[]
{
	const {
		checkLists,
		excludedCheckListId = null,
		existingItemIdPrefix,
		onSelectCheckList,
		createNewItem,
	} = params;

	const existingItems = checkLists
		.filter((checkList: CheckListModel) => checkList.id !== excludedCheckListId)
		.map((checkList: CheckListModel) => ({
			title: CheckListBbCode.toPlainText(checkList.title),
			dataset: {
				id: `${existingItemIdPrefix}-${checkList.id}`,
			},
			onClick: () => onSelectCheckList(checkList),
		}));

	const createNewMenuItem: MenuItemOptions = {
		title: createNewItem.title,
		dataset: {
			id: createNewItem.id,
		},
		onClick: createNewItem.onClick,
	};

	if (createNewItem.sectionCode)
	{
		createNewMenuItem.sectionCode = createNewItem.sectionCode;
	}

	return [
		...existingItems,
		createNewMenuItem,
	];
}

/**
 * Parent checklists (parentId === 0) the user may add items to, gated by task.rights.checklistAdd.
 * Per-item actions.modify is a different right (rename/delete the list), so it isn't used here.
 */
export function selectEditableParentCheckLists(
	checkLists: CheckListModel[],
	canAddItems: boolean,
): CheckListModel[]
{
	if (!canAddItems)
	{
		return [];
	}

	return checkLists.filter((checkList: CheckListModel) => checkList.parentId === 0);
}
