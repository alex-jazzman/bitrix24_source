import { MessageMenu } from './message-base';

import type { MenuItem } from 'im.v2.lib.menu';

export class ChannelMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItem[]
	{
		return [
			this.getCopyItem(),
			this.getCopyLinkItem(),
			this.getCopyFileItem(),
			this.getPinItem(),
			this.getForwardItem(),
			this.getDelimiter(),

			this.getMarkItem(),
			this.getFavoriteItem(),
			this.getDelimiter(),

			this.getDownloadFileItem(),
			this.getSaveToDiskItem(),
			this.getDelimiter(),

			this.getEditItem(),
			this.getDeleteItem(),
			this.getDelimiter(),

			this.getSelectItem(),
		];
	}
}
