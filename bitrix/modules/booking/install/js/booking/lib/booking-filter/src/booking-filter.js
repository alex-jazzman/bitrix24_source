import { type Store } from 'ui.vue3.vuex';
import { Type } from 'main.core';

import { Grid, Model } from 'booking.const';
import { Core } from 'booking.core';
import { type BookingUIFilter, type BookingListFilter } from './types';

const CounterDictionary = Object.freeze({
	BookingDelayed: 'booking_delayed',
	BookingUnconfirmed: 'booking_unconfirmed',
});

export class BookingFilter
{
	#store: Store = null;

	get $store(): Store
	{
		if (!this.#store)
		{
			this.#store = Core.getStore();
		}

		return this.#store;
	}

	prepareFilter(fields: BookingUIFilter, withinMonth: boolean = false): BookingListFilter
	{
		const isWeekMode = this.$store.getters[`${Model.Interface}/isWeekMode`];
		const periodStartTs = this.#getPeriodStartTs(withinMonth, isWeekMode);
		const periodEndTs = this.#getPeriodEndTs(periodStartTs, withinMonth, isWeekMode);

		const filter = {
			WITHIN: {
				DATE_FROM: periodStartTs / 1000,
				DATE_TO: periodEndTs / 1000,
			},
		};

		return this.#appendEntityFilters(filter, fields);
	}

	#getPeriodStartTs(withinMonth: boolean, isWeekMode: boolean): number
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

	#getPeriodEndTs(periodStartTs: number, withinMonth: boolean, isWeekMode: boolean): number
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

	#appendEntityFilters(filter: BookingListFilter, fields: BookingUIFilter): BookingListFilter
	{
		const result = { ...filter };

		if (Type.isArrayFilled(fields.CREATED_BY))
		{
			result.CREATED_BY = fields.CREATED_BY.map((id: string) => Number(id));
		}

		if (Type.isArrayFilled(fields.CONTACT))
		{
			result.CRM_CONTACT_ID = fields.CONTACT.map((id: string) => Number(id));
		}

		if (Type.isArrayFilled(fields.COMPANY))
		{
			result.CRM_COMPANY_ID = fields.COMPANY.map((id: string) => Number(id));
		}

		if (Type.isArrayFilled(fields.RESOURCE))
		{
			result.RESOURCE_ID = fields.RESOURCE.map((id: string) => Number(id));
		}

		if (fields.CONFIRMED)
		{
			result.IS_CONFIRMED = { Y: 1, N: 0 }[fields.CONFIRMED];
		}

		if (fields.REQUIRE_ATTENTION)
		{
			result.HAS_COUNTER_OF_TYPE = {
				D: CounterDictionary.BookingDelayed,
				AC: CounterDictionary.BookingUnconfirmed,
			}[fields.REQUIRE_ATTENTION];
		}

		return result;
	}
}

export const bookingFilter = new BookingFilter();
