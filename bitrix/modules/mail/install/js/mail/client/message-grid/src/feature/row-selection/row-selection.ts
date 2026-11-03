import { GridEvent, GridMode, type GridModeValue } from '../../const';
import { emitGridEvent } from '../../lib/grid-event/grid-event';
import { shownRows } from '../hide-rows/hide-rows';

/**
 * The registry arrives as an argument rather than being resolved here: two grids share the screen
 * and the one that started last owns the global resolution, so a rule that asked for it by itself
 * would mark a message while the reader was clicking through the drafts.
 */
export type SelectionRegistry = {
	mode: GridModeValue,
	rows: { id: string }[],
	/** Rows taken out of sight while the screen waits for the server; none of them is ever marked. */
	hiddenIds: string[],
	selectedIds: string[],
	stickyAll: boolean,
	restoreIds: string[],
	setSelection(ids: string[]): void,
	setStickyAll(on: boolean): void,
	setRestoreIds(ids: string[]): void,
};

/** The grid the events of the selection carry; the screen tells one grid from the other by it. */
export type SelectionGrid = {
	getId(): string,
};

function everyRowId(registry: SelectionRegistry): string[]
{
	return shownRows(registry).map((row: { id: string }): string => row.id);
}

/** The marked rows the reader can see; the state of the checkbox of "select all" is counted in them. */
export function selectedShownIds(registry: SelectionRegistry): string[]
{
	const marked = new Set(registry.selectedIds);

	return everyRowId(registry).filter((id: string): boolean => marked.has(id));
}

/**
 * The screen builds the panel of mass actions on the first of the two events and takes it down on
 * the second (`user-interface-manager.js:56`).
 *
 * Said apart from the change it speaks of, so that the caller can rebuild the panel first: the
 * screen answers this word by disabling buttons (`list.es6.js:419`), and a rebuild destroys every
 * button standing (`ui/actionpanel/src/panel.js:321`).
 */
export function announceSelectionState(registry: SelectionRegistry, grid: SelectionGrid): void
{
	if (registry.selectedIds.length > 0)
	{
		emitGridEvent(GridEvent.ThereSelectedRows, [grid]);

		return;
	}

	emitGridEvent(GridEvent.NoSelectedRows);
}

function isRowSelected(registry: SelectionRegistry, rowId: string): boolean
{
	return registry.selectedIds.includes(rowId);
}

/** Every row that is shown is marked - the state the checkbox of "select all" stands checked in. */
export function isEverythingSelected(registry: SelectionRegistry): boolean
{
	const shown = everyRowId(registry).length;

	return shown > 0 && selectedShownIds(registry).length === shown;
}

/**
 * One row answering for itself is no longer "everything", so the sticky mark goes - otherwise the
 * next page would arrive marked behind a checkbox the reader had just cleared.
 */
export function toggleRow(registry: SelectionRegistry, rowId: string): void
{
	registry.setSelection(
		isRowSelected(registry, rowId)
			? registry.selectedIds.filter((id: string): boolean => id !== rowId)
			: [...registry.selectedIds, rowId]
		,
	);
	registry.setStickyAll(false);
}

/**
 * Marking everything is remembered as a state rather than as a set of rows: a page loaded
 * afterwards is marked too, and so is the table after it is reloaded.
 */
export function toggleSelectAll(registry: SelectionRegistry, on: boolean): void
{
	registry.setStickyAll(on);
	registry.setSelection(on ? everyRowId(registry) : []);
}

/** The word of the checkbox of "select all", said apart for the same reason as the one above. */
export function announceSelectAll(grid: SelectionGrid, on: boolean): void
{
	emitGridEvent(on ? GridEvent.AllRowsSelected : GridEvent.AllRowsUnselected, [grid]);
}

/**
 * Rows just written into the state arrive marked while the sticky mark holds - a page appended by
 * the button "more" and a table that came back from a reload alike.
 */
export function reapplyStickyAll(registry: SelectionRegistry): void
{
	if (registry.stickyAll)
	{
		registry.setSelection(everyRowId(registry));
	}
}

/** Before the table is asked for again: what is marked now is what the reader expects back. */
export function rememberSelection(registry: SelectionRegistry): void
{
	registry.setRestoreIds([...registry.selectedIds]);
}

/** The table came back: a row the new answer no longer holds loses its mark silently. */
export function restoreSelection(registry: SelectionRegistry): void
{
	registry.setSelection(
		everyRowId(registry).filter((id: string): boolean => registry.restoreIds.includes(id)),
	);
	registry.setRestoreIds([]);

	reapplyStickyAll(registry);
}

/**
 * Said once more right after the table has been redrawn: the screen rebuilds the panel of mass
 * actions on this event, and the redraw has just taken the previous panel down.
 *
 * Only while something is really marked - the screen answers by building a panel out of the marked
 * rows, and over an empty selection that leaves a panel of a selection that does not exist.
 */
export function announceRestoredSelection(registry: SelectionRegistry, grid: SelectionGrid): void
{
	setTimeout((): void => {
		if (registry.selectedIds.length > 0)
		{
			emitGridEvent(GridEvent.ThereSelectedRows, [grid]);
		}
	}, 0);
}

/**
 * Drops the selection and says so out loud - neighbouring extensions of the screen listen for the word.
 * The list of drafts keeps its own reset to itself and says nothing.
 */
export function resetSelection(registry: SelectionRegistry): void
{
	clearSelection(registry);

	if (registry.mode === GridMode.Message)
	{
		emitGridEvent(GridEvent.ResetSelection);
	}
}

/**
 * The same drop, silent - the screen resets the selection through the event above and answers a
 * change of folder with it too (`list.es6.js:568`), so a word of our own would be said twice.
 */
export function clearSelection(registry: SelectionRegistry): void
{
	registry.setSelection([]);
	registry.setStickyAll(false);
	// a change of folder is the word and the reload at once, and the reload is asked for first
	// (`message-grid.ts` subscribes before the screen does), so a mark left here would come back on
	// the rows of the folder the reader has just walked into
	registry.setRestoreIds([]);
}
