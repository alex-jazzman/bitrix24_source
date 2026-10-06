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

	const dateKey = DateTimeFormat.format('Y-m-d', timestampInSeconds);
	const todayKey = DateTimeFormat.format('Y-m-d', nowInSeconds);
	if (dateKey === todayKey)
	{
		return todayText;
	}

	const year = DateTimeFormat.format('Y', timestampInSeconds);
	const currentYear = DateTimeFormat.format('Y', nowInSeconds);
	if (year === currentYear)
	{
		return DateTimeFormat.format(DateTimeFormat.getFormat('DAY_MONTH_FORMAT'), timestampInSeconds);
	}

	return formatDate(timestampInSeconds);
}
