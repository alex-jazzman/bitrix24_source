import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { ChatType, type ChatTypeItem } from 'im.v2.const';

import { AnalyticsCategory, AnalyticsTool, AnalyticsEvent, AnalyticsSection } from '../const';
import { getFolderSection } from '../helpers/get-folder-section';
import { getLayoutName } from '../helpers/get-layout-name';

type AnalyticsEventItem = $Values<typeof AnalyticsEvent>;
type AnalyticsSectionItem = $Values<typeof AnalyticsSection>;

export class RecentHeaderMenu
{
	onOpenUnreadMode(section: ?AnalyticsSectionItem = null): void
	{
		this.#sendListData(ChatType.chat, AnalyticsEvent.openUnreadMode, section);
	}

	onReadAllChats(section: ?AnalyticsSectionItem = null): void
	{
		this.#sendListData(ChatType.chat, AnalyticsEvent.readAllChats, section);
	}

	onOpenTasksUnreadMode(section: ?AnalyticsSectionItem = null): void
	{
		this.#sendListData(ChatType.tasks, AnalyticsEvent.openUnreadMode, section);
	}

	onReadAllTaskChats(section: ?AnalyticsSectionItem = null): void
	{
		this.#sendListData(ChatType.tasks, AnalyticsEvent.readAllChats, section);
	}

	onOpenVibecodeAppUnreadMode(section: ?AnalyticsSectionItem = null): void
	{
		this.#sendListData(ChatType.vibecodeApp, AnalyticsEvent.openUnreadMode, section);
	}

	onReadAllVibecodeAppChats(section: ?AnalyticsSectionItem = null): void
	{
		this.#sendListData(ChatType.vibecodeApp, AnalyticsEvent.readAllChats, section);
	}

	onOpenProjectUnreadMode(): void
	{
		this.#sendSectionData(AnalyticsEvent.openUnreadMode, AnalyticsSection.project);
	}

	onReadAllProjectChats(): void
	{
		this.#sendSectionData(AnalyticsEvent.readAllChats, AnalyticsSection.project);
	}

	onOpenProjectTabUnreadMode(section: ?AnalyticsSectionItem = null): void
	{
		this.#sendSectionData(AnalyticsEvent.openUnreadMode, section ?? AnalyticsSection.projectTab);
	}

	onReadAllProjectTabChats(section: ?AnalyticsSectionItem = null): void
	{
		this.#sendSectionData(AnalyticsEvent.readAllChats, section ?? AnalyticsSection.projectTab);
	}

	#sendListData(type: ChatTypeItem, event: AnalyticsEventItem, section: ?AnalyticsSectionItem = null): void
	{
		const currentLayout = getLayoutName(Core.getStore().getters['application/getLayout'].name);

		this.#sendData({
			type,
			c_section: section ?? getFolderSection(currentLayout),
			event,
		});
	}

	#sendSectionData(event: AnalyticsEventItem, section: string): void
	{
		this.#sendData({
			c_section: section,
			event,
		});
	}

	#sendData(params: { event: AnalyticsEventItem, c_section: string, type?: ChatTypeItem }): void
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			...params,
		});
	}
}
