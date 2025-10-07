import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';

import type { Store } from 'ui.vue3.vuex';

export class AiAssistantManager
{
	store: Store;

	constructor()
	{
		this.store = Core.getStore();
	}

	isAiAssistantBot(userId: string | number): boolean
	{
		return this.store.getters['users/bots/isAiAssistant'](userId);
	}

	isAiAssistantChat(dialogId: string): boolean
	{
		const type = this.store.getters['chats/get'](dialogId)?.type;

		return [ChatType.aiAssistant, ChatType.aiAssistantEntity].includes(type);
	}
}
