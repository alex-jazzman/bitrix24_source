import type { TimestampMap } from '../../../shared/types';

// Whether the canvas holds something the published version does not: the two layers of the comparison
// are read as a whole, so an added or a removed entry counts as a change of its own.
export function isTimestampMapChanged(current: TimestampMap, published: TimestampMap): boolean
{
	const currentKeys = Object.keys(current);

	if (currentKeys.length !== Object.keys(published).length)
	{
		return true;
	}

	return currentKeys.some((key: string) => current[key] !== published[key]);
}
