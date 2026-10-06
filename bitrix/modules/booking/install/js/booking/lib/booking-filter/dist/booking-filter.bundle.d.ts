/* eslint-disable */
type BookingStore = ReturnType<typeof BX.Booking.Core.getStore>;

type BookingUIFilter = {
	CREATED_BY?: string[];
	CONTACT?: string[];
	COMPANY?: string[];
	RESOURCE?: string[];
	RESOURCE_label?: string[];
	CONFIRMED?: 'Y' | 'N';
	REQUIRE_ATTENTION?: 'D' | 'AC';
};

type BookingListFilterWithPeriod = BookingListFilter & {
	WITHIN: BookingFilterPeriod;
};

type BookingListFilter = {
	WITHIN?: BookingFilterPeriod;
	CREATED_BY?: number[];
	CRM_CONTACT_ID?: number[];
	CRM_COMPANY_ID?: number[];
	RESOURCE_ID?: number[];
	IS_CONFIRMED?: 0 | 1;
	IS_DELAYED?: boolean;
	HAS_DELAYED_COUNTER?: boolean;
	HAS_NOT_CONFIRMED_COUNTER?: boolean;
	ID?: number[];
	HAS_COUNTER_OF_TYPE?: string;
};

type BookingFilterPeriod = {
	DATE_FROM: number;
	DATE_TO?: number;
};

declare namespace BX.Booking.Lib {
	const bookingFilter: BookingFilter;

	class BookingFilter {
		private store;
		get $store(): BookingStore;
		prepareFilter(fields: BookingUIFilter, withinMonth?: boolean): BookingListFilterWithPeriod;
		private getPeriodStartTs;
		private getPeriodEndTs;
		private appendEntityFilters;
	}

	const bookingDateCountFilter: BookingDateCountFilter;

	class BookingDateCountFilter extends BookingFilter {
		prepareUndatedFilter(fields: BookingUIFilter, withinMonth?: boolean): BookingListFilter;
		prepareFutureOnlyFilter(fields: BookingUIFilter, withinMonth?: boolean): BookingListFilter;
		prepareFutureFilter(fields: BookingUIFilter, withinMonth?: boolean): BookingListFilterWithPeriod;
	}
}
