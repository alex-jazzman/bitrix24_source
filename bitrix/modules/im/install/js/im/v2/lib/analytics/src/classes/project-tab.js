import { sendData } from 'ui.analytics';

import { ChatType, type ChatTypeItem, type RecentTypeItem } from 'im.v2.const';

import { AnalyticsEvent, AnalyticsTool, AnalyticsCategory, AnalyticsSection } from '../const';
import { getUserType } from '../helpers/get-user-type';

export class ProjectTab
{
	onSelectSection(section: RecentTypeItem): void
	{
		this.#sendData(AnalyticsEvent.useChatFilter, { type: section, p2: getUserType() });
	}

	onCreateTaskClick(): void
	{
		this.#sendData(AnalyticsEvent.clickCreateTask, { p2: getUserType() });
	}

	onCreateEventClick(): void
	{
		this.#sendData(AnalyticsEvent.clickCreateEvent, { p2: getUserType() });
	}

	onCreateChatClick(chatType: ChatTypeItem = ChatType.chat): void
	{
		this.#sendData(AnalyticsEvent.clickCreateNew, { type: chatType, p2: getUserType() });
	}

	#sendData(
		event: $Values<typeof AnalyticsEvent>,
		extraParams: { type?: RecentTypeItem | ChatTypeItem, p2?: string },
	): void
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.collab,
			event,
			c_section: AnalyticsSection.projectTab,
			...extraParams,
		});
	}
}
