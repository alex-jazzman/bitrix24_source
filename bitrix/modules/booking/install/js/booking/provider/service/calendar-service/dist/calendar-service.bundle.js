/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, main_core, booking_core, booking_const, booking_lib_apiClient, booking_lib_bookingFilter) {
	'use strict';

	async function* requestNextBookingDatesGenerator(startDateTs, limitDateTs, filter, request) {
		const direction = startDateTs < limitDateTs ? 1 : -1;
		const getWithin = getWithinBuilder(3, direction, limitDateTs);
		let {
			fromDate,
			toDate
		} = getWithin(new Date(startDateTs));
		const isLimit = toDateTs => {
			return direction === 1 ? toDateTs > limitDateTs : toDateTs < limitDateTs;
		};
		while (!isLimit(fromDate.getTime())) {
			const data = await request({
				...filter,
				WITHIN: {
					DATE_FROM: fromDate.getTime() / 1000,
					DATE_TO: toDate.getTime() / 1000
				}
			});
			const nextDates = getWithin(direction === 1 ? toDate : fromDate);
			fromDate = nextDates.fromDate;
			toDate = nextDates.toDate;
			if (data.foundDates.length > 0) {
				yield data;
			}
		}
	}
	function getWithinBuilder(duration, direction, limitDateTs) {
		let intervalDuration = duration;
		return function (firstDate) {
			intervalDuration++;
			const secondDate = new Date(firstDate);
			secondDate.setMonth(secondDate.getMonth() + (intervalDuration + 1) * direction);
			secondDate.setDate(0);
			if (direction === 1) {
				return {
					fromDate: firstDate,
					toDate: secondDate.getDate() > limitDateTs ? new Date(limitDateTs) : secondDate
				};
			}
			const fromDate = secondDate.getTime() < limitDateTs ? new Date(limitDateTs) : secondDate;
			const toDate = firstDate;
			if (toDate.getTime() === fromDate.getTime()) {
				toDate.setDate(toDate.getDate() + 1);
			}
			return {
				fromDate,
				toDate
			};
		};
	}

	class CalendarService {
		#filterMarksRequests = {};
		#filterBookingDatesCountRequests = {};
		#lastFilterMarksRequest;
		#freeMarksRequests = {};
		#lastFreeMarksRequest;
		#counterMarksRequests = {};
		#freeDatesForResourceRequests = {};
		clearCache(timestamp, resourceId) {
			Object.keys(this.#filterMarksRequests).forEach(key => {
				const {
					dateTs,
					sortedResources
				} = JSON.parse(key);
				if (timestamp === dateTs) {
					delete this.#filterMarksRequests[key];
				}
				for (const ids of sortedResources) {
					if (ids.includes(resourceId)) {
						delete this.#filterMarksRequests[key];
						break;
					}
				}
			});
		}
		clearFilterCache() {
			this.#filterMarksRequests = {};
			this.clearDataCountCache();
		}
		clearDataCountCache() {
			this.#filterBookingDatesCountRequests = {};
		}
		async loadMarks(dateTs, resources) {
			try {
				if (!main_core.Type.isArrayFilled(resources)) {
					return;
				}
				const sortedResources = resources.map(ids => {
					return ids.sort((a, b) => a - b);
				}).sort((a, b) => a[0] - b[0]);
				const key = JSON.stringify({
					dateTs,
					sortedResources
				});
				this.#freeMarksRequests[key] ??= this.#requestLoadMarks(dateTs, resources);
				this.#lastFreeMarksRequest = this.#freeMarksRequests[key];
				const freeMarks = await this.#freeMarksRequests[key];
				if (this.#freeMarksRequests[key] !== this.#lastFreeMarksRequest) {
					return;
				}
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setFreeMarks`, freeMarks);
			} catch (error) {
				console.error('BookingService: loadMarks error', error);
			}
		}
		async loadFilterMarks(fields, inFuture = false) {
			try {
				const filter = inFuture ? booking_lib_bookingFilter.bookingDateCountFilter.prepareFutureFilter(fields, true) : booking_lib_bookingFilter.bookingFilter.prepareFilter(fields, true);
				const key = JSON.stringify(filter);
				this.#filterMarksRequests[key] ??= this.#requestFilterMarks(filter);
				this.#lastFilterMarksRequest = this.#filterMarksRequests[key];
				const {
					foundDates,
					foundDatesWithCounters
				} = await this.#filterMarksRequests[key];
				if (this.#filterMarksRequests[key] !== this.#lastFilterMarksRequest) {
					return;
				}
				await Promise.all([booking_core.Core.getStore().dispatch(`${booking_const.Model.Filter}/addFilterDates`, foundDates), booking_core.Core.getStore().dispatch(`${booking_const.Model.Filter}/setFilteredMarks`, foundDates), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setCounterMarks`, foundDatesWithCounters)]);
			} catch (error) {
				console.error('BookingService: loadFilterMarks error', error);
			}
		}
		async loadCounterMarks(dateTs, force = false) {
			try {
				const key = dateTs.toString();
				if (force) {
					this.#counterMarksRequests[key] = this.#requestCounterMarks(dateTs);
				} else {
					this.#counterMarksRequests[key] ??= this.#requestCounterMarks(dateTs);
				}
				const counterMarks = await this.#counterMarksRequests[key];
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setCounterMarks`, counterMarks);
			} catch (error) {
				console.error('CalendarService: loadCounterMarks error', error);
			}
		}
		async loadBookingsDateCount(fields, futureOnly = false) {
			try {
				const filter = futureOnly ? booking_lib_bookingFilter.bookingDateCountFilter.prepareFutureOnlyFilter(fields, true) : booking_lib_bookingFilter.bookingDateCountFilter.prepareUndatedFilter(fields, true);
				const key = JSON.stringify(filter);
				this.#filterBookingDatesCountRequests[key] ??= this.#requestBookingsDateCount(filter);
				const data = await this.#filterBookingDatesCountRequests[key];
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.Filter}/setDatesCount`, data);
			} catch (error) {
				console.error('CalendarService: loadBookingDatesCount error', error);
			}
		}
		async loadNextFilterMarks(fields, startDateTs, limitDateTs) {
			const $store = booking_core.Core.getStore();
			try {
				const filter = booking_lib_bookingFilter.bookingFilter.prepareFilter(fields, true);
				$store.dispatch(`${booking_const.Model.Filter}/setFetchingNextDate`, true);
				const {
					foundDates,
					foundDatesWithCounters
				} = await this.#requestNextBookingDates(filter, startDateTs, limitDateTs);
				await Promise.all([booking_core.Core.getStore().dispatch(`${booking_const.Model.Filter}/addFilterDates`, foundDates), booking_core.Core.getStore().dispatch(`${booking_const.Model.Filter}/setFilteredMarks`, foundDates), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setCounterMarks`, foundDatesWithCounters)]);
			} catch (error) {
				console.error('BookingService: loadNextFilterMarks error', error);
			} finally {
				$store.dispatch(`${booking_const.Model.Filter}/setFetchingNextDate`, false);
			}
		}
		async getFreeDatesForResource(resourceId, dateTs) {
			try {
				const key = JSON.stringify({
					resourceId,
					dateTs
				});
				this.#freeDatesForResourceRequests[key] ??= this.#requestLoadMarks(dateTs, [[resourceId]]);
				return await this.#freeDatesForResourceRequests[key];
			} catch (error) {
				console.error('CalendarService: getFreeDatesForResource error', error);
				return [];
			}
		}
		async #requestLoadMarks(dateTs, resources) {
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const minTs = today.getTime() + this.#offset;
			const dateFromTs = Math.max(minTs, dateTs) / 1000;
			const dateToTs = new Date(dateTs).setMonth(new Date(dateTs).getMonth() + 1) / 1000;
			if (dateToTs <= minTs / 1000) {
				return [];
			}
			const {
				freeDates
			} = await new booking_lib_apiClient.ApiClient().post('Calendar.getResourceOccupation', {
				timezone: this.#timezone,
				dateFromTs,
				dateToTs,
				resources
			});
			return freeDates;
		}
		#requestFilterMarks(filter) {
			return new booking_lib_apiClient.ApiClient().post('Calendar.getBookingsDates', {
				timezone: this.#timezone,
				dateFromTs: filter.WITHIN.DATE_FROM,
				dateToTs: filter.WITHIN.DATE_TO,
				filter
			});
		}
		async #requestNextBookingDates(filter, startTs, limitDateTs) {
			const getBookingDatesGenerator = requestNextBookingDatesGenerator(startTs, limitDateTs, filter, this.#requestFilterMarks.bind(this));
			for await (const data of getBookingDatesGenerator) {
				if (data.foundDates.length > 0) {
					return data;
				}
			}
			return {
				foundDates: [],
				foundDatesWithCounters: []
			};
		}
		async #requestCounterMarks(dateTs) {
			const dateFromTs = dateTs / 1000;
			const dateToTs = new Date(dateTs).setMonth(new Date(dateTs).getMonth() + 1) / 1000;
			const {
				foundDatesWithCounters
			} = await new booking_lib_apiClient.ApiClient().post('Calendar.getBookingsDates', {
				timezone: this.#timezone,
				dateFromTs,
				dateToTs,
				filter: {
					HAS_COUNTERS_USER_ID: 1
				}
			});
			return foundDatesWithCounters;
		}
		#requestBookingsDateCount(filter) {
			return new booking_lib_apiClient.ApiClient().post('Calendar.getBookingsDatesCount', {
				timezone: this.#timezone,
				filter
			});
		}
		get #offset() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/offset`];
		}
		get #timezone() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/timezone`];
		}
	}
	const calendarService = new CalendarService();

	exports.calendarService = calendarService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX, BX.Booking, BX.Booking.Const, BX.Booking.Lib, BX.Booking.Lib);
//# sourceMappingURL=calendar-service.bundle.js.map
