/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, booking_core, booking_const, booking_lib_duration, main_core) {
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
		calculateWidth(...args) {
			throw new Error('Method calculateWidth must be implemented');
		}
		getUnitDurations() {
			return booking_lib_duration.Duration.getUnitDurations();
		}
	}

	const HoursInDay = 24;
	const GridTokenKey = Object.freeze({
		DayCellWidth: 'DayCellWidth',
		DayCellHeight: 'DayCellHeight',
		DayHourHeight: 'DayHourHeight',
		DayDaysPanelHeight: 'DayDaysPanelHeight',
		WeekCellWidth: 'WeekCellWidth',
		WeekCellHeight: 'WeekCellHeight',
		WeekCellPadding: 'WeekCellPadding',
		WeekDaysPanelHeight: 'WeekDaysPanelHeight',
		LeftPanelWidthDay: 'LeftPanelWidthDay',
		LeftPanelWidthAmPm: 'LeftPanelWidthAmPm',
		LeftPanelWidthWeek: 'LeftPanelWidthWeek',
		SidebarZoneWidth: 'SidebarZoneWidth',
		WeekHourWidth: 'WeekHourWidth'
	});
	const GridTokenCssVar = {
		DayCellWidth: '--booking-day-cell-width',
		DayCellHeight: '--booking-day-cell-height',
		DayHourHeight: '--booking-day-hour-height',
		DayDaysPanelHeight: '--booking-day-days-panel-height',
		WeekCellWidth: '--booking-week-cell-width',
		WeekCellHeight: '--booking-week-cell-height',
		WeekCellPadding: '--booking-week-cell-padding',
		WeekDaysPanelHeight: '--booking-week-days-panel-height',
		LeftPanelWidthDay: '--booking-day-left-panel-width',
		LeftPanelWidthAmPm: '--booking-am-pm-left-panel-width',
		LeftPanelWidthWeek: '--booking-week-left-panel-width',
		SidebarZoneWidth: '--booking-sidebar-zone-width'
	};

	class GridTokens {
		#tokens = null;
		async init(baseElement) {
			if (!main_core.Type.isDomNode(baseElement)) {
				throw new Error('Booking.GridTokens: baseElement is incorrect');
			}
			const computedStyles = getComputedStyle(baseElement);
			const tokens = {};
			for (const tokenKey of Object.keys(GridTokenCssVar)) {
				tokens[tokenKey] = this.#parseToken(computedStyles, tokenKey);
			}
			tokens.WeekHourWidth = tokens.WeekCellWidth / HoursInDay;
			this.#tokens = tokens;
		}
		get(key) {
			if (this.#tokens === null) {
				throw new Error('Booking.GridTokens: is not initialized');
			}
			return this.#tokens[key];
		}
		#parseToken(computedStyles, tokenKey) {
			const cssVar = GridTokenCssVar[tokenKey];
			const rawValue = computedStyles.getPropertyValue(cssVar).trim();
			if (rawValue === '') {
				throw new Error(`Booking.GridTokens: token ${cssVar} is not defined`);
			}
			const parsedValue = Number.parseFloat(rawValue);
			if (!Number.isFinite(parsedValue)) {
				throw new TypeError(`Booking.GridTokens: token ${cssVar} is incorrect`);
			}
			return parsedValue;
		}
	}
	const gridTokens = new GridTokens();

	class GridDay extends GridBase {
		calculateLeft(resourceId) {
			const cellWidth = gridTokens.get(GridTokenKey.DayCellWidth) * this.#zoom;
			const indexOfResource = this.#resourcesIds.indexOf(resourceId);
			return indexOfResource * cellWidth;
		}
		calculateTop(fromTs) {
			const from = new Date(Math.max(this.#selectedDateTs, fromTs + this.#offset));
			const bookingMinutes = from.getHours() * 60 + from.getMinutes();
			const fromMinutes = this.#fromHour * 60;
			return (bookingMinutes - fromMinutes) * (this.#hourHeight / 60);
		}
		calculateHeight(fromTs, toTs) {
			const minHeight = this.#hourHeight / 4;
			const from = Math.max(this.#selectedDateTs, fromTs + this.#offset);
			const to = Math.min(new Date(this.#selectedDateTs).setHours(24), toTs + this.#offset);
			return Math.max((to - from) / booking_lib_duration.Duration.getUnitDurations().H * this.#hourHeight, minHeight);
		}
		calculateWidth(width) {
			return width * this.#zoom;
		}
		calculateRealHeight(fromTs, toTs) {
			const minHeight = this.#hourHeight / 4;
			const minTs = new Date(this.#selectedDateTs).setHours(this.#offHoursExpanded ? 0 : this.#fromHour);
			const maxTs = new Date(this.#selectedDateTs).setHours(this.#offHoursExpanded ? 24 : this.#toHour);
			const from = Math.max(minTs, fromTs + this.#offset);
			const to = Math.min(maxTs, toTs + this.#offset);
			return Math.max((to - from) / booking_lib_duration.Duration.getUnitDurations().H * this.#hourHeight, minHeight);
		}
		get #hourHeight() {
			return gridTokens.get(GridTokenKey.DayHourHeight) * this.#zoom;
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
			const dayOffset = dayIndex * gridTokens.get(GridTokenKey.WeekCellWidth) * this.#zoom;
			const weekStartTs = this.bookingWeekStartTs;
			const dayMs = booking_lib_duration.Duration.getUnitDurations().d;
			const dayStartTs = weekStartTs + dayIndex * dayMs;
			const hourOffset = (fromTs - dayStartTs) / booking_lib_duration.Duration.getUnitDurations().H * gridTokens.get(GridTokenKey.WeekHourWidth) * this.#zoom;
			return dayOffset + hourOffset;
		}
		calculateTop(resourceId) {
			const index = this.#resourcesIds.indexOf(resourceId);
			return gridTokens.get(GridTokenKey.WeekDaysPanelHeight) + index * gridTokens.get(GridTokenKey.WeekCellHeight);
		}
		calculateHeight() {
			return gridTokens.get(GridTokenKey.WeekCellHeight);
		}
		calculateWidth(fromTs, toTs) {
			const weekStartTs = this.bookingWeekStartTs;
			return this.#msToPixels(toTs - weekStartTs) - this.#msToPixels(fromTs - weekStartTs);
		}
		#msToPixels(ms) {
			const dayMs = booking_lib_duration.Duration.getUnitDurations().d;
			const dayIndex = Math.floor(ms / dayMs);
			const msWithinDay = ms - dayIndex * dayMs;
			const dayPixels = dayIndex * gridTokens.get(GridTokenKey.WeekCellWidth) * this.#zoom;
			const hourPixels = msWithinDay / booking_lib_duration.Duration.getUnitDurations().H * gridTokens.get(GridTokenKey.WeekHourWidth) * this.#zoom;
			return dayPixels + hourPixels;
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
		get #zoom() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/zoom`];
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
	exports.GridTokenCssVar = GridTokenCssVar;
	exports.GridTokenKey = GridTokenKey;
	exports.gridFactory = gridFactory;
	exports.gridTokens = gridTokens;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX.Booking, BX.Booking.Const, BX.Booking.Lib, BX);
//# sourceMappingURL=grid.bundle.js.map
