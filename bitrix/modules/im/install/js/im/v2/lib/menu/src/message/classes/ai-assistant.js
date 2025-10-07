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
			this.getReplyItem(),
			this.getCopyItem(),
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
}
