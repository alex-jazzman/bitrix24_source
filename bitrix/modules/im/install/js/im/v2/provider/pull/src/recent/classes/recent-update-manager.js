import { Core } from 'im.v2.application.core';
import { RecentType, type RecentTypeItem } from 'im.v2.const';
import { UserManager } from 'im.v2.lib.user';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelRecentItem } from 'im.v2.model';

import { type RecentPinChatParams, type RecentUpdateParams } from '../../types/recent';
import { type RecentUnreadUpdateParams } from '../recent-unread';

type RecentUpdateManagerParams = RecentUpdateParams | RecentPinChatParams | RecentUnreadUpdateParams;

export class RecentUpdateManager
{
	#params: RecentUpdateParams;
	#tempMessageId: ?string = null;

	constructor(params: RecentUpdateManagerParams)
	{
		this.#params = params;
	}

	addToRecentCollection(): void
	{
		this.#setLastMessageInfo();
		const newRecentItem = {
			id: this.#getDialogId(),
			messageId: this.#getLastMessageId(),
			lastActivityDate: this.#params.lastActivityDate,
		};
		const sections = this.#params.recentConfig?.sections || [RecentType.default];
		this.applyRecentUpdateActions(sections, newRecentItem);
	}

	applyRecentUpdateActions(sections: RecentTypeItem[], recentItem: ImModelRecentItem): void
	{
		sections.forEach((recentSection) => {
			void Core.getStore().dispatch('recent/setCollection', {
				type: recentSection,
				items: [recentItem],
				parentChatId: this.#getParentChatId(),
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

	#getParentChatId(): number
	{
		return this.#params.chat.parent_chat_id;
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
		if (this.#params.message)
		{
			void Core.getStore().dispatch('messages/setChatCollection', {
				messages: this.#params.message,
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
