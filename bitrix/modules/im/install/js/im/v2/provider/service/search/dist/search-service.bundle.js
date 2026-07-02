/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core,im_v2_lib_search,im_v2_lib_logger,im_v2_lib_utils) {
	'use strict';

	const SEARCH_REQUEST_ENDPOINT = 'ui.entityselector.doSearch';
	const LOAD_LATEST_RESULTS_ENDPOINT = 'ui.entityselector.load';
	const SAVE_ITEM_ENDPOINT = 'ui.entityselector.saveRecentItems';
	var _localSearch = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("localSearch");
	var _localCollection = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("localCollection");
	var _searchConfig = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("searchConfig");
	var _loadLatestResultsRequest = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadLatestResultsRequest");
	var _searchRequest = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("searchRequest");
	var _getDialogIdAndDate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDialogIdAndDate");
	var _getItemsFromRecentItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getItemsFromRecentItems");
	class SearchService {
	  constructor(searchConfig) {
	    Object.defineProperty(this, _getItemsFromRecentItems, {
	      value: _getItemsFromRecentItems2
	    });
	    Object.defineProperty(this, _getDialogIdAndDate, {
	      value: _getDialogIdAndDate2
	    });
	    Object.defineProperty(this, _searchRequest, {
	      value: _searchRequest2
	    });
	    Object.defineProperty(this, _loadLatestResultsRequest, {
	      value: _loadLatestResultsRequest2
	    });
	    Object.defineProperty(this, _localSearch, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _localCollection, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _searchConfig, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _searchConfig)[_searchConfig] = searchConfig;
	    this.storeUpdater = new im_v2_lib_search.StoreUpdater();
	    babelHelpers.classPrivateFieldLooseBase(this, _localSearch)[_localSearch] = new im_v2_lib_search.LocalSearch(searchConfig);
	  }
	  async loadLatestResults() {
	    const response = await babelHelpers.classPrivateFieldLooseBase(this, _loadLatestResultsRequest)[_loadLatestResultsRequest]();
	    const {
	      items,
	      recentItems
	    } = response;
	    if (items.length === 0 || recentItems.length === 0) {
	      return [];
	    }
	    const itemsFromRecentItems = babelHelpers.classPrivateFieldLooseBase(this, _getItemsFromRecentItems)[_getItemsFromRecentItems](recentItems, items);
	    await this.storeUpdater.update(itemsFromRecentItems);
	    return babelHelpers.classPrivateFieldLooseBase(this, _getDialogIdAndDate)[_getDialogIdAndDate](itemsFromRecentItems);
	  }
	  searchLocal(query) {
	    const localCollection = [...babelHelpers.classPrivateFieldLooseBase(this, _localCollection)[_localCollection].values()];
	    return babelHelpers.classPrivateFieldLooseBase(this, _localSearch)[_localSearch].search(query, localCollection);
	  }
	  async search(query) {
	    const items = await babelHelpers.classPrivateFieldLooseBase(this, _searchRequest)[_searchRequest](query);
	    await this.storeUpdater.update(items);
	    const searchResult = babelHelpers.classPrivateFieldLooseBase(this, _getDialogIdAndDate)[_getDialogIdAndDate](items);
	    searchResult.forEach(searchItem => {
	      babelHelpers.classPrivateFieldLooseBase(this, _localCollection)[_localCollection].set(searchItem.dialogId, searchItem);
	    });
	    return searchResult;
	  }
	  saveItemToRecentSearch(dialogId) {
	    var _babelHelpers$classPr;
	    const recentItems = [{
	      id: dialogId,
	      entityId: (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _searchConfig)[_searchConfig].entityId) != null ? _babelHelpers$classPr : im_v2_lib_search.EntityId
	    }];
	    const config = {
	      json: {
	        ...im_v2_lib_search.getSearchConfig(babelHelpers.classPrivateFieldLooseBase(this, _searchConfig)[_searchConfig]),
	        recentItems
	      }
	    };
	    void main_core.ajax.runAction(SAVE_ITEM_ENDPOINT, config);
	  }
	  clearSessionResult() {
	    babelHelpers.classPrivateFieldLooseBase(this, _localCollection)[_localCollection].clear();
	  }
	}
	async function _loadLatestResultsRequest2() {
	  const config = {
	    json: im_v2_lib_search.getSearchConfig(babelHelpers.classPrivateFieldLooseBase(this, _searchConfig)[_searchConfig])
	  };
	  let items = {
	    items: [],
	    recentItems: []
	  };
	  try {
	    const response = await main_core.ajax.runAction(LOAD_LATEST_RESULTS_ENDPOINT, config);
	    im_v2_lib_logger.Logger.warn('Search service: latest search request result', response);
	    items = response.data.dialog;
	  } catch (error) {
	    im_v2_lib_logger.Logger.warn('Search service: latest search request error', error);
	  }
	  return items;
	}
	async function _searchRequest2(query) {
	  const config = {
	    json: im_v2_lib_search.getSearchConfig(babelHelpers.classPrivateFieldLooseBase(this, _searchConfig)[_searchConfig])
	  };
	  config.json.searchQuery = {
	    queryWords: im_v2_lib_utils.Utils.text.getWordsFromString(query),
	    query
	  };
	  let items = [];
	  try {
	    const response = await main_core.ajax.runAction(SEARCH_REQUEST_ENDPOINT, config);
	    im_v2_lib_logger.Logger.warn('Search service: request result', response);
	    items = response.data.dialog.items;
	  } catch (error) {
	    im_v2_lib_logger.Logger.warn('Search service: error', error);
	  }
	  return items;
	}
	function _getDialogIdAndDate2(items) {
	  return items.map(item => {
	    var _item$customData$date, _item$customData;
	    return {
	      dialogId: item.id.toString(),
	      dateMessage: (_item$customData$date = (_item$customData = item.customData) == null ? void 0 : _item$customData.dateMessage) != null ? _item$customData$date : ''
	    };
	  });
	}
	function _getItemsFromRecentItems2(recentItems, items) {
	  const filledRecentItems = [];
	  recentItems.forEach(([, dialogId]) => {
	    const found = items.find(recentItem => {
	      return recentItem.id === dialogId.toString();
	    });
	    if (found) {
	      filledRecentItems.push(found);
	    }
	  });
	  return filledRecentItems;
	}

	exports.SearchService = SearchService;

}((this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}),BX,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib));
//# sourceMappingURL=search-service.bundle.js.map
