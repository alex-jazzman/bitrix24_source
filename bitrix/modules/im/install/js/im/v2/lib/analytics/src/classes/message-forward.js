import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { getUserType } from 'im.v2.lib.analytics';

import { AnalyticsEvent, AnalyticsSection, AnalyticsTool } from '../const';
import { getCategoryByChatType } from '../helpers/get-category-by-chat-type';

import type { ImModelChat } from 'im.v2.model';

const SelectRecipientSource = Object.freeze({
	recent: 'recent',
	searchResult: 'search_result',
	notes: 'notes',
});

type RecipientParams = {
	dialogId: string,
	position: number,
}

type RecipientParamsWithSource = RecipientParams & {
	source: $Values<typeof SelectRecipientSource>
};

export class MessageForward
{
	#hasSearchedBefore: boolean = false;

	onClickForward({ dialogId }: { dialogId: string })
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		sendData({
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chat.type),
			event: AnalyticsEvent.clickShare,
			p1: `chatType_${chat.type}`,
			p2: getUserType(),
		});
	}

	onStartSearch({ dialogId }: { dialogId: string })
	{
		if (this.#hasSearchedBefore)
		{
			return;
		}
		this.#hasSearchedBefore = true;

		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		sendData({
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chat.type),
			event: AnalyticsEvent.startSearch,
			c_section: AnalyticsSection.forward,
			p1: `chatType_${chat.type}`,
			p2: getUserType(),
		});
	}

	onSelectRecipientFromRecent({ dialogId, position }: RecipientParams)
	{
		this.#onSelectRecipient({
			dialogId,
			position,
			source: SelectRecipientSource.recent,
		});
	}

	onSelectRecipientFromSearchResult({ dialogId, position }: RecipientParams)
	{
		this.#onSelectRecipient({
			dialogId,
			position,
			source: SelectRecipientSource.searchResult,
		});
	}

	onClosePopup()
	{
		this.#hasSearchedBefore = false;
	}

	#onSelectRecipient({ dialogId, position, source }: RecipientParamsWithSource)
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const type = this.#isNotesChat(dialogId) ? SelectRecipientSource.notes : source;

		sendData({
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chat.type),
			event: AnalyticsEvent.selectRecipient,
			type,
			c_section: AnalyticsSection.forward,
			p1: `chatType_${chat.type}`,
			p2: getUserType(),
			p3: `position_${position}`,
		});
	}

	#isNotesChat(dialogId: string): boolean
	{
		return Core.getUserId().toString() === dialogId;
	}
}
