import { Type } from 'main.core';

import { Grid, Model } from 'booking.const';
import { Core } from 'booking.core';

import { ConfirmedFilterValue, CounterDictionary } from './const';
import { type BookingListFilterWithPeriod, type BookingUIFilter } from './types';

type BookingStore = ReturnType<typeof Core.getStore>;

export class BookingFilter
{
	private store: BookingStore | null = null;

	public get $store(): BookingStore
	{
		if (!this.store)
		{
			this.store = Core.getStore();
		}

		return this.store;
	}

	public prepareFilter(fields: BookingUIFilter, withinMonth = false): BookingListFilterWithPeriod
	{
		const isWeekMode = this.$store.getters[`${Model.Interface}/isWeekMode`];
		const periodStartTs = this.getPeriodStartTs(withinMonth, isWeekMode);
		const periodEndTs = this.getPeriodEndTs(periodStartTs, withinMonth, isWeekMode);

		const filter = {
			WITHIN: {
				DATE_FROM: periodStartTs / 1000,
				DATE_TO: periodEndTs / 1000,
			},
		};

		return this.appendEntityFilters(filter, fields);
	}

	private getPeriodStartTs(withinMonth: boolean, isWeekMode: boolean): number
	{
		if (withinMonth)
		{
			return this.$store.getters[`${Model.Interface}/viewDateTs`];
		}

		if (isWeekMode)
		{
			return this.$store.getters[`${Model.Interface}/selectedFirstDayPeriodTs`];
		}

		return this.$store.getters[`${Model.Interface}/selectedDateTs`];
	}

	private getPeriodEndTs(periodStartTs: number, withinMonth: boolean, isWeekMode: boolean): number
	{
		const periodEndDate = new Date(periodStartTs);

		if (withinMonth)
		{
			return periodEndDate.setMonth(periodEndDate.getMonth() + 1);
		}

		return periodEndDate.setDate(
			periodEndDate.getDate() + (isWeekMode ? Grid.Duration.Week : Grid.Duration.Day),
		);
	}

	private appendEntityFilters(
		filter: BookingListFilterWithPeriod,
		fields: BookingUIFilter,
	): BookingListFilterWithPeriod
	{
		const result: BookingListFilterWithPeriod = { ...filter };

		if (Type.isArrayFilled(fields.CREATED_BY) && fields.CREATED_BY)
		{
			result.CREATED_BY = fields.CREATED_BY.map((id: string) => Number(id));
		}

		if (Type.isArrayFilled(fields.CONTACT) && fields.CONTACT)
		{
			result.CRM_CONTACT_ID = fields.CONTACT.map((id: string) => Number(id));
		}

		if (Type.isArrayFilled(fields.COMPANY) && fields.COMPANY)
		{
			result.CRM_COMPANY_ID = fields.COMPANY.map((id: string) => Number(id));
		}

		if (Type.isArrayFilled(fields.RESOURCE) && fields.RESOURCE)
		{
			result.RESOURCE_ID = fields.RESOURCE.map((id: string) => Number(id));
		}

		if (fields.CONFIRMED)
		{
			result.IS_CONFIRMED = ConfirmedFilterValue[fields.CONFIRMED];
		}

		if (fields.REQUIRE_ATTENTION)
		{
			result.HAS_COUNTER_OF_TYPE = CounterDictionary[fields.REQUIRE_ATTENTION];
		}

		return result;
	}
}

export const bookingFilter = new BookingFilter();
