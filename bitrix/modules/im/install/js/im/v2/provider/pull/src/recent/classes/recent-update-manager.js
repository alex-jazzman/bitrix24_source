import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';
import { UserManager } from 'im.v2.lib.user';
import { Utils } from 'im.v2.lib.utils';

import type { JsonObject } from 'main.core';
import type { RecentTypeItem } from 'im.v2.const';
import type { RecentPinChatParams, RecentUpdateParams } from '../../types/recent';

type RecentUpdateManagerParams = RecentUpdateParams | RecentPinChatParams;

export class RecentUpdateManager
{
	#params: RecentUpdateParams;
	#tempMessageId: ?string = null;

	constructor(params: RecentUpdateManagerParams)
	{
		this.#params = params;
	}

	updateRecent(): void
	{
		this.#setLastMessageInfo();
		const newRecentItem = {
			id: this.#getDialogId(),
			messageId: this.#getLastMessageId(),
			lastActivityDate: this.#params.lastActivityDate,
		};
		const sections = this.#params.recentConfig?.sections || [RecentType.default];
		this.#applyRecentUpdateActions(sections, newRecentItem);
	}

	#applyRecentUpdateActions(sections: RecentTypeItem[], recentItem: JsonObject): void
	{
		sections.forEach((recentSection) => {
			void Core.getStore().dispatch('recent/setCollection', {
				type: recentSection,
				items: [recentItem],
			});
		});
	}

	#setLastMessageInfo(): void
	{
		this.#setMessageChat();
		this.#setUsers();
		this.#setFiles();
		this.#setMessage();
	}

	#getDialogId(): string
	{
		return this.#params.chat.dialogId;
	}

	#getChatId(): number
	{
		return this.#params.chat.id;
	}

	#getLastMessageId(): number | string
	{
		const chat = Core.getStore().getters['chats/get'](this.#getDialogId());
		const lastMessageId = Core.getStore().getters['messages/getLastId'](chat.chatId);

		return lastMessageId || this.#tempMessageId;
	}

	#setUsers(): void
	{
		const userManager = new UserManager();
		void userManager.setUsersToModel(this.#params.users);
	}

	#setFiles(): void
	{
		void Core.getStore().dispatch('files/set', this.#params.files);
	}

	#setMessageChat(): void
	{
		const chat = { ...this.#params.chat, dialogId: this.#getDialogId() };
		void Core.getStore().dispatch('chats/set', chat);
	}

	#setMessage(): void
	{
		if (this.#params.messages.length > 0)
		{
			void Core.getStore().dispatch('messages/setChatCollection', {
				messages: this.#params.messages,
			});

			return;
		}

		this.#tempMessageId = Utils.text.getUuidV4();
		void Core.getStore().dispatch('messages/setChatCollection', {
			messages: {
				id: this.#tempMessageId,
				date: new Date(),
				chatId: this.#getChatId(),
			},
		});
	}
}
