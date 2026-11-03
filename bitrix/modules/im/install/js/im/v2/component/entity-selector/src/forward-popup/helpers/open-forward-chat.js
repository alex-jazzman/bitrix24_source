import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';
import { RecentManager } from 'im.v2.lib.recent';
import { type ImModelChat } from 'im.v2.model';

import { ForwardChatOpeners } from '../const/const';

export async function openForwardChat(dialogId: string): Promise
{
	const { type, parentChatId }: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

	const isNestedInCollab = parentChatId > 0 && !RecentManager.isTypeWithNestedChats(type);
	if (!isNestedInCollab)
	{
		const openLayout = ForwardChatOpeners[type] ?? ForwardChatOpeners.default;

		return openLayout(dialogId);
	}

	return ForwardChatOpeners[ChatType.collab](dialogId);
}
