/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_lib_user, im_v2_const, im_v2_lib_utils, im_v2_lib_chat, im_v2_lib_permission) {
	'use strict';

	const EntityId = 'im-recent-v2';
	const ContextId = 'IM_CHAT_SEARCH';
	const SearchDialogId = 'im-chat-search';
	const getSearchConfig = searchConfig => {
		const {
			entityId = EntityId,
			contextId = ContextId,
			searchDialogId = SearchDialogId,
			// Fields of the ui.EntitySelector entity itself (e.g. fillRecentItems) are lifted onto the
			// entity; everything else goes to entity.options as provider options.
			entityConfig = {},
			...entityOptions
		} = searchConfig;
		const entity = {
			id: entityId,
			dynamicLoad: true,
			dynamicSearch: true,
			...entityConfig,
			options: entityOptions
		};
		return {
			dialog: {
				entities: [entity],
				preselectedItems: [],
				clearUnavailableItems: false,
				context: contextId,
				id: searchDialogId
			}
		};
	};

	class StoreUpdater {
		#store;
		#userManager;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#userManager = new im_v2_lib_user.UserManager();
		}
		update(items) {
			const {
				users,
				chats
			} = this.#prepareDataForModels(items);
			return Promise.all([this.#userManager.setUsersToModel(users), this.#store.dispatch('chats/set', chats)]);
		}
		#prepareDataForModels(items) {
			const result = {
				users: [],
				chats: []
			};
			items.forEach(item => {
				const chatData = item.customData.chat;
				if (item.entityType === im_v2_const.SearchEntityIdTypes.imUser) {
					result.users.push(item.customData.user);
				}
				if (item.entityType === im_v2_const.SearchEntityIdTypes.chat) {
					const isUser = Boolean(item.customData.user);
					const userData = isUser ? im_v2_lib_user.UserManager.getDialogForUser(item.customData.user) : {};
					result.chats.push({
						...chatData,
						...userData,
						dialogId: item.id
					});
				}
			});
			return result;
		}
	}

	const EntitySearch = {
		chats: 'chats',
		users: 'users'
	};
	const MAX_ENTITIES_IN_SEARCH_LIST = 100;
	const MAX_USERS_IN_SEARCH_LIST_DEFAULT = 50;

	function getRecentItemDate(dialogId) {
		const message = im_v2_application_core.Core.getStore().getters['recent/getMessage'](dialogId);
		if (!message) {
			return '';
		}
		return message.date.toISOString();
	}

	const sortByDate = items => {
		return [...items].sort((firstItem, secondItem) => {
			// Both items have dates - compare them
			if (firstItem.dateMessage && secondItem.dateMessage) {
				return im_v2_lib_utils.Utils.date.cast(secondItem.dateMessage) - im_v2_lib_utils.Utils.date.cast(firstItem.dateMessage);
			}

			// Only one item has a date - item with date comes first
			if (firstItem.dateMessage || secondItem.dateMessage) {
				return firstItem.dateMessage ? -1 : 1;
			}

			// Case 3: Neither item has a date - non-extranet item comes first
			const firstIsExtranet = isExtranet(firstItem.dialogId);
			const secondIsExtranet = isExtranet(secondItem.dialogId);
			if (firstIsExtranet !== secondIsExtranet) {
				return firstIsExtranet ? 1 : -1;
			}
			return 0;
		});
	};
	const isExtranet = dialogId => {
		const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
		if (!dialog) {
			return false;
		}
		if (dialog.type === im_v2_const.ChatType.user) {
			const user = im_v2_application_core.Core.getStore().getters['users/get'](dialogId);
			return user && user.type === im_v2_const.UserType.extranet;
		}
		return dialog.extranet;
	};

	const mergeSearchItems = (originalItems, newItems) => {
		const mergedItems = [...originalItems, ...newItems].map(item => {
			return [item.dialogId, item];
		});
		const result = new Map(mergedItems);
		return sortByDate([...result.values()]);
	};

	function getRecentListItems(params) {
		const {
			searchAllChats,
			searchFolderId,
			searchRecentSection
		} = params;

		// The folder scope has no section at all, so its branch goes before the section fallback below - a
		// fall-through would answer with plain chats. As on the server, the presence of the identifier alone
		// switches the mode on: an unreachable folder ends in an empty result, never in a widened search.
		if (searchFolderId !== null && searchFolderId !== undefined) {
			return getFolderItems(searchFolderId, params);
		}
		if (searchAllChats) {
			return getAllChatsItems(params);
		}
		return getSectionItems(searchRecentSection ?? im_v2_const.RecentType.default, params);
	}
	const getSectionItems = (recentType, params) => {
		const {
			parentChatId,
			onlyAttachableToCollab
		} = params;
		const payload = {
			type: recentType,
			parentChatId: im_v2_lib_chat.ChatManager.prepareParentChatId(parentChatId)
		};
		const recentItems = im_v2_application_core.Core.getStore().getters['recent/getSortedCollection'](payload);
		const filterRecentItem = onlyAttachableToCollab ? item => isAttachableToCollab(item.dialogId, recentType) : item => isSearchableItem(item, params);
		return recentItems.filter(item => filterRecentItem(item)).map(({
			dialogId
		}) => buildSearchResultItem(dialogId));
	};

	// The composition is resolved at search time through the same getters the folder list is built from
	// (see AllFolderRecentService.getCollection), so the scope cannot drift from the list - except for the
	// loaded depth: the cursor applied on top of those getters stays in the service of the list.
	const getFolderItems = (folderId, params) => {
		const store = im_v2_application_core.Core.getStore();
		const sections = store.getters['recent/folders/getSourceSections'](folderId);
		const recentItems = store.getters['recent/getRootUnionCollection']({
			sections
		});

		// onlyAttachableToCollab needs no branch here: it only arrives from the selector mount points, and
		// those pass a section of their own, never a folder id.
		return recentItems.filter(item => isSearchableItem(item, params)).map(({
			dialogId
		}) => buildSearchResultItem(dialogId));
	};
	const getAllChatsItems = params => {
		const SectionsForAllChatsSearch = [im_v2_const.RecentType.default, im_v2_const.RecentType.taskComments];
		return SectionsForAllChatsSearch.reduce((items, section) => {
			return mergeSearchItems(items, getSectionItems(section, params));
		}, []);
	};
	const isAttachableToCollab = (dialogId, recentType) => {
		const handleByRecentType = {
			[im_v2_const.RecentType.collab]: () => im_v2_lib_permission.PermissionManager.getInstance().canManageUsersAdd(dialogId),
			[im_v2_const.RecentType.default]: () => canAttach(dialogId)
		};
		return handleByRecentType[recentType]();
	};
	const isSearchableItem = (item, params) => {
		const {
			withFakeUsers,
			onlyWithManageMessagesRight
		} = params;
		return isSearchableRecentItem(item, withFakeUsers) && (!onlyWithManageMessagesRight || canSendMessage(item.dialogId));
	};
	const isSearchableRecentItem = (item, withFakeUsers) => {
		if (withFakeUsers && item.isFakeElement) {
			return true;
		}
		return !item.isBirthdayPlaceholder && !item.isFakeElement;
	};
	const buildSearchResultItem = dialogId => {
		return {
			dialogId,
			dateMessage: getRecentItemDate(dialogId)
		};
	};
	const canAttach = dialogId => {
		const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
		return permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.attachToParent, dialogId);
	};
	const canSendMessage = dialogId => {
		const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
		return permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.send, dialogId);
	};

	const collator = new Intl.Collator(undefined, {
		sensitivity: 'base'
	});
	const SearchItemOrigin = {
		recentList: 'recentList',
		chatParticipants: 'chatParticipants',
		tabMemory: 'tabMemory'
	};

	// items from these parts of the pool have already passed the server visibility check
	const OriginsVisibleByDefault = new Set([SearchItemOrigin.recentList, SearchItemOrigin.chatParticipants]);
	const UserTypesHiddenInTabMemory = new Set([im_v2_const.UserType.extranet, im_v2_const.UserType.collaber, im_v2_const.UserType.guest]);
	class LocalSearch {
		#searchConfig;
		#store;
		// the words of everyone the pool has been asked about, kept for as long as this search lives
		#userSearchWords = new Map();
		constructor(searchConfig) {
			this.#searchConfig = searchConfig;
			this.#store = im_v2_application_core.Core.getStore();
		}
		search(query, localCollection) {
			if (this.#searchConfig.withTabMemoryPool) {
				return this.#searchInTabMemory(query, localCollection);
			}
			const localItems = this.#getLocalItems(localCollection);
			const result = this.#search(query, localItems);
			return this.#excludeByConfig(result);
		}
		#searchInTabMemory(query, localCollection) {
			const queryWords = im_v2_lib_utils.Utils.text.getWordsFromString(query);
			const eagerMatches = this.#getEagerMatches(localCollection, queryWords);
			const pool = this.#mergeItems(eagerMatches, this.#getTabMemoryMatches(queryWords));
			const visibleItems = pool.filter(item => isVisibleForLocalSearch(item));
			// the config cuts before the limit: the other way round the excluded eat the places of those who
			// belong in the list - a hundred chats ahead of them leave no place for a single person
			// the comparator walks the store on every comparison, so it is given the already narrowed set
			const foundItems = sortByDate(this.#excludeByConfig(visibleItems)).slice(0, MAX_ENTITIES_IN_SEARCH_LIST);
			return foundItems.map(({
				dialogId,
				dateMessage
			}) => {
				return {
					dialogId,
					dateMessage
				};
			});
		}
		#getEagerMatches(localCollection, queryWords) {
			const localItems = this.#getLocalItemsFromDialogIds(localCollection);
			// the parts the server has already shown go first, so the merge that keeps the item it met first
			// keeps the strongest mark of a person who belongs to several parts of the pool at once
			const eagerItems = [...localItems.filter(item => OriginsVisibleByDefault.has(item.origin)), ...this.#getRecentListItems(), ...localItems.filter(item => !OriginsVisibleByDefault.has(item.origin))];
			return eagerItems.filter(item => this.#searchByQueryWords(item, queryWords));
		}

		// The users collection is traversed on every keystroke, so items are built only for matched users:
		// building an item means two getter calls and two temporary entities per user.
		#getTabMemoryMatches(queryWords) {
			const users = this.#store.getters['users/getCollection'];
			const matchedItems = [];
			users.forEach(user => {
				if (!this.#searchByUserFields(user, queryWords)) {
					return;
				}
				matchedItems.push({
					dialogId: String(user.id),
					dateMessage: '',
					user,
					origin: SearchItemOrigin.tabMemory
				});
			});
			return matchedItems;
		}
		#search(query, localItems) {
			const queryWords = im_v2_lib_utils.Utils.text.getWordsFromString(query);
			const foundItems = new Map();
			localItems.forEach(localItem => {
				if (this.#searchByQueryWords(localItem, queryWords)) {
					foundItems.set(localItem.dialogId, {
						dialogId: localItem.dialogId,
						dateMessage: localItem.dateMessage
					});
				}
			});
			return [...foundItems.values()];
		}
		#getRecentListItems() {
			const recentListItems = getRecentListItems({
				withFakeUsers: true,
				searchRecentSection: this.#searchConfig.searchRecentSection,
				searchAllChats: this.#searchConfig.searchAllChats,
				searchFolderId: this.#searchConfig.searchFolderId,
				parentChatId: this.#searchConfig.parentId,
				onlyAttachableToCollab: this.#searchConfig.onlyWithManageUsersAddRight || this.#searchConfig.onlyWithOwnerRight,
				onlyWithManageMessagesRight: this.#searchConfig.onlyWithManageMessagesRight
			});
			return recentListItems.map(item => {
				return this.#prepareRecentItem(item.dialogId, item.dateMessage, SearchItemOrigin.recentList);
			});
		}
		#prepareRecentItem(dialogId, dateMessage, origin) {
			const recentItem = {
				dialogId,
				dateMessage,
				origin,
				dialog: this.#getDialog(dialogId)
			};
			const isUser = this.#isUser(dialogId);
			if (isUser) {
				recentItem.user = this.#store.getters['users/get'](dialogId, true);
			}
			return recentItem;
		}
		#searchByQueryWords(localItem, queryWords) {
			if (localItem.user) {
				return this.#searchByUserFields(localItem.user, queryWords);
			}
			return this.#searchByDialogFields(localItem, queryWords);
		}
		#searchByDialogFields(localItem, queryWords) {
			const searchField = [];
			if (localItem.dialog.name) {
				const dialogNameWords = im_v2_lib_utils.Utils.text.getWordsFromString(localItem.dialog.name.toLowerCase());
				searchField.push(...dialogNameWords);
			}
			return this.#doesItemMatchQuery(searchField, queryWords);
		}
		#searchByUserFields(user, queryWords) {
			return this.#doesItemMatchQuery(this.#getUserSearchWords(user), queryWords);
		}

		// The whole pool is walked through on every keystroke, and the fields of a person do not change
		// between two of them, so the words are parsed once. The strings they came from are kept beside them:
		// a renamed person or a changed work position rebuilds the words instead of being searched by the
		// words of yesterday.
		#getUserSearchWords(user) {
			const {
				name,
				lastName,
				workPosition
			} = user;
			const cached = this.#userSearchWords.get(user.id);
			const isCacheActual = Boolean(cached) && cached.name === name && cached.lastName === lastName && cached.workPosition === workPosition;
			if (isCacheActual) {
				return cached.words;
			}
			const words = this.#buildUserSearchWords(user);
			this.#userSearchWords.set(user.id, {
				name,
				lastName,
				workPosition,
				words
			});
			return words;
		}
		#buildUserSearchWords(user) {
			const searchField = [];
			if (user.name) {
				const userNameWords = im_v2_lib_utils.Utils.text.getWordsFromString(user.name.toLowerCase());
				searchField.push(...userNameWords);
			}

			// the name comes from the server by a name format template that may not contain the last name
			if (this.#searchConfig.withTabMemoryPool && user.lastName) {
				const lastNameWords = im_v2_lib_utils.Utils.text.getWordsFromString(user.lastName.toLowerCase());
				searchField.push(...lastNameWords);
			}
			if (user.workPosition) {
				const workPositionWords = im_v2_lib_utils.Utils.text.getWordsFromString(user.workPosition.toLowerCase());
				searchField.push(...workPositionWords);
			}
			return searchField;
		}
		#doesItemMatchQuery(fieldsForSearch, queryWords) {
			let found = 0;
			queryWords.forEach(queryWord => {
				let queryWordsMatchCount = 0;
				fieldsForSearch.forEach(field => {
					const word = field.slice(0, queryWord.length);
					if (collator.compare(queryWord, word) === 0) {
						queryWordsMatchCount++;
					}
				});
				if (queryWordsMatchCount > 0) {
					found++;
				}
			});
			return found >= queryWords.length;
		}
		#getLocalItems(localCollection) {
			const recentItems = this.#getRecentListItems();
			const localItems = this.#getLocalItemsFromDialogIds(localCollection);
			return this.#mergeItems(localItems, recentItems);
		}

		// The mark comes with the item: one collection of a consumer may hold several parts of the pool at
		// once - the composition of a chat and the answers of the search do - and only the consumer knows
		// which part an item came from. An item that carries no mark is taken for the weakest part.
		#getLocalItemsFromDialogIds(localCollection) {
			return localCollection.map(item => {
				const origin = item.origin ?? SearchItemOrigin.tabMemory;
				return this.#prepareRecentItem(item.dialogId, item.dateMessage, origin);
			});
		}
		#mergeItems(items1, items2) {
			const itemsMap = new Map();
			const mergedArray = [...items1, ...items2];
			for (const recentItem of mergedArray) {
				if (!itemsMap.has(recentItem.dialogId)) {
					itemsMap.set(recentItem.dialogId, recentItem);
				}
			}
			return [...itemsMap.values()];
		}
		#excludeByConfig(items) {
			const {
				exclude,
				excludeGuests
			} = this.#searchConfig;
			const hasExcludeList = Array.isArray(exclude) && exclude.length > 0;
			if (!hasExcludeList && !excludeGuests) {
				return items;
			}
			return items.filter(item => {
				const isUser = this.#isUserItem(item);
				const isChat = !isUser;
				if (isChat && hasExcludeList && exclude.includes(EntitySearch.chats)) {
					return false;
				}
				if (isUser && hasExcludeList && exclude.includes(EntitySearch.users)) {
					return false;
				}
				const isGuestToExclude = excludeGuests && this.#store.getters['users/isGuest'](item.dialogId);
				return !isGuestToExclude;
			});
		}
		#getDialog(dialogId) {
			return this.#store.getters['chats/get'](dialogId, true);
		}
		#isUser(dialogId) {
			const {
				type
			} = this.#getDialog(dialogId);
			return type === im_v2_const.ChatType.user;
		}

		// A pool item already knows whether it is a user. Asking the chats model instead is not enough
		// for a person from the tab memory: their dialog may be absent from it, and a blank chat is a group one.
		#isUserItem(item) {
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
	const isVisibleFromTabMemory = user => {
		if (UserTypesHiddenInTabMemory.has(user.type)) {
			return false;
		}
		return user.internalAccount === true && user.intranetUser === true && user.active === true;
	};

	// Client-side visibility rules, deliberately stricter than the server ones: the local result
	// is a subset of what the server would return. The order of the checks is a part of the contract.
	const isVisibleForLocalSearch = item => {
		const {
			user,
			origin
		} = item;
		// chats are not affected, their fate is decided by the search config
		if (!user) {
			return true;
		}
		if (user.id === im_v2_application_core.Core.getUserId()) {
			return true;
		}

		// an explicit `false` from the server hides a fired or blocked account whatever the origin is;
		// the tab memory additionally requires an explicit `true` (see isVisibleFromTabMemory)
		if (user.active === false) {
			return false;
		}
		if (user.type === im_v2_const.UserType.bot) {
			return false;
		}

		// origin is checked before the user type: external colleagues from the current chat
		// and from the recent list stay instantly searchable
		if (OriginsVisibleByDefault.has(origin)) {
			return true;
		}
		return isVisibleFromTabMemory(user);
	};

	// The state the mention list keeps for as long as the tab lives: which people belong to which chat.
	// Nothing else goes here - people and chats themselves live in the models of the tab, and a second copy
	// of them would age on its own. No browser storage either: reloading the tab drops the state by itself.
	class MentionStateStore {
		static #instance;
		#chatParticipants = new Map();
		static getInstance() {
			MentionStateStore.#instance = MentionStateStore.#instance ?? new MentionStateStore();
			return MentionStateStore.#instance;
		}

		// null means the composition has never been loaded in this tab: it has to be requested
		getChatParticipants(dialogId) {
			return this.#chatParticipants.get(dialogId) ?? null;
		}
		setChatParticipants(dialogId, participants) {
			this.#chatParticipants.set(dialogId, participants);
		}

		// tests only: the product code never resets the state
		clear() {
			this.#chatParticipants.clear();
		}
	}

	function getUsersFromRecentItems({
		withFakeUsers,
		withGuests = true,
		userLimit = MAX_USERS_IN_SEARCH_LIST_DEFAULT
	}) {
		return getRecentListItems({
			withFakeUsers
		}).filter(({
			dialogId
		}) => {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const user = im_v2_application_core.Core.getStore().getters['users/get'](dialogId, true);
			return chat.type === im_v2_const.ChatType.user && user.type !== im_v2_const.UserType.bot && user.id !== im_v2_application_core.Core.getUserId() && (withGuests || !im_v2_application_core.Core.getStore().getters['users/isGuest'](dialogId));
		}).slice(0, userLimit);
	}

	exports.EntityId = EntityId;
	exports.EntitySearch = EntitySearch;
	exports.LocalSearch = LocalSearch;
	exports.MAX_ENTITIES_IN_SEARCH_LIST = MAX_ENTITIES_IN_SEARCH_LIST;
	exports.MentionStateStore = MentionStateStore;
	exports.SearchItemOrigin = SearchItemOrigin;
	exports.StoreUpdater = StoreUpdater;
	exports.getRecentListItems = getRecentListItems;
	exports.getSearchConfig = getSearchConfig;
	exports.getUsersFromRecentItems = getUsersFromRecentItems;
	exports.mergeSearchItems = mergeSearchItems;
	exports.sortByDate = sortByDate;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=search.bundle.js.map
