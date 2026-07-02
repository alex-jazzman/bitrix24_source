import { type JsonObject } from 'main.core';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { SearchEntityIdTypes } from 'im.v2.const';

export class StoreUpdater
{
	#store: Store;

	constructor()
	{
		this.#store = Core.getStore();
	}

	update(items: JsonObject[]): Promise
	{
		const { chats } = this.#prepareDataForModels(items);

		return Promise.all([
			this.#store.dispatch('chats/set', chats),
		]);
	}

	#prepareDataForModels(items: JsonObject[]): { chats: Object[] }
	{
		const result = { chats: [] };
		items.forEach((item) => {
			const chatData = item.customData.imChat;
			if (item.entityType !== SearchEntityIdTypes.openLines)
			{
				return;
			}

			result.chats.push({
				...chatData,
				dialogId: item.id,
			});
		});

		return result;
	}
}
