/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_application_core,im_v2_lib_call,im_v2_lib_phone,im_v2_lib_smileManager,im_v2_lib_user,im_v2_lib_counter,im_v2_lib_logger,im_v2_lib_messageNotifier,im_v2_lib_market,im_v2_lib_desktop,im_v2_lib_promo,im_v2_lib_permission,im_v2_lib_updateState_manager,im_v2_lib_router) {
	'use strict';

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
	var _initAvailableAIModelsList = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initAvailableAIModelsList");
	var _initPreloadedEntities = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initPreloadedEntities");
	var _initCurrentUserAdminStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initCurrentUserAdminStatus");
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
	    Object.defineProperty(this, _initCurrentUserAdminStatus, {
	      value: _initCurrentUserAdminStatus2
	    });
	    Object.defineProperty(this, _initPreloadedEntities, {
	      value: _initPreloadedEntities2
	    });
	    Object.defineProperty(this, _initAvailableAIModelsList, {
	      value: _initAvailableAIModelsList2
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
	    babelHelpers.classPrivateFieldLooseBase(this, _initAvailableAIModelsList)[_initAvailableAIModelsList]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initPreloadedEntities)[_initPreloadedEntities]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initCurrentUserAdminStatus)[_initCurrentUserAdminStatus]();
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
	function _initAvailableAIModelsList2() {
	  const {
	    copilot
	  } = im_v2_application_core.Core.getApplicationData();
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
	Object.defineProperty(InitManager, _instance, {
	  writable: true,
	  value: void 0
	});
	Object.defineProperty(InitManager, _inited, {
	  writable: true,
	  value: false
	});

	exports.InitManager = InitManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Messenger.v2.Application,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib));
//# sourceMappingURL=init.bundle.js.map
