/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_lib_user,ui_vue3_vuex,im_v2_lib_search,im_v2_application_core,im_v2_const,im_v2_lib_utils) {
	'use strict';

	const EntityId = 'im-recent-v2';
	const ContextId = 'IM_CHAT_SEARCH';
	const SearchDialogId = 'im-chat-search';
	const getSearchConfig = searchConfig => {
	  const entity = {
	    id: EntityId,
	    dynamicLoad: true,
	    dynamicSearch: true,
	    options: searchConfig
	  };
	  return {
	    dialog: {
	      entities: [entity],
	      preselectedItems: [],
	      clearUnavailableItems: false,
	      context: ContextId,
	      id: SearchDialogId
	    }
	  };
	};

	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _userManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("userManager");
	var _prepareDataForModels = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareDataForModels");
	class StoreUpdater {
	  constructor() {
	    Object.defineProperty(this, _prepareDataForModels, {
	      value: _prepareDataForModels2
	    });
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _userManager, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = im_v2_application_core.Core.getStore();
	    babelHelpers.classPrivateFieldLooseBase(this, _userManager)[_userManager] = new im_v2_lib_user.UserManager();
	  }
	  update(items) {
	    const {
	      users,
	      chats
	    } = babelHelpers.classPrivateFieldLooseBase(this, _prepareDataForModels)[_prepareDataForModels](items);
	    return Promise.all([babelHelpers.classPrivateFieldLooseBase(this, _userManager)[_userManager].setUsersToModel(users), babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('chats/set', chats)]);
	  }
	}
	function _prepareDataForModels2(items) {
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

	function getRecentItemDate(dialogId) {
	  const message = im_v2_application_core.Core.getStore().getters['recent/getMessage'](dialogId);
	  if (!message) {
	    return '';
	  }
	  return message.date.toISOString();
	}

	function getRecentListItems({
	  withFakeUsers,
	  searchRecentSection
	}) {
	  const recentSection = searchRecentSection != null ? searchRecentSection : im_v2_const.RecentType.default;
	  const recentItems = im_v2_application_core.Core.getStore().getters['recent/getSortedCollection']({
	    type: recentSection
	  });
	  return recentItems.filter(item => filterRecentItem(item, withFakeUsers)).map(({
	    dialogId
	  }) => buildSearchResultItem(dialogId));
	}
	const filterRecentItem = (recentItem, withFakeUsers) => {
	  if (withFakeUsers && recentItem.isFakeElement) {
	    return true;
	  }
	  return !recentItem.isBirthdayPlaceholder && !recentItem.isFakeElement;
	};
	const buildSearchResultItem = dialogId => {
	  return {
	    dialogId,
	    dateMessage: getRecentItemDate(dialogId)
	  };
	};

	const collator = new Intl.Collator(undefined, {
	  sensitivity: 'base'
	});
	var _searchConfig = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("searchConfig");
	var _store$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _search = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("search");
	var _getRecentListItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getRecentListItems");
	var _prepareRecentItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareRecentItem");
	var _searchByQueryWords = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("searchByQueryWords");
	var _searchByDialogFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("searchByDialogFields");
	var _searchByUserFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("searchByUserFields");
	var _doesItemMatchQuery = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("doesItemMatchQuery");
	var _getLocalItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLocalItems");
	var _getLocalItemsFromDialogIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLocalItemsFromDialogIds");
	var _mergeItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mergeItems");
	var _excludeByConfig = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("excludeByConfig");
	var _getDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDialog");
	var _isUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isUser");
	class LocalSearch {
	  constructor(searchConfig) {
	    Object.defineProperty(this, _isUser, {
	      value: _isUser2
	    });
	    Object.defineProperty(this, _getDialog, {
	      value: _getDialog2
	    });
	    Object.defineProperty(this, _excludeByConfig, {
	      value: _excludeByConfig2
	    });
	    Object.defineProperty(this, _mergeItems, {
	      value: _mergeItems2
	    });
	    Object.defineProperty(this, _getLocalItemsFromDialogIds, {
	      value: _getLocalItemsFromDialogIds2
	    });
	    Object.defineProperty(this, _getLocalItems, {
	      value: _getLocalItems2
	    });
	    Object.defineProperty(this, _doesItemMatchQuery, {
	      value: _doesItemMatchQuery2
	    });
	    Object.defineProperty(this, _searchByUserFields, {
	      value: _searchByUserFields2
	    });
	    Object.defineProperty(this, _searchByDialogFields, {
	      value: _searchByDialogFields2
	    });
	    Object.defineProperty(this, _searchByQueryWords, {
	      value: _searchByQueryWords2
	    });
	    Object.defineProperty(this, _prepareRecentItem, {
	      value: _prepareRecentItem2
	    });
	    Object.defineProperty(this, _getRecentListItems, {
	      value: _getRecentListItems2
	    });
	    Object.defineProperty(this, _search, {
	      value: _search2
	    });
	    Object.defineProperty(this, _searchConfig, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _store$1, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _searchConfig)[_searchConfig] = searchConfig;
	    babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1] = im_v2_application_core.Core.getStore();
	  }
	  search(query, localCollection) {
	    const localItems = babelHelpers.classPrivateFieldLooseBase(this, _getLocalItems)[_getLocalItems](localCollection);
	    const result = babelHelpers.classPrivateFieldLooseBase(this, _search)[_search](query, localItems);
	    return babelHelpers.classPrivateFieldLooseBase(this, _excludeByConfig)[_excludeByConfig](result);
	  }
	}
	function _search2(query, localItems) {
	  const queryWords = im_v2_lib_utils.Utils.text.getWordsFromString(query);
	  const foundItems = new Map();
	  localItems.forEach(localItem => {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _searchByQueryWords)[_searchByQueryWords](localItem, queryWords)) {
	      foundItems.set(localItem.dialogId, {
	        dialogId: localItem.dialogId,
	        dateMessage: localItem.dateMessage
	      });
	    }
	  });
	  return [...foundItems.values()];
	}
	function _getRecentListItems2() {
	  const recentListItems = getRecentListItems({
	    withFakeUsers: true,
	    searchRecentSection: babelHelpers.classPrivateFieldLooseBase(this, _searchConfig)[_searchConfig].searchRecentSection
	  });
	  return recentListItems.map(item => {
	    return babelHelpers.classPrivateFieldLooseBase(this, _prepareRecentItem)[_prepareRecentItem](item.dialogId, item.dateMessage);
	  });
	}
	function _prepareRecentItem2(dialogId, dateMessage) {
	  const recentItem = {
	    dialogId,
	    dateMessage,
	    dialog: babelHelpers.classPrivateFieldLooseBase(this, _getDialog)[_getDialog](dialogId)
	  };
	  const isUser = babelHelpers.classPrivateFieldLooseBase(this, _isUser)[_isUser](dialogId);
	  if (isUser) {
	    recentItem.user = babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].getters['users/get'](dialogId, true);
	  }
	  return recentItem;
	}
	function _searchByQueryWords2(localItem, queryWords) {
	  if (localItem.user) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _searchByUserFields)[_searchByUserFields](localItem, queryWords);
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _searchByDialogFields)[_searchByDialogFields](localItem, queryWords);
	}
	function _searchByDialogFields2(localItem, queryWords) {
	  const searchField = [];
	  if (localItem.dialog.name) {
	    const dialogNameWords = im_v2_lib_utils.Utils.text.getWordsFromString(localItem.dialog.name.toLowerCase());
	    searchField.push(...dialogNameWords);
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _doesItemMatchQuery)[_doesItemMatchQuery](searchField, queryWords);
	}
	function _searchByUserFields2(localItem, queryWords) {
	  const searchField = [];
	  if (localItem.user.name) {
	    const userNameWords = im_v2_lib_utils.Utils.text.getWordsFromString(localItem.user.name.toLowerCase());
	    searchField.push(...userNameWords);
	  }
	  if (localItem.user.workPosition) {
	    const workPositionWords = im_v2_lib_utils.Utils.text.getWordsFromString(localItem.user.workPosition.toLowerCase());
	    searchField.push(...workPositionWords);
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _doesItemMatchQuery)[_doesItemMatchQuery](searchField, queryWords);
	}
	function _doesItemMatchQuery2(fieldsForSearch, queryWords) {
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
	function _getLocalItems2(localCollection) {
	  const recentItems = babelHelpers.classPrivateFieldLooseBase(this, _getRecentListItems)[_getRecentListItems]();
	  const localItems = babelHelpers.classPrivateFieldLooseBase(this, _getLocalItemsFromDialogIds)[_getLocalItemsFromDialogIds](localCollection);
	  return babelHelpers.classPrivateFieldLooseBase(this, _mergeItems)[_mergeItems](localItems, recentItems);
	}
	function _getLocalItemsFromDialogIds2(localCollection) {
	  return localCollection.map(item => {
	    return babelHelpers.classPrivateFieldLooseBase(this, _prepareRecentItem)[_prepareRecentItem](item.dialogId, item.dateMessage);
	  });
	}
	function _mergeItems2(items1, items2) {
	  const itemsMap = new Map();
	  const mergedArray = [...items1, ...items2];
	  for (const recentItem of mergedArray) {
	    if (!itemsMap.has(recentItem.dialogId)) {
	      itemsMap.set(recentItem.dialogId, recentItem);
	    }
	  }
	  return [...itemsMap.values()];
	}
	function _excludeByConfig2(items) {
	  var _babelHelpers$classPr;
	  const exclude = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _searchConfig)[_searchConfig]) == null ? void 0 : _babelHelpers$classPr.exclude;
	  if (!exclude || exclude.length === 0) {
	    return items;
	  }
	  return items.filter(item => {
	    const isUser = babelHelpers.classPrivateFieldLooseBase(this, _isUser)[_isUser](item.dialogId);
	    const isChat = !isUser;
	    if (isChat && exclude.includes(im_v2_lib_search.EntitySearch.chats)) {
	      return false;
	    }

	    // eslint-disable-next-line sonarjs/prefer-single-boolean-return
	    if (isUser && exclude.includes(im_v2_lib_search.EntitySearch.users)) {
	      return false;
	    }
	    return true;
	  });
	}
	function _getDialog2(dialogId) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].getters['chats/get'](dialogId, true);
	}
	function _isUser2(dialogId) {
	  const {
	    type
	  } = babelHelpers.classPrivateFieldLooseBase(this, _getDialog)[_getDialog](dialogId);
	  return type === im_v2_const.ChatType.user;
	}

	const EntitySearch = {
	  chats: 'chats',
	  users: 'users'
	};
	const MAX_ENTITIES_IN_SEARCH_LIST = 100;
	const MAX_USERS_IN_SEARCH_LIST_DEFAULT = 50;

	function getUsersFromRecentItems({
	  withFakeUsers,
	  userLimit = MAX_USERS_IN_SEARCH_LIST_DEFAULT
	}) {
	  return getRecentListItems({
	    withFakeUsers
	  }).filter(({
	    dialogId
	  }) => {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    const user = im_v2_application_core.Core.getStore().getters['users/get'](dialogId, true);
	    return chat.type === im_v2_const.ChatType.user && user.type !== im_v2_const.UserType.bot && user.id !== im_v2_application_core.Core.getUserId();
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

	exports.getSearchConfig = getSearchConfig;
	exports.EntityId = EntityId;
	exports.StoreUpdater = StoreUpdater;
	exports.LocalSearch = LocalSearch;
	exports.getUsersFromRecentItems = getUsersFromRecentItems;
	exports.getRecentListItems = getRecentListItems;
	exports.sortByDate = sortByDate;
	exports.EntitySearch = EntitySearch;
	exports.MAX_ENTITIES_IN_SEARCH_LIST = MAX_ENTITIES_IN_SEARCH_LIST;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Messenger.v2.Lib,BX.Vue3.Vuex,BX.Messenger.v2.Lib,BX.Messenger.v2.Application,BX.Messenger.v2.Const,BX.Messenger.v2.Lib));
//# sourceMappingURL=search.bundle.js.map
