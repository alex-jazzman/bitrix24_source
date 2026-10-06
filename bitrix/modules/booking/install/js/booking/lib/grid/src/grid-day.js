import { Duration } from 'booking.lib.duration';

import { GridBase } from './grid-base';
import { gridTokens } from './grid-tokens';
import { GridTokenKey, HoursInDay } from './const';

export class GridDay extends GridBase
{
	calculateLeft(resourceId: number): number
	{
		const cellWidth = gridTokens.get(GridTokenKey.DayCellWidth) * this.#zoom;
		const indexOfResource = this.#resourcesIds.indexOf(resourceId);

		return indexOfResource * cellWidth;
	}

	calculateTop(fromTs: number): number
	{
		const from = new Date(Math.max(this.#selectedDateTs, fromTs + this.#offset));
		const bookingMinutes = from.getHours() * 60 + from.getMinutes();
		const fromMinutes = this.#fromHour * 60;

		return (bookingMinutes - fromMinutes) * (this.#hourHeight / 60);
	}

	calculateHeight(fromTs: number, toTs: number): number
	{
		const minHeight = this.#hourHeight / 4;

		const from = Math.max(this.#selectedDateTs, fromTs + this.#offset);
		const to = Math.min(new Date(this.#selectedDateTs).setHours(HoursInDay), toTs + this.#offset);

		return Math.max((to - from) / Duration.getUnitDurations().H * this.#hourHeight, minHeight);
	}

	calculateWidth(width: number): number
	{
		return width * this.#zoom;
	}

	calculateRealHeight(fromTs: number, toTs: number): number
	{
		const minHeight = this.#hourHeight / 4;

		const minTs = new Date(this.#selectedDateTs).setHours(this.#offHoursExpanded ? 0 : this.#fromHour);
		const maxTs = new Date(this.#selectedDateTs).setHours(this.#offHoursExpanded ? HoursInDay : this.#toHour);
		const from = Math.max(minTs, fromTs + this.#offset);
		const to = Math.min(maxTs, toTs + this.#offset);

		return Math.max((to - from) / Duration.getUnitDurations().H * this.#hourHeight, minHeight);
	}

	get #hourHeight(): number
	{
		return gridTokens.get(GridTokenKey.DayHourHeight) * this.#zoom;
	}

	get #selectedDateTs(): number
	{
		return this.getParamValue('selectedDateTs') + this.#offset;
	}

	get #offset(): number
	{
		return this.getParamValue('offset');
	}

	get #zoom(): number
	{
		return this.getParamValue('zoom');
	}

	get #resourcesIds(): number[]
	{
		return this.getParamValue('resourcesIds');
	}

	get #fromHour(): number
	{
		return this.getParamValue('fromHour');
	}

	get #toHour(): number
	{
		return this.getParamValue('toHour');
	}

	get #offHoursExpanded(): boolean
	{
		return this.getParamValue('offHoursExpanded');
	}
}
