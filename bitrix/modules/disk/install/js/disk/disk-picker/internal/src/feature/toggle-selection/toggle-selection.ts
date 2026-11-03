import { SelectionMode } from '../../const/picker';
import { type PickerItem } from '../../model/item/types';
import { useSelectionStore } from '../../model/selection/selection';
import { type SelectionSnapshot } from '../../model/selection/types';
import { useSessionStore } from '../../model/session/session';
import { openFolder, type FeedDeps } from '../open-folder/open-folder';

const DEFAULT_MAX_ITEMS = 100;
const SELECT_LIMIT_MESSAGE = 'DISK_PICKER_NOTIFY_SELECT_LIMIT';
// The double click window the browser itself works with. Only the limit notice waits it
// out; the set is changed at once, so the click stays as immediate as it was.
const LIMIT_NOTICE_DELAY = 250;

export type ToggleSelectionDeps = FeedDeps & {
	notify: (messageCode: string, replacements?: { [key: string]: string }) => void,
};

function effectiveMaxItems(maxItems: number | null): number
{
	return Math.min(maxItems ?? DEFAULT_MAX_ITEMS, DEFAULT_MAX_ITEMS);
}

// The first click of a double click on a previewable file runs the whole toggle, limit
// and all, and the double click then gives the set back: a notice already said would be
// a lie about a set nobody changed. It waits out the double click window instead, and
// the preview that follows cancels it.
let pendingLimitNotice: { objectId: number, timer: ReturnType<typeof setTimeout> } | null = null;

function clearLimitNotice(): void
{
	if (pendingLimitNotice !== null)
	{
		clearTimeout(pendingLimitNotice.timer);
		pendingLimitNotice = null;
	}
}

// Called when the picker window goes away: a notice waiting out its double click window
// must not reach a disposed store or a session of the next open.
export function resetSelectLimitNotice(): void
{
	clearLimitNotice();
}

// Called by the double click that takes the set of its first click back.
export function cancelSelectLimitNotice(objectId: number): void
{
	if (pendingLimitNotice?.objectId === objectId)
	{
		clearLimitNotice();
	}
}

function notifySelectLimit(item: PickerItem, maxItems: number, deps: ToggleSelectionDeps): void
{
	const replacements = { '#COUNT#': String(maxItems) };
	if (!item.previewable)
	{
		deps.notify(SELECT_LIMIT_MESSAGE, replacements);

		return;
	}

	clearLimitNotice();
	const timer = setTimeout(() => {
		pendingLimitNotice = null;
		if (useSessionStore().isSessionActive())
		{
			deps.notify(SELECT_LIMIT_MESSAGE, replacements);
		}
	}, LIMIT_NOTICE_DELAY);
	pendingLimitNotice = { objectId: item.objectId, timer };
}

function lastPickedId(selectedIds: number[]): number | null
{
	return selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
}

function snapshotOf(item: PickerItem): SelectionSnapshot
{
	return {
		objectId: item.objectId,
		size: item.size,
		iconType: item.iconType,
		previewUrl: item.previewUrl,
		createTime: item.createTime,
		updateTime: item.updateTime,
	};
}

// ALG-04. In multiple mode a plain click toggles the file in the set: a picked file is
// dropped and the preview moves to the last picked file that is left, a new one is added
// together with a snapshot of what the panel shows. The
// modifier takes no part in the decision. A click on a folder always navigates into it,
// using the folder's own source/object pair; single mode replaces the whole set. Client
// limits are convenience only; the backend is the authority on the final selection.
export function toggleSelection(item: PickerItem, deps: ToggleSelectionDeps): void
{
	const session = useSessionStore();
	if (session.confirming || (session.contentLoading && session.preserveContentOnLoading))
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
		selection.replaceWith(item.objectId, snapshotOf(item));

		return;
	}

	if (selection.has(item.objectId))
	{
		selection.remove(item.objectId);
		// The preview follows the set: a dropped file must not stay on the panel, so the
		// most recently picked file that is left takes its place, or nothing does.
		selection.setActive(lastPickedId(selection.selectedIds));

		return;
	}

	const maxItems = effectiveMaxItems(session.constraints.maxItems);
	if (selection.count >= maxItems)
	{
		notifySelectLimit(item, maxItems, deps);

		return;
	}

	selection.add(item.objectId, snapshotOf(item));
}

// SEL-01 Space: single replaces, multiple adds or removes without a modifier;
// a folder and an unavailable file are no-ops.
export function toggleFileSelection(item: PickerItem, deps: ToggleSelectionDeps): void
{
	if (item.isFolder || !item.selectable)
	{
		return;
	}

	toggleSelection(item, deps);
}
