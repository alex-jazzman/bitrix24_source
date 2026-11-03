import { type MenuItemOptions, type MenuSectionOptions } from 'ui.system.menu';

import { MessageMenu, MenuItemPlacement, MenuSectionCode, NestedMenuSectionCode } from './message-base';

export class TaskCommentsMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getReplyItem(),
			this.getCopyItem(),
			this.getEditItem(),
			this.getDownloadFileItem(),
			this.getForwardItem(),
			this.getAskCopilotItem(),
			this.getCreateAiTaskItem(),
			this.isAiTaskFromMessageAvailable() ? null : this.getCreateTaskItem(),
			this.getAddResultItem(),
			this.getRemoveResultItem(),
			...this.getAdditionalItems(),
		];

		const secondGroupItems = [
			this.getDeleteItem(),
			this.getSelectItem(),
		];

		return [
			...this.groupItems(firstGroupItems, MenuSectionCode.first),
			...this.groupItems(secondGroupItems, MenuSectionCode.second),
		];
	}

	getNestedItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getPinItem(),
			this.getCopyLinkItem(),
			this.getCopyFileItem(),
			this.getFavoriteItem(),
			this.getSaveToDiskItem(),
			this.isAiTaskFromMessageAvailable() ? this.getCreateTaskItem(MenuItemPlacement.nested) : null,
			this.getCreateMeetingItem(),
		];

		return this.groupItems(firstGroupItems, NestedMenuSectionCode.first);
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: MenuSectionCode.first },
			{ code: MenuSectionCode.second },
		];
	}

	getNestedMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: NestedMenuSectionCode.first },
		];
	}

	getAddResultItem(): ?MenuItemOptions
	{
		return null;
	}

	getRemoveResultItem(): ?MenuItemOptions
	{
		return null;
	}
}
