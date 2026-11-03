import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { UnreadModeManager } from 'im.v2.lib.unread-mode';
import { ChatService } from 'im.v2.provider.service.chat';

import { BaseRecentHeaderMenu } from '../base';

export class CollabCalendarHeaderMenu extends BaseRecentHeaderMenu
{
	onSelectUnreadMode()
	{
		Analytics.getInstance().recentHeaderMenu.onOpenProjectUnreadMode();

		this.emit(BaseRecentHeaderMenu.events.onToggleUnreadMode);
	}

	onReadAllClick()
	{
		Analytics.getInstance().recentHeaderMenu.onReadAllProjectChats();

		(new ChatService()).readAllByRecentType(RecentType.calendar, this.context.parentChatId);
	}

	getUnreadCounter(): number
	{
		return Core.getStore().getters['counters/getChildrenTotalCounter'](this.context.parentChatId, RecentType.calendar);
	}
}
