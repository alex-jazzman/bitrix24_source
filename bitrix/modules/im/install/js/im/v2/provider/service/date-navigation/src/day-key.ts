import type { CalendarDay, CalendarMonth } from './types';

/**
 * A 'YYYY-MM-DD' key names a day of the user's own calendar, so it is read into the local midnight
 * of that day: new Date(key) would read the same string as UTC midnight and name the previous day
 * west of Greenwich.
 */
export const parseCalendarDay = (day: CalendarDay): Date => {
	const [year, month, date] = day.split('-').map((part: string) => Number.parseInt(part, 10));

	return new Date(year, month - 1, date);
};

// The first day of a 'YYYY-MM' month, read as the same local day.
export const parseCalendarMonth = (month: CalendarMonth): Date => {
	return parseCalendarDay(`${month}-01`);
};
