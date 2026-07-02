import { DatePeriod, type DatePeriodTs } from 'booking.lib.date-period';
import { Duration } from 'booking.lib.duration';
import { type BookingModel } from 'booking.model.bookings';

type BookingIntersectedDayIndexes = {
	fromIndex: number,
	toIndex: number,
};

class BookingService
{
	generateKey(booking: BookingModel): string
	{
		return `${booking.id}-${booking.resourcesIds[0]}`;
	}

	getVisiblePeriod(booking: BookingModel, period: DatePeriodTs): DatePeriodTs
	{
		return DatePeriod.intersect({
			fromTs: booking.dateFromTs,
			toTs: booking.dateToTs,
		}, period);
	}

	getVisibleDuration(booking: BookingModel, period: DatePeriodTs): number
	{
		return DatePeriod.getDuration(this.getVisiblePeriod(booking, period));
	}

	getBookingIntersectedDayIndexes(booking: BookingModel, period: DatePeriodTs): BookingIntersectedDayIndexes
	{
		const bookingVisiblePeriod = this.getVisiblePeriod(booking, period);

		return {
			fromIndex: Math.floor((bookingVisiblePeriod.fromTs - period.fromTs) / Duration.getUnitDurations().d),
			toIndex: Math.floor((bookingVisiblePeriod.toTs - 1 - period.fromTs) / Duration.getUnitDurations().d),
		};
	}

	isVisibleByMinDuration(booking: BookingModel, period: DatePeriodTs, minDuration: number): boolean
	{
		return this.getVisibleDuration(booking, period) >= minDuration;
	}
}

export const bookingService: BookingService = new BookingService();
