import { MessageMenu } from 'im.v2.lib.menu';

import type { MenuItemOptions, MenuSectionOptions } from 'ui.system.menu';

const MenuSectionCode = {
	main: 'first',
	select: 'second',
	third: 'third',
};

export class OpenLinesMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getReplyItem(),
			this.getCopyItem(),
			this.getMarkItem(),
			this.getForwardItem(),
			this.getFavoriteItem(),
			this.getDownloadFileItem(),
			this.getEditItem(),
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

	getMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: MenuSectionCode.first },
			{ code: MenuSectionCode.second },
		];
	}
}
