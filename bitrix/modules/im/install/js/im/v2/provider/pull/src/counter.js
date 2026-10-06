import { Core } from 'im.v2.application.core';
import {
	CounterManager,
} from 'im.v2.lib.counter';
import { Logger } from 'im.v2.lib.logger';
import { UuidManager } from 'im.v2.lib.uuid';
import { type ImModelCounter } from 'im.v2.model';

import { NewMessageManager } from './classes/new-message-manager';
import { type ChatUnreadParams, type ChatDeleteParams, type ChatReadAllParams } from './types/chat';
import { type ReadAllChannelCommentsParams } from './types/comments';
import { type PullExtraParams } from './types/common';
import { type RecentUpdateParams, type RecentPinChatParams } from './types/recent';
import { type MessageAddParams, type ReadMessageParams, type MultipleMessageDeleteParams } from './types/message';

export class CounterPullHandler
{
	getModuleId(): string
	{
		return 'im';
	}

	handleMessage(params: MessageAddParams, extra: PullExtraParams)
	{
		this.handleMessageChat(params, extra);
	}

	handleMessageChat(params: MessageAddParams, extra: PullExtraParams)
	{
		const manager = new NewMessageManager(params, extra);
		if (!manager.isUserInChat())
		{
			return;
		}

		const { chatId, counter, userBlockChat, recentConfig } = params;

		const chatMuteMap = userBlockChat[chatId];
		const isMuted = chatMuteMap[Core.getUserId()] === true;
		const isMarkedAsUnread = Core.getStore().getters['counters/getUnreadStatus'](chatId);

		const counterItem: ImModelCounter = {
			chatId,
			counter,
			isMarkedAsUnread,
			isMuted,
			parentChatId: manager.getParentChatId(),
			recentSections: recentConfig.sections,
		};

		void Core.getStore().dispatch('counters/setCounters', [counterItem]);
	}

	handleReadMessage(params: ReadMessageParams, extra: PullExtraParams)
	{
		this.handleReadMessageChat(params, extra);
	}

	handleReadMessageChat(params: ReadMessageParams, extra: PullExtraParams)
	{
		const { chatId, counter: newCounter, unread, muted, parentChatId, recentConfig } = params;

		const uuidManager = UuidManager.getInstance();
		if (uuidManager.hasActionUuid(extra.action_uuid))
		{
			Logger.warn('CounterPullHandler: handleReadMessage: we have this uuid, skip');
			uuidManager.removeActionUuid(extra.action_uuid);

			return;
		}

		const counterItem: ImModelCounter = {
			chatId,
			counter: newCounter,
			isMarkedAsUnread: unread,
			isMuted: muted,
			parentChatId,
			recentSections: recentConfig.sections,
		};

		void Core.getStore().dispatch('counters/setCounters', [counterItem]);
	}

	handleMessageDeleteV2(params: MultipleMessageDeleteParams)
	{
		const { chatId, counter, unread, muted, parentChatId, recentConfig } = params;

		const counterItem: ImModelCounter = {
			chatId,
			counter,
			isMarkedAsUnread: unread,
			isMuted: muted,
			parentChatId,
			recentSections: recentConfig.sections,
		};

		void Core.getStore().dispatch('counters/setCounters', [counterItem]);
	}

	handleChatUnread(params: ChatUnreadParams)
	{
		const { chatId, counter, active, muted, parentChatId, recentConfig } = params;

		const counterItem: ImModelCounter = {
			chatId,
			counter,
			isMarkedAsUnread: active,
			isMuted: muted,
			parentChatId,
			recentSections: recentConfig.sections,
		};

		void Core.getStore().dispatch('counters/setCounters', [counterItem]);
	}

	handleRecentUpdate(params: RecentUpdateParams)
	{
		const { chat, recentConfig, lastActivityDate } = params;

		const needToUpdate = lastActivityDate !== null;

		if (!needToUpdate)
		{
			return;
		}

		const { id: chatId, parent_chat_id: parentChatId, mute_list: muteList } = chat;

		const isMuted = muteList[Core.getUserId()] === true;

		// recentUpdate is emitted for parent chat, we add parent item for children counters to work properly
		const counterItem: Partial<ImModelCounter> = {
			chatId,
			parentChatId,
			recentSections: recentConfig.sections,
			isMuted,
		};

		void Core.getStore().dispatch('counters/setCounters', [counterItem]);
	}

	handleChatPin(params: RecentPinChatParams)
	{
		const { chat, recentConfig } = params;
		const { id: chatId, parent_chat_id: parentChatId, mute_list: muteList } = chat;

		const isMuted = muteList[Core.getUserId()] === true;

		// Pinning puts a chat (back) into the recent list. Its recentSections are emptied server-side
		// while a chat is hidden from recent, and only handleRecentUpdate restores them - but pin emits
		// its own event without a fresh activity date, so we restore them here too. Otherwise child
		// counters can't bubble into the section badge through this (now visible) parent until reload.
		const counterItem: Partial<ImModelCounter> = {
			chatId,
			parentChatId,
			recentSections: recentConfig.sections,
			isMuted,
		};

		void Core.getStore().dispatch('counters/setCounters', [counterItem]);
	}

	handleChatDelete(params: ChatDeleteParams)
	{
		const { chatId } = params;

		void Core.getStore().dispatch('counters/clearById', { chatId });
	}

	handleReadAllChats()
	{
		CounterManager.clearAllCounters();
	}

	handleReadAllChatsByRecentSection(params: ChatReadAllParams)
	{
		const { recentSection, parentChatId } = params;

		CounterManager.clearCountersByRecentType(recentSection, parentChatId);
	}

	handleReadChildren(params: ReadAllChannelCommentsParams)
	{
		const { chatId } = params;

		void Core.getStore().dispatch('counters/clearByParentId', { parentChatId: chatId });
	}
}
