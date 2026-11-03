import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import { AnalyticsCategory, AnalyticsEvent, AnalyticsTool, AnalyticsSection } from '../const';
import { getChatType } from '../helpers/get-chat-type';
import { getProjectId } from '../helpers/get-collab-id';
import { getUserType } from '../helpers/get-user-type';
import { getCategoryByChat } from '../helpers/get-category-by-chat-type';

import type { ImModelChat } from 'im.v2.model';

type SelectUserParams = {
	dialogId: string,
	position: number,
};

type SelectUserWithSourceParams = SelectUserParams & {
	source: $Values<typeof SelectUserSource>,
};

const SelectUserSource = Object.freeze({
	recent: 'recent',
	searchResult: 'search_result',
});

export class UserAdd
{
	#hasSearchedBefore: boolean = false;

	onChatSidebarClick(dialogId: string): void
	{
		this.#onAddUserClick(dialogId, AnalyticsSection.chatSidebar);
	}

	onChatHeaderClick(dialogId: string): void
	{
		this.#onAddUserClick(dialogId, AnalyticsSection.chatHeader);
	}

	onStartSearch({ dialogId }: { dialogId: string }): void
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
			c_section: AnalyticsSection.userAdd,
			p1: `chatType_${getChatType(chat)}`,
			p2: getUserType(),
		};

		sendData(params);
	}

	onClosePopup(): void
	{
		this.#hasSearchedBefore = false;
	}

	onSelectUserFromRecent({ dialogId, position }: SelectUserParams): void
	{
		this.#onSelectUser({
			dialogId,
			position,
			source: SelectUserSource.recent,
		});
	}

	onSelectUserFromSearchResult({ dialogId, position }: SelectUserParams): void
	{
		this.#onSelectUser({
			dialogId,
			position,
			source: SelectUserSource.searchResult,
		});
	}

	#onSelectUser({ dialogId, position, source }: SelectUserWithSourceParams): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.selectUser,
			type: source,
			c_section: AnalyticsSection.userAdd,
			p1: `chatType_${getChatType(chat)}`,
			p2: getUserType(),
			p3: `position_${position}`,
		};

		sendData(params);
	}

	#onAddUserClick(dialogId: string, element: AnalyticsSection.chatSidebar | AnalyticsSection.chatHeader): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.clickAddUser,
			c_section: element,
			p1: `chatType_${getChatType(chat)}`,
			p2: getUserType(),
			p5: `chatId_${chat.chatId}`,
		};

		if (params.category === AnalyticsCategory.collab)
		{
			const projectId = getProjectId(chat);
			if (projectId)
			{
				params.p4 = projectId;
			}
		}

		sendData(params);
	}
}
