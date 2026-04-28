import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { Logger } from 'im.v2.lib.logger';
import { RecentType } from 'im.v2.const';

import { NewMessageManager } from '../classes/new-message-manager';
import { buildRecentItem } from './helpers/helpers';

import type { MessageAddParams, PullExtraParams } from 'im.v2.provider.pull';
import type { ImModelChat, ImModelRecentItem } from 'im.v2.model';
import type { ChatUnreadParams } from '../types/chat';

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

	handleChatUnread(params: ChatUnreadParams)
	{
		const { recentConfig, dialogId } = params;

		Logger.warn('RecentUnreadPullHandler: handleChatUnread', params);
		const recentItem = Core.getStore().getters['recent/get'](dialogId);
		// later we should build new recent item from event params there
		if (!recentItem)
		{
			return;
		}

		recentConfig.sections.forEach((section) => {
			void Core.getStore().dispatch('recent/setUnreadCollection', {
				type: section,
				items: [recentItem],
			});
		});
	}

	handleMessageAdd(params: MessageAddParams, extra: PullExtraParams)
	{
		const { recentConfig, counter } = params;

		if (counter === 0 || Type.isUndefined(counter))
		{
			return;
		}

		Logger.warn('UnreadRecentPullHandler: handleMessageAdd', params);

		const manager = new NewMessageManager(params, extra);

		if (!manager.isUserInChat())
		{
			return;
		}

		if (manager.isCommentChat())
		{
			const parentChatId = manager.getParentChatId();

			const parentRecentItem = this.#getChannelRecentItem(parentChatId);
			if (!parentRecentItem)
			{
				return;
			}

			void Core.getStore().dispatch('recent/setUnreadCollection', {
				type: RecentType.default,
				items: [parentRecentItem],
			});

			return;
		}

		const newRecentItem = buildRecentItem(params);

		recentConfig.sections.forEach((section) => {
			void Core.getStore().dispatch('recent/setUnreadCollection', {
				type: section,
				items: [newRecentItem],
			});
		});
	}

	#getChannelRecentItem(parentChatId: number): ?ImModelRecentItem
	{
		const { dialogId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](parentChatId);

		return Core.getStore().getters['recent/get'](dialogId);
	}
}
