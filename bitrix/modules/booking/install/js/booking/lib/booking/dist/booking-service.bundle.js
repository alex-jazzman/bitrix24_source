/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, booking_lib_datePeriod, booking_lib_duration) {
	'use strict';

	class BookingService {
		generateKey(booking) {
			return `${booking.id}-${booking.resourcesIds[0]}`;
		}
		getVisiblePeriod(booking, period) {
			return booking_lib_datePeriod.DatePeriod.intersect({
				fromTs: booking.dateFromTs,
				toTs: booking.dateToTs
			}, period);
		}
		getVisibleDuration(booking, period) {
			return booking_lib_datePeriod.DatePeriod.getDuration(this.getVisiblePeriod(booking, period));
		}
		getBookingIntersectedDayIndexes(booking, period) {
			const bookingVisiblePeriod = this.getVisiblePeriod(booking, period);
			return {
				fromIndex: Math.floor((bookingVisiblePeriod.fromTs - period.fromTs) / booking_lib_duration.Duration.getUnitDurations().d),
				toIndex: Math.floor((bookingVisiblePeriod.toTs - 1 - period.fromTs) / booking_lib_duration.Duration.getUnitDurations().d)
			};
		}
		isVisibleByMinDuration(booking, period, minDuration) {
			return this.getVisibleDuration(booking, period) >= minDuration;
		}
	}
	const bookingService = new BookingService();

	exports.bookingService = bookingService;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX.Booking.Lib, BX.Booking.Lib);
//# sourceMappingURL=booking-service.bundle.js.map
