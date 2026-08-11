import { Core } from 'booking.core';
import { Grid, Model } from 'booking.const';
import { Duration } from 'booking.lib.duration';

import { GridBase } from './grid-base';
import { gridTokens } from './grid-tokens';
import { GridTokenKey } from './const';

class GridWeek extends GridBase
{
	calculateLeft(dayIndex: number, fromTs: number): number
	{
		const dayOffset = dayIndex * gridTokens.get(GridTokenKey.WeekCellWidth) * this.#zoom;
		const weekStartTs = this.bookingWeekStartTs;
		const dayMs = Duration.getUnitDurations().d;
		const dayStartTs = weekStartTs + dayIndex * dayMs;
		const hourOffset = (fromTs - dayStartTs)
			/ Duration.getUnitDurations().H
			* gridTokens.get(GridTokenKey.WeekHourWidth)
			* this.#zoom
		;

		return dayOffset + hourOffset;
	}

	calculateTop(resourceId: number): number
	{
		const index = this.#resourcesIds.indexOf(resourceId);

		return gridTokens.get(GridTokenKey.WeekDaysPanelHeight) + index * gridTokens.get(GridTokenKey.WeekCellHeight);
	}

	calculateHeight(): number
	{
		return gridTokens.get(GridTokenKey.WeekCellHeight);
	}

	calculateWidth(fromTs: number, toTs: number): number
	{
		const weekStartTs = this.bookingWeekStartTs;

		return this.#msToPixels(toTs - weekStartTs) - this.#msToPixels(fromTs - weekStartTs);
	}

	#msToPixels(ms: number): number
	{
		const dayMs = Duration.getUnitDurations().d;
		const dayIndex = Math.floor(ms / dayMs);
		const msWithinDay = ms - dayIndex * dayMs;

		const dayPixels = dayIndex * gridTokens.get(GridTokenKey.WeekCellWidth) * this.#zoom;
		const hourPixels = msWithinDay
			/ Duration.getUnitDurations().H
			* gridTokens.get(GridTokenKey.WeekHourWidth)
			* this.#zoom
		;

		return dayPixels + hourPixels;
	}

	getDayIndex(dateTs: number): number
	{
		const localDate = new Date(dateTs + this.#offset);
		const dateMidnight = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());

		const weekStartDate = new Date(this.#weekStartTs);
		const weekStartMidnight = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate());

		const diffDays = Math.round((dateMidnight - weekStartMidnight) / Duration.getUnitDurations().d);

		return Math.max(0, Math.min(diffDays, Grid.Duration.Week - 1));
	}

	get bookingWeekStartTs(): number
	{
		const weekStartDate = new Date(this.#weekStartTs);

		return new Date(
			weekStartDate.getFullYear(),
			weekStartDate.getMonth(),
			weekStartDate.getDate(),
		).getTime() - this.#offset;
	}

	get #weekStartTs(): number
	{
		return Core.getStore().getters[`${Model.Interface}/selectedFirstDayPeriodTs`] + this.#offset;
	}

	get #offset(): number
	{
		return Core.getStore().getters[`${Model.Interface}/offset`];
	}

	get #zoom(): number
	{
		return Core.getStore().getters[`${Model.Interface}/zoom`];
	}

	get #resourcesIds(): number[]
	{
		return Core.getStore().getters[`${Model.Interface}/resourcesIds`];
	}
}

export const gridWeek = new GridWeek();
