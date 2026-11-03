import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsSection,
	AnalyticsTool,
	AnalyticsSubSection,
	AnalyticsStatus,
} from '../const';
import { getChatType } from '../helpers/get-chat-type';
import { getFolderSection } from '../helpers/get-folder-section';

import type { ImModelChat } from 'im.v2.model';
import type { LayoutType } from 'im.v2.const';

export class RecentSearch
{
	#hasSearchedBefore: { [key: string]: boolean } = {};

	onStart(layoutName: LayoutType, parentChatId: number = 0)
	{
		const surface = this.#getSurfaceKey(layoutName, parentChatId);
		if (this.#hasSearchedBefore[surface])
		{
			return;
		}
		this.#hasSearchedBefore[surface] = true;

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.startSearch,
			c_section: this.#getSection(layoutName, parentChatId),
		});
	}

	onOpen(layoutName: LayoutType, parentChatId: number = 0)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.openSearch,
			c_section: this.#getSection(layoutName, parentChatId),
		});
	}

	onClose(layoutName: LayoutType, parentChatId: number = 0)
	{
		this.#hasSearchedBefore[this.#getSurfaceKey(layoutName, parentChatId)] = false;

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.closeSearch,
			c_section: this.#getSection(layoutName, parentChatId),
		});
	}

	onSelectFromSearchResult(layoutName: LayoutType, position: number, parentChatId: number = 0)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.selectSearchResult,
			c_section: this.#getSection(layoutName, parentChatId),
			p3: `position_${position}`,
		});
	}

	onSelectFromRecentSearch(layoutName: LayoutType, dialogId: string, parentChatId: number = 0)
	{
		this.#onSelectFromRecent(layoutName, dialogId, AnalyticsSubSection.recentSearch, parentChatId);
	}

	onSelectFromRecentChats(layoutName: LayoutType, dialogId: string, parentChatId: number = 0)
	{
		this.#onSelectFromRecent(layoutName, dialogId, AnalyticsSubSection.recentChats, parentChatId);
	}

	onShowSuccessResult(layoutName: LayoutType, parentChatId: number = 0)
	{
		this.#onShowResult(layoutName, AnalyticsStatus.success, parentChatId);
	}

	onShowNotFoundResult(layoutName: LayoutType, parentChatId: number = 0)
	{
		this.#onShowResult(layoutName, AnalyticsStatus.notFound, parentChatId);
	}

	#onShowResult(layoutName: LayoutType, status: string, parentChatId: number)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.searchResult,
			c_section: this.#getSection(layoutName, parentChatId),
			status,
		});
	}

	#onSelectFromRecent(
		layoutName: LayoutType,
		dialogId: string,
		subSection: $Values<typeof AnalyticsSubSection>,
		parentChatId: number,
	)
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.selectSearchRecent,
			c_section: this.#getSection(layoutName, parentChatId),
			c_sub_section: subSection,
			p1: `chatType_${getChatType(chat)}`,
		});
	}

	// A parent chat is only supplied by the nested list of a single project, so it - and not the
	// layout - is what separates a search inside a project from the tab listing all of them. The
	// nested list is a drawer over the root list and does not change the layout: opening a chat
	// inside a project switches the layout to `chat` while the search stays project-scoped.
	#getSection(layoutName: LayoutType, parentChatId: number): string
	{
		if (parentChatId > 0)
		{
			return AnalyticsSection.project;
		}

		return getFolderSection(layoutName);
	}

	// start_search fires once per search surface, and the projects tab and a project's own list
	// share a layout - so the guard is keyed by both parts the section is built from.
	#getSurfaceKey(layoutName: LayoutType, parentChatId: number): string
	{
		return `${layoutName}:${parentChatId}`;
	}
}
