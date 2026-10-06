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

		this.addItemToCollection(sections, newRecentItem, this.#getParentChatId());
	}

	// Metadata-only variant for RecentUpdateMeta (lastActivityDate=null): hydrates the payload and
	// re-targets the preview messageId of an already existing recent item. Never adds the item to
	// sections or touches its lastActivityDate, so a hidden row is not surfaced and sort order keeps.
	updateExistingItem(): void
	{
		if (!this.#params.message?.id)
		{
			return;
		}

		this.#setLastMessageInfo();

		void Core.getStore().dispatch('recent/update', {
			dialogId: this.#getDialogId(),
			fields: { messageId: this.#params.message.id },
		});
	}

	addItemToCollection(sections: RecentTypeItem[], recentItem: ImModelRecentItem, parentChatId: number): void
	{
		sections.forEach((recentSection) => {
			void Core.getStore().dispatch('recent/setCollection', {
				type: recentSection,
				items: [recentItem],
				parentChatId,
			});
		});
	}

	#getParentChatId(): number
	{
		return this.#params.chat.parent_chat_id;
	}

	#setLastMessageInfo(): void
	{
		this.#setMessageChat();
		this.#setSourceChats();
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
		if (this.#params.message?.id)
		{
			return this.#params.message.id;
		}

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

	#setSourceChats(): void
	{
		if (!this.#params.chats)
		{
			return;
		}

		// Source chats already carry their own dialogId, so no normalization is needed (unlike #setMessageChat).
		Object.values(this.#params.chats).forEach((sourceChat) => {
			void Core.getStore().dispatch('chats/set', sourceChat);
		});
	}

	#setMessage(): void
	{
		if (this.#params.message)
		{
			if (this.#isNestedPreview())
			{
				// Nested collab preview is a message of a child chat: keep it in the collection only,
				// without chatCollection membership, so the following messageAdd sets its read state.
				void Core.getStore().dispatch('messages/store', this.#params.message);

				return;
			}

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

	#isNestedPreview(): boolean
	{
		return Number(this.#params.message.chatId) !== Number(this.#getChatId());
	}
}
