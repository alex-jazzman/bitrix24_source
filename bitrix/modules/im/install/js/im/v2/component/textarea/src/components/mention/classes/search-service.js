import { LocalSearch, sortByDate, type SearchResultItem, type EntitySearchConfigType } from 'im.v2.lib.search';

import { BaseServerSearch } from './search/base-search';

export class MentionSearchService
{
	#localSearch: LocalSearch;
	#baseServerSearch: BaseServerSearch;
	#localCollection: Map<string, Date> = new Map();

	constructor(searchConfig: EntitySearchConfigType)
	{
		this.#localSearch = new LocalSearch(searchConfig);
		this.#baseServerSearch = new BaseServerSearch(searchConfig);
	}

	async loadChatParticipants(dialogId: string): Promise<string[]>
	{
		const items = await this.#baseServerSearch.loadChatParticipants(dialogId);

		items.forEach((searchItem) => {
			this.#localCollection.set(searchItem.dialogId, searchItem);
		});

		return this.#getDialogIds(items);
	}

	searchLocal(query: string): string[]
	{
		const localCollection = [...this.#localCollection.values()];
		const result = this.#localSearch.search(query, localCollection);
		const sortedResult = sortByDate(result);

		return this.#getDialogIds(sortedResult);
	}

	async search(query: string): Promise<string[]>
	{
		const searchResult = await this.#baseServerSearch.search(query);
		searchResult.forEach((searchItem) => {
			this.#localCollection.set(searchItem.dialogId, searchItem);
		});

		return this.#getDialogIds(searchResult);
	}

	#getDialogIds(items: SearchResultItem[]): string[]
	{
		return items.map((item) => item.dialogId);
	}
}
