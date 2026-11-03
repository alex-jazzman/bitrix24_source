import { createUtcDate } from './create-utc-date';

// Comparing two dates at a precision means comparing these numbers: the widget bounds and the consumer
// bounds are compared by the same formula, otherwise they disagree on the edge of the range.
export function toComparable(date: Date, precision: 'datetime' | 'day' | 'month' | 'year'): number
{
	switch (precision)
	{
		case 'year':
			return date.getUTCFullYear();
		case 'month':
			return (date.getUTCFullYear() * 12) + date.getUTCMonth();
		case 'day':
			return createUtcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).getTime();
		default:
			return date.getTime();
	}
}
