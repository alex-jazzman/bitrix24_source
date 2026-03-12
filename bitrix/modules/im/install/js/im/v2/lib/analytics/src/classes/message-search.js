import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import { AnalyticsEvent, AnalyticsTool, AnalyticsStatus, AnalyticsSection, AnalyticsCategory } from '../const';
import { getCategoryByChatType } from '../helpers/get-category-by-chat-type';
import { ExtendedChatType, getChatType } from '../helpers/get-chat-type';

import type { ImModelChat } from 'im.v2.model';

export class MessageSearch
{
	onOpenSearchPanel(dialogId: string): void
	{
		const chatType = this.#getChatType(dialogId);
		const params = {
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			event: AnalyticsEvent.openSearch,
			c_section: AnalyticsSection.chatSidebar,
			p1: `chatType_${chatType}`,
		};

		sendData(params);
	}

	onStartSearch(dialogId: string): void
	{
		const chatType = this.#getChatType(dialogId);
		const params = {
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			event: AnalyticsEvent.startSearch,
			c_section: AnalyticsSection.chatSidebar,
			p1: `chatType_${chatType}`,
		};

		sendData(params);
	}

	onGetSearchResult(dialogId: string, searchResult: string[]): void
	{
		const chatType = this.#getChatType(dialogId);
		const status = searchResult.length > 0 ? AnalyticsStatus.success : AnalyticsStatus.notFound;
		const params = {
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			event: AnalyticsEvent.searchResult,
			c_section: AnalyticsSection.chatSidebar,
			status,
			p1: `chatType_${chatType}`,
		};

		sendData(params);
	}

	onSearchResultClick(dialogId: string): void
	{
		const chatType = this.#getChatType(dialogId);
		const params = {
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			event: AnalyticsEvent.selectSearchResult,
			c_section: AnalyticsSection.chatSidebar,
			p1: `chatType_${chatType}`,
		};

		sendData(params);
	}

	#getChatCategory(dialogId: string): $Values<typeof AnalyticsCategory>
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		return getCategoryByChatType(chat.type);
	}

	#getChatType(dialogId: string): ExtendedChatType
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		return getChatType(chat);
	}
}
