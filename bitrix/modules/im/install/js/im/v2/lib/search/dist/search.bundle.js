/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_lib_user, im_v2_const, im_v2_lib_utils, im_v2_lib_permission, im_v2_lib_chat) {
	'use strict';

	const EntityId = 'im-recent-v2';
	const ContextId = 'IM_CHAT_SEARCH';
	const SearchDialogId = 'im-chat-search';
	const getSearchConfig = searchConfig => {
		const {
			entityId = EntityId,
			contextId = ContextId,
			searchDialogId = SearchDialogId,
			...entityOptions
		} = searchConfig;
		const entity = {
			id: entityId,
			dynamicLoad: true,
			dynamicSearch: true,
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

	function getRecentListItems(params) {
		const {
			searchRecentSection,
			parentChatId,
			onlyAttachableToCollab,
			withFakeUsers
		} = params;
		const recentType = searchRecentSection ?? im_v2_const.RecentType.default;
		const preparedParentChatId = im_v2_lib_chat.ChatManager.prepareParentChatId(parentChatId);
		const payload = {
			type: recentType,
			parentChatId: preparedParentChatId
		};
		const recentItems = im_v2_application_core.Core.getStore().getters['recent/getSortedCollection'](payload);
		const filterRecentItem = onlyAttachableToCollab ? item => isAttachableToCollab(item.dialogId, recentType) : item => isSearchableRecentItem(item, withFakeUsers);
		return recentItems.filter(item => filterRecentItem(item)).map(({
			dialogId
		}) => buildSearchResultItem(dialogId));
	}
	const isAttachableToCollab = (dialogId, recentType) => {
		const handleByRecentType = {
			[im_v2_const.RecentType.collab]: () => im_v2_lib_permission.PermissionManager.getInstance().canManageUsersAdd(dialogId),
			[im_v2_const.RecentType.default]: () => canAttach(dialogId)
		};
		return handleByRecentType[recentType]();
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

	const collator = new Intl.Collator(undefined, {
		sensitivity: 'base'
	});
	class LocalSearch {
		#searchConfig;
		#store;
		constructor(searchConfig) {
			this.#searchConfig = searchConfig;
			this.#store = im_v2_application_core.Core.getStore();
		}
		search(query, localCollection) {
			const localItems = this.#getLocalItems(localCollection);
			const result = this.#search(query, localItems);
			return this.#excludeByConfig(result);
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
				parentChatId: this.#searchConfig.parentId,
				onlyAttachableToCollab: this.#searchConfig.onlyWithManageUsersAddRight || this.#searchConfig.onlyWithOwnerRight
			});
			return recentListItems.map(item => {
				return this.#prepareRecentItem(item.dialogId, item.dateMessage);
			});
		}
		#prepareRecentItem(dialogId, dateMessage) {
			const recentItem = {
				dialogId,
				dateMessage,
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
				return this.#searchByUserFields(localItem, queryWords);
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
		#searchByUserFields(localItem, queryWords) {
			const searchField = [];
			if (localItem.user.name) {
				const userNameWords = im_v2_lib_utils.Utils.text.getWordsFromString(localItem.user.name.toLowerCase());
				searchField.push(...userNameWords);
			}
			if (localItem.user.workPosition) {
				const workPositionWords = im_v2_lib_utils.Utils.text.getWordsFromString(localItem.user.workPosition.toLowerCase());
				searchField.push(...workPositionWords);
			}
			return this.#doesItemMatchQuery(searchField, queryWords);
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
		#getLocalItemsFromDialogIds(localCollection) {
			return localCollection.map(item => {
				return this.#prepareRecentItem(item.dialogId, item.dateMessage);
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
				const isUser = this.#isUser(item.dialogId);
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

	exports.EntityId = EntityId;
	exports.EntitySearch = EntitySearch;
	exports.LocalSearch = LocalSearch;
	exports.MAX_ENTITIES_IN_SEARCH_LIST = MAX_ENTITIES_IN_SEARCH_LIST;
	exports.StoreUpdater = StoreUpdater;
	exports.getRecentListItems = getRecentListItems;
	exports.getSearchConfig = getSearchConfig;
	exports.getUsersFromRecentItems = getUsersFromRecentItems;
	exports.mergeSearchItems = mergeSearchItems;
	exports.sortByDate = sortByDate;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=search.bundle.js.map
