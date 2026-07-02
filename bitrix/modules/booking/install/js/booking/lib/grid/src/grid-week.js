import { Core } from 'booking.core';
import { Grid, Model } from 'booking.const';
import { Duration } from 'booking.lib.duration';

import { GridBase } from './grid-base';
class GridWeek extends GridBase
{
	calculateLeft(dayIndex: number, fromTs: number): number
	{
		const dayOffset = dayIndex * Grid.SizeElement.WeekCellWidth;
		const weekStartTs = this.bookingWeekStartTs;
		const dayMs = Duration.getUnitDurations().d;
		const dayStartTs = weekStartTs + dayIndex * dayMs;
		const hourOffset = (fromTs - dayStartTs) / Duration.getUnitDurations().H * Grid.SizeElement.WeekHourWidth;

		return dayOffset + hourOffset;
	}

	calculateTop(resourceId: number): number
	{
		const index = this.#resourcesIds.indexOf(resourceId);

		return Grid.SizeElement.WeekDaysPanelHeight + index * Grid.SizeElement.WeekCellHeight;
	}

	calculateHeight(): number
	{
		return Grid.SizeElement.WeekCellHeight;
	}

	calculateWidth(fromTs: number, toTs: number): number
	{
		const weekStartTs = this.bookingWeekStartTs;
		const dayMs = Duration.getUnitDurations().d;

		const fromRelMs = fromTs - weekStartTs;
		const toRelMs = toTs - weekStartTs;

		const fromDayIndex = Math.floor(fromRelMs / dayMs);
		const toDayIndex = Math.floor(toRelMs / dayMs);

		const fromHourOffset = (fromRelMs - fromDayIndex * dayMs)
			/ Duration.getUnitDurations().H
			* Grid.SizeElement.WeekHourWidth;
		const toHourOffset = (toRelMs - toDayIndex * dayMs) / Duration.getUnitDurations().H * Grid.SizeElement.WeekHourWidth;

		return (toDayIndex - fromDayIndex) * Grid.SizeElement.WeekCellWidth + (toHourOffset - fromHourOffset);
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

	get #resourcesIds(): number[]
	{
		return Core.getStore().getters[`${Model.Interface}/resourcesIds`];
	}
}

export const gridWeek = new GridWeek();
