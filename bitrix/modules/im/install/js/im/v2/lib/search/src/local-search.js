import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { ChatType, UserType } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat, type ImModelUser } from 'im.v2.model';

import { EntitySearch, MAX_ENTITIES_IN_SEARCH_LIST } from './const/const.js';
import { getRecentListItems } from './helpers/get-recent-items';
import { sortByDate } from './helpers/sort-items-by-date';
import {
	type SearchResultItem,
	type LocalSearchItem,
	type LocalSearchItemOrigin,
	type SearchConfig,
	type UserSearchWords,
} from './types/types';

const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

export const SearchItemOrigin = {
	recentList: 'recentList',
	chatParticipants: 'chatParticipants',
	tabMemory: 'tabMemory',
};

// items from these parts of the pool have already passed the server visibility check
const OriginsVisibleByDefault = new Set([SearchItemOrigin.recentList, SearchItemOrigin.chatParticipants]);
const UserTypesHiddenInTabMemory = new Set([UserType.extranet, UserType.collaber, UserType.guest]);

export class LocalSearch
{
	#searchConfig: SearchConfig;
	#store: Store;
	// the words of everyone the pool has been asked about, kept for as long as this search lives
	#userSearchWords: Map<number | string, UserSearchWords> = new Map();

	constructor(searchConfig: SearchConfig)
	{
		this.#searchConfig = searchConfig;
		this.#store = Core.getStore();
	}

