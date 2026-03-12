/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core,ui_vue3,ui_vue3_vuex,pull_client,rest_client,im_v2_application_launch,im_v2_model,im_v2_provider_pull,imopenlines_v2_lib_launchResources) {
	'use strict';

	var _initPromise = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initPromise");
	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _restClient = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restClient");
	var _pullClient = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pullClient");
	var _host = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("host");
	var _userId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("userId");
	var _siteId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("siteId");
	var _languageId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("languageId");
	var _offline = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("offline");
	var _applicationData = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("applicationData");
	var _init = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("init");
	var _prepareVariables = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareVariables");
	var _initRestClient = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initRestClient");
	var _initStorage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initStorage");
	var _initPull = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initPull");
	var _onPullStatusChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onPullStatusChange");
	class CoreApplication {
	  constructor() {
	    Object.defineProperty(this, _onPullStatusChange, {
	      value: _onPullStatusChange2
	    });
	    Object.defineProperty(this, _initPull, {
	      value: _initPull2
	    });
	    Object.defineProperty(this, _initStorage, {
	      value: _initStorage2
	    });
	    Object.defineProperty(this, _initRestClient, {
	      value: _initRestClient2
	    });
	    Object.defineProperty(this, _prepareVariables, {
	      value: _prepareVariables2
	    });
	    Object.defineProperty(this, _init, {
	      value: _init2
	    });
	    Object.defineProperty(this, _initPromise, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _restClient, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _pullClient, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _host, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _userId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _siteId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _languageId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _offline, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _applicationData, {
	      writable: true,
	      value: {}
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _prepareVariables)[_prepareVariables]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initRestClient)[_initRestClient]();
	  }
	  ready() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _initPromise)[_initPromise]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _initPromise)[_initPromise] = babelHelpers.classPrivateFieldLooseBase(this, _init)[_init]();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _initPromise)[_initPromise];
	  }
	  createVue(application, config = {}) {
	    const initConfig = {};
	    if (config.el) {
	      initConfig.el = config.el;
	    }
	    if (config.template) {
	      initConfig.template = config.template;
	    }
	    if (config.name) {
	      initConfig.name = config.name;
	    }
	    if (config.components) {
	      initConfig.components = config.components;
	    }
	    if (config.data) {
	      initConfig.data = config.data;
	    }
	    return new Promise(resolve => {
	      initConfig.created = function () {
	        if (main_core.Type.isFunction(config.created)) {
	          config.created.call(this);
	        }
	        resolve(this);
	      };
	      const bitrixVue = ui_vue3.BitrixVue.createApp(initConfig);
	      bitrixVue.config.errorHandler = function (err, vm, info) {
	        // eslint-disable-next-line no-console
	        console.error(err, vm, info);
	        if (main_core.Type.isFunction(config.onError)) {
	          config.onError(err);
	        }
	      };
	      bitrixVue.config.warnHandler = function (warn, vm, trace) {
	        // eslint-disable-next-line no-console
	        console.warn(warn, vm, trace);
	      };

	      // todo: remove after updating Vue to 3.3+
	      bitrixVue.config.unwrapInjectedRef = true;

	      // eslint-disable-next-line no-param-reassign
	      application.bitrixVue = bitrixVue;
	      bitrixVue.use(babelHelpers.classPrivateFieldLooseBase(this, _store)[_store]).mount(initConfig.el);
	    });
	  }
	  getHost() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _host)[_host];
	  }
	  getUserId() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _userId)[_userId];
	  }
	  getSiteId() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _siteId)[_siteId];
	  }
	  getLanguageId() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _languageId)[_languageId];
	  }
	  getStore() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _store)[_store];
	  }
	  getRestClient() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _restClient)[_restClient];
	  }
	  getPullClient() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient];
	  }
	  setApplicationData(data) {
	    babelHelpers.classPrivateFieldLooseBase(this, _applicationData)[_applicationData] = {
	      ...babelHelpers.classPrivateFieldLooseBase(this, _applicationData)[_applicationData],
	      ...data
	    };
	  }
	  getApplicationData() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _applicationData)[_applicationData];
	  }
	  isOnline() {
	    return !babelHelpers.classPrivateFieldLooseBase(this, _offline)[_offline];
	  }
	  isCloud() {
	    const settings = main_core.Extension.getSettings('im.v2.application.core');
	    return settings.get('isCloud');
	  }
	}
	async function _init2() {
	  try {
	    await babelHelpers.classPrivateFieldLooseBase(this, _initStorage)[_initStorage]();
	    await babelHelpers.classPrivateFieldLooseBase(this, _initPull)[_initPull]();
	    return this;
	  } catch (error) {
	    console.error('Core: error starting core application', error);
	    throw error;
	  }
	}
	function _prepareVariables2() {
	  var _Number$parseInt, _Loc$getMessage, _Loc$getMessage2;
	  babelHelpers.classPrivateFieldLooseBase(this, _host)[_host] = location.origin;
	  babelHelpers.classPrivateFieldLooseBase(this, _userId)[_userId] = (_Number$parseInt = Number.parseInt(main_core.Loc.getMessage('USER_ID'), 10)) != null ? _Number$parseInt : 0;
	  babelHelpers.classPrivateFieldLooseBase(this, _siteId)[_siteId] = (_Loc$getMessage = main_core.Loc.getMessage('SITE_ID')) != null ? _Loc$getMessage : 's1';
	  babelHelpers.classPrivateFieldLooseBase(this, _languageId)[_languageId] = (_Loc$getMessage2 = main_core.Loc.getMessage('LANGUAGE_ID')) != null ? _Loc$getMessage2 : 'en';
	}
	function _initRestClient2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _restClient)[_restClient] = BX.rest;
	}
	async function _initStorage2() {
	  const builder = ui_vue3_vuex.Builder.init().addModel(im_v2_model.ApplicationModel.create()).addModel(im_v2_model.MessagesModel.create()).addModel(im_v2_model.ChatsModel.create()).addModel(im_v2_model.FilesModel.create()).addModel(im_v2_model.UsersModel.create()).addModel(im_v2_model.RecentModel.create()).addModel(im_v2_model.CountersModel.create()).addModel(im_v2_model.NotificationsModel.create()).addModel(im_v2_model.SidebarModel.create()).addModel(im_v2_model.MarketModel.create()).addModel(im_v2_model.CopilotModel.create()).addModel(im_v2_model.StickersModel.create()).addModel(im_v2_model.AiAssistantModel.create());
	  if (imopenlines_v2_lib_launchResources.OpenLinesLaunchResources) {
	    imopenlines_v2_lib_launchResources.OpenLinesLaunchResources.models.forEach(model => {
	      builder.addModel(model.create());
	    });
	  }
	  const buildResult = await builder.build();
	  babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = buildResult.store;
	}
	function _initPull2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient] = BX.PULL;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient]) {
	    return Promise.reject(new Error('Core: error setting pull client'));
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe(new im_v2_provider_pull.BasePullHandler());
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe(new im_v2_provider_pull.RecentPullHandler());
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe(new im_v2_provider_pull.RecentUnreadPullHandler());
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe(new im_v2_provider_pull.NotificationPullHandler());
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe(new im_v2_provider_pull.NotifierPullHandler());
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe(new im_v2_provider_pull.OnlinePullHandler());
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe(new im_v2_provider_pull.CounterPullHandler());
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe(new im_v2_provider_pull.AnchorPullHandler());
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe(new im_v2_provider_pull.SidebarPullHandler());
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe(new im_v2_provider_pull.StickersPullHandler());
	  if (imopenlines_v2_lib_launchResources.OpenLinesLaunchResources) {
	    imopenlines_v2_lib_launchResources.OpenLinesLaunchResources.pullHandlers.forEach(Handler => {
	      babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe(new Handler());
	    });
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _pullClient)[_pullClient].subscribe({
	    type: BX.PullClient.SubscriptionType.Status,
	    callback: babelHelpers.classPrivateFieldLooseBase(this, _onPullStatusChange)[_onPullStatusChange].bind(this)
	  });
	  return Promise.resolve();
	}
	function _onPullStatusChange2(data) {
	  if (data.status === BX.PullClient.PullStatus.Online) {
	    babelHelpers.classPrivateFieldLooseBase(this, _offline)[_offline] = false;
	  } else if (data.status === BX.PullClient.PullStatus.Offline) {
	    babelHelpers.classPrivateFieldLooseBase(this, _offline)[_offline] = true;
	  }
	}
	const Core = new CoreApplication();

	exports.Core = Core;
	exports.CoreApplication = CoreApplication;

}((this.BX.Messenger.v2.Application = this.BX.Messenger.v2.Application || {}),BX??{},BX?.Vue3??{},BX?.Vue3?.Vuex??{},BX??{},BX??{},BX?.Messenger?.v2?.Application??{},BX?.Messenger?.v2?.Model??{},BX?.Messenger?.v2?.Provider?.Pull??{},BX?.OpenLines?.v2?.Lib??{}));
//# sourceMappingURL=core.bundle.js.map
