import { Type } from 'main.core';
import { PageContext } from 'ui.page-context';

import { Core } from 'im.v2.application.core';
import { ChatType, type ChatTypeItem } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';
import { type ImModelChat, type ImModelLayout } from 'im.v2.model';

type ChatCategory =
	| 'Channel'
	| 'Task Chat'
	| 'CRM Chat'
	| 'Calendar Chat'
	| 'AI Chat'
	| 'Thread'
	| 'Support Chat'
	| 'OpenLines Chat'
	| 'Chat';

const MODULE_ID = 'im';
const CONTEXT_KEY = 'currentChat';

export class ChatPageContextManager
{
	static #instance: ChatPageContextManager;

	static init(): void
	{
		ChatPageContextManager.getInstance();
	}

	static getInstance(): ChatPageContextManager
	{
		if (!ChatPageContextManager.#instance)
		{
			ChatPageContextManager.#instance = new ChatPageContextManager();
		}

		return ChatPageContextManager.#instance;
	}

	constructor()
	{
		this.#subscribe();
	}

	#subscribe(): void
	{
		const watcher = (state: unknown, getters: Record<string, any>): string => {
			const layout = getters['application/getLayout'];
			const chat = layout.entityId ? getters['chats/get'](layout.entityId) : null;

			return [
				layout.name,
				layout.entityId,
				chat?.inited ? '1' : '0',
				chat?.type ?? '',
				chat?.name ?? '',
				chat?.entityLink?.id ?? '',
			].join('|');
		};

		Core.getStore().watch(watcher, () => this.#syncContext());
		this.#syncContext();
	}

	#syncContext(): void
	{
		const layout: ImModelLayout = Core.getStore().getters['application/getLayout'];
		const isChatLayout = LayoutManager.getInstance().isChatLayout(layout.name) && Type.isStringFilled(layout.entityId);
		const chat: ImModelChat | null = isChatLayout ? Core.getStore().getters['chats/get'](layout.entityId) : null;

		if (!chat?.inited)
		{
			PageContext.delete(MODULE_ID, CONTEXT_KEY);

			return;
		}

		PageContext.set(MODULE_ID, CONTEXT_KEY, {
			dialogId: chat.dialogId,
			chatId: chat.chatId,
			type: this.#getChatCategory(chat.type),
			title: chat.name,
			entityLink: chat.entityLink?.id ? chat.entityLink : null,
		});
	}

	#getChatCategory(type: ChatTypeItem): ChatCategory
	{
		switch (type)
		{
			case ChatType.channel:
			case ChatType.openChannel:
			case ChatType.generalChannel:
				return 'Channel';
			case ChatType.tasks:
			case ChatType.taskComments:
				return 'Task Chat';
			case ChatType.crm:
				return 'CRM Chat';
			case ChatType.calendar:
				return 'Calendar Chat';
			case ChatType.copilot:
				return 'AI Chat';
			case ChatType.lines:
				return 'OpenLines Chat';
			case ChatType.thread:
			case ChatType.comment:
				return 'Thread';
			case ChatType.support24Notifier:
			case ChatType.support24Question:
				return 'Support Chat';
			default:
				return 'Chat';
		}
	}
}
