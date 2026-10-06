export type BookingUIFilter = {
	CREATED_BY?: string[],
	CONTACT?: string[],
	COMPANY?: string[],
	RESOURCE?: string[],
	RESOURCE_label?: string[],
	CONFIRMED?: 'Y' | 'N',
	REQUIRE_ATTENTION?: 'D' | 'AC',
};

export type BookingFilterPeriod = {
	DATE_FROM: number,
	DATE_TO?: number,
};

export type BookingListFilter = {
	WITHIN?: BookingFilterPeriod,
	CREATED_BY?: number[],
	CRM_CONTACT_ID?: number[],
	CRM_COMPANY_ID?: number[],
	RESOURCE_ID?: number[],
	IS_CONFIRMED?: 0 | 1,
	IS_DELAYED?: boolean,
	HAS_DELAYED_COUNTER?: boolean,
	HAS_NOT_CONFIRMED_COUNTER?: boolean,
	ID?: number[],
	HAS_COUNTER_OF_TYPE?: string,
};

export type BookingListFilterWithPeriod = BookingListFilter & {
	WITHIN: BookingFilterPeriod,
};
