import { MessageMenu } from './message-base';

import type { MenuItemOptions, MenuSectionOptions } from 'ui.system.menu';

const MenuSectionCode = Object.freeze({
	main: 'main',
	select: 'select',
});

export class ChannelMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		const mainGroupItems = [
			this.getCopyItem(),
			this.getEditItem(),
			this.getDownloadFileItem(),
			this.getPinItem(),
			this.getForwardItem(),
			...this.getAdditionalItems(),
			this.getDeleteItem(),
		];

		return [
			...this.groupItems(mainGroupItems, MenuSectionCode.main),
			...this.groupItems([this.getSelectItem()], MenuSectionCode.select),
		];
	}

	getNestedMenuGroups(): MenuSectionOptions[]
	{
		return [];
	}

	getNestedItems(): MenuItemOptions[]
	{
		return [
			this.getCopyLinkItem(),
			this.getCopyFileItem(),
			this.getMarkItem(),
			this.getFavoriteItem(),
			this.getSaveToDiskItem(),
		];
	}
}
