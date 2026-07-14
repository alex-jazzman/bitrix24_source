import { type MenuItemOptions } from 'ui.system.menu';

import { RecentMenu } from 'im.v2.lib.menu';

export class CollabNestedRecentMenu extends RecentMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		return [
			this.getUnreadMessageItem(),
			this.getPinMessageItem(),
			this.getMuteItem(),
			this.getHideItem(),
			this.getLeaveItem(),
		];
	}
}
