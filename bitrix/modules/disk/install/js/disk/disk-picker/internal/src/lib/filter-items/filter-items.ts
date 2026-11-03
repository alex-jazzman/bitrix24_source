import { ObjectTypeFilter } from '../../const/picker';
import { type PickerItem } from '../../model/item/types';
import { type SessionFilters } from '../../model/session/types';

// Narrows an already-fetched item list by the user object-type and file-type
// filters. Used only for the recent snapshot, which the server already bounded
// by `allowedFileTypes`; folder and search feeds are re-requested instead. Pure:
// no store or network access.
export function applyLocalFilters(items: PickerItem[], filters: SessionFilters): PickerItem[]
{
	return items.filter((item) => {
		if (filters.objectTypeFilter === ObjectTypeFilter.Files && item.isFolder)
		{
			return false;
		}

		if (filters.objectTypeFilter === ObjectTypeFilter.Folders && !item.isFolder)
		{
			return false;
		}

		if (filters.fileTypeFilters.length > 0)
		{
			return !item.isFolder && item.fileType !== null && filters.fileTypeFilters.includes(item.fileType);
		}

		return true;
	});
}

export function findItemsByName(
	items: PickerItem[],
	filters: SessionFilters,
	query: string,
): PickerItem[]
{
	const normalizedQuery = query.trim().toLocaleLowerCase();
	if (normalizedQuery === '')
	{
		return [];
	}

	return applyLocalFilters(items, filters).filter(
		(item) => item.name.toLocaleLowerCase().includes(normalizedQuery),
	);
}

// The server answer with the rows it cannot reach appended after it. Chat files enter the
// picker only through the recent feed, so a search over that feed is completed from the
// snapshot rather than from a second search request. Rows the server already returned keep
// their place and are not repeated.
export function withLocalMatches(
	serverItems: PickerItem[],
	localCandidates: PickerItem[],
	filters: SessionFilters,
	query: string,
): PickerItem[]
{
	const seenIds = new Set(serverItems.map((item) => item.objectId));

	return [
		...serverItems,
		...findItemsByName(localCandidates, filters, query).filter((item) => {
			if (seenIds.has(item.objectId))
			{
				return false;
			}

			seenIds.add(item.objectId);

			return true;
		}),
	];
}
