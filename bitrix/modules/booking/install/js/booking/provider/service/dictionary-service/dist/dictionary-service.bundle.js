/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, main_core, booking_core, booking_const) {
	'use strict';

	class DictionaryDataExtractor {
		#response;
		constructor(response) {
			this.#response = response;
		}
		getCounters() {
			return this.#response.counters;
		}
		getNotifications() {
			return this.#response.notifications;
		}
		getNotificationTemplates() {
			return this.#response.notificationTemplateTypes;
		}
		getPushCommands() {
			return this.#response.pushCommands;
		}
		getBookings() {
			return this.#response.bookings;
		}
	}

	class DictionaryService {
		async fetchData() {
			try {
				const data = main_core.Extension.getSettings('booking.provider.service.dictionary-service');
				const extractor = new DictionaryDataExtractor(data);
				await Promise.all([this.$store.dispatch(`${booking_const.Model.Dictionary}/setCounters`, extractor.getCounters()), this.$store.dispatch(`${booking_const.Model.Dictionary}/setNotifications`, extractor.getNotifications()), this.$store.dispatch(`${booking_const.Model.Dictionary}/setNotificationTemplates`, extractor.getNotificationTemplates()), this.$store.dispatch(`${booking_const.Model.Dictionary}/setPushCommands`, extractor.getPushCommands()), this.$store.dispatch(`${booking_const.Model.Dictionary}/setBookings`, extractor.getBookings())]);
			} catch (error) {
				console.error('BookingDictionaryGetRequest: error', error);
			}
		}
		get $store() {
			return booking_core.Core.getStore();
		}
	}
	const dictionaryService = new DictionaryService();

	exports.dictionaryService = dictionaryService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX, BX.Booking, BX.Booking.Const);
//# sourceMappingURL=dictionary-service.bundle.js.map
