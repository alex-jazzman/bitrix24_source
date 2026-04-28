import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

import {
	AnalyticsCategory,
	AnalyticsTool,
	AnalyticsEvent,
	AnalyticsSection,
	AnalyticsSubSection,
	AnalyticsElement,
} from '../const';
import { getChatType } from '../helpers/get-chat-type';

export class TaskComments
{
	onOpenCard(dialogId: string)
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatType = getChatType(chat);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.chat,
			event: AnalyticsEvent.openTaskCard,
			c_section: AnalyticsSection.taskCommentsLayout,
			c_sub_section: AnalyticsSubSection.chatHeader,
			c_element: AnalyticsElement.taskButton,
			p1: `chatType_${chatType}`,
		});
	}
}
