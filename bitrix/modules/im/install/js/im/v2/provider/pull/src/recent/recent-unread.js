import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { RecentType, type RecentTypeItem } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelChat, type ImModelRecentItem } from 'im.v2.model';
import { type MessageAddParams, type PullExtraParams, type ReadMessageParams } from 'im.v2.provider.pull';
import { UnreadModeManager } from 'im.v2.lib.unread-mode';
import { ChatManager } from 'im.v2.lib.chat';

import { type ChatUnreadParams, type ChatMuteNotifyParams, type ChatReadAllParams } from '../types/chat';
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
		UnreadModeManager.removeClosedChats(RecentType.default);
	}

	handleReadAllChatsByRecentSection(params: ChatReadAllParams)
	{
		const { recentSection, parentChatId } = params;

		const preparedParentChatId = ChatManager.prepareParentChatId(parentChatId);
		UnreadModeManager.removeClosedChats(recentSection, preparedParentChatId);
	}

	handleReadMessageChat(params: ReadMessageParams)
	{
		const { dialogId, chatId, unread, counter, recentConfig, parentChatId } = params;

		const shouldRemoveParentChat = !this.#isParentChatOpen(parentChatId) && !this.#hasParentChatCounters(parentChatId);
		if (shouldRemoveParentChat)
		{
			this.#removeParentChat(parentChatId);
		}

		const shouldRemoveChat = !this.#isChatOpen(dialogId) && !this.#hasChatCounters(chatId, counter, unread);
		if (shouldRemoveChat)
		{
			this.#removeChat(recentConfig.sections, dialogId, parentChatId);
		}
	}

	handleChatUnread(params: ChatUnreadParams)
	{
		Logger.warn('RecentUnreadPullHandler: handleChatUnread', params);

		const { muted, active, dialogId, recentConfig, parentChatId } = params;

		const shouldRemoveParentChat = !this.#hasParentChatCounters(parentChatId) && !this.#isParentChatOpen(parentChatId);
		if (shouldRemoveParentChat)
		{
			this.#removeParentChat(parentChatId);
		}

		const shouldAddChat = active && !muted;
		if (shouldAddChat)
		{
			const manager = new RecentUnreadUpdateManager(params);
			manager.addToRecentCollection();

			this.#addParentToRecentCollection(parentChatId, params);

			return;
		}

		const shouldRemoveChat = !this.#isChatOpen(dialogId);
		if (shouldRemoveChat)
		{
			this.#removeChat(recentConfig.sections, dialogId, parentChatId);
		}
	}

	handleChatMuteNotify(params: ChatMuteNotifyParams)
	{
		const { muted, unread, recentConfig, dialogId, counter, chatId, parentChatId } = params;

		const shouldRemoveParentChat = muted && !this.#isParentChatOpen(parentChatId);
		if (shouldRemoveParentChat)
		{
			this.#removeParentChat(parentChatId);
		}

		const shouldAddChat = !muted && this.#hasChatCounters(chatId, counter, unread);
		if (shouldAddChat)
		{
			const manager = new RecentUnreadUpdateManager(params);
			manager.addToRecentCollection();

			this.#addParentToRecentCollection(parentChatId, params);

			return;
		}

		const shouldRemoveChat = muted && !this.#isChatOpen(dialogId);
		if (shouldRemoveChat)
		{
			this.#removeChat(recentConfig.sections, dialogId, parentChatId);
		}
	}

	handleMessageAdd(params: MessageAddParams, extra: PullExtraParams)
	{
		const { recentConfig, counter, chatId, userBlockChat } = params;

		const chatMuteMap = userBlockChat[chatId];
		const isMuted = chatMuteMap[Core.getUserId()] === true;

		Logger.warn('UnreadRecentPullHandler: handleMessageAdd', params);

		const manager = new NewMessageManager(params, extra);

		const parentChatId = manager.getParentChatId();
		const recentManager = new RecentUnreadUpdateManager(params);

		const hasCounter = counter > 0 && !Type.isUndefined(counter);
		const shouldAddChat = hasCounter && !isMuted && manager.isUserInChat();
		if (shouldAddChat)
		{
			const newRecentItem = buildRecentItem(params);
			recentManager.addItemToCollection(recentConfig.sections, newRecentItem, parentChatId);
		}

		const shouldAddParentChat = parentChatId > 0 && shouldAddChat;
		if (shouldAddParentChat)
		{
			this.#addParentToRecentCollection(parentChatId, params);
		}
	}

	#getParentRecentItem(parentChatId: number): ?ImModelRecentItem
	{
		const parentDialogId = this.#getParentDialogId(parentChatId);

		return Core.getStore().getters['recent/get'](parentDialogId);
	}

	#isChatOpen(dialogId: string): boolean
	{
		return Core.getStore().getters['application/isChatOpen'](dialogId);
	}

	#isParentChatOpen(parentChatId: number): boolean
	{
		const parentDialogId = this.#getParentDialogId(parentChatId);

		return this.#isChatOpen(parentDialogId);
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

	#addParentToRecentCollection(chatId: number, params: RecentUnreadUpdateParams)
	{
		const parentRecentSections = this.#getParentSections(chatId);
		const parentRecentItem = this.#getParentRecentItem(chatId);
		const parentChatId = this.#getParentChatId(chatId);

		const manager = new RecentUnreadUpdateManager(params);
		manager.addItemToCollection(parentRecentSections, parentRecentItem, parentChatId);
	}

	#removeParentChat(parentChatId: number)
	{
		const parentRecentSections = this.#getParentSections(parentChatId);

		const parentDialogId = this.#getParentDialogId(parentChatId);
		UnreadModeManager.removeDialogIdBySections({
			recentSections: parentRecentSections,
			dialogId: parentDialogId,
		});
	}

	#removeChat(recentSections: RecentTypeItem[], dialogId: string, parentChatId: number)
	{
		UnreadModeManager.removeDialogIdBySections({
			recentSections,
			dialogId,
			parentChatId,
		});
	}

	#getParentDialogId(parentChatId: number): string
	{
		const { dialogId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](parentChatId, true);

		return dialogId;
	}

	#getParentSections(parentChatId: number): RecentTypeItem[]
	{
		return Core.getStore().getters['counters/getRecentSectionsByChatId'](parentChatId);
	}

	#getParentChatId(chatId: number): number
	{
		const { parentChatId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](chatId);

		return parentChatId;
	}
}
