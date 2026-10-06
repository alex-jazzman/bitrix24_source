import { BookingFilter } from './booking-filter';
import { type BookingListFilter, type BookingListFilterWithPeriod, type BookingUIFilter } from './types';

class BookingDateCountFilter extends BookingFilter
{
	public prepareUndatedFilter(fields: BookingUIFilter, withinMonth = false): BookingListFilter
	{
		const filter: BookingListFilter = super.prepareFilter(fields, withinMonth);

		delete filter.WITHIN;

		return filter;
	}

	public prepareFutureOnlyFilter(fields: BookingUIFilter, withinMonth = false): BookingListFilter
	{
		const filter: BookingListFilter = super.prepareFilter(fields, withinMonth);

		filter.WITHIN = {
			DATE_FROM: Math.trunc(Date.now() / 1000),
		};

		return filter;
	}

	public prepareFutureFilter(fields: BookingUIFilter, withinMonth = false): BookingListFilterWithPeriod
	{
		const filter = super.prepareFilter(fields, withinMonth);
		const dateFrom = filter.WITHIN.DATE_FROM;
		const today = Math.trunc(Date.now() / 1000);

		if (dateFrom < today)
		{
			filter.WITHIN.DATE_FROM = today;
		}

		return filter;
	}
}

export const bookingDateCountFilter = new BookingDateCountFilter();
