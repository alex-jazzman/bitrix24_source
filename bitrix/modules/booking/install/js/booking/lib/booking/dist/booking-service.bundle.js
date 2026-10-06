/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports) {
	'use strict';

	class BookingService {
		generateKey(booking) {
			return `${booking.id}-${booking.resourcesIds[0]}`;
		}
		getVisiblePeriod(booking, period) {
			return {
				fromTs: Math.max(booking.dateFromTs, period.fromTs),
				toTs: Math.min(booking.dateToTs, period.toTs)
			};
		}
		getVisibleDuration(booking, period) {
			const visiblePeriod = this.getVisiblePeriod(booking, period);
			return Math.max(0, visiblePeriod.toTs - visiblePeriod.fromTs);
		}
		isVisibleByMinDuration(booking, period, minDuration) {
			return this.getVisibleDuration(booking, period) >= minDuration;
		}
	}
	const bookingService = new BookingService();

	exports.bookingService = bookingService;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {});
//# sourceMappingURL=booking-service.bundle.js.map
