import { markRaw } from 'ui.vue3';

import { type PickerItem } from '../../model/item/types';
import { useSelectionStore } from '../../model/selection/selection';
import { type SelectionStateSnapshot } from '../../model/selection/types';
import { useSessionStore } from '../../model/session/session';
import { canOpenPreview, createOpenPreviewDeps, openPreview } from '../open-preview/open-preview';
import { cancelSelectLimitNotice, toggleSelection } from '../toggle-selection/toggle-selection';

// ALG-03. The click protocol of a row, shared by the list and the table: both views are
// presentational shells over the same pair of scenarios, and a protocol kept in each of
// them drifts apart row by row.

// The selection as it was before the click that may turn out to be the first half of a
// double click, together with the file it was taken on: a double click elsewhere must not
// restore a foreign snapshot. Nothing renders it, and the copy is kept raw so Vue never
// proxies the arrays that go back into the store. Only a file a preview could open for is
// worth a snapshot - no double click gives a folder or an unpreviewable file back.
let clickState: { objectId: number, snapshot: SelectionStateSnapshot } | null = null;

// Called when the picker window goes away: the snapshot of the last click must not outlive
// the store it was taken from.
export function resetRowActivation(): void
{
	clickState = null;
}

function rememberClickState(item: PickerItem): void
{
	clickState = item.previewable && !item.isFolder
		? { objectId: item.objectId, snapshot: markRaw(useSelectionStore().captureState()) }
		: null;
}

function restoreClickState(item: PickerItem): void
{
	if (clickState?.objectId !== item.objectId)
	{
		return;
	}

	useSelectionStore().restoreState(clickState.snapshot);
	clickState = null;
}

function startPreview(item: PickerItem, initiator: HTMLElement | null, windowContainer: HTMLElement | null): void
{
	// A preview opening over the window makes a notice about the limit of a set nobody is
	// looking at noise; the click that raised it is taken back with it.
	cancelSelectLimitNotice(item.objectId);

	void openPreview(
		item,
		initiator,
		createOpenPreviewDeps(useSessionStore().callbacks.notify, windowContainer),
	);
}

// The first click of a pair runs the whole toggle at once, so the row answers as
// immediately as it always did; the second click of a double click toggles nothing,
// because the double click owns the pair and gives the set back untouched.
export function beginClick(item: PickerItem, event: MouseEvent): void
{
	if (event.detail >= 2)
	{
		return;
	}

	rememberClickState(item);
	toggleSelection(item, useSessionStore().callbacks);
}

// A double click that opens nothing changes nothing either: a file the viewer cannot show,
// a preview already on its way or a confirmation under way all leave the result of the
// single click standing.
export function openPreviewFromDblclick(
	item: PickerItem,
	initiator: HTMLElement | null,
	windowContainer: HTMLElement | null,
): void
{
	if (!canOpenPreview(item))
	{
		return;
	}

	restoreClickState(item);
	startPreview(item, initiator, windowContainer);
}

// The eye of the row: its click is stopped on the button and never reaches the row, so the
// set is untouched and only the preview is asked for.
export function openPreviewFromButton(
	item: PickerItem,
	initiator: HTMLElement | null,
	windowContainer: HTMLElement | null,
): void
{
	startPreview(item, initiator, windowContainer);
}
