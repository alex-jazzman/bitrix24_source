import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import { AnalyticsCategory, AnalyticsTool, AnalyticsEvent, AnalyticsSection } from '../const';
import { getChatType } from '../helpers/get-chat-type';

import type { ImModelChat } from 'im.v2.model';

export class Mention
{
	onClickAddToChat(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatType = getChatType(chat);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.chat,
			event: AnalyticsEvent.addUser,
			c_section: AnalyticsSection.mentionPopup,
			p1: `chatType_${chatType}`,
		});
	}
}
