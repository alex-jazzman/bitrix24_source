import { DataRole } from '../../const';

/**
 * What a click on a row is not: the controls of the row answer for themselves, and the cells that hold
 * them mark nothing. Everything else in the row belongs to the selection, the way the platform grid
 * had it (`main.ui.grid/src/js/grid.js:1675`).
 */
const OwnControlSelector = [
	'a',
	'.main-grid-cell-checkbox',
	'.main-grid-cell-action',
	`[data-role="${DataRole.Favorite}"]`,
	`[data-role="${DataRole.AttachmentChip}"]`,
	`[data-role="${DataRole.AttachmentsStack}"]`,
].join(',');

/**
 * Whether this click marks the row it landed in. A click that only finished selecting text marks
 * nothing - or reading a subject would mark the row it is in.
 */
export function marksRow(event: MouseEvent): boolean
{
	if ((event.target as HTMLElement).closest(OwnControlSelector))
	{
		return false;
	}

	return (window.getSelection()?.toString() ?? '').length === 0;
}
