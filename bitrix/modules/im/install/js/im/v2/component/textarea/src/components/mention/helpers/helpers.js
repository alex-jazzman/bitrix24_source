import { Dom, Text } from 'main.core';

// DOM ids of the mention grid, referenced by the field via aria-controls/aria-activedescendant. Activity
// belongs to a cell, not to a row: column 0 is the name, column 1 the optional "add to chat". The action
// button keeps its cell coordinates in the id so navigation can read the same position from either node.
export type MentionGridIds = {
	gridId: string,
	getCellId: (rowIndex: number, columnIndex: number) => string,
	getActionButtonId: (rowIndex: number) => string,
	getCellRow: (cellId: ?string) => number,
};

/**
 * One set of ids per composer: a fixed id would name two grids at once wherever two composers share a
 * page, and `aria-activedescendant` would then point the field at a cell of the other one.
 */
export function createMentionGridIds(): MentionGridIds
{
	const gridId = `bx-im-mention-grid-${Text.getRandom(8)}`;
	const cellIdPrefix = `${gridId}-r`;
	// `Text.getRandom` yields base-36 characters only, so the prefix goes into the pattern as it is.
	const cellRowPattern = new RegExp(`^${cellIdPrefix}(\\d+)-c\\d+(?:-button)?$`);

	return {
		gridId,
		getCellId: (rowIndex: number, columnIndex: number): string => {
			return `${cellIdPrefix}${rowIndex}-c${columnIndex}`;
		},
		getActionButtonId: (rowIndex: number): string => {
			return `${cellIdPrefix}${rowIndex}-c1-button`;
		},
		getCellRow: (cellId: ?string): number => {
			const match = cellRowPattern.exec(cellId ?? '');

			return match ? Number(match[1]) : -1;
		},
	};
}

// The column is read from a cell id or from the action button id derived from it.
export function getMentionCellColumn(cellId: ?string): number
{
	const match = (/-c(\d+)(?:-button)?$/).exec(cellId ?? '');

	return match ? Number(match[1]) : 0;
}

/**
 * Scroll position that brings the active item of the list into view together with `room` around it: what has
 * to end up inside the visible area is not the bare item but the ring of the keyboard position it wears, so
 * the box the check and the correction are written in is the item grown by that room. An item flush with an
 * edge of the visible area is fully visible while its ring is not.
 */
export function getNewScrollPosition(element: HTMLElement, scrollContainer: HTMLElement, room: number): number
{
	const containerPosition = Dom.getPosition(scrollContainer);
	const targetElementPosition = Dom.getPosition(element);

	const wantedTop = targetElementPosition.top - room;
	const wantedBottom = targetElementPosition.bottom + room;

	const shouldScrollUp = wantedTop < containerPosition.top;
	const shouldScrollDown = wantedBottom > containerPosition.bottom;

	let newScrollTop = scrollContainer.scrollTop;

	if (shouldScrollUp)
	{
		newScrollTop -= containerPosition.top - wantedTop;
	}
	else if (shouldScrollDown)
	{
		newScrollTop += wantedBottom - containerPosition.bottom;
	}

	return newScrollTop;
}

/**
 * Room the scrolling keeps between the active item and the edge of the visible area.
 *
 * The ring of the keyboard position is what needs it: the gap it stands off by plus the line itself, both
 * read off the focus tokens the ring is drawn with. Where those tokens are missing no ring is drawn either,
 * and then nothing has to be kept for one.
 *
 * The vertical margin of the list is the floor. That margin is the breathing space of the outermost items -
 * the only room the first and the last of them have - and asking for exactly it is what lands the list on its
 * own edge when the walk reaches either end, instead of a couple of pixels short of it, where the scroll
 * gradient stays lit and paints over the ring.
 */
export function getScrollRoom(element: HTMLElement, itemsContainer: HTMLElement): number
{
	const ringStyle = window.getComputedStyle(element);
	const ringSpace = (Number.parseFloat(ringStyle.getPropertyValue('--ui-focus-outline-offset')) || 0)
		+ (Number.parseFloat(ringStyle.getPropertyValue('--ui-focus-outline-width')) || 0);

	const listStyle = window.getComputedStyle(itemsContainer);
	const listMargin = Math.max(
		Number.parseFloat(listStyle.marginTop) || 0,
		Number.parseFloat(listStyle.marginBottom) || 0,
	);

	return Math.max(ringSpace, listMargin);
}
