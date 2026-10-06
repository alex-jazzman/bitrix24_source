/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, booking_const, booking_core) {
	'use strict';

	var CounterDictionary;
	(function (CounterDictionary) {
		CounterDictionary["D"] = "booking_delayed";
		CounterDictionary["AC"] = "booking_unconfirmed";
	})(CounterDictionary || (CounterDictionary = {}));
	var ConfirmedFilterValue;
	(function (ConfirmedFilterValue) {
		ConfirmedFilterValue[ConfirmedFilterValue["Y"] = 1] = "Y";
		ConfirmedFilterValue[ConfirmedFilterValue["N"] = 0] = "N";
	})(ConfirmedFilterValue || (ConfirmedFilterValue = {}));

	class BookingFilter {
		store = null;
		get $store() {
			if (!this.store) {
				this.store = booking_core.Core.getStore();
			}
			return this.store;
		}
		prepareFilter(fields, withinMonth = false) {
			const isWeekMode = this.$store.getters[`${booking_const.Model.Interface}/isWeekMode`];
			const periodStartTs = this.getPeriodStartTs(withinMonth, isWeekMode);
			const periodEndTs = this.getPeriodEndTs(periodStartTs, withinMonth, isWeekMode);
			const filter = {
				WITHIN: {
					DATE_FROM: periodStartTs / 1000,
					DATE_TO: periodEndTs / 1000
				}
			};
			return this.appendEntityFilters(filter, fields);
		}
		getPeriodStartTs(withinMonth, isWeekMode) {
			if (withinMonth) {
				return this.$store.getters[`${booking_const.Model.Interface}/viewDateTs`];
			}
			if (isWeekMode) {
				return this.$store.getters[`${booking_const.Model.Interface}/selectedFirstDayPeriodTs`];
			}
			return this.$store.getters[`${booking_const.Model.Interface}/selectedDateTs`];
		}
		getPeriodEndTs(periodStartTs, withinMonth, isWeekMode) {
			const periodEndDate = new Date(periodStartTs);
			if (withinMonth) {
				return periodEndDate.setMonth(periodEndDate.getMonth() + 1);
			}
			return periodEndDate.setDate(periodEndDate.getDate() + (isWeekMode ? booking_const.Grid.Duration.Week : booking_const.Grid.Duration.Day));
		}
		appendEntityFilters(filter, fields) {
			const result = {
				...filter
			};
			if (main_core.Type.isArrayFilled(fields.CREATED_BY) && fields.CREATED_BY) {
				result.CREATED_BY = fields.CREATED_BY.map(id => Number(id));
			}
			if (main_core.Type.isArrayFilled(fields.CONTACT) && fields.CONTACT) {
				result.CRM_CONTACT_ID = fields.CONTACT.map(id => Number(id));
			}
			if (main_core.Type.isArrayFilled(fields.COMPANY) && fields.COMPANY) {
				result.CRM_COMPANY_ID = fields.COMPANY.map(id => Number(id));
			}
			if (main_core.Type.isArrayFilled(fields.RESOURCE) && fields.RESOURCE) {
				result.RESOURCE_ID = fields.RESOURCE.map(id => Number(id));
			}
			if (fields.CONFIRMED) {
				result.IS_CONFIRMED = ConfirmedFilterValue[fields.CONFIRMED];
			}
			if (fields.REQUIRE_ATTENTION) {
				result.HAS_COUNTER_OF_TYPE = CounterDictionary[fields.REQUIRE_ATTENTION];
			}
			return result;
		}
	}
	const bookingFilter = new BookingFilter();

	class BookingDateCountFilter extends BookingFilter {
		prepareUndatedFilter(fields, withinMonth = false) {
			const filter = super.prepareFilter(fields, withinMonth);
			delete filter.WITHIN;
			return filter;
		}
		prepareFutureOnlyFilter(fields, withinMonth = false) {
			const filter = super.prepareFilter(fields, withinMonth);
			filter.WITHIN = {
				DATE_FROM: Math.trunc(Date.now() / 1000)
			};
			return filter;
		}
		prepareFutureFilter(fields, withinMonth = false) {
			const filter = super.prepareFilter(fields, withinMonth);
			const dateFrom = filter.WITHIN.DATE_FROM;
			const today = Math.trunc(Date.now() / 1000);
			if (dateFrom < today) {
				filter.WITHIN.DATE_FROM = today;
			}
			return filter;
		}
	}
	const bookingDateCountFilter = new BookingDateCountFilter();

	exports.bookingDateCountFilter = bookingDateCountFilter;
	exports.bookingFilter = bookingFilter;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX, BX.Booking.Const, BX.Booking);
//# sourceMappingURL=booking-filter.bundle.js.map
