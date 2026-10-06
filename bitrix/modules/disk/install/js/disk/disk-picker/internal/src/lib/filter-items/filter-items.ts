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
