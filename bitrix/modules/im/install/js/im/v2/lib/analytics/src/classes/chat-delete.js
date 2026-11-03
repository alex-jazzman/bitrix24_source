import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsSection, AnalyticsSubSection,
	AnalyticsTool,
} from '../const';
import { getCategoryByChat } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';
import { getProjectId } from '../helpers/get-collab-id';

import type { ImModelChat } from 'im.v2.model';

export class ChatDelete
{
	onClick(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatType = getChatType(chat);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.clickDelete,
			type: chatType,
			c_section: AnalyticsSection.sidebar,
			c_sub_section: AnalyticsSubSection.contextMenu,
			p1: `chatType_${chatType}`,
		};

		sendData(params);
	}

	onCancel(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatType = getChatType(chat);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.cancelDelete,
			type: chatType,
			c_section: AnalyticsSection.popup,
			p1: `chatType_${chatType}`,
		};

		sendData(params);
	}

	onConfirm(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatType = getChatType(chat);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.delete,
			type: chatType,
			c_section: AnalyticsSection.popup,
			p1: `chatType_${chatType}`,
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

	onChatDeletedNotification(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const category = getCategoryByChat(chat);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.chatPopup,
			event: AnalyticsEvent.view,
			type: `deleted_${category}`,
			c_section: AnalyticsSection.activeChat,
			p1: `chatType_${getChatType(chat)}`,
		});
	}
}
