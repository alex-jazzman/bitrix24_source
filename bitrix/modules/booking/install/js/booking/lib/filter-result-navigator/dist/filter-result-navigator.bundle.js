/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, booking_core, booking_const, booking_provider_service_calendarService, main_core, booking_lib_removeResource) {
	'use strict';

	const DAY_MS = 1000 * 60 * 60 * 24;
	class FilterResultNavigator {
		getOptimalFilterDateTs(inFuture = false) {
			const $store = booking_core.Core.getStore();
			const count = $store.getters[`${booking_const.Model.Filter}/datesCount`]?.count ?? 0;
			const maxDate = $store.getters[`${booking_const.Model.Filter}/datesCount`]?.maxDate;
			const minDate = $store.getters[`${booking_const.Model.Filter}/datesCount`]?.minDate;
			const selectedDateTs = $store.getters[`${booking_const.Model.Interface}/selectedDateTs`];
			if (count === 0) {
				return selectedDateTs;
			}
			if (maxDate !== null && (this.#getDateTs(maxDate) > selectedDateTs || inFuture)) {
				return this.getNextFilterDateTs((inFuture ? this.#getTodayTs() : selectedDateTs) - DAY_MS, inFuture);
			}
			if (minDate !== null && this.#getDateTs(minDate) < selectedDateTs) {
				return this.getPreviousFilterDateTs(selectedDateTs + DAY_MS);
			}
			return selectedDateTs;
		}
		async getPreviousFilterDateTs(startingDateTs) {
			const $store = booking_core.Core.getStore();
			const minDate = $store.getters[`${booking_const.Model.Filter}/datesCount`]?.minDate;
			if (minDate === null) {
				return null;
			}
			const minDateTs = this.#getDateTs(minDate);
			const selectedDateTs = startingDateTs || $store.getters[`${booking_const.Model.Interface}/selectedDateTs`];
			if (selectedDateTs <= minDateTs) {
				return minDateTs;
			}
			const maxDateTs = this.#getDateTs($store.getters[`${booking_const.Model.Filter}/datesCount`]?.maxDate);
			if (selectedDateTs > maxDateTs) {
				return maxDateTs;
			}
			const previousFilterDate = this.#findPreviousDate(selectedDateTs);
			if (previousFilterDate) {
				return previousFilterDate;
			}
			const previousDate = new Date(selectedDateTs - DAY_MS);
			await this.#loadNextFilterDates(previousDate.getTime(), minDateTs);
			return this.#findPreviousDate(selectedDateTs);
		}
		async getNextFilterDateTs(startingDateTs, inFuture = false) {
			const $store = booking_core.Core.getStore();
			const maxDate = $store.getters[`${booking_const.Model.Filter}/datesCount`]?.maxDate;
			if (maxDate === null) {
				return null;
			}
			const selectedDateTs = startingDateTs || $store.getters[`${booking_const.Model.Interface}/selectedDateTs`];
			const maxDateTs = this.#getDateTs(maxDate);
			if (selectedDateTs >= maxDateTs) {
				return maxDateTs;
			}
			const minDateTs = this.#getDateTs($store.getters[`${booking_const.Model.Filter}/datesCount`]?.minDate);
			if (selectedDateTs < minDateTs) {
				return minDateTs;
			}
			const nextFilterDate = this.#findNextDate(selectedDateTs, inFuture);
			if (nextFilterDate) {
				return nextFilterDate;
			}
			const nextDate = new Date(selectedDateTs + DAY_MS); // + (inFuture ? 0 : DAY_MS));

			await this.#loadNextFilterDates(nextDate.getTime(), maxDateTs);
			return this.#findNextDate(selectedDateTs);
		}
		#getTodayTs() {
			const today = new Date();
			return Math.trunc(today.getTime() / 1000) * 1000;
		}
		#getDateTs(date) {
			const d = new Date(date);
			d.setHours(0, 0, 0, 0);
			return d.getTime();
		}
		async #loadNextFilterDates(selectedDateTs, limitDateTs) {
			const filterFields = booking_core.Core.getStore().getters[`${booking_const.Model.Filter}/fields`];
			await booking_provider_service_calendarService.calendarService.loadNextFilterMarks(filterFields, selectedDateTs, limitDateTs);
		}
		#findPreviousDate(selectedDateTs) {
			return booking_core.Core.getStore().state[booking_const.Model.Filter].filterDates.findLast(dateTs => dateTs < selectedDateTs);
		}
		#findNextDate(viewDateTs, inFuture = false) {
			const filterDates = [...booking_core.Core.getStore().state[booking_const.Model.Filter].filterDates].sort();
			if (inFuture) {
				return filterDates.find(dateTs => dateTs >= viewDateTs);
			}
			return filterDates.find(dateTs => dateTs > viewDateTs);
		}
	}
	const filterResultNavigator = new FilterResultNavigator();

	class DeletingResourceFilterResultCountActualizer {
		subscribe() {
			main_core.Event.EventEmitter.subscribe(booking_const.EventName.CreateBookings, this.afterCreateBooking);
			main_core.Event.EventEmitter.subscribe(booking_const.EventName.DeleteBooking, this.afterDeleteBooking);
			main_core.Event.EventEmitter.subscribe(booking_const.EventName.UpdateBooking, this.afterUpdateBooking);
		}
		unsubscribe() {
			main_core.Event.EventEmitter.unsubscribe(booking_const.EventName.CreateBookings, this.afterCreateBooking);
			main_core.Event.EventEmitter.unsubscribe(booking_const.EventName.DeleteBooking, this.afterDeleteBooking);
			main_core.Event.EventEmitter.unsubscribe(booking_const.EventName.UpdateBooking, this.afterUpdateBooking);
		}
		afterCreateBooking({
			data
		}) {
			const id = booking_core.Core.getStore().getters[`${booking_const.Model.Filter}/deletingResource`]?.id;
			const bookings = data.bookings || [];
			if (!main_core.Type.isArray(bookings) || bookings.every(({
				resourcesIds
			}) => !resourcesIds.includes(id))) {
				return;
			}
			void updateFilterResultCounter();
			const selectedDateTs = booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/selectedDateTs`];
			const resourceBookings = booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/getByDateAndResources`](selectedDateTs, [id]);
			if (resourceBookings.length === 1) {
				void updateFilterMarks();
			}
		}
		async afterDeleteBooking({
			data
		}) {
			const id = booking_core.Core.getStore().getters[`${booking_const.Model.Filter}/deletingResource`]?.id;
			const resourcesIds = data.booking.resourcesIds || [];
			if (!resourcesIds.includes(id)) {
				return;
			}
			await updateFilterResultCounter();
			if (getResourceBookings(new Date(data.booking.dateFromTs)).length === 0) {
				void updateFilterMarks();
			}
			void tryRemoveResourceAgain(id);
		}
		async afterUpdateBooking({
			data
		}) {
			const oldResourcesIds = data.oldBooking.resourcesIds;
			const newResourcesIds = data.newBooking.resourcesIds;
			const id = booking_core.Core.getStore().getters[`${booking_const.Model.Filter}/deletingResource`]?.id;
			if (oldResourcesIds.includes(id) && newResourcesIds.includes(id) || !oldResourcesIds.includes(id) && !newResourcesIds.includes(id)) {
				return;
			}
			await updateFilterResultCounter();
			if (getResourceBookings().length < 2) {
				void updateFilterMarks();
			}
			void tryRemoveResourceAgain(id);
		}
	}
	function getResourceBookings(dateTs) {
		const selectedDateTs = dateTs || booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/selectedDateTs`];
		const resourceId = booking_core.Core.getStore().getters[`${booking_const.Model.Filter}/deletingResource`]?.id;
		return booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/getByDateAndResources`](selectedDateTs, [resourceId]);
	}
	async function updateFilterResultCounter() {
		const $store = booking_core.Core.getStore();
		const fields = $store.getters[`${booking_const.Model.Filter}/fields`];
		booking_provider_service_calendarService.calendarService.clearDataCountCache();
		await booking_provider_service_calendarService.calendarService.loadBookingsDateCount(fields, true);
	}
	async function updateFilterMarks() {
		const $store = booking_core.Core.getStore();
		const fields = $store.getters[`${booking_const.Model.Filter}/fields`];
		await $store.dispatch(`${booking_const.Model.Filter}/setFilteredMarks`, []);
		booking_provider_service_calendarService.calendarService.clearFilterCache();
		await booking_provider_service_calendarService.calendarService.loadFilterMarks(fields);
	}
	async function tryRemoveResourceAgain(resourceId) {
		if (booking_core.Core.getStore().getters[`${booking_const.Model.Filter}/datesCount`]?.count > 0) {
			return;
		}
		await new booking_lib_removeResource.RemoveResource(resourceId).runAfterMoveBookings();
	}
	const deletingResourceFilterResultCountActualizer = new DeletingResourceFilterResultCountActualizer();

	exports.deletingResourceFilterResultCountActualizer = deletingResourceFilterResultCountActualizer;
	exports.filterResultNavigator = filterResultNavigator;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX.Booking, BX.Booking.Const, BX.Booking.Provider.Service, BX, BX.Booking.Lib);
//# sourceMappingURL=filter-result-navigator.bundle.js.map
