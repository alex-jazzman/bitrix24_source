import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsSection,
	AnalyticsTool,
	AnalyticsType,
} from '../const';

import type { ImModelChat } from 'im.v2.model';

export class MessageDelete
{
	onNotFoundNotification({ dialogId }: {dialogId: string}): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		if (!chat)
		{
			return;
		}

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.chatPopup,
			event: AnalyticsEvent.view,
			type: AnalyticsType.deletedMessage,
			p1: `chatType_${chat.type}`,
		});
	}

	onDeletedPostNotification({ dialogId }: {dialogId: string}): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.chatPopup,
			event: AnalyticsEvent.view,
			type: AnalyticsType.deletedMessage,
			c_section: AnalyticsSection.comments,
			p1: `chatType_${chat.type}`,
			p4: `parentChatId_${chat.chatId}`,
		});
	}
}
