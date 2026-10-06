import { type DatePeriodTs } from 'booking.lib.date-period';
import { type BookingModel } from 'booking.model.bookings';

class BookingService
{
	public generateKey(booking: Pick<BookingModel, 'id' | 'resourcesIds'>): string
	{
		return `${booking.id}-${booking.resourcesIds[0]}`;
	}

	public getVisiblePeriod(booking: Pick<BookingModel, 'dateFromTs' | 'dateToTs'>, period: DatePeriodTs): DatePeriodTs
	{
		return {
			fromTs: Math.max(booking.dateFromTs, period.fromTs),
			toTs: Math.min(booking.dateToTs, period.toTs),
		};
	}

	public getVisibleDuration(booking: Pick<BookingModel, 'dateFromTs' | 'dateToTs'>, period: DatePeriodTs): number
	{
		const visiblePeriod = this.getVisiblePeriod(booking, period);

		return Math.max(0, visiblePeriod.toTs - visiblePeriod.fromTs);
	}

	public isVisibleByMinDuration(
		booking: Pick<BookingModel, 'dateFromTs' | 'dateToTs'>,
		period: DatePeriodTs,
		minDuration: number,
	): boolean
	{
		return this.getVisibleDuration(booking, period) >= minDuration;
	}
}

export const bookingService: BookingService = new BookingService();
