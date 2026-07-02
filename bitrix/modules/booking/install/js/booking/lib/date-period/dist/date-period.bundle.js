/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, booking_core, booking_const) {
	'use strict';

	const DayDurationTs = 24 * 60 * 60;
	class DatePeriod {
		static createByCurrentGridMode() {
			const store = booking_core.Core.getStore();
			const selectedDateTs = store.getters[`${booking_const.Model.Interface}/selectedDateTs`];
			const selectedFirstDayPeriodTs = store.getters[`${booking_const.Model.Interface}/selectedFirstDayPeriodTs`];
			const isWeekMode = store.getters[`${booking_const.Model.Interface}/isWeekMode`];
			const periodStartTs = isWeekMode ? selectedFirstDayPeriodTs : selectedDateTs;
			const durationDays = isWeekMode ? booking_const.Grid.Duration.Week : booking_const.Grid.Duration.Day;
			return DatePeriod.create(periodStartTs / 1000, durationDays);
		}
		static create(fromTs, durationDays = booking_const.Grid.Duration.Day) {
			const periodStartTs = Math.floor(fromTs);
			return {
				fromTs: periodStartTs,
				toTs: periodStartTs + durationDays * DayDurationTs
			};
		}
		static intersect(firstPeriod, secondPeriod) {
			return {
				fromTs: Math.max(firstPeriod.fromTs, secondPeriod.fromTs),
				toTs: Math.min(firstPeriod.toTs, secondPeriod.toTs)
			};
		}
		static isIntersect(firstPeriod, secondPeriod) {
			return firstPeriod.fromTs < secondPeriod.toTs && secondPeriod.fromTs < firstPeriod.toTs;
		}
		static getDuration(datePeriod) {
			return Math.max(0, datePeriod.toTs - datePeriod.fromTs);
		}
		static merge(datePeriods) {
			return datePeriods.map(({
				fromTs,
				toTs
			}) => ({
				fromTs,
				toTs
			})).sort((firstPeriod, secondPeriod) => firstPeriod.fromTs - secondPeriod.fromTs).reduce((acc, {
				fromTs,
				toTs
			}) => {
				const lastPeriod = acc[acc.length - 1];
				if (lastPeriod && lastPeriod.toTs >= fromTs) {
					if (lastPeriod.toTs < toTs) {
						lastPeriod.toTs = toTs;
					}
					return acc;
				}
				acc.push({
					fromTs,
					toTs
				});
				return acc;
			}, []).filter(({
				fromTs,
				toTs
			}) => toTs > fromTs);
		}
		static getDates(datePeriod) {
			const dates = [];
			for (let dateTs = datePeriod.fromTs; dateTs < datePeriod.toTs; dateTs += DayDurationTs) {
				dates.push(dateTs);
			}
			return dates;
		}
	}

	exports.DatePeriod = DatePeriod;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX.Booking, BX.Booking.Const);
//# sourceMappingURL=date-period.bundle.js.map
