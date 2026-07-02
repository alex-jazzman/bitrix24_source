/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, ui_analytics, booking_const, booking_core, main_core) {
	'use strict';

	class BannerAnalytics {
		static sendShowPopup() {
			const options = {
				tool: booking_const.AnalyticsTool.booking,
				category: booking_const.AnalyticsCategory.booking,
				event: 'show_popup',
				c_section: 'booking'
			};
			ui_analytics.sendData(options);
		}
		static sendClickEnable() {
			const options = {
				tool: booking_const.AnalyticsTool.booking,
				category: booking_const.AnalyticsCategory.booking,
				event: 'click_enable',
				c_section: 'booking'
			};
			ui_analytics.sendData(options);
		}
	}

	function getCSection() {
		const embedItems = booking_core.Core.getStore()?.state?.[booking_const.Model.Interface]?.embedItems || [];
		const fromCrm = embedItems.some(item => item.moduleId === booking_const.Module.Crm);
		return fromCrm ? booking_const.AnalyticsCSection.crm : booking_const.AnalyticsCSection.booking;
	}

	class BookingAnalytics {
		static sendAddMultiBookings(bookingIds) {
			const $store = booking_core.Core.getStore();
			const cSection = getCSection();
			const overbookingMap = $store.getters[`${booking_const.Model.Bookings}/overbookingMap`];
			const gridMode = $store.getters[`${booking_const.Model.Interface}/gridMode`];
			for (const bookingId of bookingIds) {
				const isOverbooking = overbookingMap.has(bookingId);
				const options = {
					tool: booking_const.AnalyticsTool.booking,
					category: booking_const.AnalyticsCategory.booking,
					event: 'add_booking',
					c_section: cSection,
					c_sub_section: gridMode,
					c_element: 'multi_button',
					p1: 'isMultiResource_Y',
					p2: isOverbooking ? 'isOverbooking_Y' : 'isOverbooking_N',
					p3: 'isWaitlist_N'
				};
				ui_analytics.sendData(options);
			}
		}
		static sendAddBooking({
			isOverbooking
		} = {}) {
			const $store = booking_core.Core.getStore();
			const options = {
				tool: booking_const.AnalyticsTool.booking,
				category: booking_const.AnalyticsCategory.booking,
				event: 'add_booking',
				c_section: getCSection(),
				c_sub_section: $store.getters[`${booking_const.Model.Interface}/gridMode`],
				c_element: 'solo_button',
				p1: 'isMultiResource_N',
				p2: isOverbooking ? 'isOverbooking_Y' : 'isOverbooking_N',
				p3: 'isWaitlist_N'
			};
			ui_analytics.sendData(options);
		}
		static sendAddWaitListItem() {
			const $store = booking_core.Core.getStore();
			const options = {
				tool: booking_const.AnalyticsTool.booking,
				category: booking_const.AnalyticsCategory.booking,
				event: 'add_booking',
				c_section: getCSection(),
				c_sub_section: $store.getters[`${booking_const.Model.Interface}/gridMode`],
				c_element: 'solo_button',
				p1: 'isMultiResource_N',
				p2: 'isOverbooking_N',
				p3: 'isWaitlist_Y'
			};
			ui_analytics.sendData(options);
		}
	}

	function isExistingResource() {
		const $store = booking_core.Core.getStore();
		const resourceId = $store.state[booking_const.Model.ResourceCreationWizard].resourceId || null;
		return main_core.Type.isNumber(resourceId);
	}

	class RcwAnalytics {
		static sendClickAddResource() {
			const options = {
				tool: booking_const.AnalyticsTool.booking,
				category: booking_const.AnalyticsCategory.booking,
				event: booking_const.AnalyticsEvent.clickAddResource,
				c_section: getCSection(),
				c_element: booking_const.AnalyticsElement.addButton
			};
			ui_analytics.sendData(options);
		}
		static sendAddResourceStep1() {
			const $store = booking_core.Core.getStore();
			if (isExistingResource()) {
				return;
			}
			const options = {
				tool: booking_const.AnalyticsTool.booking,
				category: booking_const.AnalyticsCategory.booking,
				event: booking_const.AnalyticsEvent.addResourceStep1,
				c_section: getCSection()
			};
			let code = $store.getters[`${booking_const.Model.ResourceCreationWizard}/advertisingResourceType`]?.code || null;
			if (code === 'none') {
				code = 'other';
			}
			if (!code) {
				console.error('Booking.RCW. Code not found');
				return;
			}
			options.type = code;
			ui_analytics.sendData(options);
		}
		static sendAddResourceStep2() {
			const $store = booking_core.Core.getStore();
			if (isExistingResource()) {
				return;
			}
			const getP1 = () => {
				return $store.state[booking_const.Model.ResourceCreationWizard].resource.isMain ? 'renderType_main' : 'renderType_additional';
			};
			const getP2 = () => {
				return $store.state[booking_const.Model.ResourceCreationWizard].globalSchedule ? 'setSchedule_Y' : 'setSchedule_N';
			};
			const getP3 = () => {
				const slotLengthId = $store.state[booking_const.Model.ResourceCreationWizard].slotLengthId;
				switch (slotLengthId / 60) {
					case 1:
						return 'slotLength_1h';
					case 2:
						return 'slotLength_2h';
					case 24:
						return 'slotLength_24h';
					case 168:
						return 'slotLength_7d';
					default:
						return 'slotLength_custom';
				}
			};
			const options = {
				tool: booking_const.AnalyticsTool.booking,
				category: booking_const.AnalyticsCategory.booking,
				event: booking_const.AnalyticsEvent.addResourceStep2,
				c_section: getCSection(),
				p1: getP1(),
				p2: getP2(),
				p3: getP3()
			};
			ui_analytics.sendData(options);
		}
		static sendAddResourceFinish() {
			const $store = booking_core.Core.getStore();
			if (isExistingResource()) {
				return;
			}
			const resource = $store.state[booking_const.Model.ResourceCreationWizard].resource;
			const senders = $store.getters[`${booking_const.Model.Notifications}/getSenders`];
			const activeSender = senders.find(s => s.code === resource.senderCode) ?? senders[0] ?? null;
			const senderCanUse = activeSender?.canUse ?? false;
			const getP1 = () => {
				return senderCanUse && resource.isInfoNotificationOn ? 'infoNotification_Y' : 'infoNotification_N';
			};
			const getP2 = () => {
				return senderCanUse && resource.isConfirmationNotificationOn ? 'confirmationNotification_Y' : 'confirmationNotification_N';
			};
			const getP3 = () => {
				return senderCanUse && resource.isReminderNotificationOn ? 'reminderNotification_Y' : 'reminderNotification_N';
			};
			const getP4 = () => {
				return senderCanUse && resource.isDelayedNotificationOn ? 'delayedNotification_Y' : 'delayedNotification_N';
			};
			const getP5 = () => {
				return senderCanUse && resource.isFeedbackNotificationOn ? 'feedbackNotification_Y' : 'feedbackNotification_N';
			};
			const options = {
				tool: booking_const.AnalyticsTool.booking,
				category: booking_const.AnalyticsCategory.booking,
				event: booking_const.AnalyticsEvent.addResourceFinish,
				c_section: getCSection(),
				p1: getP1(),
				p2: getP2(),
				p3: getP3(),
				p4: getP4(),
				p5: getP5()
			};
			ui_analytics.sendData(options);
		}
		static sendAcceptAgreement({
			accepted
		}) {
			if (isExistingResource()) {
				return;
			}
			const getCSubSection = () => {
				return accepted ? 'accept' : 'deny';
			};
			const options = {
				tool: booking_const.AnalyticsTool.booking,
				category: booking_const.AnalyticsCategory.booking,
				event: booking_const.AnalyticsEvent.acceptAgreement,
				c_section: getCSection(),
				c_sub_section: getCSubSection()
			};
			ui_analytics.sendData(options);
		}
	}

	function getOpenSectionCSection(editingBookingId, embedItems = []) {
		return embedItems.some(({
			moduleId
		}) => moduleId === booking_const.Module.Crm) || editingBookingId > 0 ? 'crm' : 'main_menu';
	}
	function getOpenSectionCSubSection(editingBookingId, embedItems = []) {
		if (editingBookingId > 0) {
			return 'crm_business';
		}
		if (embedItems.length === 0) {
			return '';
		}
		const entityTypeSet = new Set(embedItems.map(({
			entityTypeId
		}) => entityTypeId));
		const isType = entityTypeId => entityTypeSet.has(entityTypeId);
		const isSmart = () => {
			const regExp = /^DYNAMIC_\d+$/;
			for (const entityType of entityTypeSet) {
				if (regExp.test(entityType)) {
					return true;
				}
			}
			return false;
		};
		if (isType(booking_const.EntityTypeId.Lead)) {
			return 'lead';
		}
		if (isType(booking_const.EntityTypeId.Deal)) {
			return 'deal';
		}
		if (isSmart()) {
			return 'smart';
		}
		if (isType(booking_const.EntityTypeId.Company)) {
			return 'company';
		}
		if (isType(booking_const.EntityTypeId.Contact)) {
			return 'contact';
		}
		return '';
	}

	class SectionAnalytics {
		static sendOpenSection() {
			const $store = booking_core.Core.getStore();
			const embedItems = $store.getters[`${booking_const.Model.Interface}/embedItems`];
			const editingBookingId = $store.getters[`${booking_const.Model.Interface}/editingBookingId`] || 0;
			const options = {
				tool: booking_const.AnalyticsTool.booking,
				category: booking_const.AnalyticsCategory.booking,
				event: 'open_section',
				c_section: getOpenSectionCSection(editingBookingId, embedItems),
				c_sub_section: getOpenSectionCSubSection(editingBookingId, embedItems)
			};
			ui_analytics.sendData(options);
		}
	}

	class WaitListAnalytics {
		static sendAddBooking() {
			const options = {
				tool: booking_const.AnalyticsTool.booking,
				category: booking_const.AnalyticsCategory.waitlist,
				c_section: getCSection(),
				event: 'add_booking',
				c_element: 'add_button'
			};
			ui_analytics.sendData(options);
		}
	}

	exports.BannerAnalytics = BannerAnalytics;
	exports.BookingAnalytics = BookingAnalytics;
	exports.RcwAnalytics = RcwAnalytics;
	exports.SectionAnalytics = SectionAnalytics;
	exports.WaitListAnalytics = WaitListAnalytics;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX.UI.Analytics, BX.Booking.Const, BX.Booking, BX);
//# sourceMappingURL=analytics.bundle.js.map
