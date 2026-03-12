import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { Layout } from 'im.v2.const';

import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsSection,
	AnalyticsTool,
	AnalyticsSubSection,
	AnalyticsStatus,
} from '../const';
import { getChatType } from '../helpers/get-chat-type';

import type { ImModelChat } from 'im.v2.model';
import type { LayoutType } from 'im.v2.const';

const SectionByLayoutName = {
	[Layout.chat]: AnalyticsSection.chatLayout,
	[Layout.notification]: AnalyticsSection.notificationLayout,
	[Layout.taskComments]: AnalyticsSection.taskCommentsLayout,
};

export class RecentSearch
{
	#hasSearchedBefore: { [key: LayoutType]: boolean } = {};

	onStart(layoutName: LayoutType)
	{
		if (this.#hasSearchedBefore[layoutName])
		{
			return;
		}
		this.#hasSearchedBefore[layoutName] = true;

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.startSearch,
			c_section: SectionByLayoutName[layoutName],
		});
	}

	onOpen(layoutName: LayoutType)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.openSearch,
			c_section: SectionByLayoutName[layoutName],
		});
	}

	onClose(layoutName: LayoutType)
	{
		this.#hasSearchedBefore[layoutName] = false;

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.closeSearch,
			c_section: SectionByLayoutName[layoutName],
		});
	}

	onSelectFromSearchResult(layoutName: LayoutType, position: number)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.selectSearchResult,
			c_section: SectionByLayoutName[layoutName],
			p3: `position_${position}`,
		});
	}

	onSelectFromRecentSearch(layoutName: LayoutType, dialogId: string)
	{
		this.#onSelectFromRecent(layoutName, dialogId, AnalyticsSubSection.recentSearch);
	}

	onSelectFromRecentChats(layoutName: LayoutType, dialogId: string)
	{
		this.#onSelectFromRecent(layoutName, dialogId, AnalyticsSubSection.recentChats);
	}

	onShowSuccessResult(layoutName: LayoutType)
	{
		this.#onShowResult(layoutName, AnalyticsStatus.success);
	}

	onShowNotFoundResult(layoutName: LayoutType)
	{
		this.#onShowResult(layoutName, AnalyticsStatus.notFound);
	}

	#onShowResult(layoutName: LayoutType, status: string)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.searchResult,
			c_section: SectionByLayoutName[layoutName],
			status,
		});
	}

	#onSelectFromRecent(
		layoutName: LayoutType,
		dialogId: string,
		subSection: $Values<typeof AnalyticsSubSection>,
	)
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.selectSearchRecent,
			c_section: SectionByLayoutName[layoutName],
			c_sub_section: subSection,
			p1: `chatType_${getChatType(chat)}`,
		});
	}
}
