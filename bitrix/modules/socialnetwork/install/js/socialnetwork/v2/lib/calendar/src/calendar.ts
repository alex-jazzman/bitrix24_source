import { Extension, Loc } from 'main.core';
import { DateTimeFormat, DurationFormat } from 'main.date';

import { Timezone } from 'socialnetwork.v2.lib.timezone';
import { type CalendarSettings, type FormatDateTimeOptions } from './types';

const settings = Extension.getSettings('socialnetwork.v2.lib.calendar') as CalendarSettings;
const holidays = new Set(settings.HOLIDAYS.map(({ M, D }) => `${M}.${D}`));
const weekends = new Set(
	settings.WEEKEND.map(
		(it) => ({ SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 })[it],
	),
);
const { H: startH, M: startM } = settings.HOURS.START;
const { H: endH, M: endM } = settings.HOURS.END;

const unitDurations = DurationFormat.getUnitDurations();
const workdayDuration = (endH * 60 + endM - (startH * 60 + startM)) * 60000;

export class Calendar
{
	static get weekStart(): string
	{
		return settings.WEEK_START;
	}

	static get workdayDuration(): number
	{
		return workdayDuration;
	}

	static get workdayStart(): { H: number; M: number }
	{
		return settings.HOURS.START;
	}

	static get dayStartTime(): string
	{
		return `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
	}

	static get dayEndTime(): string
	{
		return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
	}

	static formatDateTime(
		timestamp: number,
		options: FormatDateTimeOptions | null = null,
	): string
	{
		if (!timestamp)
		{
			return '';
		}

		const { forceYear = false, removeOffset = false } = options || {};

		const showYear = forceYear
			|| new Date(timestamp).getFullYear() !== new Date().getFullYear();
		const format = Loc.getMessage('SONET_EXT_V2_DATE_TIME_FORMAT', {
			'#DATE#': DateTimeFormat.getFormat(showYear ? 'LONG_DATE_FORMAT' : 'DAY_MONTH_FORMAT') || '',
			'#TIME#': DateTimeFormat.getFormat('SHORT_TIME_FORMAT') || '',
		});
		const offset = removeOffset ? 0 : Timezone.getOffset(timestamp);

		return DateTimeFormat.format(format, (timestamp + offset) / 1000);
	}

	static formatDate(
		timestamp: number,
		options: Pick<FormatDateTimeOptions, 'forceYear'> | null = null,
	): string
	{
		if (!timestamp)
		{
			return '';
		}

		const showYear = options?.forceYear || new Date(timestamp).getFullYear() !== new Date().getFullYear();
		const format = DateTimeFormat.getFormat(
			showYear ? 'LONG_DATE_FORMAT' : 'DAY_MONTH_FORMAT',
		);
		const offset = Timezone.getOffset(timestamp);

		return DateTimeFormat.format(format, (timestamp + offset) / 1000);
	}

	static formatTime(timestamp: number): string
	{
		if (!timestamp)
		{
			return '';
		}

		const format = DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
		const offset = Timezone.getOffset(timestamp);

		return DateTimeFormat.format(format, (timestamp + offset) / 1000);
	}

	static calculateDuration(startTs: number, end: number): number
	{
		const dayEnd = Calendar.setHours(startTs, endH, endM);
		if (end < dayEnd)
		{
			return end - startTs;
		}

		let start = Calendar.setHours(startTs + unitDurations.d, startH, startM);
		let duration = dayEnd - startTs;
		while (start < end)
		{
			if (Calendar.isWorkDay(start))
			{
				duration += Math.min(start + workdayDuration, end) - start;
			}

			start += unitDurations.d;
		}

		return duration;
	}

	static isWorkDay(timestamp: number): boolean
	{
		const date = new Date(timestamp);

		return (
			!weekends.has(date.getUTCDay())
			&& !holidays.has(`${date.getUTCMonth() + 1}.${date.getUTCDate()}`)
		);
	}

	static setHours(timestamp: number, hours: number, minutes: number): number
	{
		return (
			new Date(timestamp).setHours(hours, minutes, 0, 0) - Timezone.getOffset(timestamp)
		);
	}

	static createDateFromUtc(date: Date): Date
	{
		return new Date(
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate(),
			date.getUTCHours(),
			date.getUTCMinutes(),
		);
	}

	static isToday(timestamp: number): boolean
	{
		if (!timestamp)
		{
			return false;
		}

		const date = new Date(timestamp);
		const nowDate = new Date();

		return Calendar.#isSameCalendarDay(date, nowDate);
	}

	static #isSameCalendarDay(firstDate: Date, secondDate: Date): boolean
	{
		return (
			firstDate.getFullYear() === secondDate.getFullYear()
			&& firstDate.getMonth() === secondDate.getMonth()
			&& firstDate.getDate() === secondDate.getDate()
		);
	}
}
