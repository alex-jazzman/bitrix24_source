// Cross-module contract: calendar and disk set and read __utc themselves, so renaming it here breaks both.
/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

export function createUtcDate(
	year: number,
	monthIndex: number = 0,
	day: number = 1,
	hours: number = 0,
	minutes: number = 0,
	seconds: number = 0,
	ms: number = 0,
): Date
{
	const date = new Date(Date.UTC(year, monthIndex, day, hours, minutes, seconds, ms));

	// The year from 0 to 99 will be incremented by 1900 automatically.
	if (year < 100 && year >= 0)
	{
		date.setUTCFullYear(year);
	}

	date.__utc = true;

	return date;
}
