import { ChatType } from 'im.v2.const';
import { Core } from 'im.v2.application.core';
import { CounterClearHandlersByChatType, CounterClearActions } from 'im.v2.lib.counter';
import { UuidManager } from 'im.v2.lib.uuid';
import { Logger } from 'im.v2.lib.logger';

import { NewMessageManager } from './classes/new-message-manager';

import type { ImModelCounter } from 'im.v2.model';
import type { ChatUnreadParams, ChatDeleteParams } from './types/chat';
import type { ReadAllChannelCommentsParams } from './types/comments';
import type { MessageAddParams, ReadMessageParams, MultipleMessageDeleteParams } from './types/message';
import type { PullExtraParams } from './types/common';

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

	handleChatDelete(params: ChatDeleteParams)
	{
		const { chatId } = params;

		void Core.getStore().dispatch('counters/clearById', { chatId });
	}

	handleReadAllChats()
	{
		CounterClearActions.forEach((actionHandler) => {
			void actionHandler();
		});
	}

	handleReadAllChatsByType(params: { type: $Values<typeof ChatType> })
	{
		const { type } = params;

		const counterClearHandlers = CounterClearHandlersByChatType[type];
		if (!counterClearHandlers)
		{
			return;
		}

		counterClearHandlers.forEach((handler) => {
			handler(type);
		});
	}

	handleReadChildren(params: ReadAllChannelCommentsParams)
	{
		const { chatId } = params;

		void Core.getStore().dispatch('counters/clearByParentId', { parentChatId: chatId });
	}
}
