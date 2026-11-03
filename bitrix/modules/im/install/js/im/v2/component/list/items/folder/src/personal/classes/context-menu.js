import { type MenuItemOptions } from 'ui.system.menu';

import { RecentMenu } from 'im.v2.lib.menu';

export class FolderRecentMenu extends RecentMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		return [
			this.getUnreadMessageItem(),
			this.getPinMessageItem(),
			this.getAddToFolderItem(),
			this.getMuteItem(),
		];
	}
}
