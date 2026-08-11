/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, booking_core, booking_const, booking_lib_apiClient, booking_provider_service_optionService) {
	'use strict';

	class ResourceCreationWizardDataExtractor {
		#data;
		constructor(data) {
			this.#data = data;
		}
		getAdvertisingTypes() {
			return this.#data.advertisingResourceTypes ?? [];
		}
		getNotifications() {
			return this.#data.notificationsSettings.notifications;
		}
		getSenders() {
			return this.#data.notificationsSettings.senders;
		}
		getCompanyScheduleSlots() {
			return this.#data.companyScheduleSlots;
		}
		isCompanyScheduleAccess() {
			return Boolean(this.#data.isCompanyScheduleAccess);
		}
		showLicenseWarning() {
			return Boolean(this.#data.notificationsSettings.showLicenseWarning);
		}
		getCompanyScheduleUrl() {
			return this.#data.companyScheduleUrl;
		}
		getWeekStart() {
			return this.#data.weekStart;
		}
		isChannelChoiceAvailable() {
			return this.#data.isChannelChoiceAvailable;
		}
	}

	class ResourceCreationWizardService {
		async fetchData() {
			await this.loadData();
		}
		async loadData() {
			try {
				const data = await booking_lib_apiClient.apiClient.post('ResourceWizard.get', {});
				const extractor = new ResourceCreationWizardDataExtractor(data);
				const wizardModel = booking_const.Model.ResourceCreationWizard;
				await Promise.all([this.$store.dispatch(`${wizardModel}/setAdvertisingTypes`, extractor.getAdvertisingTypes()), this.$store.dispatch(`${wizardModel}/setCompanyScheduleSlots`, extractor.getCompanyScheduleSlots()), this.$store.dispatch(`${wizardModel}/setCompanyScheduleAccess`, extractor.isCompanyScheduleAccess()), this.$store.dispatch(`${wizardModel}/setLicenseWarning`, extractor.showLicenseWarning()), this.$store.dispatch(`${wizardModel}/setCompanyScheduleUrl`, extractor.getCompanyScheduleUrl()), this.$store.dispatch(`${wizardModel}/setWeekStart`, extractor.getWeekStart()), this.$store.dispatch(`${wizardModel}/setIsChannelChoiceAvailable`, extractor.isChannelChoiceAvailable()), this.$store.dispatch(`${booking_const.Model.Notifications}/upsertMany`, extractor.getNotifications())]);
			} catch (error) {
				console.error('ResourceCreationWizardService loadData error', error);
			}
		}
		async updateNotificationExpanded(type, isExpanded) {
			await this.$store.dispatch(`${booking_const.Model.Notifications}/setIsExpanded`, {
				type,
				isExpanded
			});
			const notifications = Object.fromEntries(this.$store.getters[`${booking_const.Model.Notifications}/get`].map(notification => [notification.type, notification.isExpanded]));
			try {
				await booking_provider_service_optionService.optionService.set(booking_const.Option.NotificationsExpanded, JSON.stringify(notifications));
			} catch (error) {
				await this.$store.dispatch(`${booking_const.Model.Notifications}/setIsExpanded`, {
					type,
					isExpanded: !isExpanded
				});
				console.error('ResourceCreationWizardService updateNotificationExpanded error', error);
			}
		}
		get $store() {
			return booking_core.Core.getStore();
		}
	}
	const resourceCreationWizardService = new ResourceCreationWizardService();

	exports.resourceCreationWizardService = resourceCreationWizardService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX.Booking, BX.Booking.Const, BX.Booking.Lib, BX.Booking.Provider.Service);
//# sourceMappingURL=resource-creation-wizard-service.bundle.js.map
