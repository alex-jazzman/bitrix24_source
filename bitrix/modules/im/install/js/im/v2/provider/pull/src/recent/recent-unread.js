import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { RecentType, type ChatTypeItem } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelChat, type ImModelRecentItem } from 'im.v2.model';
import { type MessageAddParams, type PullExtraParams, type ReadMessageParams } from 'im.v2.provider.pull';
import { UnreadModeManager } from 'im.v2.lib.unread-mode';

import { type ChatUnreadParams, type ChatMuteNotifyParams } from '../types/chat';
import { NewMessageManager } from '../classes/new-message-manager';
import { RecentUnreadUpdateManager } from './classes/recent-unread-update-manager';
import { buildRecentItem } from './helpers/helpers';

export type RecentUnreadUpdateParams = ChatUnreadParams | ChatMuteNotifyParams | MessageAddParams;

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

	handleReadAllChats()
	{
		const recentSections = [RecentType.default, RecentType.taskComments];

		recentSections.forEach((section) => {
			UnreadModeManager.clearClosedChats(section);
		});
	}

	handleReadAllChatsByType(params: { type: ChatTypeItem })
	{
		UnreadModeManager.clearClosedChats(params.type);
	}

	handleReadMessageChat(params: ReadMessageParams)
	{
		const { dialogId, chatId, unread, counter, recentConfig, parentChatId } = params;

		if (this.#isChatOpen(dialogId))
		{
			return;
		}

		if (this.#hasChatCounters(chatId, counter, unread))
		{
			return;
		}

		if (!parentChatId)
		{
			UnreadModeManager.clearDialogIdBySections(recentConfig.sections, dialogId);

			return;
		}

		const { dialogId: parentDialogId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](parentChatId, true);
		if (this.#isChatOpen(parentDialogId))
		{
			return;
		}

		if (this.#hasParentChatCounters(parentChatId))
		{
			return;
		}

		UnreadModeManager.clearByDialogId(RecentType.default, parentDialogId);
	}

	handleChatUnread(params: ChatUnreadParams)
	{
		Logger.warn('RecentUnreadPullHandler: handleChatUnread', params);

		const { muted, active, dialogId, recentConfig } = params;

		if (this.#isChatOpen(dialogId) || muted)
		{
			return;
		}

		if (active)
		{
			const manager = new RecentUnreadUpdateManager(params);
			manager.addToRecentCollection();

			return;
		}

		UnreadModeManager.clearDialogIdBySections(recentConfig.sections, dialogId);
	}

	handleChatMuteNotify(params: ChatMuteNotifyParams)
	{
		const { muted, unread, recentConfig, dialogId, counter, chatId } = params;

		const isMutedClosedChat = muted && !this.#isChatOpen(dialogId);
		if (isMutedClosedChat)
		{
			UnreadModeManager.clearDialogIdBySections(recentConfig.sections, dialogId);

			return;
		}

		if (muted || !this.#hasChatCounters(chatId, counter, unread))
		{
			return;
		}

		const manager = new RecentUnreadUpdateManager(params);
		manager.addToRecentCollection();
	}

	handleMessageAdd(params: MessageAddParams, extra: PullExtraParams)
	{
		const { recentConfig, counter, chatId, userBlockChat } = params;

		const chatMuteMap = userBlockChat[chatId];
		const isMuted = chatMuteMap[Core.getUserId()] === true;

		if (counter === 0 || Type.isUndefined(counter) || isMuted)
		{
			return;
		}

		Logger.warn('UnreadRecentPullHandler: handleMessageAdd', params);

		const manager = new NewMessageManager(params, extra);

		if (!manager.isUserInChat())
		{
			return;
		}

		const hasParent = manager.getParentChatId() > 0;
		if (hasParent)
		{
			const parentChatId = manager.getParentChatId();

			const parentRecentItem = this.#getParentRecentItem(parentChatId);
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
		const recentManager = new RecentUnreadUpdateManager(params);

		recentManager.applyRecentUpdateActions(recentConfig.sections, newRecentItem);
	}

	#getParentRecentItem(parentChatId: number): ?ImModelRecentItem
	{
		const { dialogId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](parentChatId);

		return Core.getStore().getters['recent/get'](dialogId);
	}

	#isChatOpen(dialogId: string): boolean
	{
		return Core.getStore().getters['application/isChatOpen'](dialogId);
	}

	#hasChatCounters(chatId: number, counter: number, unread: boolean): boolean
	{
		const childrenCounter = Core.getStore().getters['counters/getChildrenTotalCounter'](chatId);
		const totalCounter = counter + childrenCounter;

		return totalCounter > 0 || unread;
	}

	#hasParentChatCounters(parentChatId: number): boolean
	{
		const parentChildrenCounter = Core.getStore().getters['counters/getChildrenTotalCounter'](parentChatId);
		const parentCounter = Core.getStore().getters['counters/getTotalCounterByIds']([parentChatId]);
		const parentTotalCounter = parentChildrenCounter + parentCounter;

		return parentTotalCounter > 0;
	}
}
