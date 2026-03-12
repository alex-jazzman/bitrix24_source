import { ajax as Ajax } from 'main.core';

import { RestMethod } from 'im.v2.const';
import { UserManager } from 'im.v2.lib.user';
import { Logger } from 'im.v2.lib.logger';
import { Utils } from 'im.v2.lib.utils';
import { getSearchConfig, StoreUpdater } from 'im.v2.lib.search';
import { runAction } from 'im.v2.lib.rest';

import type { ImRecentProviderItem, SearchConfig, SearchResultItem } from 'im.v2.lib.search';

const SEARCH_REQUEST_ENDPOINT = 'ui.entityselector.doSearch';

export class BaseServerSearch
{
	#storeUpdater: StoreUpdater;
	#searchConfig: SearchConfig;

	constructor(searchConfig)
	{
		this.#searchConfig = searchConfig;
		this.#storeUpdater = new StoreUpdater();
	}

	async search(query: string): Promise<SearchResultItem[]>
	{
		const items = await this.#searchRequest(query);
		await this.#storeUpdater.update(items);

		return this.#getDialogIdAndDate(items);
	}

	async loadChatParticipants(dialogId: string): Promise<SearchResultItem[]>
	{
		const queryParams = {
			order: { lastSendMessageId: 'desc' },
			dialogId,
			limit: 50,
		};

		try
		{
			const response = await runAction(RestMethod.imV2ChatMentionList, {
				data: queryParams,
			});

			const { users } = response;

			void (new UserManager()).setUsersToModel(users);

			return this.#getDialogIdAndDate(users);
		}
		catch (error)
		{
			console.error('Mention search service: load chat participants error', error);
			throw error;
		}
	}

	async #searchRequest(query: string): Promise<ImRecentProviderItem[]>
	{
		const config = {
			json: getSearchConfig(this.#searchConfig),
		};

		config.json.searchQuery = {
			queryWords: Utils.text.getWordsFromString(query),
			query,
		};

		let items = [];
		try
		{
			const response = await Ajax.runAction(SEARCH_REQUEST_ENDPOINT, config);
			Logger.warn('Mention search service: request result', response);
			items = response.data.dialog.items;
		}
		catch (error)
		{
			Logger.warn('Mention search service: request error', error);
		}

		return items;
	}

	#getDialogIdAndDate(items: ImRecentProviderItem[]): SearchResultItem[]
	{
		return items.map((item) => {
			return {
				dialogId: item.id.toString(),
				dateMessage: item.customData?.dateMessage ?? '',
			};
		});
	}
}
