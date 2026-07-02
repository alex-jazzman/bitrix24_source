/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, booking_core, booking_const, booking_lib_duration) {
	'use strict';

	class GridBase {
		calculateLeft(...args) {
			throw new Error('Method calculateLeft must be implemented');
		}
		calculateTop(...args) {
			throw new Error('Method calculateTop must be implemented');
		}
		calculateHeight(...args) {
			throw new Error('Method calculateHeight must be implemented');
		}
		calculateRealHeight(...args) {
			return this.calculateHeight(...args);
		}
		calculateWidth(width) {
			return width;
		}
		getUnitDurations() {
			return booking_lib_duration.Duration.getUnitDurations();
		}
	}

	class GridDay extends GridBase {
		calculateLeft(resourceId) {
			const cellWidth = 280 * this.#zoom;
			const indexOfResource = this.#resourcesIds.indexOf(resourceId);
			return indexOfResource * cellWidth;
		}
		calculateTop(fromTs) {
			const hourHeight = 50 * this.#zoom;
			const from = new Date(Math.max(this.#selectedDateTs, fromTs + this.#offset));
			const bookingMinutes = from.getHours() * 60 + from.getMinutes();
			const fromMinutes = this.#fromHour * 60;
			return (bookingMinutes - fromMinutes) * (hourHeight / 60);
		}
		calculateHeight(fromTs, toTs) {
			const hourHeight = 50 * this.#zoom;
			const minHeight = hourHeight / 4;
			const from = Math.max(this.#selectedDateTs, fromTs + this.#offset);
			const to = Math.min(new Date(this.#selectedDateTs).setHours(24), toTs + this.#offset);
			return Math.max((to - from) / booking_lib_duration.Duration.getUnitDurations().H * hourHeight, minHeight);
		}
		calculateWidth(width) {
			return width * this.#zoom;
		}
		calculateRealHeight(fromTs, toTs) {
			const hourHeight = 50 * this.#zoom;
			const minHeight = hourHeight / 4;
			const minTs = new Date(this.#selectedDateTs).setHours(this.#offHoursExpanded ? 0 : this.#fromHour);
			const maxTs = new Date(this.#selectedDateTs).setHours(this.#offHoursExpanded ? 24 : this.#toHour);
			const from = Math.max(minTs, fromTs + this.#offset);
			const to = Math.min(maxTs, toTs + this.#offset);
			return Math.max((to - from) / booking_lib_duration.Duration.getUnitDurations().H * hourHeight, minHeight);
		}
		get #selectedDateTs() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/selectedDateTs`] + this.#offset;
		}
		get #offset() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/offset`];
		}
		get #zoom() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/zoom`];
		}
		get #resourcesIds() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/resourcesIds`];
		}
		get #fromHour() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/fromHour`];
		}
		get #toHour() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/toHour`];
		}
		get #offHoursExpanded() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/offHoursExpanded`];
		}
	}
	const gridDay = new GridDay();

	class GridWeek extends GridBase {
		calculateLeft(dayIndex, fromTs) {
			const dayOffset = dayIndex * booking_const.Grid.SizeElement.WeekCellWidth;
			const weekStartTs = this.bookingWeekStartTs;
			const dayMs = booking_lib_duration.Duration.getUnitDurations().d;
			const dayStartTs = weekStartTs + dayIndex * dayMs;
			const hourOffset = (fromTs - dayStartTs) / booking_lib_duration.Duration.getUnitDurations().H * booking_const.Grid.SizeElement.WeekHourWidth;
			return dayOffset + hourOffset;
		}
		calculateTop(resourceId) {
			const index = this.#resourcesIds.indexOf(resourceId);
			return booking_const.Grid.SizeElement.WeekDaysPanelHeight + index * booking_const.Grid.SizeElement.WeekCellHeight;
		}
		calculateHeight() {
			return booking_const.Grid.SizeElement.WeekCellHeight;
		}
		calculateWidth(fromTs, toTs) {
			const weekStartTs = this.bookingWeekStartTs;
			const dayMs = booking_lib_duration.Duration.getUnitDurations().d;
			const fromRelMs = fromTs - weekStartTs;
			const toRelMs = toTs - weekStartTs;
			const fromDayIndex = Math.floor(fromRelMs / dayMs);
			const toDayIndex = Math.floor(toRelMs / dayMs);
			const fromHourOffset = (fromRelMs - fromDayIndex * dayMs) / booking_lib_duration.Duration.getUnitDurations().H * booking_const.Grid.SizeElement.WeekHourWidth;
			const toHourOffset = (toRelMs - toDayIndex * dayMs) / booking_lib_duration.Duration.getUnitDurations().H * booking_const.Grid.SizeElement.WeekHourWidth;
			return (toDayIndex - fromDayIndex) * booking_const.Grid.SizeElement.WeekCellWidth + (toHourOffset - fromHourOffset);
		}
		getDayIndex(dateTs) {
			const localDate = new Date(dateTs + this.#offset);
			const dateMidnight = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
			const weekStartDate = new Date(this.#weekStartTs);
			const weekStartMidnight = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate());
			const diffDays = Math.round((dateMidnight - weekStartMidnight) / booking_lib_duration.Duration.getUnitDurations().d);
			return Math.max(0, Math.min(diffDays, booking_const.Grid.Duration.Week - 1));
		}
		get bookingWeekStartTs() {
			const weekStartDate = new Date(this.#weekStartTs);
			return new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate()).getTime() - this.#offset;
		}
		get #weekStartTs() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/selectedFirstDayPeriodTs`] + this.#offset;
		}
		get #offset() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/offset`];
		}
		get #resourcesIds() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/resourcesIds`];
		}
	}
	const gridWeek = new GridWeek();

	class GridFactory {
		getGrid() {
			const isWeekMode = booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/isWeekMode`];
			return isWeekMode ? gridWeek : gridDay;
		}
	}
	const gridFactory = new GridFactory();

	exports.GridBase = GridBase;
	exports.gridFactory = gridFactory;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX.Booking, BX.Booking.Const, BX.Booking.Lib);
//# sourceMappingURL=grid.bundle.js.map
