import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';
import { UserManager } from 'im.v2.lib.user';
import { Utils } from 'im.v2.lib.utils';

import type { JsonObject } from 'main.core';
import type { RecentPinChatParams, RecentUpdateParams } from '../../types/recent';

type RecentTypeItem = $Values<typeof RecentType>;
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

	#applyRecentUpdateActions(sections: $Values<typeof RecentType>[], recentItem: JsonObject): void
	{
		sections.forEach((recentSection) => {
			const sectionConfig = this.#getRecentSectionConfig(recentSection);
			if (!sectionConfig)
			{
				return;
			}

			void Core.getStore().dispatch(sectionConfig, recentItem);
		});
	}

	#getRecentSectionConfig(section: RecentTypeItem): string
	{
		const handlers = {
			[RecentType.default]: 'recent/setRecent',
			[RecentType.copilot]: 'recent/setCopilot',
			[RecentType.openChannel]: 'recent/setChannel',
			[RecentType.collab]: 'recent/setCollab',
			[RecentType.taskComments]: 'recent/setTask',
		};

		return handlers[section];
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
		const chat = { ...this.#params.chat, counter: this.#params.counter, dialogId: this.#getDialogId() };
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
