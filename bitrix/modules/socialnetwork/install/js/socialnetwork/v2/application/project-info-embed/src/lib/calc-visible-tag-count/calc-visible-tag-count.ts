const CHIP_GAP = 6;

type RowLayout = {
	rows: number,
	used: number,
};

function pickMoreWidth(moreWidths: number[], hiddenCount: number): number
{
	if (hiddenCount <= 0 || moreWidths.length === 0)
	{
		return 0;
	}

	const index = Math.min(String(hiddenCount).length, moreWidths.length) - 1;

	return moreWidths[index];
}

// Packing is greedy and left to right, so the layout of the first N chips never
// depends on what follows: one pass yields the state of every prefix that still
// fits. The pass also stops at the first prefix over the row budget — longer
// ones cannot come back under it, however many tags the project carries.
function layOutPrefixes(chipWidths: number[], available: number, maxRows: number): RowLayout[]
{
	const layouts = [{ rows: 1, used: 0 }];
	let rows = 1;
	let used = 0;

	for (const width of chipWidths)
	{
		const extended = used === 0 ? width : used + CHIP_GAP + width;
		if (extended <= available || used === 0)
		{
			used = extended;
		}
		else
		{
			rows++;
			used = width;
		}

		if (rows > maxRows)
		{
			break;
		}

		layouts.push({ rows, used });
	}

	return layouts;
}

function fitsWithToggle(layout: RowLayout, toggleWidth: number, available: number, maxRows: number): boolean
{
	if (toggleWidth <= 0)
	{
		return true;
	}

	const extended = layout.used === 0 ? toggleWidth : layout.used + CHIP_GAP + toggleWidth;

	return extended <= available || layout.used === 0 || layout.rows + 1 <= maxRows;
}

export function calcVisibleTagCount(
	available: number,
	chipWidths: number[],
	moreWidths: number[],
	collapseWidth: number,
	maxRows: number,
): number
{
	const total = chipWidths.length;
	const layouts = layOutPrefixes(chipWidths, available, maxRows);

	if (layouts.length === total + 1)
	{
		return total;
	}

	for (let count = layouts.length - 1; count > 0; count--)
	{
		const toggleWidth = Math.max(pickMoreWidth(moreWidths, total - count), collapseWidth);
		if (fitsWithToggle(layouts[count], toggleWidth, available, maxRows))
		{
			return count;
		}
	}

	return 0;
}
