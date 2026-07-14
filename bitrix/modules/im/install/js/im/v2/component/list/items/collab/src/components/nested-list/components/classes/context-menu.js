import { type MenuItemOptions } from 'ui.system.menu';

import { RecentMenu } from 'im.v2.lib.menu';
import { type ImModelChat } from 'im.v2.model';

export class FixedParentRecentMenu extends RecentMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		return [
			this.getUnreadMessageItem(),
			this.getMuteItem(),
		];
	}

	hasCounter(): boolean
	{
		const { chatId }: ImModelChat = this.store.getters['chats/get'](this.context.dialogId, true);

		const chatCounter = this.store.getters['counters/getCounterByChatId'](chatId);
		const isChatMarkedUnread = this.store.getters['counters/getUnreadStatus'](chatId);

		return isChatMarkedUnread || chatCounter > 0;
	}
}
