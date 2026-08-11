/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, booking_core, booking_const, booking_lib_utils, booking_lib_duration, booking_provider_service_calendarService, main_core, booking_lib_removeResource) {
	'use strict';

	const DayMs = booking_lib_duration.Duration.getUnitDurations().d;
	const WeekMs = DayMs * booking_const.Grid.Duration.Week;
	class FilterResultNavigator {
		#store = null;
		get $store() {
			if (!this.#store) {
				this.#store = booking_core.Core.getStore();
			}
			return this.#store;
		}
		getOptimalFilterDateTs(inFuture = false) {
			const isWeekMode = this.#isWeekMode();
			const count = this.$store.getters[`${booking_const.Model.Filter}/datesCount`]?.count ?? 0;
			const maxDate = this.$store.getters[`${booking_const.Model.Filter}/datesCount`]?.maxDate;
			const minDate = this.$store.getters[`${booking_const.Model.Filter}/datesCount`]?.minDate;
			const selectedDateTs = this.$store.getters[`${booking_const.Model.Interface}/selectedDateTs`] - this.#getOffset();
			const selectedFirstDayPeriodTs = this.$store.getters[`${booking_const.Model.Interface}/selectedFirstDayPeriodTs`];
			if (count === 0) {
				return isWeekMode ? selectedFirstDayPeriodTs : selectedDateTs;
			}
			if (maxDate !== null && (this.#getDateTs(maxDate) > selectedDateTs || inFuture)) {
				return this.getNextFilterDateTs((inFuture ? this.#getTodayTs() : selectedDateTs) - DayMs, inFuture);
			}
			if (minDate !== null && this.#getDateTs(minDate) < selectedDateTs) {
				return this.getPreviousFilterDateTs(selectedDateTs + DayMs);
			}
			return isWeekMode ? selectedFirstDayPeriodTs : selectedDateTs;
		}
		async getPreviousFilterDateTs(startingDateTs) {
			if (this.#isWeekMode()) {
				return this.#getPreviousFilterWeekStartTs(startingDateTs);
			}
			return this.#getPreviousFilterDayTs(startingDateTs);
		}
		async getNextFilterDateTs(startingDateTs, inFuture = false) {
			if (this.#isWeekMode()) {
				return this.#getNextFilterWeekStartTs(startingDateTs, inFuture);
			}
			return this.#getNextFilterDayTs(startingDateTs, inFuture);
		}
		async #getPreviousFilterDayTs(startingDateTs) {
			const minDate = this.$store.getters[`${booking_const.Model.Filter}/datesCount`]?.minDate;
			if (minDate === null) {
				return null;
			}
			const minDateTs = this.#getDateTs(minDate);
			const selectedDateTs = startingDateTs ?? this.$store.getters[`${booking_const.Model.Interface}/selectedDateTs`] + this.#getOffset();
			if (selectedDateTs <= minDateTs) {
				return minDateTs;
			}
			const maxDateTs = this.#getDateTs(this.$store.getters[`${booking_const.Model.Filter}/datesCount`]?.maxDate);
			if (selectedDateTs > maxDateTs) {
				return maxDateTs;
			}
			const previousFilterDate = this.#findPreviousDate(selectedDateTs);
			if (previousFilterDate) {
				return previousFilterDate;
			}
			const previousDate = new Date(selectedDateTs - DayMs);
			await this.#loadNextFilterDates(previousDate.getTime(), minDateTs);
			return this.#findPreviousDate(selectedDateTs) ?? null;
		}
		async #getNextFilterDayTs(startingDateTs, inFuture = false) {
			const maxDate = this.$store.getters[`${booking_const.Model.Filter}/datesCount`]?.maxDate;
			if (maxDate === null) {
				return null;
			}
			const selectedDateTs = startingDateTs ?? this.$store.getters[`${booking_const.Model.Interface}/selectedDateTs`] + this.#getOffset();
			const maxDateTs = this.#getDateTs(maxDate);
			if (selectedDateTs >= maxDateTs) {
				return maxDateTs;
			}
			const minDateTs = this.#getDateTs(this.$store.getters[`${booking_const.Model.Filter}/datesCount`]?.minDate);
			if (selectedDateTs < minDateTs) {
				return minDateTs;
			}
			const nextFilterDate = this.#findNextDate(selectedDateTs, inFuture);
			if (nextFilterDate) {
				return nextFilterDate;
			}
			const nextDate = new Date(selectedDateTs + DayMs); // + (inFuture ? 0 : DayMs));

			await this.#loadNextFilterDates(nextDate.getTime(), maxDateTs);
			return this.#findNextDate(selectedDateTs) ?? null;
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
		#getOffset() {
			return this.$store.getters[`${booking_const.Model.Interface}/offset`];
		}
		#isWeekMode() {
			return this.$store.getters[`${booking_const.Model.Interface}/isWeekMode`];
		}
		#getFirstWeekDay() {
			return this.$store.getters[`${booking_const.Model.Interface}/firstWeekDay`];
		}
		#getWeekStartTs(dateTs) {
			return booking_lib_utils.Utils.time.getWeekStartTs(dateTs, this.#getFirstWeekDay());
		}
		#getSelectedWeekStartTs() {
			return this.$store.getters[`${booking_const.Model.Interface}/selectedFirstDayPeriodTs`] + this.#getOffset();
		}
		#getWeekStarts() {
			const weekStarts = new Set(this.$store.state[booking_const.Model.Filter].filterDates.map(dateTs => this.#getWeekStartTs(dateTs)));
			return [...weekStarts].sort((a, b) => a - b);
		}
		async #getPreviousFilterWeekStartTs(startingDateTs) {
			const minDate = this.$store.getters[`${booking_const.Model.Filter}/datesCount`]?.minDate;
			if (minDate === null) {
				return null;
			}
			const minWeekStartTs = this.#getWeekStartTs(this.#getDateTs(minDate));
			const selectedWeekStartTs = this.#getWeekStartTs(startingDateTs ?? this.#getSelectedWeekStartTs());
			if (selectedWeekStartTs <= minWeekStartTs) {
				return minWeekStartTs;
			}
			const maxWeekStartTs = this.#getWeekStartTs(this.#getDateTs(this.$store.getters[`${booking_const.Model.Filter}/datesCount`]?.maxDate));
			if (selectedWeekStartTs > maxWeekStartTs) {
				return maxWeekStartTs;
			}
			const previousFilterWeekStart = this.#findPreviousWeekStart(selectedWeekStartTs);
			if (previousFilterWeekStart) {
				return previousFilterWeekStart;
			}
			const previousWeek = new Date(selectedWeekStartTs - DayMs);
			await this.#loadNextFilterDates(previousWeek.getTime(), minWeekStartTs);
			return this.#findPreviousWeekStart(selectedWeekStartTs) ?? null;
		}
		async #getNextFilterWeekStartTs(startingDateTs, inFuture = false) {
			const maxDate = this.$store.getters[`${booking_const.Model.Filter}/datesCount`]?.maxDate;
			if (maxDate === null) {
				return null;
			}
			const selectedWeekStartTs = this.#getWeekStartTs(startingDateTs ?? this.#getSelectedWeekStartTs());
			const maxWeekStartTs = this.#getWeekStartTs(this.#getDateTs(maxDate));
			if (selectedWeekStartTs >= maxWeekStartTs) {
				return maxWeekStartTs;
			}
			const minWeekStartTs = this.#getWeekStartTs(this.#getDateTs(this.$store.getters[`${booking_const.Model.Filter}/datesCount`]?.minDate));
			if (selectedWeekStartTs < minWeekStartTs) {
				return minWeekStartTs;
			}
			const nextFilterWeekStart = this.#findNextWeekStart(selectedWeekStartTs, inFuture);
			if (nextFilterWeekStart) {
				return nextFilterWeekStart;
			}
			const nextWeek = new Date(selectedWeekStartTs + WeekMs);
			await this.#loadNextFilterDates(nextWeek.getTime(), maxWeekStartTs);
			return this.#findNextWeekStart(selectedWeekStartTs, inFuture) ?? null;
		}
		async #loadNextFilterDates(selectedDateTs, limitDateTs) {
			const filterFields = this.$store.getters[`${booking_const.Model.Filter}/fields`];
			await booking_provider_service_calendarService.calendarService.loadNextFilterMarks(filterFields, selectedDateTs, limitDateTs);
		}
		#findPreviousDate(selectedDateTs) {
			return this.$store.state[booking_const.Model.Filter].filterDates.findLast(dateTs => dateTs < selectedDateTs);
		}
		#findPreviousWeekStart(selectedWeekStartTs) {
			return this.#getWeekStarts().findLast(weekStartTs => weekStartTs < selectedWeekStartTs);
		}
		#findNextDate(viewDateTs, inFuture = false) {
			const filterDates = [...this.$store.state[booking_const.Model.Filter].filterDates].sort();
			if (inFuture) {
				return filterDates.find(dateTs => dateTs >= viewDateTs);
			}
			return filterDates.find(dateTs => dateTs > viewDateTs);
		}
		#findNextWeekStart(viewWeekStartTs, inFuture = false) {
			const weekStarts = this.#getWeekStarts();
			if (inFuture) {
				return weekStarts.find(weekStartTs => weekStartTs >= viewWeekStartTs);
			}
			return weekStarts.find(weekStartTs => weekStartTs > viewWeekStartTs);
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

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX.Booking, BX.Booking.Const, BX.Booking, BX.Booking.Lib, BX.Booking.Provider.Service, BX, BX.Booking.Lib);
//# sourceMappingURL=filter-result-navigator.bundle.js.map
