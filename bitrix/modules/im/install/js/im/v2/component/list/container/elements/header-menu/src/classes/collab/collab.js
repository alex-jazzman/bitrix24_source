import { Core } from 'im.v2.application.core';
import { ChatService } from 'im.v2.provider.service.chat';
import { ParentChatScope, RecentType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';

import { BaseRecentHeaderMenu } from '../base';

export class CollabHeaderMenu extends BaseRecentHeaderMenu
{
	onSelectUnreadMode()
	{
		Analytics.getInstance().recentHeaderMenu.onOpenProjectTabUnreadMode();

		this.emit(BaseRecentHeaderMenu.events.onToggleUnreadMode);
	}

	onReadAllClick()
	{
		Analytics.getInstance().recentHeaderMenu.onReadAllProjectTabChats();

		(new ChatService()).readAllByRecentType(RecentType.collab, ParentChatScope.topLevel);
	}

	getUnreadCounter(): number
	{
		return Core.getStore().getters['counters/getTotalCollabCounter'];
	}
}
