/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_sidepanel,im_v2_application_core,im_v2_lib_call,im_v2_lib_phone,im_v2_lib_smileManager,im_v2_lib_user,im_v2_lib_counter,im_v2_lib_logger,im_v2_lib_messageNotifier,im_v2_lib_market,im_v2_lib_desktop,im_v2_lib_promo,im_v2_lib_permission,im_v2_lib_updateState_manager,im_v2_lib_router,im_public,im_v2_const) {
	'use strict';

	const BindingsCondition = {
	  openLinesHistory: new RegExp(`\\?${im_v2_const.GetParameter.openHistory}=([^&]+)`, 'i'),
	  openLines: new RegExp(`\\?${im_v2_const.GetParameter.openLines}=([^&]+)`, 'i'),
	  openCopilotChat: new RegExp(`\\?${im_v2_const.GetParameter.openCopilotChat}=([^&]+)`, 'i'),
	  openChannel: new RegExp(`\\?${im_v2_const.GetParameter.openChannel}=([^&]+)`, 'i'),
	  openCollab: new RegExp(`\\?${im_v2_const.GetParameter.openCollab}=([^&]+)`, 'i'),
	  openSharedLink: new RegExp(`\\?${im_v2_const.GetParameter.openSharedLink}=([^&]+)`, 'i'),
	  openTaskComments: new RegExp(`\\?${im_v2_const.GetParameter.openTaskComments}=([^&]+)(&${im_v2_const.GetParameter.openMessage}=([^&]+))?`, 'i'),
	  openBotContext: new RegExp(`\\?${im_v2_const.GetParameter.openChat}=([^&]+)(&${im_v2_const.GetParameter.botContext}=([^&]+))`, 'i'),
	  openChat: new RegExp(`\\?${im_v2_const.GetParameter.openChat}=([^&]+)(&${im_v2_const.GetParameter.openMessage}=([^&]+))?`, 'i'),
	  openOriginRoot: new RegExp(`${location.origin}/online/$`),
	  openRoot: /^\/online\/$/,
	  openExtranetRoot: /^\/extranet\/online\/$/,
	  openCollabLayout: new RegExp(`/online/\\?${im_v2_const.GetParameter.openCollab}(?=&|$)`, 'i'),
	  openCopilotChatLayout: new RegExp(`/online/\\?${im_v2_const.GetParameter.openCopilotChat}(?=&|$)`, 'i'),
	  openChannelLayout: new RegExp(`/online/\\?${im_v2_const.GetParameter.openChannel}(?=&|$)`, 'i')
	};

	var _conditionHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("conditionHandler");
	var _findMatchingCondition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("findMatchingCondition");
	var _openNavigationItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openNavigationItem");
	var _openLinesHistory = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openLinesHistory");
	var _openLines = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openLines");
	var _openCopilot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openCopilot");
	var _openChannel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openChannel");
	var _openCollab = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openCollab");
	var _openTaskComments = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openTaskComments");
	var _openChat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openChat");
	var _openChatWithBotContext = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openChatWithBotContext");
	var _openSharedLink = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openSharedLink");
	class BindingsManager {
	  constructor() {
	    Object.defineProperty(this, _openSharedLink, {
	      value: _openSharedLink2
	    });
	    Object.defineProperty(this, _openChatWithBotContext, {
	      value: _openChatWithBotContext2
	    });
	    Object.defineProperty(this, _openChat, {
	      value: _openChat2
	    });
	    Object.defineProperty(this, _openTaskComments, {
	      value: _openTaskComments2
	    });
	    Object.defineProperty(this, _openCollab, {
	      value: _openCollab2
	    });
	    Object.defineProperty(this, _openChannel, {
	      value: _openChannel2
	    });
	    Object.defineProperty(this, _openCopilot, {
	      value: _openCopilot2
	    });
	    Object.defineProperty(this, _openLines, {
	      value: _openLines2
	    });
	    Object.defineProperty(this, _openLinesHistory, {
	      value: _openLinesHistory2
	    });
	    Object.defineProperty(this, _openNavigationItem, {
	      value: _openNavigationItem2
	    });
	    Object.defineProperty(this, _findMatchingCondition, {
	      value: _findMatchingCondition2
	    });
	    Object.defineProperty(this, _conditionHandler, {
	      writable: true,
	      value: {
	        [BindingsCondition.openCopilotChat]: params => babelHelpers.classPrivateFieldLooseBase(this, _openCopilot)[_openCopilot](params),
	        [BindingsCondition.openChannel]: params => babelHelpers.classPrivateFieldLooseBase(this, _openChannel)[_openChannel](params),
	        [BindingsCondition.openLinesHistory]: params => babelHelpers.classPrivateFieldLooseBase(this, _openLinesHistory)[_openLinesHistory](params),
	        [BindingsCondition.openLines]: params => babelHelpers.classPrivateFieldLooseBase(this, _openLines)[_openLines](params),
	        [BindingsCondition.openCollab]: params => babelHelpers.classPrivateFieldLooseBase(this, _openCollab)[_openCollab](params),
	        [BindingsCondition.openTaskComments]: params => babelHelpers.classPrivateFieldLooseBase(this, _openTaskComments)[_openTaskComments](params),
	        [BindingsCondition.openBotContext]: params => babelHelpers.classPrivateFieldLooseBase(this, _openChatWithBotContext)[_openChatWithBotContext](params),
	        [BindingsCondition.openChat]: params => babelHelpers.classPrivateFieldLooseBase(this, _openChat)[_openChat](params),
	        [BindingsCondition.openSharedLink]: params => babelHelpers.classPrivateFieldLooseBase(this, _openSharedLink)[_openSharedLink](params),
	        [BindingsCondition.openOriginRoot]: () => babelHelpers.classPrivateFieldLooseBase(this, _openNavigationItem)[_openNavigationItem]({
	          id: im_v2_const.ChatType.chat
	        }),
	        [BindingsCondition.openRoot]: () => babelHelpers.classPrivateFieldLooseBase(this, _openNavigationItem)[_openNavigationItem]({
	          id: im_v2_const.ChatType.chat
	        }),
	        [BindingsCondition.openExtranetRoot]: () => babelHelpers.classPrivateFieldLooseBase(this, _openNavigationItem)[_openNavigationItem]({
	          id: im_v2_const.ChatType.chat
	        }),
	        [BindingsCondition.openChannelLayout]: () => babelHelpers.classPrivateFieldLooseBase(this, _openNavigationItem)[_openNavigationItem]({
	          id: im_v2_const.ChatType.channel
	        }),
	        [BindingsCondition.openCollabLayout]: () => babelHelpers.classPrivateFieldLooseBase(this, _openNavigationItem)[_openNavigationItem]({
	          id: im_v2_const.ChatType.collab
	        }),
	        [BindingsCondition.openCopilotChatLayout]: () => babelHelpers.classPrivateFieldLooseBase(this, _openNavigationItem)[_openNavigationItem]({
	          id: im_v2_const.ChatType.copilot
	        })
	      }
	    });
	  }
	  routeLink(url) {
	    const condition = babelHelpers.classPrivateFieldLooseBase(this, _findMatchingCondition)[_findMatchingCondition](url);
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _conditionHandler)[_conditionHandler][condition]) {
	      return;
	    }
	    const currentUrl = new URL(url, location.origin);
	    const searchParams = currentUrl.searchParams;
	    babelHelpers.classPrivateFieldLooseBase(this, _conditionHandler)[_conditionHandler][condition](searchParams);
	  }
	}
	function _findMatchingCondition2(url) {
	  for (const regex of Object.values(BindingsCondition)) {
	    const isMatch = regex.exec(url);
	    if (isMatch) {
	      return regex;
	    }
	  }
	  return null;
	}
	function _openNavigationItem2({
	  id,
	  asLink = true
	}) {
	  void im_public.Messenger.openNavigationItem({
	    id,
	    asLink
	  });
	}
	function _openLinesHistory2(params) {
	  const dialogId = params.get(im_v2_const.GetParameter.openHistory);
	  void im_public.Messenger.openLinesHistory(dialogId);
	}
	function _openLines2(params) {
	  const dialogId = params.get(im_v2_const.GetParameter.openLines);
	  void im_public.Messenger.openLines(dialogId);
	}
	function _openCopilot2(params) {
	  const dialogId = params.get(im_v2_const.GetParameter.openCopilotChat);
	  void im_public.Messenger.openCopilot(dialogId);
	}
	function _openChannel2(params) {
	  const dialogId = params.get(im_v2_const.GetParameter.openChannel);
	  void im_public.Messenger.openChannel(dialogId);
	}
	function _openCollab2(params) {
	  const dialogId = params.get(im_v2_const.GetParameter.openCollab);
	  void im_public.Messenger.openCollab(dialogId);
	}
	function _openTaskComments2(params) {
	  const dialogId = params.get(im_v2_const.GetParameter.openTaskComments);
	  const messageId = Number(params.get(im_v2_const.GetParameter.openMessage)) || 0;
	  void im_public.Messenger.openTaskComments(dialogId, messageId);
	}
	function _openChat2(params) {
	  const dialogId = params.get(im_v2_const.GetParameter.openChat);
	  const messageId = Number(params.get(im_v2_const.GetParameter.openMessage)) || 0;
	  void im_public.Messenger.openChat(dialogId, messageId);
	}
	function _openChatWithBotContext2(params) {
	  const dialogId = params.get(im_v2_const.GetParameter.openChat);
	  const botContext = params.get(im_v2_const.GetParameter.botContext);
	  let decodedContext = {};
	  try {
	    decodedContext = JSON.parse(decodeURIComponent(botContext));
	  } catch (error) {
	    console.error('Im bindings: incorrect bot context', error);
	  }
	  void im_public.Messenger.openChatWithBotContext(dialogId, decodedContext);
	}
	function _openSharedLink2(params) {
	  const code = params.get(im_v2_const.GetParameter.openSharedLink);
	  void im_public.Messenger.joinChatByCode(code);
	}

	const PreloadedEntity = {
	  users: 'users'
	};

	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	var _inited = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inited");
	var _initLogger = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initLogger");
	var _initSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initSettings");
	var _initTariffRestrictions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initTariffRestrictions");
	var _initCallManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initCallManager");
	var _initAnchors = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initAnchors");
	var _initCopilot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initCopilot");
	var _initPreloadedEntities = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initPreloadedEntities");
	var _initCurrentUserAdminStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initCurrentUserAdminStatus");
	var _initBindings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initBindings");
	class InitManager {
	  static getInstance() {
	    var _babelHelpers$classPr;
	    babelHelpers.classPrivateFieldLooseBase(InitManager, _instance)[_instance] = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(InitManager, _instance)[_instance]) != null ? _babelHelpers$classPr : new InitManager();
	    return babelHelpers.classPrivateFieldLooseBase(InitManager, _instance)[_instance];
	  }
	  static init() {
	    InitManager.getInstance();
	  }
	  constructor() {
	    Object.defineProperty(this, _initBindings, {
	      value: _initBindings2
	    });
	    Object.defineProperty(this, _initCurrentUserAdminStatus, {
	      value: _initCurrentUserAdminStatus2
	    });
	    Object.defineProperty(this, _initPreloadedEntities, {
	      value: _initPreloadedEntities2
	    });
	    Object.defineProperty(this, _initCopilot, {
	      value: _initCopilot2
	    });
	    Object.defineProperty(this, _initAnchors, {
	      value: _initAnchors2
	    });
	    Object.defineProperty(this, _initCallManager, {
	      value: _initCallManager2
	    });
	    Object.defineProperty(this, _initTariffRestrictions, {
	      value: _initTariffRestrictions2
	    });
	    Object.defineProperty(this, _initSettings, {
	      value: _initSettings2
	    });
	    Object.defineProperty(this, _initLogger, {
	      value: _initLogger2
	    });
	    if (babelHelpers.classPrivateFieldLooseBase(InitManager, _inited)[_inited]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _initLogger)[_initLogger]();
	    im_v2_lib_logger.Logger.warn('InitManager: start');
	    babelHelpers.classPrivateFieldLooseBase(this, _initSettings)[_initSettings]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initTariffRestrictions)[_initTariffRestrictions]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initAnchors)[_initAnchors]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initCallManager)[_initCallManager]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initCopilot)[_initCopilot]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initPreloadedEntities)[_initPreloadedEntities]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initCurrentUserAdminStatus)[_initCurrentUserAdminStatus]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initBindings)[_initBindings]();
	    im_v2_lib_counter.CounterManager.init();
	    im_v2_lib_permission.PermissionManager.init();
	    im_v2_lib_promo.PromoManager.init();
	    im_v2_lib_market.MarketManager.init();
	    im_v2_lib_phone.PhoneManager.init();
	    im_v2_lib_smileManager.SmileManager.init();
	    im_v2_lib_messageNotifier.MessageNotifierManager.init();
	    im_v2_lib_desktop.DesktopManager.init();
	    im_v2_lib_updateState_manager.UpdateStateManager.init();
	    im_v2_lib_router.Router.handleGetParams();
	    babelHelpers.classPrivateFieldLooseBase(InitManager, _inited)[_inited] = true;
	  }
	}
	function _initLogger2() {
	  const {
	    loggerConfig
	  } = im_v2_application_core.Core.getApplicationData();
	  if (!loggerConfig) {
	    return;
	  }
	  im_v2_lib_logger.Logger.setConfig(loggerConfig);
	}
	function _initSettings2() {
	  const {
	    settings
	  } = im_v2_application_core.Core.getApplicationData();
	  if (!settings) {
	    return;
	  }
	  im_v2_lib_logger.Logger.warn('InitManager: settings', settings);
	  void im_v2_application_core.Core.getStore().dispatch('application/settings/set', settings);
	}
	function _initTariffRestrictions2() {
	  const {
	    tariffRestrictions
	  } = im_v2_application_core.Core.getApplicationData();
	  if (!tariffRestrictions) {
	    return;
	  }
	  im_v2_lib_logger.Logger.warn('InitManager: tariffRestrictions', tariffRestrictions);
	  void im_v2_application_core.Core.getStore().dispatch('application/tariffRestrictions/set', tariffRestrictions);
	}
	function _initCallManager2() {
	  const {
	    activeCalls
	  } = im_v2_application_core.Core.getApplicationData();
	  im_v2_lib_call.CallManager.getInstance().updateRecentCallsList(activeCalls);
	}
	function _initAnchors2() {
	  const {
	    anchors
	  } = im_v2_application_core.Core.getApplicationData();
	  if (!anchors) {
	    return;
	  }
	  void im_v2_application_core.Core.getStore().dispatch('messages/anchors/setAnchors', {
	    anchors
	  });
	}
	function _initCopilot2() {
	  const {
	    copilot
	  } = im_v2_application_core.Core.getApplicationData();
	  void im_v2_application_core.Core.getStore().dispatch('copilot/setName', copilot.botName);
	  if (!copilot.availableEngines) {
	    return;
	  }
	  void im_v2_application_core.Core.getStore().dispatch('copilot/setAvailableAIModels', copilot.availableEngines);
	}
	function _initPreloadedEntities2() {
	  const {
	    preloadedEntities
	  } = im_v2_application_core.Core.getApplicationData();
	  if (!preloadedEntities) {
	    return;
	  }
	  const preloadedEntitiesHandler = {
	    [PreloadedEntity.users]: users => new im_v2_lib_user.UserManager().setUsersToModel(users)
	  };
	  Object.entries(preloadedEntities).forEach(([entityType, items]) => {
	    if (preloadedEntitiesHandler[entityType]) {
	      preloadedEntitiesHandler[entityType](items);
	    }
	  });
	}
	function _initCurrentUserAdminStatus2() {
	  const {
	    isCurrentUserAdmin
	  } = im_v2_application_core.Core.getApplicationData();
	  void im_v2_application_core.Core.getStore().dispatch('users/setCurrentUserAdminStatus', isCurrentUserAdmin);
	}
	function _initBindings2() {
	  main_sidepanel.SidePanel.Instance.bindAnchors({
	    rules: [{
	      condition: Object.values(BindingsCondition),
	      handler(event, link) {
	        new BindingsManager().routeLink(link.url);
	        event.preventDefault();
	      }
	    }]
	  });
	}
	Object.defineProperty(InitManager, _instance, {
	  writable: true,
	  value: void 0
	});
	Object.defineProperty(InitManager, _inited, {
	  writable: true,
	  value: false
	});

	exports.InitManager = InitManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.SidePanel,BX.Messenger.v2.Application,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Const));
//# sourceMappingURL=init.bundle.js.map