	search(query: string, localCollection: SearchResultItem[]): SearchResultItem[]
	{
		if (this.#searchConfig.withTabMemoryPool)
		{
			return this.#searchInTabMemory(query, localCollection);
		}

		const localItems = this.#getLocalItems(localCollection);
		const result = this.#search(query, localItems);

		return this.#excludeByConfig(result);
	}

	#searchInTabMemory(query: string, localCollection: SearchResultItem[]): SearchResultItem[]
	{
		const queryWords = Utils.text.getWordsFromString(query);
		const eagerMatches = this.#getEagerMatches(localCollection, queryWords);
		const pool = this.#mergeItems(eagerMatches, this.#getTabMemoryMatches(queryWords));

		const visibleItems = pool.filter((item) => isVisibleForLocalSearch(item));
		// the config cuts before the limit: the other way round the excluded eat the places of those who
		// belong in the list - a hundred chats ahead of them leave no place for a single person
		// the comparator walks the store on every comparison, so it is given the already narrowed set
		const foundItems = sortByDate(this.#excludeByConfig(visibleItems)).slice(0, MAX_ENTITIES_IN_SEARCH_LIST);

		return foundItems.map(({ dialogId, dateMessage }) => {
			return { dialogId, dateMessage };
		});
	}

	#getEagerMatches(localCollection: SearchResultItem[], queryWords: string[]): LocalSearchItem[]
	{
		const localItems = this.#getLocalItemsFromDialogIds(localCollection);
		// the parts the server has already shown go first, so the merge that keeps the item it met first
		// keeps the strongest mark of a person who belongs to several parts of the pool at once
		const eagerItems = [
			...localItems.filter((item) => OriginsVisibleByDefault.has(item.origin)),
			...this.#getRecentListItems(),
			...localItems.filter((item) => !OriginsVisibleByDefault.has(item.origin)),
		];

		return eagerItems.filter((item) => this.#searchByQueryWords(item, queryWords));
	}

	// The users collection is traversed on every keystroke, so items are built only for matched users:
	// building an item means two getter calls and two temporary entities per user.
	#getTabMemoryMatches(queryWords: string[]): LocalSearchItem[]
	{
		const users: ImModelUser[] = this.#store.getters['users/getCollection'];
		const matchedItems = [];

		users.forEach((user) => {
			if (!this.#searchByUserFields(user, queryWords))
			{
				return;
			}

			matchedItems.push({
				dialogId: String(user.id),
				dateMessage: '',
				user,
				origin: SearchItemOrigin.tabMemory,
			});
		});

		return matchedItems;
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
			searchRecentSection: this.#searchConfig.searchRecentSection,
			searchAllChats: this.#searchConfig.searchAllChats,
			searchFolderId: this.#searchConfig.searchFolderId,
			parentChatId: this.#searchConfig.parentId,
			onlyAttachableToCollab: this.#searchConfig.onlyWithManageUsersAddRight || this.#searchConfig.onlyWithOwnerRight,
			onlyWithManageMessagesRight: this.#searchConfig.onlyWithManageMessagesRight,
		});

		return recentListItems.map((item) => {
			return this.#prepareRecentItem(item.dialogId, item.dateMessage, SearchItemOrigin.recentList);
		});
	}

	#prepareRecentItem(dialogId: string, dateMessage: string, origin: LocalSearchItemOrigin): LocalSearchItem
	{
		const recentItem = { dialogId, dateMessage, origin, dialog: this.#getDialog(dialogId) };
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
			return this.#searchByUserFields(localItem.user, queryWords);
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

	#searchByUserFields(user: ImModelUser, queryWords: string[]): boolean
	{
		return this.#doesItemMatchQuery(this.#getUserSearchWords(user), queryWords);
	}

	// The whole pool is walked through on every keystroke, and the fields of a person do not change
	// between two of them, so the words are parsed once. The strings they came from are kept beside them:
	// a renamed person or a changed work position rebuilds the words instead of being searched by the
	// words of yesterday.
	#getUserSearchWords(user: ImModelUser): string[]
	{
		const { name, lastName, workPosition } = user;
		const cached = this.#userSearchWords.get(user.id);
		const isCacheActual = Boolean(cached)
			&& cached.name === name
			&& cached.lastName === lastName
			&& cached.workPosition === workPosition;

		if (isCacheActual)
		{
			return cached.words;
		}

		const words = this.#buildUserSearchWords(user);
		this.#userSearchWords.set(user.id, { name, lastName, workPosition, words });

		return words;
	}

	#buildUserSearchWords(user: ImModelUser): string[]
	{
		const searchField = [];

		if (user.name)
		{
			const userNameWords = Utils.text.getWordsFromString(user.name.toLowerCase());
			searchField.push(...userNameWords);
		}

		// the name comes from the server by a name format template that may not contain the last name
		if (this.#searchConfig.withTabMemoryPool && user.lastName)
		{
			const lastNameWords = Utils.text.getWordsFromString(user.lastName.toLowerCase());
			searchField.push(...lastNameWords);
		}

		if (user.workPosition)
		{
			const workPositionWords = Utils.text.getWordsFromString(user.workPosition.toLowerCase());
			searchField.push(...workPositionWords);
		}

		return searchField;
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

	// The mark comes with the item: one collection of a consumer may hold several parts of the pool at
	// once - the composition of a chat and the answers of the search do - and only the consumer knows
	// which part an item came from. An item that carries no mark is taken for the weakest part.
	#getLocalItemsFromDialogIds(localCollection: SearchResultItem[]): LocalSearchItem[]
	{
		return localCollection.map((item) => {
			const origin = item.origin ?? SearchItemOrigin.tabMemory;

			return this.#prepareRecentItem(item.dialogId, item.dateMessage, origin);
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

	#excludeByConfig(items: SearchResultItem[] | LocalSearchItem[]): SearchResultItem[] | LocalSearchItem[]
	{
		const { exclude, excludeGuests } = this.#searchConfig;

		const hasExcludeList = Array.isArray(exclude) && exclude.length > 0;
		if (!hasExcludeList && !excludeGuests)
		{
			return items;
		}

		return items.filter((item) => {
			const isUser = this.#isUserItem(item);
			const isChat = !isUser;

			if (isChat && hasExcludeList && exclude.includes(EntitySearch.chats))
			{
				return false;
			}

			if (isUser && hasExcludeList && exclude.includes(EntitySearch.users))
			{
				return false;
			}

			const isGuestToExclude = excludeGuests && this.#store.getters['users/isGuest'](item.dialogId);

			return !isGuestToExclude;
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

	// A pool item already knows whether it is a user. Asking the chats model instead is not enough
	// for a person from the tab memory: their dialog may be absent from it, and a blank chat is a group one.
	#isUserItem(item: SearchResultItem | LocalSearchItem): boolean
	{
		return Boolean(item.user) || this.#isUser(item.dialogId);
	}
}

// The tab memory admits only an account the server confirmed as an active internal one: the user type
// alone is not enough, since openlines clients, email users and call participants come as plain users,
// and the type of an external colleague is the plain one too whenever the server cannot tell.
// Both confirmations are verdicts of the server: `internalAccount` on the auth method of the account,
// `intranetUser` on the visibility scope - the mirror of the filter the server search applies itself,
// its own department field included. They come with the full user format only; the short one brings
// neither them nor `active`, and the model fills all three with defaults, so a person the tab memory
// knows by the short format stays hidden.
const isVisibleFromTabMemory = (user: ImModelUser): boolean => {
	if (UserTypesHiddenInTabMemory.has(user.type))
	{
		return false;
	}

	return user.internalAccount === true && user.intranetUser === true && user.active === true;
};

// Client-side visibility rules, deliberately stricter than the server ones: the local result
// is a subset of what the server would return. The order of the checks is a part of the contract.
export const isVisibleForLocalSearch = (item: LocalSearchItem): boolean => {
	const { user, origin } = item;
	// chats are not affected, their fate is decided by the search config
	if (!user)
	{
		return true;
	}

	if (user.id === Core.getUserId())
	{
		return true;
	}

	// an explicit `false` from the server hides a fired or blocked account whatever the origin is;
	// the tab memory additionally requires an explicit `true` (see isVisibleFromTabMemory)
	if (user.active === false)
	{
		return false;
	}

	if (user.type === UserType.bot)
	{
		return false;
	}

	// origin is checked before the user type: external colleagues from the current chat
	// and from the recent list stay instantly searchable
	if (OriginsVisibleByDefault.has(origin))
	{
		return true;
	}

	return isVisibleFromTabMemory(user);
};
