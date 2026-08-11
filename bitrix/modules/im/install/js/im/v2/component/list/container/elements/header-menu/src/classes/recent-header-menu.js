import { RecentType } from 'im.v2.const';
import { UnreadModeManager } from 'im.v2.lib.unread-mode';
import { ChatService } from 'im.v2.provider.service.chat';
import { Core } from 'im.v2.application.core';
import { Analytics } from 'im.v2.lib.analytics';

import { BaseRecentHeaderMenu } from './base-header-menu';

export class RecentHeaderMenu extends BaseRecentHeaderMenu
{
	onSelectUnreadMode()
	{
		Analytics.getInstance().recentHeaderMenu.onOpenUnreadMode();

		this.emit(BaseRecentHeaderMenu.events.onToggleUnreadMode);
	}

	onReadAllClick()
	{
		Analytics.getInstance().recentHeaderMenu.onReadAllChats();

		UnreadModeManager.clearClosedChats(RecentType.default);

		(new ChatService()).readAll();
	}

	getUnreadCounter(): number
	{
		return Core.getStore().getters['counters/getTotalChatCounter'];
	}
}
