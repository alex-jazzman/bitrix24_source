export type TabAnchorCell = {
	disabled: boolean,
	tabIndex: number,
};

// A grid page keeps a single tab stop. It stays on the cell the picker focuses or opens on while that cell
// is available, and falls back to the first available cell of the page, so Tab always enters the grid.
export function setTabAnchor(cells: TabAnchorCell[], isAnchorCandidate: (cell: TabAnchorCell) => boolean): void
{
	const candidate = cells.find((cell: TabAnchorCell): boolean => isAnchorCandidate(cell)) ?? null;
	const firstAvailable = cells.find((cell: TabAnchorCell): boolean => !cell.disabled) ?? null;

	let anchor = null;
	if (candidate === null)
	{
		anchor = firstAvailable ?? cells[0] ?? null;
	}
	else
	{
		anchor = candidate.disabled ? (firstAvailable ?? candidate) : candidate;
	}

	for (const cell of cells)
	{
		cell.tabIndex = cell === anchor ? 0 : -1;
	}
}
