import { type AnalyticsOptions, sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

import { AnalyticsEvent, AnalyticsSection, AnalyticsSubSection, AnalyticsTool } from '../const';
import { getCategoryByChat } from '../helpers/get-category-by-chat-type';
import { getForwardTab } from '../helpers/get-forward-tab';
import { getUserType } from '../helpers/get-user-type.js';
import { getChatType } from '../helpers/get-chat-type';
import { isSelfChat } from '../helpers/is-self-chat';

const SelectRecipientSource = Object.freeze({
	searchResult: 'search_result',
	selfChat: 'notes',
});

type RecipientParams = {
	dialogId: string,
	position: number,
}

type RecipientParamsFromSection = RecipientParams & {
	section: string,
};

type RecipientParamsWithSource = RecipientParams & {
	source: string
};

type SendDataHandler = (data: AnalyticsOptions) => void;

export class MessageForward
{
	#hasSearchedBefore: boolean = false;
	#sendData: SendDataHandler;

	constructor(sendDataFunction: SendDataHandler = sendData)
	{
		this.#sendData = sendDataFunction;
	}

	onClickForward(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.clickShare,
			c_section: AnalyticsSection.chatWindow,
			c_sub_section: AnalyticsSubSection.contextMenu,
			p1: `chatType_${getChatType(chat)}`,
			p2: getUserType(),
		};

		this.#sendData(params);
	}

	onStartSearch({ dialogId, section }: { dialogId: string, section: string }): void
	{
		if (this.#hasSearchedBefore)
		{
			return;
		}
		this.#hasSearchedBefore = true;

		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.startSearch,
			c_section: AnalyticsSection.forward,
			c_sub_section: getForwardTab(section),
			p1: `chatType_${getChatType(chat)}`,
			p2: getUserType(),
		};

		this.#sendData(params);
	}

	onSelectRecipientFromRecent({ dialogId, position, section }: RecipientParamsFromSection): void
	{
		this.#onSelectRecipient({
			dialogId,
			position,
			source: getForwardTab(section),
		});
	}

	onSelectRecipientFromSearchResult({ dialogId, position }: RecipientParams): void
	{
		this.#onSelectRecipient({
			dialogId,
			position,
			source: SelectRecipientSource.searchResult,
		});
	}

	onClosePopup(): void
	{
		this.#hasSearchedBefore = false;
	}

	onOperationResult(params: {
		dialogId: string,
		recipientCount: number,
		unsuccessfulCount: number,
		reasonGroups: string[],
		limitReached: boolean,
		isRetry: boolean,
	}): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](params.dialogId);
		let status = 'success';
		if (params.unsuccessfulCount === params.recipientCount)
		{
			status = 'error';
		}
		else if (params.unsuccessfulCount > 0)
		{
			status = 'partial';
		}

		this.#sendData({
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.forwardResult,
			type: params.isRetry ? 'retry' : 'initial',
			status,
			c_section: AnalyticsSection.forward,
			c_element: params.limitReached ? 'limit_reached' : 'limit_not_reached',
			p1: `chatType_${getChatType(chat)}`,
			p2: getUserType(),
			p3: `recipients_${params.recipientCount}`,
			p4: `unsuccessful_${params.unsuccessfulCount}`,
			p5: `reasons_${[...new Set(params.reasonGroups)].sort().join(',') || 'none'}`,
		});
	}

	#onSelectRecipient({ dialogId, position, source }: RecipientParamsWithSource): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const type = isSelfChat(dialogId) ? SelectRecipientSource.selfChat : source;

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.selectRecipient,
			type,
			c_section: AnalyticsSection.forward,
			p1: `chatType_${getChatType(chat)}`,
			p2: getUserType(),
			p3: `position_${position}`,
		};

		this.#sendData(params);
	}
}
