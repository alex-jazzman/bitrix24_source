import { SelectionMode } from '../../const/picker';
import { type PickerItem } from '../../model/item/types';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { openFolder, type FeedDeps } from '../open-folder/open-folder';

const DEFAULT_MAX_ITEMS = 100;
const SELECT_LIMIT_MESSAGE = 'DISK_PICKER_NOTIFY_SELECT_LIMIT';

export type ToggleSelectionDeps = FeedDeps & {
	notify: (messageCode: string, replacements?: { [key: string]: string }) => void,
};

function effectiveMaxItems(maxItems: number | null): number
{
	return Math.min(maxItems ?? DEFAULT_MAX_ITEMS, DEFAULT_MAX_ITEMS);
}

// ALG-04. A plain click replaces the whole selection and makes the file active; a
// modifier click adds or removes in multiple mode; a click on a folder always
// navigates into it, using the folder's own source/object pair, regardless of the
// modifier. The modifier is Cmd on macOS and Ctrl elsewhere - both are handled
// without detecting the OS. Client limits are convenience only; the backend is the
// authority on the final selection.
export function toggleSelection(item: PickerItem, modifier: boolean, deps: ToggleSelectionDeps): void
{
	const session = useSessionStore();
	if (session.confirming)
	{
		return;
	}

	if (item.isFolder)
	{
		void openFolder(item, deps);

		return;
	}

	if (!item.selectable)
	{
		return;
	}

	const selection = useSelectionStore();
	selection.setActive(item.objectId);

	if (session.constraints.selectionMode === SelectionMode.Single)
	{
		selection.replaceWith(item.objectId, item.size ?? 0);

		return;
	}

	if (!modifier)
	{
		selection.replaceWith(item.objectId, item.size ?? 0);

		return;
	}

	if (selection.has(item.objectId))
	{
		selection.remove(item.objectId);

		return;
	}

	const maxItems = effectiveMaxItems(session.constraints.maxItems);
	if (selection.count >= maxItems)
	{
		deps.notify(SELECT_LIMIT_MESSAGE, { '#COUNT#': String(maxItems) });

		return;
	}

	selection.add(item.objectId, item.size ?? 0);
}
