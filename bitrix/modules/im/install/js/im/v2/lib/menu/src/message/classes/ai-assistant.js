import { MessageMenu } from './message-base';

import type { MenuItemOptions } from 'ui.system.menu';

const MenuSectionCode = Object.freeze({
	main: 'main',
	select: 'select',
	create: 'create',
	market: 'market',
});

export class AiAssistantMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		const mainGroupItems = [
			this.getCopyItem(),
			this.getDownloadFileItem(),
			this.getForwardItem(),
			...this.getAdditionalItems(),
		];

		return this.groupItems(mainGroupItems, MenuSectionCode.main);
	}

	getNestedItems(): MenuItemOptions[]
	{
		const mainGroupItems = [
			this.getCopyFileItem(),
			this.getMarkItem(),
			this.getFavoriteItem(),
			this.getSaveToDiskItem(),
		];

		const createGroupItems = [
			this.getCreateTaskItem(),
			this.getCreateMeetingItem(),
		];

		return [
			...this.groupItems(mainGroupItems, MenuSectionCode.main),
			...this.groupItems(createGroupItems, MenuSectionCode.create),
			...this.groupItems(this.getMarketItems(), MenuSectionCode.market),
		];
	}
}
