/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
this.BX.OpenLines.v2.Provider = this.BX.OpenLines.v2.Provider || {};
(function (exports,im_public,im_v2_const,im_v2_lib_layout,im_v2_provider_service_chat,im_v2_application_core,im_v2_lib_rest,im_v2_lib_notifier,im_v2_lib_logger,imopenlines_v2_const) {
	'use strict';

	var _itemsPerPage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("itemsPerPage");
	var _isLoading = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isLoading");
	var _hasMoreItemsToLoad = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasMoreItemsToLoad");
	var _sortPointer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sortPointer");
	var _lastStatusGroup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastStatusGroup");
	var _requestItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("requestItems");
	var _updateModel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateModel");
	var _getLastDate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLastDate");
	var _getLastStatusGroup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLastStatusGroup");
	class RecentService {
	  constructor() {
	    Object.defineProperty(this, _getLastStatusGroup, {
	      value: _getLastStatusGroup2
	    });
	    Object.defineProperty(this, _getLastDate, {
	      value: _getLastDate2
	    });
	    Object.defineProperty(this, _updateModel, {
	      value: _updateModel2
	    });
	    Object.defineProperty(this, _requestItems, {
	      value: _requestItems2
	    });
	    this.firstPageIsLoaded = false;
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
	    Object.defineProperty(this, _sortPointer, {
	      writable: true,
	      value: 0
	    });
	    Object.defineProperty(this, _lastStatusGroup, {
	      writable: true,
	      value: ''
	    });
	  }
	  async loadFirstPage() {
	    babelHelpers.classPrivateFieldLooseBase(this, _isLoading)[_isLoading] = true;
	    const result = await babelHelpers.classPrivateFieldLooseBase(this, _requestItems)[_requestItems]({
	      firstPage: true
	    });
	    this.firstPageIsLoaded = true;
	    return result;
	  }
	  loadNextPage() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isLoading)[_isLoading] || !babelHelpers.classPrivateFieldLooseBase(this, _hasMoreItemsToLoad)[_hasMoreItemsToLoad]) {
	      return Promise.resolve();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _isLoading)[_isLoading] = true;
	    return babelHelpers.classPrivateFieldLooseBase(this, _requestItems)[_requestItems]();
	  }
	  hasMoreItemsToLoad() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _hasMoreItemsToLoad)[_hasMoreItemsToLoad];
	  }
	}
	async function _requestItems2({
	  firstPage = false
	} = {}) {
	  const queryParams = {
	    data: {
	      cursor: {
	        sortPointer: firstPage ? null : babelHelpers.classPrivateFieldLooseBase(this, _sortPointer)[_sortPointer],
	        statusGroup: firstPage ? null : babelHelpers.classPrivateFieldLooseBase(this, _lastStatusGroup)[_lastStatusGroup]
	      },
	      limit: babelHelpers.classPrivateFieldLooseBase(this, _itemsPerPage)[_itemsPerPage]
	    }
	  };
	  const result = await im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2RecentList, queryParams).catch(error => {
	    im_v2_lib_notifier.Notifier.onDefaultError();
	    im_v2_lib_logger.Logger.error('Imol.OpenlinesList: page request error', error);
	  });
	  const {
	    messages,
	    recentItems,
	    sessions,
	    hasNextPage
	  } = result;
	  if (!hasNextPage) {
	    babelHelpers.classPrivateFieldLooseBase(this, _hasMoreItemsToLoad)[_hasMoreItemsToLoad] = false;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _isLoading)[_isLoading] = false;
	  if (recentItems.length === 0) {
	    return Promise.resolve();
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _lastStatusGroup)[_lastStatusGroup] = babelHelpers.classPrivateFieldLooseBase(this, _getLastStatusGroup)[_getLastStatusGroup](sessions, recentItems);
	  if (babelHelpers.classPrivateFieldLooseBase(this, _lastStatusGroup)[_lastStatusGroup] === imopenlines_v2_const.StatusGroup.answered) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sortPointer)[_sortPointer] = babelHelpers.classPrivateFieldLooseBase(this, _getLastDate)[_getLastDate](messages, recentItems);
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _sortPointer)[_sortPointer] = recentItems[recentItems.length - 1].sessionId;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _updateModel)[_updateModel](result);
	}
	function _updateModel2(restResult) {
	  const {
	    users,
	    chats,
	    messages,
	    files,
	    recentItems,
	    sessions
	  } = restResult;
	  const usersPromise = im_v2_application_core.Core.getStore().dispatch('users/set', users);
	  const dialoguesPromise = im_v2_application_core.Core.getStore().dispatch('chats/set', chats);
	  const messagesPromise = im_v2_application_core.Core.getStore().dispatch('messages/store', messages);
	  const filesPromise = im_v2_application_core.Core.getStore().dispatch('files/set', files);
	  const openLinesPromise = im_v2_application_core.Core.getStore().dispatch('openLines/recent/set', recentItems);
	  const sessionsPromise = im_v2_application_core.Core.getStore().dispatch('openLines/sessions/set', sessions);
	  return Promise.all([usersPromise, dialoguesPromise, messagesPromise, filesPromise, openLinesPromise, sessionsPromise]);
	}
	function _getLastDate2(messages, recentItems) {
	  const lastItemMessageId = recentItems[recentItems.length - 1].messageId;
	  return messages.find(message => message.id === lastItemMessageId).date;
	}
	function _getLastStatusGroup2(sessions, recentItems) {
	  const lastItemSessionId = recentItems[recentItems.length - 1].sessionId;
	  return sessions.find(session => session.id === lastItemSessionId).status;
	}

	class AnswerService {
	  requestAnswer(dialogId) {
	    const queryParams = {
	      data: {
	        dialogId
	      }
	    };
	    return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionAnswer, queryParams).catch(error => {
	      im_v2_lib_notifier.Notifier.onDefaultError();
	      im_v2_lib_logger.Logger.error('Imol.OperatorAnswer: request error', error);
	    });
	  }
	}

	var _updateModel$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateModel");
	var _clearLastOpenedElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("clearLastOpenedElement");
	class FinishService {
	  constructor() {
	    Object.defineProperty(this, _clearLastOpenedElement, {
	      value: _clearLastOpenedElement2
	    });
	    Object.defineProperty(this, _updateModel$1, {
	      value: _updateModel2$1
	    });
	  }
	  markSpamChat(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _updateModel$1)[_updateModel$1](dialogId);
	    const queryParams = {
	      data: {
	        dialogId
	      }
	    };
	    return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionMarkSpam, queryParams).catch(error => {
	      im_v2_lib_notifier.Notifier.onDefaultError();
	      im_v2_lib_logger.Logger.error('Imol.MarkSpam: request error', error);
	    });
	  }
	  finishChat(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _updateModel$1)[_updateModel$1](dialogId);
	    const queryParams = {
	      data: {
	        dialogId
	      }
	    };
	    return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionFinish, queryParams).catch(error => {
	      im_v2_lib_notifier.Notifier.onDefaultError();
	      im_v2_lib_logger.Logger.error('Imol.Finish: request error', error);
	    });
	  }
	}
	function _updateModel2$1(dialogId) {
	  const chatIsOpened = im_v2_application_core.Core.getStore().getters['application/isLinesChatOpen'](dialogId);
	  const chatId = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId).chatId;
	  const session = im_v2_application_core.Core.getStore().getters['openLines/sessions/getByChatId'](chatId);
	  if (chatIsOpened) {
	    void im_public.Messenger.openLines();
	    babelHelpers.classPrivateFieldLooseBase(this, _clearLastOpenedElement)[_clearLastOpenedElement]();
	  }
	  void im_v2_application_core.Core.getStore().dispatch('openLines/sessions/set', {
	    ...session,
	    isClosed: true
	  });
	  void im_v2_application_core.Core.getStore().dispatch('openLines/recent/delete', {
	    id: dialogId
	  });
	}
	function _clearLastOpenedElement2() {
	  im_v2_lib_layout.LayoutManager.getInstance().setLastOpenedElement(im_v2_const.Layout.openlinesV2, '');
	}

	var _sendRequest = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendRequest");
	class PinService {
	  constructor() {
	    Object.defineProperty(this, _sendRequest, {
	      value: _sendRequest2
	    });
	  }
	  pinChat(dialogId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _sendRequest)[_sendRequest]({
	      dialogId,
	      action: true,
	      restMethod: imopenlines_v2_const.RestMethod.linesV2SessionPin
	    });
	  }
	  unpinChat(dialogId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _sendRequest)[_sendRequest]({
	      dialogId,
	      action: false,
	      restMethod: imopenlines_v2_const.RestMethod.linesV2SessionUnpin
	    });
	  }
	}
	function _sendRequest2(actionParams) {
	  const session = im_v2_application_core.Core.getStore().getters['openLines/recent/getSession'](actionParams.dialogId);
	  void im_v2_application_core.Core.getStore().dispatch('openLines/sessions/pin', {
	    id: session.id,
	    chatId: session.chatId,
	    action: actionParams.action
	  });
	  const queryParams = {
	    data: {
	      dialogId: actionParams.dialogId
	    }
	  };
	  return im_v2_lib_rest.runAction(actionParams.restMethod, queryParams).catch(error => {
	    im_v2_lib_logger.Logger.error('Imol.Pin/UnpinDialog: request error', error);
	    void im_v2_application_core.Core.getStore().dispatch('openLines/sessions/pin', {
	      id: session.id,
	      action: !actionParams.action
	    });
	  });
	}

	class InterceptService {
	  interceptDialog(dialogId) {
	    const queryParams = {
	      data: {
	        dialogId
	      }
	    };
	    return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionIntercept, queryParams).catch(error => {
	      im_v2_lib_notifier.Notifier.onDefaultError();
	      im_v2_lib_logger.Logger.error('Imol.InterceptDialog: request error', error);
	    });
	  }
	}

	class SkipService {
	  requestSkip(dialogId) {
	    const chatIsOpened = im_v2_application_core.Core.getStore().getters['application/isLinesChatOpen'](dialogId);
	    if (chatIsOpened) {
	      void im_public.Messenger.openLines();
	    }
	    void im_v2_application_core.Core.getStore().dispatch('openLines/recent/delete', {
	      id: dialogId
	    });
	    im_v2_lib_layout.LayoutManager.getInstance().setLastOpenedElement(im_v2_const.Layout.openlinesV2, '');
	    const queryParams = {
	      data: {
	        dialogId
	      }
	    };
	    return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionSkip, queryParams).catch(error => {
	      im_v2_lib_notifier.Notifier.onDefaultError();
	      im_v2_lib_logger.Logger.error('Imol.SkipDialog: request error', error);
	    });
	  }
	}

	class StartService {
	  startDialog(dialogId) {
	    const queryParams = {
	      data: {
	        dialogId
	      }
	    };
	    return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionStart, queryParams).catch(error => {
	      im_v2_lib_notifier.Notifier.onDefaultError();
	      im_v2_lib_logger.Logger.error('Imol.start: request error', error);
	    });
	  }
	}

	class TransferService {
	  chatTransfer(dialogId, transferId) {
	    void im_public.Messenger.openLines();
	    im_v2_lib_layout.LayoutManager.getInstance().setLastOpenedElement(im_v2_const.Layout.openlinesV2, '');
	    const queryParams = {
	      data: {
	        dialogId,
	        transferId
	      }
	    };
	    return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionTransfer, queryParams).catch(error => {
	      im_v2_lib_notifier.Notifier.onDefaultError();
	      im_v2_lib_logger.Logger.error('Imol.transfer: request error', error);
	    });
	  }
	}

	class JoinService {
	  joinToDialog(dialogId) {
	    const queryParams = {
	      data: {
	        dialogId
	      }
	    };
	    return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionJoin, queryParams).catch(error => {
	      im_v2_lib_notifier.Notifier.onDefaultError();
	      im_v2_lib_logger.Logger.error('Imol.join: request error', error);
	    });
	  }
	}

	class MessageService {
	  addSession(dialogId, messageId) {
	    const queryParams = {
	      data: {
	        dialogId,
	        messageId
	      }
	    };
	    return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2MessageAddSession, queryParams).catch(error => {
	      im_v2_lib_logger.Logger.error('Imol.StartMultidialog: request error', error);
	      im_v2_lib_notifier.Notifier.onDefaultError();
	    });
	  }
	}

	var _restResult = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restResult");
	class OpenLinesDataExtractor {
	  constructor(restResult) {
	    Object.defineProperty(this, _restResult, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _restResult)[_restResult] = restResult;
	  }
	  getDialogId() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _restResult)[_restResult].chat.dialogId;
	  }
	  getSession() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _restResult)[_restResult].session;
	  }
	  getConnectorData() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _restResult)[_restResult].openlines.connector;
	  }
	  getCrmData() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _restResult)[_restResult].openlines.crm;
	  }
	  getCurrentSessionData() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _restResult)[_restResult].openlines.currentSession;
	  }
	}

	class LoadServiceOl extends im_v2_provider_service_chat.LoadService {
	  getLoadRestMethodName() {
	    return imopenlines_v2_const.RestMethod.linesV2ChatLoad;
	  }
	  updateChatCustomModels(restResult) {
	    const extractor = new OpenLinesDataExtractor(restResult);
	    const store = im_v2_application_core.Core.getStore();
	    const dialogId = extractor.getDialogId();
	    const actions = [{
	      path: 'openLines/sessions/set',
	      payload: extractor.getSession() || null
	    }, {
	      path: 'openLines/connector/set',
	      payload: {
	        dialogId,
	        data: extractor.getConnectorData()
	      }
	    }, {
	      path: 'openLines/crm/set',
	      payload: {
	        dialogId,
	        data: extractor.getCrmData()
	      }
	    }, {
	      path: 'openLines/currentSession/set',
	      payload: {
	        dialogId,
	        data: extractor.getCurrentSessionData()
	      }
	    }];
	    return actions.map(({
	      path,
	      payload
	    }) => store.dispatch(path, payload));
	  }
	}

	class ChatServiceOl extends im_v2_provider_service_chat.ChatService {
	  createLoadService() {
	    return new LoadServiceOl();
	  }
	}

	class SilentModeService {
	  set(dialogId, silentMode) {
	    const data = {
	      dialogId,
	      silentMode
	    };
	    return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionSetSilentMode, {
	      data
	    }).then(() => {
	      void im_v2_application_core.Core.getStore().dispatch('openLines/currentSession/set', {
	        dialogId,
	        data: {
	          silentMode
	        }
	      });
	    }).catch(error => {
	      im_v2_lib_notifier.Notifier.onDefaultError();
	      im_v2_lib_logger.Logger.error('Imol.SilentMode.set: request error', error);
	    });
	  }
	}

	exports.RecentService = RecentService;
	exports.AnswerService = AnswerService;
	exports.FinishService = FinishService;
	exports.PinService = PinService;
	exports.InterceptService = InterceptService;
	exports.SkipService = SkipService;
	exports.StartService = StartService;
	exports.TransferService = TransferService;
	exports.JoinService = JoinService;
	exports.MessageService = MessageService;
	exports.ChatServiceOl = ChatServiceOl;
	exports.SilentModeService = SilentModeService;

}((this.BX.OpenLines.v2.Provider.Service = this.BX.OpenLines.v2.Provider.Service || {}),BX.Messenger.v2.Lib,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Messenger.v2.Application,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.OpenLines.v2.Const));
//# sourceMappingURL=service.bundle.js.map
