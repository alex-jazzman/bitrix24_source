import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import { AnalyticsEvent, AnalyticsSection, AnalyticsTool } from '../const';
import { getCategoryByChat } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';
import { getUserType } from '../helpers/get-user-type';

import type { ImModelChat } from 'im.v2.model';

export class AttachMenu
{
	onOpenUploadMenu(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatType = getChatType(chat);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.clickAttach,
			c_section: AnalyticsSection.chatTextarea,
			p1: `chatType_${chatType}`,
			p2: getUserType(),
		};

		sendData(params);
	}
}
