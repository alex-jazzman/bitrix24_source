import { Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { EntitySearch } from 'im.v2.lib.search';

import { getRecentListItems } from './helpers/get-recent-items';

import type { SearchResultItem, LocalSearchItem, SearchConfig } from './types/types';
import type { ImModelChat } from 'im.v2.model';

const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

export class LocalSearch
{
	#searchConfig: SearchConfig;
	#store: Store;

	constructor(searchConfig: SearchConfig)
	{
		this.#searchConfig = searchConfig;
		this.#store = Core.getStore();
	}

	search(query: string, localCollection: SearchResultItem[]): SearchResultItem[]
	{
		const localItems = this.#getLocalItems(localCollection);
		const result = this.#search(query, localItems);

		return this.#excludeByConfig(result);
	}

	#search(query: string, localItems: LocalSearchItem[]): SearchResultItem[]
	{
		const queryWords = Utils.text.getWordsFromString(query);

		const foundItems: Map<string, SearchResultItem> = new Map();
		localItems.forEach((localItem) => {
			if (this.#searchByQueryWords(localItem, queryWords))
			{
				foundItems.set(localItem.dialogId, {
					dialogId: localItem.dialogId,
					dateMessage: localItem.dateMessage,
				});
			}
		});

		return [...foundItems.values()];
	}

	#getRecentListItems(): LocalSearchItem[]
	{
		const recentListItems = getRecentListItems({
			withFakeUsers: true,
			searchConfig: this.#searchConfig,
		});

		return recentListItems.map((item) => {
			return this.#prepareRecentItem(item.dialogId, item.dateMessage);
		});
	}

	#prepareRecentItem(dialogId: string, dateMessage: string): LocalSearchItem[]
	{
		const recentItem = { dialogId, dateMessage, dialog: this.#getDialog(dialogId) };
		const isUser = this.#isUser(dialogId);

		if (isUser)
		{
			recentItem.user = this.#store.getters['users/get'](dialogId, true);
		}

		return recentItem;
	}

	#searchByQueryWords(localItem: LocalSearchItem, queryWords: string[]): boolean
	{
		if (localItem.user)
		{
			return this.#searchByUserFields(localItem, queryWords);
		}

		return this.#searchByDialogFields(localItem, queryWords);
	}

	#searchByDialogFields(localItem: LocalSearchItem, queryWords: string[]): boolean
	{
		const searchField = [];

		if (localItem.dialog.name)
		{
			const dialogNameWords = Utils.text.getWordsFromString(localItem.dialog.name.toLowerCase());
			searchField.push(...dialogNameWords);
		}

		return this.#doesItemMatchQuery(searchField, queryWords);
	}

	#searchByUserFields(localItem: LocalSearchItem, queryWords: string[]): boolean
	{
		const searchField = [];

		if (localItem.user.name)
		{
			const userNameWords = Utils.text.getWordsFromString(localItem.user.name.toLowerCase());
			searchField.push(...userNameWords);
		}

		if (localItem.user.workPosition)
		{
			const workPositionWords = Utils.text.getWordsFromString(localItem.user.workPosition.toLowerCase());
			searchField.push(...workPositionWords);
		}

		return this.#doesItemMatchQuery(searchField, queryWords);
	}

	#doesItemMatchQuery(fieldsForSearch: string[], queryWords: string[]): boolean
	{
		let found = 0;
		queryWords.forEach((queryWord) => {
			let queryWordsMatchCount = 0;
			fieldsForSearch.forEach((field) => {
				const word = field.slice(0, queryWord.length);
				if (collator.compare(queryWord, word) === 0)
				{
					queryWordsMatchCount++;
				}
			});
			if (queryWordsMatchCount > 0)
			{
				found++;
			}
		});

		return found >= queryWords.length;
	}

	#getLocalItems(localCollection: SearchResultItem[]): LocalSearchItem[]
	{
		const recentItems = this.#getRecentListItems();
		const localItems = this.#getLocalItemsFromDialogIds(localCollection);

		return this.#mergeItems(localItems, recentItems);
	}

	#getLocalItemsFromDialogIds(localCollection: SearchResultItem[]): LocalSearchItem[]
	{
		return localCollection.map((item) => {
			return this.#prepareRecentItem(item.dialogId, item.dateMessage);
		});
	}

	#mergeItems(items1: LocalSearchItem[], items2: LocalSearchItem[]): LocalSearchItem[]
	{
		const itemsMap = new Map();
		const mergedArray = [...items1, ...items2];

		for (const recentItem of mergedArray)
		{
			if (!itemsMap.has(recentItem.dialogId))
			{
				itemsMap.set(recentItem.dialogId, recentItem);
			}
		}

		return [...itemsMap.values()];
	}

	#excludeByConfig(items: SearchResultItem[]): SearchResultItem[]
	{
		const exclude = this.#searchConfig?.exclude;

		if (!exclude || exclude.length === 0)
		{
			return items;
		}

		return items.filter((item) => {
			const isUser = this.#isUser(item.dialogId);
			const isChat = !isUser;

			if (isChat && exclude.includes(EntitySearch.chats))
			{
				return false;
			}

			if (isUser && exclude.includes(EntitySearch.users))
			{
				return false;
			}

			return true;
		});
	}

	#getDialog(dialogId: string): ImModelChat
	{
		return this.#store.getters['chats/get'](dialogId, true);
	}

	#isUser(dialogId: string): boolean
	{
		const { type } = this.#getDialog(dialogId);

		return type === ChatType.user;
	}
}
