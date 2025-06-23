import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import { AnalyticsEvent, AnalyticsTool, MessagePinsTypes } from '../const';
import { getCategoryByChatType } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';

import type { ImModelChat } from 'im.v2.model';

export class MessagePins
{
	onPin(chatId: string)
	{
		this.#onClick({
			chatId,
			event: AnalyticsEvent.pinMessage,
		});
	}

	onUnpin(chatId: string)
	{
		this.#onClick({
			chatId,
			event: AnalyticsEvent.unpinMessage,
		});
	}

	onReachingLimit(chatId: string)
	{
		this.#onClick({
			chatId,
			event: AnalyticsEvent.pinnedMessageLimitException,
		});
	}

	#onClick({ chatId, event }: { chatId: string, event: string })
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](`chat${chatId}`, true);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chat.type),
			event,
			p1: `chatType_${getChatType(chat)}`,
			...this.#getAdditionalParams(event, chatId),
		};

		sendData(params);
	}

	#getAdditionalParams(event: string, chatId: string): Record<string, string>
	{
		const pinnedCount: number = Core.getStore().getters['messages/pin/getPinned'](chatId).length;

		if (event === AnalyticsEvent.pinMessage)
		{
			return {
				p3: `pinnedCount_${pinnedCount}`,
				type: pinnedCount > 1 ? MessagePinsTypes.multiple : MessagePinsTypes.single,
			};
		}

		if (event === AnalyticsEvent.unpinMessage)
		{
			return {
				type: pinnedCount > 0 ? MessagePinsTypes.selected : MessagePinsTypes.single,
			};
		}

		return {};
	}
}
