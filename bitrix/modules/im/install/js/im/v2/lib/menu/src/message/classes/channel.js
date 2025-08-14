import { MessageMenu } from './message-base';

import type { MenuItem } from 'im.v2.lib.menu';

export class ChannelMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItem[]
	{
		return [
			this.getCopyItem(),
			this.getEditItem(),
			this.getPinItem(),
			this.getForwardItem(),
			...this.getAdditionalItems(),
			this.getDeleteItem(),
			this.getDelimiter(),
			this.getSelectItem(),
		];
	}

	getNestedItems(): MenuItem[]
	{
		return [
			this.getCopyLinkItem(),
			this.getCopyFileItem(),
			this.getMarkItem(),
			this.getFavoriteItem(),
			this.getDownloadFileItem(),
			this.getSaveToDiskItem(),
		];
	}
}
