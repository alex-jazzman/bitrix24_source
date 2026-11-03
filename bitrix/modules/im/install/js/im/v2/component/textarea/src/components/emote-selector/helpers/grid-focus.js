import { Event } from 'main.core';
import { FocusKeys } from 'ui.a11y';

import { createListFocusZone } from 'im.v2.lib.a11y';

import { activateWhenVisible } from './deferred-activation';

import type { FocusZone, FocusZoneDirection } from 'ui.a11y';

// `row` is the index of the cell's `role="row"` among the rows that hold a focusable cell, `column`
// is its place within that row.
export type GridCell = {
	element: HTMLElement,
	row: number,
	column: number,
};

// A panel painted over the bottom of the scrollport. Two selectors and not one because the overlay is
// a sibling of the scrollport, not its descendant: `within` scopes the search, `selector` finds it.
export type BottomOverlay = {
	within: string,
	selector: string,
};

export type GridFocusZoneOptions = {
	// The section a cell belongs to: a category of emoji, a pack of stickers. Enables the section-top
	// reveal, see `getRevealTop`.
	sectionSelector?: string | null,
	// A panel laid over the bottom of the grid, see `getVisibleBottom`. Belongs to the surface: the
	// emoji popup covers its grid with a button panel, the file dialog covers nothing and passes nothing.
	bottomOverlay?: BottomOverlay | null,
	// Lets the caller move the entry point with `setEntryPoint`. Without it the entry point follows the
	// rule of the primitive - the cell focus left last.
	withEntryPointControl?: boolean,
	// Called when focus lands on a cell of the last logical row: a grid that fits without a scrollbar
	// fires no `scroll` event, so the caller loads its next page from here instead.
	onLastRowFocus?: (() => void) | null,
};

const GRID_BIND_KEYS: number = FocusKeys.ArrowAll | FocusKeys.HomeAndEnd;
// Logical rows are real markup, not a coordinate guess: a chunk of four cells for stickers, eight
// for emoji.
const ROW_SELECTOR = '[role="row"]';
// The ... of a sticker pack sits beside the pack title, inside a row header.
const ROWHEADER_SELECTOR = '[role="rowheader"]';
// Leaves the focus ring of a scrolled-to cell clear of the scrollport edge.
const SCROLL_GAP = 4;
// A taller glyph shifts the baseline of its neighbours, so cells of one visual row may sit a pixel
// apart: the first-row test of the reveal is "within half a cell", not "exactly the same top".
const MIN_ROW_TOLERANCE = 1;

/**
 * The next cell read from the logical `role="row"` structure - one algorithm for both grids
 * (stickers, 4 columns; emoji, 8), column-agnostic.
 *
 * `Left/Right` cross row boundaries in the flat order of all cells, `Ctrl/Cmd` turns `Home/End` from
 * the edge of the row into the edge of the grid. A grid bound returns the current cell ("stop");
 * focus still on the container, or any other key, falls through to the primitive's linear walk.
 */
export function getNextFocusableLogical(
	from: Element | null,
	event: KeyboardEvent,
	rows: GridCell[][],
): HTMLElement | null
{
	const pos = locate(from, rows);
	if (pos === null)
	{
		return null;
	}

	const current = rows[pos.r][pos.c].element;
	const gridEdge = event.ctrlKey || event.metaKey;

	switch (event.key)
	{
		case 'ArrowRight':
			return flatNeighbour(rows, pos, 1) ?? current;
		case 'ArrowLeft':
			return flatNeighbour(rows, pos, -1) ?? current;
		case 'ArrowDown':
			return adjacentRowByColumn(rows, pos, 1) ?? current;
		case 'ArrowUp':
			return adjacentRowByColumn(rows, pos, -1) ?? current;
		case 'Home':
			return gridEdge ? firstCell(rows) : rows[pos.r][0].element;
		case 'End':
			return gridEdge ? lastCell(rows) : lastOf(rows[pos.r]).element;
		default:
			return null;
	}
}

function locate(from: Element | null, rows: GridCell[][]): { r: number, c: number } | null
{
	if (from === null)
	{
		return null;
	}

	for (let r = 0; r < rows.length; r++)
	{
		const c = rows[r].findIndex((cell) => cell.element === from);
		if (c !== -1)
		{
			return { r, c };
		}
	}

	return null;
}

