import { SidebarFileGroups } from 'im.v2.const';

import { getLastElementId } from './get-last-element-id';

type PageCursor = {
	lastId: number,
	lastDate: string,
}

// Paging by the date needs the date order: the server then continues the page by the pair
// LAST_DATE + LAST_ID and refuses either half alone (API-01).
export const SidebarFileDateOrder = Object.freeze({ DATE_CREATE: 'DESC' });

export function usesDateOrder(group: string): boolean
{
	return group === SidebarFileGroups.audio;
}

/**
 * The smallest number of the collection would be a different record: one from a live update lands
 * there with a bigger number and an earlier date, and the next page would start from another place.
 */
export function getPageCursor(list: Object[], withDate: boolean): PageCursor
{
	if (!withDate)
	{
		return { lastId: getLastElementId(list), lastDate: '' };
	}

	const lastItem = list[list.length - 1];

	// the date goes back to the server as it came, in RFC3339
	return { lastId: lastItem.id, lastDate: lastItem.dateCreate };
}
