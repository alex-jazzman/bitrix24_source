/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_vue3_vuex, booking_model_bookings, booking_model_messageStatus, booking_model_clients, booking_model_counters, booking_model_interface, booking_model_resourceTypes, booking_model_resources, booking_model_favorites, booking_model_dictionary, booking_model_notifications, booking_model_mainResources, booking_model_waitList, booking_provider_pull_bookingPullManager, booking_model_filter, booking_model_saleChannels, booking_model_sku) {
	'use strict';

	const featuresMap = Object.freeze({
		booking: 'booking',
		booking_calendar: 'bookingCalendar',
		booking_waitlist: 'bookingWaitlist',
		booking_overbooking: 'bookingOverbooking',
		booking_multi: 'bookingMulti',
		booking_crm_slider: 'bookingCrmSlider',
		booking_notifications_settings: 'bookingNotificationsSettings',
		booking_notifications_ai_call: 'bookingNotificationsAiCall',
		booking_long: 'bookingLong'
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
			bookingNotificationsSettings: false,
			bookingNotificationsAiCall: false,
			bookingLong: false
		};
		for (const feature of features) {
			if (!(feature.id in featuresMap)) {
				void console.error(`Extracting feature name ${feature.id} not found.`);
			}
			enabledFeature[featuresMap[feature.id]] = Boolean(feature.isEnabled);
		}
		return enabledFeature;
	}

	class CoreApplication {
		#params;
		#store;
		#builder;
		#initPromise;
		#pullManager = null;
		setParams(params) {
			this.#params = params;
		}
		getParams() {
			return this.#params;
		}
		getStore() {
			return this.#store;
		}
		async init(options = {}) {
			this.#initPromise ??= new Promise(async resolve => {
				this.#store = await this.#initStore(options);
				if (!options.skipPull) {
					this.#initPull();
				}
				resolve();
			});
			return this.#initPromise;
		}
		async #initStore(options) {
			const settings = main_core.Extension.getSettings('booking.core');
			this.#builder = ui_vue3_vuex.Builder.init();
			if (!options.skipCoreModels) {
				this.#builder.addModel(booking_model_bookings.Bookings.create()).addModel(booking_model_messageStatus.MessageStatus.create()).addModel(booking_model_clients.Clients.create()).addModel(booking_model_counters.Counters.create()).addModel(booking_model_interface.Interface.create().setVariables({
					schedule: settings.schedule,
					editingBookingId: this.#params.editingBookingId,
					editingWaitListItemId: this.#params.editingWaitListItemId,
					timezone: this.#params.timezone,
					firstWeekDay: this.#params.firstWeekDay,
					totalClients: this.#params.totalClients,
					totalNewClientsToday: this.#params.totalClientsToday,
					moneyStatistics: this.#params.moneyStatistics,
					isFeatureEnabled: this.#params.isFeatureEnabled,
					canTurnOnTrial: this.#params.canTurnOnTrial,
					canTurnOnDemo: this.#params.canTurnOnDemo,
					embedItems: this.#params.embedItems.map(item => {
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
					calendarExpanded: this.#params.isCalendarExpanded,
					waitListExpanded: this.#params.isWaitListExpanded,
					gridMode: this.#params.gridMode,
					enabledFeature: extractFeatures(this.#params)
				})).addModel(booking_model_resourceTypes.ResourceTypes.create()).addModel(booking_model_resources.Resources.create()).addModel(booking_model_favorites.Favorites.create()).addModel(booking_model_dictionary.Dictionary.create()).addModel(booking_model_notifications.Notifications.create()).addModel(booking_model_mainResources.MainResources.create()).addModel(booking_model_waitList.WaitList.create()).addModel(booking_model_filter.Filter.create()).addModel(booking_model_saleChannels.SaleChannels.create()).addModel(booking_model_sku.SkuModel.create());
			}
			const builderResult = await this.#builder.build();
			return builderResult.store;
		}
		#initPull() {
			this.#pullManager = new booking_provider_pull_bookingPullManager.BookingPullManager({
				currentUserId: this.#params.currentUserId
			});
			this.#pullManager.initQueueManager();
		}
		async addDynamicModule(vuexBuilderModel) {
			if (!(this.#builder instanceof ui_vue3_vuex.Builder)) {
				throw new TypeError('Builder has not been init');
			}
			if (this.#store.hasModule(vuexBuilderModel.getName())) {
				return;
			}
			await this.#builder.addDynamicModel(vuexBuilderModel);
		}
		removeDynamicModule(vuexModelName) {
			if (this.#builder instanceof ui_vue3_vuex.Builder && this.#store.hasModule(vuexModelName)) {
				this.#builder.removeDynamicModel(vuexModelName);
			}
		}
	}
	const Core = new CoreApplication();

	exports.Core = Core;

})(this.BX.Booking = this.BX.Booking || {}, BX, BX.Vue3.Vuex, BX.Booking.Model, BX.Booking.Model, BX.Booking.Model, BX.Booking.Model, BX.Booking.Model, BX.Booking.Model, BX.Booking.Model, BX.Booking.Model, BX.Booking.Model, BX.Booking.Model, BX.Booking.Model, BX.Booking.Model, BX.Booking.Provider.Pull, BX.Booking.Model, BX.Booking.Model, BX.Booking.Model);
//# sourceMappingURL=core.bundle.js.map
