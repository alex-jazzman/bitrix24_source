/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core,ui_vue3_vuex,booking_model_bookings,booking_model_messageStatus,booking_model_clients,booking_model_counters,booking_model_interface,booking_model_resourceTypes,booking_model_resources,booking_model_favorites,booking_model_dictionary,booking_model_mainResources,booking_model_waitList,booking_provider_pull_bookingPullManager,booking_model_filter,booking_model_formsMenu,booking_model_saleChannels) {
	'use strict';

	const featuresMap = Object.freeze({
	  booking: 'booking',
	  booking_calendar: 'bookingCalendar',
	  booking_waitlist: 'bookingWaitlist',
	  booking_overbooking: 'bookingOverbooking',
	  booking_multi: 'bookingMulti',
	  booking_crm_slider: 'bookingCrmSlider',
	  booking_notifications_settings: 'bookingNotificationsSettings'
	});
	function extractFeatures({
	  features
	}) {
	  const enabledFeature = {
	    booking: false,
	    bookingCalendar: false,
	    bookingWaitlist: false,
	    bookingOverbooking: false,
	    bookingCrmSlider: false,
	    bookingMulti: false,
	    bookingNotificationsSettings: false
	  };
	  for (const feature of features) {
	    if (!(feature.id in featuresMap)) {
	      void console.error(`Extracting feature name ${feature.id} not found.`);
	    }
	    enabledFeature[featuresMap[feature.id]] = Boolean(feature.isEnabled);
	  }
	  return enabledFeature;
	}

	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _builder = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("builder");
	var _initPromise = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initPromise");
	var _pullManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pullManager");
	var _initStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initStore");
	var _initPull = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initPull");
	class CoreApplication {
	  constructor() {
	    Object.defineProperty(this, _initPull, {
	      value: _initPull2
	    });
	    Object.defineProperty(this, _initStore, {
	      value: _initStore2
	    });
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _builder, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _initPromise, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _pullManager, {
	      writable: true,
	      value: null
	    });
	  }
	  setParams(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = params;
	  }
	  getParams() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _params)[_params];
	  }
	  getStore() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _store)[_store];
	  }
	  async init(options = {}) {
	    var _babelHelpers$classPr, _babelHelpers$classPr2;
	    (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _initPromise))[_initPromise]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_initPromise] = new Promise(async resolve => {
	      babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = await babelHelpers.classPrivateFieldLooseBase(this, _initStore)[_initStore](options);
	      if (!options.skipPull) {
	        babelHelpers.classPrivateFieldLooseBase(this, _initPull)[_initPull]();
	      }
	      resolve();
	    });
	    return babelHelpers.classPrivateFieldLooseBase(this, _initPromise)[_initPromise];
	  }
	  async addDynamicModule(vuexBuilderModel) {
	    if (!(babelHelpers.classPrivateFieldLooseBase(this, _builder)[_builder] instanceof ui_vue3_vuex.Builder)) {
	      throw new TypeError('Builder has not been init');
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].hasModule(vuexBuilderModel.getName())) {
	      return;
	    }
	    await babelHelpers.classPrivateFieldLooseBase(this, _builder)[_builder].addDynamicModel(vuexBuilderModel);
	  }
	  removeDynamicModule(vuexModelName) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _builder)[_builder] instanceof ui_vue3_vuex.Builder && babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].hasModule(vuexModelName)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _builder)[_builder].removeDynamicModel(vuexModelName);
	    }
	  }
	}
	async function _initStore2(options) {
	  const settings = main_core.Extension.getSettings('booking.core');
	  babelHelpers.classPrivateFieldLooseBase(this, _builder)[_builder] = ui_vue3_vuex.Builder.init();
	  if (!options.skipBookingCore) {
	    babelHelpers.classPrivateFieldLooseBase(this, _builder)[_builder].addModel(booking_model_bookings.Bookings.create()).addModel(booking_model_messageStatus.MessageStatus.create()).addModel(booking_model_clients.Clients.create()).addModel(booking_model_counters.Counters.create()).addModel(booking_model_interface.Interface.create().setVariables({
	      schedule: settings.schedule,
	      editingBookingId: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].editingBookingId,
	      editingWaitListItemId: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].editingWaitListItemId,
	      timezone: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].timezone,
	      totalClients: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].totalClients,
	      totalNewClientsToday: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].totalClientsToday,
	      moneyStatistics: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].moneyStatistics,
	      isFeatureEnabled: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].isFeatureEnabled,
	      canTurnOnTrial: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].canTurnOnTrial,
	      canTurnOnDemo: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].canTurnOnDemo,
	      embedItems: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].embedItems.map(item => {
	        return {
	          value: item.id,
	          entityTypeId: item.code,
	          moduleId: item.module,
	          data: {
	            opportunity: 0,
	            currencyId: '',
	            createdTimestamp: 0
	          }
	        };
	      }),
	      calendarExpanded: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].isCalendarExpanded,
	      waitListExpanded: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].isWaitListExpanded,
	      enabledFeature: extractFeatures(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params])
	    })).addModel(booking_model_resourceTypes.ResourceTypes.create()).addModel(booking_model_resources.Resources.create()).addModel(booking_model_favorites.Favorites.create()).addModel(booking_model_dictionary.Dictionary.create()).addModel(booking_model_mainResources.MainResources.create()).addModel(booking_model_waitList.WaitList.create()).addModel(booking_model_filter.Filter.create()).addModel(booking_model_formsMenu.FormsMenu.create()).addModel(booking_model_saleChannels.SaleChannels.create());
	  }
	  const builderResult = await babelHelpers.classPrivateFieldLooseBase(this, _builder)[_builder].build();
	  return builderResult.store;
	}
	function _initPull2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _pullManager)[_pullManager] = new booking_provider_pull_bookingPullManager.BookingPullManager({
	    currentUserId: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].currentUserId
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _pullManager)[_pullManager].initQueueManager();
	}
	const Core = new CoreApplication();

	exports.Core = Core;

}((this.BX.Booking = this.BX.Booking || {}),BX,BX.Vue3.Vuex,BX.Booking.Model,BX.Booking.Model,BX.Booking.Model,BX.Booking.Model,BX.Booking.Model,BX.Booking.Model,BX.Booking.Model,BX.Booking.Model,BX.Booking.Model,BX.Booking.Model,BX.Booking.Model,BX.Booking.Provider.Pull,BX.Booking.Model,BX.Booking.Model,BX.Booking.Model));
//# sourceMappingURL=core.bundle.js.map