// The neighbour in the flat order of every cell of the grid, stepping across row boundaries.
function flatNeighbour(rows: GridCell[][], pos: { r: number, c: number }, step: number): HTMLElement | null
{
	let { r } = pos;
	let c = pos.c + step;

	if (c < 0)
	{
		r -= 1;
		if (r < 0)
		{
			return null;
		}

		c = rows[r].length - 1;
	}
	else if (c >= rows[r].length)
	{
		r += 1;
		if (r >= rows.length)
		{
			return null;
		}

		c = 0;
	}

	return rows[r][c].element;
}

// The cell of the adjacent row closest by column; ties go to the left cell.
function adjacentRowByColumn(rows: GridCell[][], pos: { r: number, c: number }, step: number): HTMLElement | null
{
	const r = pos.r + step;
	if (r < 0 || r >= rows.length)
	{
		return null;
	}

	let closest = rows[r][0];
	for (const cell of rows[r])
	{
		if (Math.abs(cell.column - pos.c) < Math.abs(closest.column - pos.c))
		{
			closest = cell;
		}
	}

	return closest.element;
}

function firstCell(rows: GridCell[][]): HTMLElement | null
{
	return rows[0]?.[0]?.element ?? null;
}

function lastCell(rows: GridCell[][]): HTMLElement | null
{
	const lastRow = rows[rows.length - 1];

	return lastRow ? lastOf(lastRow).element : null;
}

function lastOf(row: GridCell[]): GridCell
{
	return row[row.length - 1];
}

/**
 * The grid as logical rows: every `role="row"` that holds at least one cell matching `cellSelector`,
 * in document order. Structure only - no geometry. A row with no focusable cell (a pack header with
 * no actions, an emoji category title) contributes nothing, so vertical moves cross it.
 */
export function readLogicalRows(container: HTMLElement, cellSelector: string): GridCell[][]
{
	const rows: GridCell[][] = [];

	for (const rowElement of container.querySelectorAll(ROW_SELECTOR))
	{
		const cellElements = [...rowElement.querySelectorAll(cellSelector)];
		if (cellElements.length === 0)
		{
			continue;
		}

		const row = rows.length;
		rows.push(cellElements.map((element, column) => ({ element, row, column })));
	}

	return rows;
}

/**
 * Roving focus over a grid whose rows are real `role="row"` markup: arrows move by logical rows and
 * columns (`getNextFocusableLogical`), and the focused cell is revealed inside the container, never by
 * scrolling the page.
 *
 * Lifecycle is the caller's: `activate()` once the grid is rendered, `deactivate()` before unmount.
 */
