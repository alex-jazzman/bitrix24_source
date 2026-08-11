import { type Store } from 'ui.vue3.vuex';

import { Core } from 'booking.core';
import { Grid, Model } from 'booking.const';
import { Utils } from 'booking.lib.utils';
import { Duration } from 'booking.lib.duration';
import { calendarService } from 'booking.provider.service.calendar-service';

const DayMs = Duration.getUnitDurations().d;
const WeekMs = DayMs * Grid.Duration.Week;

class FilterResultNavigator
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

	getOptimalFilterDateTs(inFuture = false): Promise<number>
	{
		const isWeekMode = this.#isWeekMode();

		const count = this.$store.getters[`${Model.Filter}/datesCount`]?.count ?? 0;
		const maxDate = this.$store.getters[`${Model.Filter}/datesCount`]?.maxDate;
		const minDate = this.$store.getters[`${Model.Filter}/datesCount`]?.minDate;
		const selectedDateTs: number = this.$store.getters[`${Model.Interface}/selectedDateTs`] - this.#getOffset();
		const selectedFirstDayPeriodTs = this.$store.getters[`${Model.Interface}/selectedFirstDayPeriodTs`];

		if (count === 0)
		{
			return isWeekMode ? selectedFirstDayPeriodTs : selectedDateTs;
		}

		if (maxDate !== null && (this.#getDateTs(maxDate) > selectedDateTs || inFuture))
		{
			return this.getNextFilterDateTs((inFuture ? this.#getTodayTs() : selectedDateTs) - DayMs, inFuture);
		}

		if (minDate !== null && this.#getDateTs(minDate) < selectedDateTs)
		{
			return this.getPreviousFilterDateTs(selectedDateTs + DayMs);
		}

		return isWeekMode ? selectedFirstDayPeriodTs : selectedDateTs;
	}

	async getPreviousFilterDateTs(startingDateTs: ?number): Promise<number | null>
	{
		if (this.#isWeekMode())
		{
			return this.#getPreviousFilterWeekStartTs(startingDateTs);
		}

		return this.#getPreviousFilterDayTs(startingDateTs);
	}

	async getNextFilterDateTs(startingDateTs: ?number, inFuture = false): Promise<number | null>
	{
		if (this.#isWeekMode())
		{
			return this.#getNextFilterWeekStartTs(startingDateTs, inFuture);
		}

		return this.#getNextFilterDayTs(startingDateTs, inFuture);
	}

	async #getPreviousFilterDayTs(startingDateTs: ?number): Promise<number | null>
	{
		const minDate = this.$store.getters[`${Model.Filter}/datesCount`]?.minDate;
		if (minDate === null)
		{
			return null;
		}

		const minDateTs = this.#getDateTs(minDate);
		const selectedDateTs = startingDateTs ?? (this.$store.getters[`${Model.Interface}/selectedDateTs`] + this.#getOffset());

		if (selectedDateTs <= minDateTs)
		{
			return minDateTs;
		}

		const maxDateTs = this.#getDateTs(this.$store.getters[`${Model.Filter}/datesCount`]?.maxDate);
		if (selectedDateTs > maxDateTs)
		{
			return maxDateTs;
		}

		const previousFilterDate = this.#findPreviousDate(selectedDateTs);
		if (previousFilterDate)
		{
			return previousFilterDate;
		}

		const previousDate = new Date(selectedDateTs - DayMs);

		await this.#loadNextFilterDates(previousDate.getTime(), minDateTs);

		return this.#findPreviousDate(selectedDateTs) ?? null;
	}

	async #getNextFilterDayTs(startingDateTs: ?number, inFuture = false): Promise<number | null>
	{
		const maxDate = this.$store.getters[`${Model.Filter}/datesCount`]?.maxDate;
		if (maxDate === null)
		{
			return null;
		}

		const selectedDateTs: number = startingDateTs
			?? (this.$store.getters[`${Model.Interface}/selectedDateTs`] + this.#getOffset())
		;

		const maxDateTs = this.#getDateTs(maxDate);
		if (selectedDateTs >= maxDateTs)
		{
			return maxDateTs;
		}

		const minDateTs = this.#getDateTs(this.$store.getters[`${Model.Filter}/datesCount`]?.minDate);
		if (selectedDateTs < minDateTs)
		{
			return minDateTs;
		}

		const nextFilterDate = this.#findNextDate(selectedDateTs, inFuture);
		if (nextFilterDate)
		{
			return nextFilterDate;
		}

		const nextDate = new Date(selectedDateTs + DayMs); // + (inFuture ? 0 : DayMs));

		await this.#loadNextFilterDates(nextDate.getTime(), maxDateTs);

		return this.#findNextDate(selectedDateTs) ?? null;
	}

	#getTodayTs(): number
	{
		const today = new Date();

		return Math.trunc(today.getTime() / 1000) * 1000;
	}

	#getDateTs(date: Date | string | number): number
	{
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);

		return d.getTime();
	}

	#getOffset(): number
	{
		return this.$store.getters[`${Model.Interface}/offset`];
	}

	#isWeekMode(): boolean
	{
		return this.$store.getters[`${Model.Interface}/isWeekMode`];
	}

	#getFirstWeekDay(): number
	{
		return this.$store.getters[`${Model.Interface}/firstWeekDay`];
	}

	#getWeekStartTs(dateTs: number): number
	{
		return Utils.time.getWeekStartTs(dateTs, this.#getFirstWeekDay());
	}

	#getSelectedWeekStartTs(): number
	{
		return this.$store.getters[`${Model.Interface}/selectedFirstDayPeriodTs`] + this.#getOffset();
	}

	#getWeekStarts(): number[]
	{
		const weekStarts = new Set(
			this.$store.state[Model.Filter].filterDates.map((dateTs) => this.#getWeekStartTs(dateTs)),
		);

		return [...weekStarts].sort((a, b) => a - b);
	}

	async #getPreviousFilterWeekStartTs(startingDateTs: ?number): Promise<number | null>
	{
		const minDate = this.$store.getters[`${Model.Filter}/datesCount`]?.minDate;

		if (minDate === null)
		{
			return null;
		}

		const minWeekStartTs = this.#getWeekStartTs(this.#getDateTs(minDate));
		const selectedWeekStartTs = this.#getWeekStartTs(startingDateTs ?? this.#getSelectedWeekStartTs());

		if (selectedWeekStartTs <= minWeekStartTs)
		{
			return minWeekStartTs;
		}

		const maxWeekStartTs = this.#getWeekStartTs(this.#getDateTs(this.$store.getters[`${Model.Filter}/datesCount`]?.maxDate));
		if (selectedWeekStartTs > maxWeekStartTs)
		{
			return maxWeekStartTs;
		}

		const previousFilterWeekStart = this.#findPreviousWeekStart(selectedWeekStartTs);
		if (previousFilterWeekStart)
		{
			return previousFilterWeekStart;
		}

		const previousWeek = new Date(selectedWeekStartTs - DayMs);

		await this.#loadNextFilterDates(previousWeek.getTime(), minWeekStartTs);

		return this.#findPreviousWeekStart(selectedWeekStartTs) ?? null;
	}

	async #getNextFilterWeekStartTs(startingDateTs: ?number, inFuture = false): Promise<number | null>
	{
		const maxDate = this.$store.getters[`${Model.Filter}/datesCount`]?.maxDate;

		if (maxDate === null)
		{
			return null;
		}

		const selectedWeekStartTs = this.#getWeekStartTs(
			startingDateTs ?? this.#getSelectedWeekStartTs(),
		);
		const maxWeekStartTs = this.#getWeekStartTs(this.#getDateTs(maxDate));

		if (selectedWeekStartTs >= maxWeekStartTs)
		{
			return maxWeekStartTs;
		}

		const minWeekStartTs = this.#getWeekStartTs(
			this.#getDateTs(this.$store.getters[`${Model.Filter}/datesCount`]?.minDate),
		);
		if (selectedWeekStartTs < minWeekStartTs)
		{
			return minWeekStartTs;
		}

		const nextFilterWeekStart = this.#findNextWeekStart(selectedWeekStartTs, inFuture);
		if (nextFilterWeekStart)
		{
			return nextFilterWeekStart;
		}

		const nextWeek = new Date(selectedWeekStartTs + WeekMs);

		await this.#loadNextFilterDates(nextWeek.getTime(), maxWeekStartTs);

		return this.#findNextWeekStart(selectedWeekStartTs, inFuture) ?? null;
	}

	async #loadNextFilterDates(selectedDateTs: number, limitDateTs: number): Promise<void>
	{
		const filterFields = this.$store.getters[`${Model.Filter}/fields`];

		await calendarService.loadNextFilterMarks(filterFields, selectedDateTs, limitDateTs);
	}

	#findPreviousDate(selectedDateTs: number): number | undefined
	{
		return this.$store.state[Model.Filter].filterDates.findLast((dateTs) => dateTs < selectedDateTs);
	}

	#findPreviousWeekStart(selectedWeekStartTs: number): number | undefined
	{
		return this.#getWeekStarts().findLast((weekStartTs) => weekStartTs < selectedWeekStartTs);
	}

	#findNextDate(viewDateTs: number, inFuture = false): number | undefined
	{
		const filterDates = [...this.$store.state[Model.Filter].filterDates].sort();

		if (inFuture)
		{
			return filterDates.find((dateTs) => dateTs >= viewDateTs);
		}

		return filterDates.find((dateTs) => dateTs > viewDateTs);
	}

	#findNextWeekStart(viewWeekStartTs: number, inFuture = false): number | undefined
	{
		const weekStarts = this.#getWeekStarts();

		if (inFuture)
		{
			return weekStarts.find((weekStartTs) => weekStartTs >= viewWeekStartTs);
		}

		return weekStarts.find((weekStartTs) => weekStartTs > viewWeekStartTs);
	}
}

export const filterResultNavigator = new FilterResultNavigator();
