import { floorDate } from './floor-date';
import { getDate } from './get-date';

const MS_IN_DAY = 86_400_000;

// The distance between two dates in whole units of the grid the cursor moves over.
export function getDateOffset(from: Date, to: Date, unit: 'day' | 'month' | 'year'): number
{
	const fromParts = getDate(from);
	const toParts = getDate(to);

	if (unit === 'year')
	{
		return toParts.year - fromParts.year;
	}

	if (unit === 'month')
	{
		return ((toParts.year - fromParts.year) * 12) + (toParts.month - fromParts.month);
	}

	return Math.round((floorDate(to, 'day').getTime() - floorDate(from, 'day').getTime()) / MS_IN_DAY);
}