export class GridFocusZone
{
	#container: HTMLElement;
	#cellSelector: string;
	#sectionSelector: string | null;
	#bottomOverlay: BottomOverlay | null;
	#onLastRowFocus: (() => void) | null;
	#zone: FocusZone;
	#entryPoint: HTMLElement | null = null;
	#pendingEntryCell: HTMLElement | null = null;
	#cancelActivation: (() => void) | null = null;
	#rows: GridCell[][] | null = null;
	#structureObserver: MutationObserver | null = null;
	#invalidateRows = () => {
		this.#rows = null;
	};
	#focusInHandler = (event: FocusEvent) => {
		// The nomination is spent by the first arrival of focus in the zone, whatever it lands on: kept
		// past that, it would align a section on some later, ordinary focus of the same cell.
		const nominated = this.#pendingEntryCell;
		this.#pendingEntryCell = null;

		const cell = event.target;
		if (cell instanceof HTMLElement && cell.matches(this.#cellSelector))
		{
			scrollCellIntoView(this.#container, cell, {
				cellSelector: this.#cellSelector,
				sectionSelector: this.#sectionSelector,
				bottomOverlay: this.#bottomOverlay,
				alignSectionTop: cell === nominated,
			});
			this.#notifyIfLastRow(cell);
		}
	};

	constructor(container: HTMLElement, cellSelector: string, options: GridFocusZoneOptions = {})
	{
		this.#container = container;
		this.#cellSelector = cellSelector;
		this.#sectionSelector = options.sectionSelector ?? null;
		this.#bottomOverlay = options.bottomOverlay ?? null;
		this.#onLastRowFocus = options.onLastRowFocus ?? null;
		this.#zone = createListFocusZone(container, {
			bindKeys: GRID_BIND_KEYS,
			focusableElementFilter: (element: HTMLElement): boolean => element.matches(cellSelector),
			// A browser-native reveal scrolls every ancestor, including the page; #focusInHandler
			// scrolls the container instead.
			preventScroll: true,
			// `direction` merges both arrow axes and is unused: `getNextFocusableLogical` reads the axis
			// and the grid-edge modifier from the raw event.
			getNextFocusable: (direction: FocusZoneDirection, from: Element | null, event: KeyboardEvent) => {
				return getNextFocusableLogical(from, event, this.#readRows());
			},
			// A strategy of its own also replaces how the very first entry point is resolved, so it is
			// installed only for a caller that moves the entry point itself.
			focusInStrategy: options.withEntryPointControl === true ? () => this.#takeEntryPoint() : undefined,
		});
	}

	/**
	 * Nominates the cell focus lands on the next time it enters the grid from outside - the first cell
	 * of the pack just picked. Spent once: after that the entry point is the cell focus left last,
	 * which is what a user who only scrolled the grid expects to come back to.
	 */
	setEntryPoint(cell: HTMLElement): void
	{
		this.#entryPoint = cell;
	}

	#takeEntryPoint(): HTMLElement | null
	{
		const entryPoint = this.#entryPoint;
		this.#entryPoint = null;
		// The reveal is keyed on this cell and not on the event: only a caller's nomination aligns its
		// section to the top, the fallbacks below keep the minimal reveal. Nominating the cell that
		// already holds focus raises no focusin, so such a nomination would never be spent.
		this.#pendingEntryCell = entryPoint === document.activeElement ? null : entryPoint;

		// The fallback has to be complete: this strategy also resolves the initial entry point, and an
		// empty result there leaves the grid without a single tabbable cell, unreachable by Tab.
		return entryPoint
			?? this.#zone.getCurrentFocusedElement()
			?? this.#container.querySelector(this.#cellSelector)
		;
	}

	/**
	 * The logical rows, cached until the markup changes: the structure changes on the order of a page
	 * load, arrows are pressed on the order of a key repeat.
	 *
	 * Only the observer clears the cache, never a timer, and `takeRecords` covers a change made inside
	 * the very task that reads - records are queued the moment the DOM changes, while the callback only
	 * runs once the stack empties. Without an observer nothing would clear it, so the read stays direct.
	 */
	#readRows(): GridCell[][]
	{
		if (this.#structureObserver === null)
		{
			return readLogicalRows(this.#container, this.#cellSelector);
		}

		if (this.#structureObserver.takeRecords().length > 0)
		{
			this.#rows = null;
		}

		if (this.#rows === null)
		{
			this.#rows = readLogicalRows(this.#container, this.#cellSelector);
		}

		return this.#rows;
	}

	// A cell of the last logical row means focus has reached the end of what is loaded; the cached read
	// makes a page brought in by scrolling part of the count without a second pass.
	#notifyIfLastRow(cell: HTMLElement): void
	{
		if (this.#onLastRowFocus === null)
		{
			return;
		}

		const rows = this.#readRows();
		const lastRow = rows[rows.length - 1] ?? null;
		if (lastRow !== null && lastRow.some((gridCell) => gridCell.element === cell))
		{
			this.#onLastRowFocus();
		}
	}

	activate(): void
	{
		Event.bind(this.#container, 'focusin', this.#focusInHandler);
		// Structure only, never attributes: the roving focus rewrites `tabindex` on every move, and
		// watching attributes would throw the rows away on every key press.
		this.#structureObserver = new MutationObserver(this.#invalidateRows);
		this.#structureObserver.observe(this.#container, { childList: true, subtree: true });
		this.#cancelActivation = activateWhenVisible(this.#zone, this.#container);
	}

	deactivate(): void
	{
		this.#cancelActivation?.();
		this.#cancelActivation = null;

		this.#structureObserver?.disconnect();
		this.#structureObserver = null;
		this.#rows = null;

		Event.unbind(this.#container, 'focusin', this.#focusInHandler);
		this.#zone.deactivate();
	}
}

type ScrollCellOptions = {
	cellSelector: string,
	sectionSelector: string | null,
	bottomOverlay: BottomOverlay | null,
	alignSectionTop: boolean,
};

function scrollCellIntoView(container: HTMLElement, cell: HTMLElement, options: ScrollCellOptions): void
{
	const { cellSelector, sectionSelector, bottomOverlay, alignSectionTop } = options;
	const containerRect = container.getBoundingClientRect();
	const cellRect = cell.getBoundingClientRect();
	const revealTop = getRevealTop(cell, cellRect, cellSelector, sectionSelector);

	if (alignSectionTop)
	{
		// The pack scroll animates to this same top and its scrollTop is still mid-flight when focus
		// enters, so a minimal reveal would read a section far below and park its first row at the
		// bottom. Aiming where the pack scroll aims makes the two agree wherever the animation has got
		// to, and is a no-op once it has arrived.
		container.scrollTop += revealTop - containerRect.top;

		return;
	}

	const visibleBottom = getVisibleBottom(container, containerRect, bottomOverlay);
	if (revealTop < containerRect.top)
	{
		container.scrollTop -= containerRect.top - revealTop + SCROLL_GAP;
	}
	else if (cellRect.bottom > visibleBottom)
	{
		container.scrollTop += cellRect.bottom - visibleBottom + SCROLL_GAP;
	}
}

/**
 * Which top edge has to end up inside the scrollport.
 *
 * For a cell of the first row of a section it is the top of the section: the title above the row is
 * what tells which category or pack focus has landed in, and it already sits inside the section box
 * in both grids - the margin of an emoji title collapses out of the section, the header of a sticker
 * pack is its first child.
 *
 * The "first row" is measured against the first cell of content, so the ... of a sticker pack - a
 * cell of the row header, beside the title - is not it; the first sticker below it is.
 */
function getRevealTop(
	cell: HTMLElement,
	cellRect: DOMRect,
	cellSelector: string,
	sectionSelector: string | null,
): number
{
	const section = sectionSelector === null ? null : cell.closest(sectionSelector);
	const firstCellOfContent = section === null ? null : firstContentCell(section, cellSelector);
	if (firstCellOfContent === null)
	{
		return cellRect.top;
	}

	const tolerance = Math.max(cellRect.height / 2, MIN_ROW_TOLERANCE);
	const isFirstRow = Math.abs(cellRect.top - firstCellOfContent.getBoundingClientRect().top) <= tolerance;

	return isFirstRow ? section.getBoundingClientRect().top : cellRect.top;
}

function firstContentCell(section: HTMLElement, cellSelector: string): HTMLElement | null
{
	// `:is` wraps `cellSelector` because a caller may pass a list of selectors.
	return section.querySelector(
		`:is(${cellSelector}):not(${ROWHEADER_SELECTOR}, ${ROWHEADER_SELECTOR} *)`,
	);
}

/**
 * Where the grid stops being visible from below.
 *
 * A surface may paint a panel over the bottom of the scrollport rather than shrink it - the resting
 * look of the emoji popup keeps the last row sliding under its buttons. A cell in that strip is
 * inside the box of the container yet hidden, so a scroll decision made on `containerRect.bottom`
 * leaves focus on a row nobody can see and scrolls one key press too late (WCAG 2.4.11).
 *
 * The panel is measured rather than declared in numbers, because its height lives in CSS. No panel
 * named, or none found, and the grid ends where its own box ends.
 */
function getVisibleBottom(container: HTMLElement, containerRect: DOMRect, bottomOverlay: BottomOverlay | null): number
{
	if (bottomOverlay === null)
	{
		return containerRect.bottom;
	}

	const overlay = container.closest(bottomOverlay.within)?.querySelector(bottomOverlay.selector) ?? null;
	if (overlay === null)
	{
		return containerRect.bottom;
	}

	// A panel laid out below the grid instead of over it hides no row of it.
	return Math.min(containerRect.bottom, overlay.getBoundingClientRect().top);
}
