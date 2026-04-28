import { LocalSearch, sortByDate } from 'im.v2.lib.search';

import { BaseServerSearch } from './search/base-search';

import type { MentionSearchConfigType, SearchResultItem } from 'im.v2.lib.search';

export class MentionSearchService
{
	#localSearch: LocalSearch;
	#baseServerSearch: BaseServerSearch;
	#localCollection: Map<string, Date> = new Map();

	constructor(searchConfig: MentionSearchConfigType)
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

	async search(query: string): Promise<{ dialogIds: string[], participantDialogIds: string[] }>
	{
		const searchResult = await this.#baseServerSearch.search(query);
		searchResult.forEach((searchItem) => {
			this.#localCollection.set(searchItem.dialogId, searchItem);
		});

		return {
			dialogIds: this.#getDialogIds(searchResult),
			participantDialogIds: this.#getParticipantDialogIds(searchResult),
		};
	}

	#getDialogIds(items: SearchResultItem[]): string[]
	{
		return items.map((item) => item.dialogId);
	}

	#getParticipantDialogIds(items: SearchResultItem[]): string[]
	{
		const chatParticipants = items.filter((item) => item.isChatParticipant);

		return chatParticipants.map((item) => item.dialogId);
	}
}
