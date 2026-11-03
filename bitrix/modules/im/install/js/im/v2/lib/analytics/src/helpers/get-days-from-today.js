import { Type } from 'main.core';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const toLocalMidnight = (date: Date): Date => {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/**
 * A 'YYYY-MM-DD' key names a day of the user's own calendar, so it is read into the local midnight
 * of that day: new Date(key) would read the same string as UTC midnight and name the previous day
 * west of Greenwich. The shared reader of the key lives in im.v2.provider.service.date-navigation
 * and is not taken from there on purpose: this lib is loaded by every surface of the messenger and
 * would then depend on the service of a single feature.
 */
export function parseCalendarDay(day: string): Date
{
	const [year, month, date] = day.split('-').map((part: string) => Number.parseInt(part, 10));

	return new Date(year, month - 1, date);
}

/**
 * Full days between the day of `date` and the day of `today`, counted in the user's own calendar:
 * both ends are reduced to local midnight, so a jump made a minute before midnight counts the same
 * as one made at noon of the same day, and rounding absorbs the 23/25-hour days of a DST switch.
 * An unusable date gives null - the caller drops its label instead of sending `daysCnt_NaN`.
 */
export function getDaysFromToday(date: Date, today: Date = new Date()): number | null
{
	if (!Type.isDate(date) || Number.isNaN(date.getTime()))
	{
		return null;
	}

	return Math.round((toLocalMidnight(today).getTime() - toLocalMidnight(date).getTime()) / MS_IN_DAY);
}
