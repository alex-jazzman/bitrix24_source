import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { Logger } from 'im.v2.lib.logger';

import { NewMessageManager } from './classes/new-message-manager';
import { buildRecentItem } from './helpers/helpers';

import type { MessageAddParams } from 'im.v2.provider.pull';
import type { ImModelChat, ImModelRecentItem } from 'im.v2.model';

export class RecentUnreadPullHandler
{
	getModuleId(): string
	{
		return 'im';
	}

	handleMessage(params, extra)
	{
		this.handleMessageAdd(params, extra);
	}

	handleMessageChat(params, extra)
	{
		this.handleMessageAdd(params, extra);
	}

	handleMessageAdd(params: MessageAddParams, extra: PullExtraParams)
	{
		if (params.counter === 0 || Type.isUndefined(params.counter))
		{
			return;
		}

		Logger.warn('UnreadRecentPullHandler: handleMessageAdd', params);

		const manager = new NewMessageManager(params, extra);

		if (manager.isCommentChat())
		{
			const parentChatId = manager.getParentChatId();

			const recentItem = this.#getChannelByParentChatId(parentChatId);
			if (!recentItem)
			{
				return;
			}

			void Core.getStore().dispatch('recent/setUnread', recentItem);

			return;
		}

		const newRecentItem = buildRecentItem(params);

		void Core.getStore().dispatch('recent/setUnread', newRecentItem);
	}

	#getChannelByParentChatId(parentChatId: number): ?ImModelRecentItem
	{
		const { dialogId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](parentChatId);
		const recentList = Core.getStore().getters['recent/getRecentCollection'];

		return recentList.find((item) => item.dialogId === dialogId);
	}
}
