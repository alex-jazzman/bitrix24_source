import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import { AnalyticsCategory, AnalyticsEvent, AnalyticsTool, AnalyticsSection } from '../const';
import { getCategoryByChat } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';
import { getProjectId } from '../helpers/get-collab-id';
import { getUserType } from '../helpers/get-user-type';

import type { ImModelChat } from 'im.v2.model';

export class ChatEntities
{
	onCreateTaskFromSidebarClick(dialogId: string): void
	{
		this.#onClick({
			dialogId,
			event: AnalyticsEvent.clickCreateTask,
			section: AnalyticsSection.chatSidebar,
		});
	}

	onCreateTaskFromTextareaClick(dialogId: string): void
	{
		this.#onClick({
			dialogId,
			event: AnalyticsEvent.clickCreateTask,
			section: AnalyticsSection.chatTextarea,
		});
	}

	onCreateEventFromSidebarClick(dialogId: string): void
	{
		this.#onClick({
			dialogId,
			event: AnalyticsEvent.clickCreateEvent,
			section: AnalyticsSection.chatSidebar,
		});
	}

	onCreateEventFromTextareaClick(dialogId: string): void
	{
		this.#onClick({
			dialogId,
			event: AnalyticsEvent.clickCreateEvent,
			section: AnalyticsSection.chatTextarea,
		});
	}

	onCreateVoteFromTextareaClick(dialogId: string): void
	{
		this.#onClick({
			dialogId,
			event: AnalyticsEvent.clickCreatePoll,
			section: AnalyticsSection.chatTextarea,
			includeChatLabels: true,
		});
	}

	// includeChatLabels adds where the click happened - p4 projectId_ and p5 chatId_. Only
	// click_create_poll still reports them; click_create_task / click_create_event report
	// neither, at any entry point.
	#onClick({ dialogId, event, section, includeChatLabels = false }): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event,
			c_section: section,
			p1: `chatType_${getChatType(chat)}`,
			p2: getUserType(),
		};

		if (includeChatLabels)
		{
			params.p5 = `chatId_${chat.chatId}`;

			const projectId = params.category === AnalyticsCategory.collab ? getProjectId(chat) : null;
			if (projectId)
			{
				params.p4 = projectId;
			}
		}

		sendData(params);
	}
}
