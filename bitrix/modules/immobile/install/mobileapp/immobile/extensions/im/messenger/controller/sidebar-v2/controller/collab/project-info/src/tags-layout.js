/**
 * @module im/messenger/controller/sidebar-v2/controller/collab/project-info/src/tags-layout
 */
jn.define('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/tags-layout', (require, exports, module) => {
	const { Type } = require('type');

	// Horizontal space a tag chip takes around its text: left and right indents of
	// ChipButtonSize.S plus its outline border.
	const CHIP_HORIZONTAL_SPACE = 22;

	// Average character width of Text5 (13px), the typography of ChipButtonSize.S. Text
	// cannot be measured before the layout pass, so chip widths are estimated: an
	// overestimated chip only leaves a gap at the end of the row, an underestimated one
	// shrinks and ellipsizes on its own (the chip body has flexShrink).
	const CHARACTER_WIDTH = 7.2;

	/**
	 * @param {string} text
	 * @return {number}
	 */
	function estimateTagChipWidth(text)
	{
		const length = Type.isStringFilled(text) ? text.length : 0;

		return CHIP_HORIZONTAL_SPACE + Math.ceil(length * CHARACTER_WIDTH);
	}

	/**
	 * Wraps tags into rows by hand: flexWrap is not an option for this layout, so the rows
	 * are built from the estimated chip widths.
	 *
	 * @param {{ tags: string[], availableWidth: number, gap: number }} params
	 * @return {string[][]}
	 */
	function splitTagsIntoRows({ tags, availableWidth, gap })
	{
		if (!Type.isArrayFilled(tags))
		{
			return [];
		}

		const rows = [];
		let row = [];
		let usedWidth = 0;

		for (const tag of tags)
		{
			const width = estimateTagChipWidth(tag);
			const widthWithChip = usedWidth + (row.length > 0 ? gap : 0) + width;

			if (row.length > 0 && widthWithChip > availableWidth)
			{
				rows.push(row);
				row = [tag];
				usedWidth = width;

				continue;
			}

			row.push(tag);
			usedWidth = widthWithChip;
		}

		if (row.length > 0)
		{
			rows.push(row);
		}

		return rows;
	}

	module.exports = { estimateTagChipWidth, splitTagsIntoRows };
});
