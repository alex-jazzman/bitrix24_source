import { sortByDate } from './sort-items-by-date';

import type { SearchResultItem } from '../types/types';

export const mergeSearchItems = (
	originalItems: SearchResultItem[],
	newItems: SearchResultItem[],
): SearchResultItem[] => {
	const mergedItems = [...originalItems, ...newItems].map((item) => {
		return [item.dialogId, item];
	});
	const result = new Map(mergedItems);

	return sortByDate([...result.values()]);
};
