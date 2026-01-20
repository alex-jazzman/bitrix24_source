import { MessageMenu, MenuSectionCode, NestedMenuSectionCode } from './message-base';

import type { MenuItemOptions, MenuSectionOptions } from 'ui.system.menu';

export class ChannelMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getCopyItem(),
			this.getEditItem(),
			this.getDownloadFileItem(),
			this.getForwardItem(),
			this.getAskCopilotItem(),
			this.getCreateTaskItem(),
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
			this.getMarkItem(),
			this.getFavoriteItem(),
			this.getSaveToDiskItem(),
			this.getCreateMeetingItem(),
		];

		return this.groupItems(firstGroupItems, NestedMenuSectionCode.first);
	}

	getNestedMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: NestedMenuSectionCode.first },
		];
	}
}
