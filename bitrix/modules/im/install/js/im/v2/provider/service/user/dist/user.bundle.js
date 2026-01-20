/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_lib_rest,im_v2_lib_user) {
	'use strict';

	var _itemsPerPage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("itemsPerPage");
	var _isLoading = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isLoading");
	var _hasMoreItemsToLoad = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasMoreItemsToLoad");
	var _lastId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastId");
	var _requestItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("requestItems");
	var _getQueryParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getQueryParams");
	class BaseUserService {
	  constructor() {
	    Object.defineProperty(this, _getQueryParams, {
	      value: _getQueryParams2
	    });
	    Object.defineProperty(this, _requestItems, {
	      value: _requestItems2
	    });
	    Object.defineProperty(this, _itemsPerPage, {
	      writable: true,
	      value: 50
	    });
	    Object.defineProperty(this, _isLoading, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _hasMoreItemsToLoad, {
	      writable: true,
	      value: true
	    });
	    Object.defineProperty(this, _lastId, {
	      writable: true,
	      value: void 0
	    });
	  }
	  loadFirstPage(messageId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _isLoading)[_isLoading] = true;
	    return babelHelpers.classPrivateFieldLooseBase(this, _requestItems)[_requestItems]({
	      messageId,
	      firstPage: true
	    });
	  }
	  loadNextPage(messageId) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isLoading)[_isLoading] || !babelHelpers.classPrivateFieldLooseBase(this, _hasMoreItemsToLoad)[_hasMoreItemsToLoad]) {
	      return Promise.resolve();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _isLoading)[_isLoading] = true;
	    return babelHelpers.classPrivateFieldLooseBase(this, _requestItems)[_requestItems]({
	      messageId
	    });
	  }
	  hasMoreItemsToLoad() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _hasMoreItemsToLoad)[_hasMoreItemsToLoad];
	  }
	  getItemsPerPage() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _itemsPerPage)[_itemsPerPage];
	  }
	  getRequestFilter(firstPage = false) {
	    return {
	      lastId: firstPage ? null : babelHelpers.classPrivateFieldLooseBase(this, _lastId)[_lastId]
	    };
	  }
	  getRestMethodName() {
	    throw new Error('BaseUserService: you should implement "getRestMethodName" for child class');
	  }
	  getLastId(result) {
	    throw new Error('BaseUserService: you should implement "getLastId" for child class');
	  }
	}
	async function _requestItems2({
	  messageId,
	  firstPage = false
	}) {
	  const result = await im_v2_lib_rest.runAction(this.getRestMethodName(), babelHelpers.classPrivateFieldLooseBase(this, _getQueryParams)[_getQueryParams]({
	    messageId,
	    firstPage
	  })).catch(([error]) => {
	    console.error('BaseRecentList: page request error', error);
	  });
	  const {
	    users,
	    hasNextPage
	  } = result;
	  babelHelpers.classPrivateFieldLooseBase(this, _lastId)[_lastId] = this.getLastId(result);
	  babelHelpers.classPrivateFieldLooseBase(this, _hasMoreItemsToLoad)[_hasMoreItemsToLoad] = hasNextPage;
	  babelHelpers.classPrivateFieldLooseBase(this, _isLoading)[_isLoading] = false;
	  const userManager = new im_v2_lib_user.UserManager();
	  await userManager.setUsersToModel(Object.values(users));
	  return users.map(user => user.id);
	}
	function _getQueryParams2({
	  messageId,
	  firstPage = false
	}) {
	  return {
	    data: {
	      messageId,
	      limit: this.getItemsPerPage(),
	      filter: this.getRequestFilter(firstPage)
	    }
	  };
	}

	exports.BaseUserService = BaseUserService;

}((this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}),BX.Messenger.v2.Lib,BX.Messenger.v2.Lib));
//# sourceMappingURL=user.bundle.js.map
