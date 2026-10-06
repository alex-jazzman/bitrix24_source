import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';

import { BaseRecentHeaderMenu } from '../base';

export class CollabDefaultHeaderMenu extends BaseRecentHeaderMenu
{
	onReadAllClick()
	{
		(new ChatService()).readAllByRecentType(RecentType.collabDefault, this.context.parentChatId);

		this.#readParentChat();
	}

	getUnreadCounter(): number
	{
		const childrenCounter = Core.getStore().getters['counters/getChildrenTotalCounter'](this.context.parentChatId, RecentType.collabDefault);
		const parentCounter = Core.getStore().getters['counters/getTotalCounterByIds']([this.context.parentChatId]);

		return parentCounter + childrenCounter;
	}

	#readParentChat(): void
	{
		const { dialogId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](this.context.parentChatId);

		(new ChatService()).readDialog(dialogId);
	}
}
