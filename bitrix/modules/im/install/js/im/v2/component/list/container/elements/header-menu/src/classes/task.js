import { Core } from 'im.v2.application.core';
import { ParentChatScope, RecentType } from 'im.v2.const';
import { ChatService } from 'im.v2.provider.service.chat';
import { Analytics } from 'im.v2.lib.analytics';

import { BaseRecentHeaderMenu } from './base';

export class TaskHeaderMenu extends BaseRecentHeaderMenu
{
	onSelectUnreadMode()
	{
		Analytics.getInstance().recentHeaderMenu.onOpenTasksUnreadMode();

		this.emit(BaseRecentHeaderMenu.events.onToggleUnreadMode);
	}

	onReadAllClick()
	{
		Analytics.getInstance().recentHeaderMenu.onReadAllTaskChats();

		if (this.context.parentChatId > 0)
		{
			(new ChatService()).readAllByRecentType(RecentType.taskComments, this.context.parentChatId);

			return;
		}

		(new ChatService()).readAllByRecentType(RecentType.taskComments, ParentChatScope.all);
	}

	getUnreadCounter(): number
	{
		const parentChatId = this.context.parentChatId;

		if (parentChatId > 0)
		{
			return Core.getStore().getters['counters/getChildrenTotalCounter'](parentChatId, RecentType.taskComments);
		}

		return Core.getStore().getters['counters/getTotalTaskCounter'];
	}
}
