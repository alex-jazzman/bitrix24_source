import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsSection,
	AnalyticsStatus,
	AnalyticsTool,
	DateNavigationEntryPoint,
} from '../const';
import { getCategoryByChat } from '../helpers/get-category-by-chat-type';
import { getChatType, type ExtendedChatType } from '../helpers/get-chat-type';
import { getDaysFromToday, parseCalendarDay } from '../helpers/get-days-from-today';

export type GoToDateParams = {
	dialogId: string,
	// the entry the jump was started from; the event reports it as its own section
	entryPoint: $Values<typeof DateNavigationEntryPoint>,
	// day the user picked, 'YYYY-MM-DD' in the user's own calendar
	day: string,
};

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

	onSearchResultClick(dialogId: string, messageDate: Date): void
	{
		const chatType = this.#getChatType(dialogId);
		const params = {
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			event: AnalyticsEvent.selectSearchResult,
			c_section: AnalyticsSection.chatSidebar,
			p1: `chatType_${chatType}`,
		};

		const daysFromToday = getDaysFromToday(messageDate);
		if (daysFromToday !== null)
		{
			params.p2 = `daysCnt_${daysFromToday}`;
		}

		sendData(params);
	}

	/**
	 * Counts the attempts of the jump, not the hits: the panel reports the pick before it asks the
	 * server for a message of that day, so a jump that ends in an error is counted too. The section
	 * of this event is the entry it was started from, not the panel that hosts the calendar.
	 */
	onGoToDate(params: GoToDateParams): void
	{
		const { dialogId, entryPoint, day } = params;
		const chatType = this.#getChatType(dialogId);
		const eventParams = {
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			event: AnalyticsEvent.goToDate,
			c_section: entryPoint,
			type: chatType,
			p1: `chatType_${chatType}`,
		};

		const daysFromToday = getDaysFromToday(parseCalendarDay(day));
		if (daysFromToday !== null)
		{
			eventParams.p2 = `daysCnt_${daysFromToday}`;
		}

		sendData(eventParams);
	}

	#getChatCategory(dialogId: string): $Values<typeof AnalyticsCategory>
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		return getCategoryByChat(chat);
	}

	#getChatType(dialogId: string): ExtendedChatType
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		return getChatType(chat);
	}
}
