/* eslint-disable */
declare namespace BX.Booking.Lib {
	const bookingService: BookingService;

	class BookingService {
		generateKey(booking: Pick<BX.Booking.Model.BookingModel, 'id' | 'resourcesIds'>): string;
		getVisiblePeriod(booking: Pick<BX.Booking.Model.BookingModel, 'dateFromTs' | 'dateToTs'>, period: BX.Booking.Lib.DatePeriodTs): BX.Booking.Lib.DatePeriodTs;
		getVisibleDuration(booking: Pick<BX.Booking.Model.BookingModel, 'dateFromTs' | 'dateToTs'>, period: BX.Booking.Lib.DatePeriodTs): number;
		isVisibleByMinDuration(booking: Pick<BX.Booking.Model.BookingModel, 'dateFromTs' | 'dateToTs'>, period: BX.Booking.Lib.DatePeriodTs, minDuration: number): boolean;
	}
}
