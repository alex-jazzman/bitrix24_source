/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,ui_vue3_vuex,im_v2_lib_logger,main_core,im_public,im_v2_application_core,im_v2_const) {
	'use strict';

	var _methodHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("methodHandlers");
	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _onMessageEvent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onMessageEvent");
	var _handleGetImTextareaContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleGetImTextareaContent");
	var _handleSetImTextareaContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleSetImTextareaContent");
	var _isOriginValid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isOriginValid");
	var _isRegisteredAppOrigin = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isRegisteredAppOrigin");
	var _isContextValid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isContextValid");
	var _getChatId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatId");
	var _sendResponseToIframe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendResponseToIframe");
	var _buildResponseMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildResponseMessage");
	class IframeCommunicationManager {
	  static init() {
	    return new IframeCommunicationManager();
	  }
	  constructor() {
	    Object.defineProperty(this, _buildResponseMessage, {
	      value: _buildResponseMessage2
	    });
	    Object.defineProperty(this, _sendResponseToIframe, {
	      value: _sendResponseToIframe2
	    });
	    Object.defineProperty(this, _getChatId, {
	      value: _getChatId2
	    });
	    Object.defineProperty(this, _isContextValid, {
	      value: _isContextValid2
	    });
	    Object.defineProperty(this, _isRegisteredAppOrigin, {
	      value: _isRegisteredAppOrigin2
	    });
	    Object.defineProperty(this, _isOriginValid, {
	      value: _isOriginValid2
	    });
	    Object.defineProperty(this, _handleSetImTextareaContent, {
	      value: _handleSetImTextareaContent2
	    });
	    Object.defineProperty(this, _handleGetImTextareaContent, {
	      value: _handleGetImTextareaContent2
	    });
	    Object.defineProperty(this, _onMessageEvent, {
	      value: _onMessageEvent2
	    });
	    Object.defineProperty(this, _methodHandlers, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = im_v2_application_core.Core.getStore();
	    babelHelpers.classPrivateFieldLooseBase(this, _methodHandlers)[_methodHandlers] = {
	      'im:getImTextareaContent': babelHelpers.classPrivateFieldLooseBase(this, _handleGetImTextareaContent)[_handleGetImTextareaContent].bind(this),
	      'im:setImTextareaContent': babelHelpers.classPrivateFieldLooseBase(this, _handleSetImTextareaContent)[_handleSetImTextareaContent].bind(this)
	    };
	    main_core.Event.bind(window, 'message', babelHelpers.classPrivateFieldLooseBase(this, _onMessageEvent)[_onMessageEvent].bind(this));
	  }
	}
	function _onMessageEvent2(messageEvent) {
	  const {
	    origin,
	    data: rawIframeContext
	  } = messageEvent;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isOriginValid)[_isOriginValid](origin) || !babelHelpers.classPrivateFieldLooseBase(this, _isContextValid)[_isContextValid](rawIframeContext)) {
	    return;
	  }
	  const {
	    method,
	    requestId,
	    callback,
	    params
	  } = rawIframeContext;
	  const context = {
	    requestId,
	    callback,
	    messageEvent
	  };
	  const handler = babelHelpers.classPrivateFieldLooseBase(this, _methodHandlers)[_methodHandlers][method];
	  if (handler) {
	    handler(context, params);
	  }
	}
	async function _handleGetImTextareaContent2(context) {
	  try {
	    const chatId = babelHelpers.classPrivateFieldLooseBase(this, _getChatId)[_getChatId]();
	    const text = await im_public.Messenger.textarea.getText(chatId);
	    babelHelpers.classPrivateFieldLooseBase(this, _sendResponseToIframe)[_sendResponseToIframe](context, {
	      result: {
	        text
	      }
	    });
	  } catch (error) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendResponseToIframe)[_sendResponseToIframe](context, {
	      error: {
	        message: error.message
	      }
	    });
	  }
	}
	function _handleSetImTextareaContent2(context, params) {
	  try {
	    const {
	      text = '',
	      withNewLine = false,
	      replace = false
	    } = params;
	    const chatId = babelHelpers.classPrivateFieldLooseBase(this, _getChatId)[_getChatId]();
	    im_public.Messenger.textarea.insertText(chatId, text, {
	      withNewLine,
	      replace
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _sendResponseToIframe)[_sendResponseToIframe](context, {
	      result: {
	        success: true
	      }
	    });
	  } catch (error) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendResponseToIframe)[_sendResponseToIframe](context, {
	      error: {
	        message: error.message
	      }
	    });
	  }
	}
	function _isOriginValid2(origin) {
	  if (origin === window.location.origin) {
	    return true;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _isRegisteredAppOrigin)[_isRegisteredAppOrigin](origin);
	}
	function _isRegisteredAppOrigin2(origin) {
	  return Object.values(BX.rest.layoutList).some(layout => {
	    const {
	      appProto,
	      appHost,
	      appPort
	    } = layout.params;
	    const appOrigin = `${appProto}://${appHost}`;
	    const originWithPort = `${origin}:${appPort}`;
	    return origin === appOrigin || originWithPort === appOrigin;
	  });
	}
	function _isContextValid2(rawContext) {
	  if (!main_core.Type.isObject(rawContext)) {
	    return false;
	  }
	  const {
	    requestId,
	    params,
	    method
	  } = rawContext;
	  const isRequestIdValid = main_core.Type.isStringFilled(requestId);
	  const isParamsValid = main_core.Type.isObject(params) || main_core.Type.isString(params);
	  const isMethodValid = (method in babelHelpers.classPrivateFieldLooseBase(this, _methodHandlers)[_methodHandlers]);
	  return isRequestIdValid && isParamsValid && isMethodValid;
	}
	function _getChatId2() {
	  const dialogId = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['application/getLayout'].entityId;
	  const dialog = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['chats/get'](dialogId, true);
	  return dialog.chatId;
	}
	function _sendResponseToIframe2(context, data) {
	  const {
	    messageEvent,
	    requestId,
	    callback
	  } = context;
	  if (!messageEvent.source || !callback) {
	    return;
	  }
	  const message = babelHelpers.classPrivateFieldLooseBase(this, _buildResponseMessage)[_buildResponseMessage](callback, requestId, data);
	  messageEvent.source.postMessage(message, messageEvent.origin);
	}
	function _buildResponseMessage2(callback, requestId, data) {
	  var _ref, _data$result;
	  const payload = (_ref = (_data$result = data.result) != null ? _data$result : data.error) != null ? _ref : {};
	  return `${callback}:${JSON.stringify({
    requestId,
    ...payload
  })}`;
	}

	var _loadLink = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadLink");
	var _getPlacementOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPlacementOptions");
	class MarketService {
	  constructor() {
	    Object.defineProperty(this, _getPlacementOptions, {
	      value: _getPlacementOptions2
	    });
	    Object.defineProperty(this, _loadLink, {
	      writable: true,
	      value: ''
	    });
	  }
	  openPlacement(item, context) {
	    return new Promise((resolve, reject) => {
	      const formData = new FormData();
	      Object.entries(item.loadConfiguration).forEach(([key, value]) => {
	        formData.append(`PARAMS[params][${key}]`, value);
	      });
	      Object.entries(babelHelpers.classPrivateFieldLooseBase(this, _getPlacementOptions)[_getPlacementOptions](context)).forEach(([key, value]) => {
	        formData.append(`PARAMS[params][PLACEMENT_OPTIONS][${key}]`, value);
	      });
	      const requestPrams = {
	        method: 'POST',
	        body: formData
	      };
	      fetch(babelHelpers.classPrivateFieldLooseBase(this, _loadLink)[_loadLink], requestPrams).then(response => response.text()).then(textResponse => resolve(textResponse)).catch(error => reject(error));
	    });
	  }
	  setLoadLink(link) {
	    babelHelpers.classPrivateFieldLooseBase(this, _loadLink)[_loadLink] = link;
	  }
	}
	function _getPlacementOptions2(context) {
	  const placementOptions = {};
	  if (context.dialogId) {
	    placementOptions.dialogId = context.dialogId;
	  }
	  if (context.messageId) {
	    placementOptions.messageId = context.messageId;
	  }
	  return placementOptions;
	}

	const MarketTypes = Object.freeze({
	  user: 'user',
	  chat: 'chat',
	  lines: 'lines',
	  crm: 'crm',
	  all: 'all'
	});
	var _canShowPlacementInChat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canShowPlacementInChat");
	var _matchDialogType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("matchDialogType");
	var _isUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isUser");
	var _isChat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isChat");
	var _isLines = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isLines");
	var _isCrm = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCrm");
	class AvailabilityManager {
	  constructor() {
	    Object.defineProperty(this, _isCrm, {
	      value: _isCrm2
	    });
	    Object.defineProperty(this, _isLines, {
	      value: _isLines2
	    });
	    Object.defineProperty(this, _isChat, {
	      value: _isChat2
	    });
	    Object.defineProperty(this, _isUser, {
	      value: _isUser2
	    });
	    Object.defineProperty(this, _matchDialogType, {
	      value: _matchDialogType2
	    });
	    Object.defineProperty(this, _canShowPlacementInChat, {
	      value: _canShowPlacementInChat2
	    });
	  }
	  getAvailablePlacements(placements, dialogType = '') {
	    return placements.filter(placement => babelHelpers.classPrivateFieldLooseBase(this, _canShowPlacementInChat)[_canShowPlacementInChat](placement, dialogType));
	  }
	}
	function _canShowPlacementInChat2(placement, dialogType) {
	  if (!placement.options.context || !dialogType) {
	    return true;
	  }
	  return placement.options.context.some(marketType => babelHelpers.classPrivateFieldLooseBase(this, _matchDialogType)[_matchDialogType](marketType, dialogType));
	}
	function _matchDialogType2(marketType, dialogType) {
	  switch (marketType) {
	    case MarketTypes.user:
	      return babelHelpers.classPrivateFieldLooseBase(this, _isUser)[_isUser](dialogType);
	    case MarketTypes.chat:
	      return babelHelpers.classPrivateFieldLooseBase(this, _isChat)[_isChat](dialogType);
	    case MarketTypes.lines:
	      return babelHelpers.classPrivateFieldLooseBase(this, _isLines)[_isLines](dialogType);
	    case MarketTypes.crm:
	      return babelHelpers.classPrivateFieldLooseBase(this, _isCrm)[_isCrm](dialogType);
	    case MarketTypes.all:
	      return true;
	    default:
	      return false;
	  }
	}
	function _isUser2(dialogType) {
	  return dialogType === im_v2_const.ChatType.user;
	}
	function _isChat2(dialogType) {
	  return dialogType !== im_v2_const.ChatType.lines && dialogType !== im_v2_const.ChatType.crm && dialogType !== im_v2_const.ChatType.user;
	}
	function _isLines2(dialogType) {
	  return dialogType === im_v2_const.ChatType.lines;
	}
	function _isCrm2(dialogType) {
	  return dialogType === im_v2_const.ChatType.crm;
	}

	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	var _store$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _marketService = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("marketService");
	var _availabilityManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("availabilityManager");
	var _init = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("init");
	class MarketManager {
	  static getInstance() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance] = new this();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance];
	  }
	  static init() {
	    MarketManager.getInstance();
	  }
	  constructor() {
	    Object.defineProperty(this, _init, {
	      value: _init2
	    });
	    Object.defineProperty(this, _store$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _marketService, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _availabilityManager, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1] = im_v2_application_core.Core.getStore();
	    babelHelpers.classPrivateFieldLooseBase(this, _marketService)[_marketService] = new MarketService();
	    babelHelpers.classPrivateFieldLooseBase(this, _availabilityManager)[_availabilityManager] = new AvailabilityManager();
	    const {
	      marketApps: _marketApps
	    } = im_v2_application_core.Core.getApplicationData();
	    im_v2_lib_logger.Logger.warn('MarketManager: marketApps', _marketApps);
	    babelHelpers.classPrivateFieldLooseBase(this, _init)[_init](_marketApps);
	  }
	  getAvailablePlacementsByType(placementType, dialogId = '') {
	    const placements = babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].getters['market/getByPlacement'](placementType);
	    const dialog = babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].getters['chats/get'](dialogId);
	    const dialogType = dialog ? dialog.type : '';
	    return babelHelpers.classPrivateFieldLooseBase(this, _availabilityManager)[_availabilityManager].getAvailablePlacements(placements, dialogType);
	  }
	  loadPlacement(id, context = {}) {
	    const placement = babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].getters['market/getById'](Number.parseInt(id, 10));
	    return babelHelpers.classPrivateFieldLooseBase(this, _marketService)[_marketService].openPlacement(placement, context);
	  }
	  unloadPlacement(placementId) {
	    const appLayoutNew = Object.values(BX.rest.layoutList).filter(layout => {
	      return layout.params.placementId === placementId;
	    });
	    if (appLayoutNew.length > 0) {
	      appLayoutNew.forEach(layout => {
	        layout.destroy();
	      });
	    }
	  }
	  static async openSlider(placement, context) {
	    await main_core.Runtime.loadExtension('applayout');
	    BX.rest.AppLayout.openApplication(placement.loadConfiguration.ID, context, placement.loadConfiguration);
	  }
	  static openChatMarket() {
	    const placementCode = 'IM_CHAT';
	    BX.SidePanel.Instance.open(`/market/?placement=${placementCode}`);
	  }
	}
	function _init2(marketApps) {
	  if (!marketApps) {
	    return;
	  }
	  void babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].dispatch('market/set', marketApps);
	  babelHelpers.classPrivateFieldLooseBase(this, _marketService)[_marketService].setLoadLink(marketApps.links.load);
	  IframeCommunicationManager.init();
	}
	Object.defineProperty(MarketManager, _instance, {
	  writable: true,
	  value: void 0
	});

	exports.MarketManager = MarketManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Vue3.Vuex,BX.Messenger.v2.Lib,BX,BX.Messenger.v2.Lib,BX.Messenger.v2.Application,BX.Messenger.v2.Const));
//# sourceMappingURL=market.bundle.js.map
