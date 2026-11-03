import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

import { AnalyticsCategory, AnalyticsTool, AnalyticsEvent, AnalyticsSection } from '../const';
import { getCategoryByChat } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';
import { getProjectId } from '../helpers/get-collab-id';

export class Mention
{
	onClickAddToChat(dialogId: string): void
	{
		this.#sendAddUserData(dialogId, AnalyticsSection.mentionPopup);
	}

	onClickAddToChatFromPopup(dialogId: string): void
	{
		this.#sendAddUserData(dialogId, AnalyticsSection.textareaMentionPopup);
	}

	#sendAddUserData(dialogId: string, section: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatType = getChatType(chat);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.addUser,
			c_section: section,
			p1: `chatType_${chatType}`,
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
