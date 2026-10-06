import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';
import { UnreadModeManager } from 'im.v2.lib.unread-mode';
import { ChatService } from 'im.v2.provider.service.chat';

import { BaseRecentHeaderMenu } from '../base';

export class CollabChatHeaderMenu extends BaseRecentHeaderMenu
{
	onReadAllClick()
	{
		(new ChatService()).readAllByRecentType(RecentType.collabChat, this.context.parentChatId);
	}

	getUnreadCounter(): number
	{
		return Core.getStore().getters['counters/getChildrenTotalCounter'](this.context.parentChatId, RecentType.collabChat);
	}
}
