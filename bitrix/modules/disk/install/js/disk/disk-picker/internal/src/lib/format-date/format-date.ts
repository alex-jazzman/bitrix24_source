import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

// Absolute date formatting for the picker. Dates go ONLY through the product
// formatter (`main.date`), which respects the site locale and settings; native
// language date formatting is forbidden. The timestamp is in SECONDS, matching
// what `DateTimeFormat.format` expects.
export function formatDate(timestampInSeconds: number | null): string
{
	if (!Type.isNumber(timestampInSeconds))
	{
		return '';
	}

	return DateTimeFormat.format(DateTimeFormat.getFormat('FORMAT_DATE'), timestampInSeconds);
}

// The day a moment falls on, named the way a reader names it: today by word, a day of this
// year by day and month, anything older by its full date. The word for today is passed in, so
// this module stays free of the language files.
function formatRelativeDate(timestampInSeconds: number, todayText: string, nowInSeconds: number): string
{
	const dayKey = (timestamp: number): string => DateTimeFormat.format('Y-m-d', timestamp);

	if (dayKey(timestampInSeconds) === dayKey(nowInSeconds))
	{
		return todayText;
	}

	if (DateTimeFormat.format('Y', timestampInSeconds) === DateTimeFormat.format('Y', nowInSeconds))
	{
		return DateTimeFormat.format(DateTimeFormat.getFormat('DAY_MONTH_FORMAT'), timestampInSeconds);
	}

	return formatDate(timestampInSeconds);
}

export function formatTableDate(
	timestampInSeconds: number | null,
	todayText: string,
	nowInSeconds: number = Math.floor(Date.now() / 1000),
): string
{
	if (!Type.isNumber(timestampInSeconds))
	{
		return '';
	}

	return formatRelativeDate(timestampInSeconds, todayText, nowInSeconds);
}
