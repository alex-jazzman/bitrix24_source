import { type AnalyticsOptions } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';

import { getProjectId } from '../helpers/get-collab-id.js';
import { AnalyticsCategory, AnalyticsTool, AnalyticsEvent } from '../const';
import { getCategoryByChat } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';
import { getUserType } from '../helpers/get-user-type';

export class Vote
{
	getSerializedParams(dialogId: string): string
	{
		const options = this.getAnalyticsOptions(dialogId);
		const queryParams = Object.entries(options).map(([optionName, optionValue]) => {
			return `st[${optionName}]=${encodeURIComponent(optionValue)}`;
		});

		return queryParams.join('&');
	}

	getAnalyticsOptions(dialogId: string): Partial<AnalyticsOptions>
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);
		const chatType = chat.type;
		const options = {
			tool: AnalyticsTool.im,
			event: AnalyticsEvent.clickCreatePoll,
			category: getCategoryByChat(chat),
			p1: `chatType_${getChatType(chat)}`,
			p2: getUserType(),
			p5: `chatId_${chat.chatId}`,
		};

		if (chatType === ChatType.comment)
		{
			const parentChat: ?ImModelChat = Core.getStore().getters['chats/getByChatId'](chat.parentChatId);
			if (!parentChat)
			{
				return options;
			}

			options.p1 = `chatType_${parentChat.type}`;
			options.p4 = `parentChatId_${chat.parentChatId}`;
		}

		if (options.category === AnalyticsCategory.collab)
		{
			const projectId = getProjectId(chat);
			if (projectId)
			{
				options.p4 = projectId;
			}
		}

		return options;
	}
}
