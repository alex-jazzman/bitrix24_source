import { type MenuItemOptions } from 'ui.system.menu';

import { RecentMenu } from 'im.v2.lib.menu';

// Same rows a folder offers, minus "add to folder": an application chat cannot be put into a
// personal folder, so offering the target picker here would only lead to a rejected move.
export class VibecodeAppRecentMenu extends RecentMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		return [
			this.getUnreadMessageItem(),
			this.getPinMessageItem(),
			this.getMuteItem(),
		];
	}
}
