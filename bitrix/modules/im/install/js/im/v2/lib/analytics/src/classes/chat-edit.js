import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import { AnalyticsCategory, AnalyticsEvent, AnalyticsTool, AnalyticsSubSection, AnalyticsSection } from '../const';
import { getCategoryByChat } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';
import { getProjectId } from '../helpers/get-collab-id';
import { getUserType } from '../helpers/get-user-type';

import type { ImModelChat } from 'im.v2.model';

export class ChatEdit
{
	onOpenForm(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.clickEdit,
			c_section: AnalyticsSection.sidebar,
			c_sub_section: AnalyticsSubSection.contextMenu,
			p1: `chatType_${getChatType(chat)}`,
			p5: `chatId_${chat.chatId}`,
		};

		if (params.category === AnalyticsCategory.collab)
		{
			const projectId = getProjectId(chat);
			if (projectId)
			{
				params.p4 = projectId;
			}
		}

		sendData(params);
	}

	onSubmitForm(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			c_section: AnalyticsSection.editor,
			event: AnalyticsEvent.submitEdit,
			p1: `chatType_${getChatType(chat)}`,
			p2: getUserType(),
			p5: `chatId_${chat.chatId}`,
		};

		if (params.category === AnalyticsCategory.collab)
		{
			const projectId = getProjectId(chat);
			if (projectId)
			{
				params.p4 = projectId;
			}
		}

		sendData(params);
	}
}
