import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { ChatType, type ChatTypeItem } from 'im.v2.const';

import { AnalyticsCategory, AnalyticsTool, AnalyticsEvent } from '../const';

export class RecentHeaderMenu
{
	onOpenUnreadMode(): void
	{
		this.#sendData(ChatType.chat, AnalyticsEvent.openUnreadMode);
	}

	onReadAllChats(): void
	{
		this.#sendData(ChatType.chat, AnalyticsEvent.readAllChats);
	}

	onOpenTasksUnreadMode(): void
	{
		this.#sendData(ChatType.tasks, AnalyticsEvent.openUnreadMode);
	}

	onReadAllTaskChats(): void
	{
		this.#sendData(ChatType.tasks, AnalyticsEvent.readAllChats);
	}

	#sendData(type: ChatTypeItem, event: $Values<typeof AnalyticsEvent>)
	{
		const currentLayout = Core.getStore().getters['application/getLayout'].name;

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			type,
			c_section: `${currentLayout}_tab`,
			event,
		});
	}
}
