/**
 * @module layout/ui/field-filter/filter/src/layout/row-layout
 */
jn.define('layout/ui/field-filter/filter/src/layout/row-layout', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { ROW_PADDING } = require('layout/ui/field-filter/filter/src/layout/section');

	/**
	 * Side of the leading icon of a row. Repeated from the design system rather than taken from a
	 * token, because there is none: `SettingSelector.renderIcon()` writes `size: 24` as a literal.
	 * Every icon of every row of the filter is this one size, so the number stands here alone.
	 *
	 * @type {number}
	 */
	const ROW_ICON_SIZE = 24;

	/**
	 * The icon plus the gap it keeps after itself: the column the title starts in when the row list
	 * has icons. `SettingSelector` adds `Indent.XS` after its icon and offers no way to reserve the
	 * column for a row that carries no icon of its own.
	 *
	 * @type {number}
	 */
	const ICON_COLUMN = ROW_ICON_SIZE + Indent.XS.toNumber();

	/**
	 * Where the title of a row starts: at the edge of the area, or past the icon column.
	 * @type {number}
	 */
	const TITLE_START = ROW_PADDING;
	const TITLE_START_WITH_ICON_COLUMN = ROW_PADDING + ICON_COLUMN;

	/**
	 * How tall a cell comes out. The tallest thing inside is the icon of `SettingSelector`;
	 * around it lie its own `Indent.XS2` and the vertical padding this module gives the row. Needed
	 * by a screen that has to name its height before it is drawn - a sheet opened to the height of
	 * its content - so it is derived here, next to the padding it depends on.
	 *
	 * @type {number}
	 */
	const ROW_HEIGHT = ROW_ICON_SIZE + 2 * Indent.L.toNumber() + 2 * Indent.XS2.toNumber();

	/** Hairline between two cells of one list, see RowDivider. */
	const ROW_DIVIDER_HEIGHT = 1;

	/**
	 * Geometry of a cell of the filter, shared by the field rows and the choice rows.
	 *
	 * `SettingSelector` pads its content by `Indent.XS2` only, which is well below the row height of
	 * the design, so the rest of it belongs to the caller. A row of a list that has an icon column
	 * keeps its title in that column even without an icon of its own - otherwise fields the icon map
	 * says nothing about would sit closer to the edge than their neighbours.
	 *
	 * @param {RowLayoutParams} [props]
	 * @return {RowStyle}
	 */
	function getRowStyle(props = {})
	{
		const { hasIcon = false, iconColumn = false } = props;
		const keepsIconColumn = iconColumn && !hasIcon;

		return {
			paddingLeft: keepsIconColumn ? TITLE_START_WITH_ICON_COLUMN : TITLE_START,
			paddingRight: ROW_PADDING,
			paddingVertical: Indent.L.toNumber(),
		};
	}

	/**
	 * Hairline between the cells of one list. It starts under the title rather than at the edge of
	 * the screen the way the `divider` prop of `SettingSelector` draws it (BXML divider under the
	 * text); the DS knows such a divider in `ui-system/blocks/entity-cell` only, which draws it for
	 * its own layout. On the right it stops at the same padding as the rows: a hairline running
	 * into the edge of the sheet reads as the end of the section, not as a line between two rows.
	 *
	 * @param {RowDividerProps} [props]
	 */
	function RowDivider(props = {})
	{
		const { testId = null, iconColumn = false } = props;

		return View({
			testId,
			style: {
				height: 1,
				marginLeft: iconColumn ? TITLE_START_WITH_ICON_COLUMN : TITLE_START,
				marginRight: ROW_PADDING,
				backgroundColor: Color.bgSeparatorSecondary.toHex(),
			},
		});
	}

	module.exports = {
		getRowStyle,
		RowDivider,
		ROW_ICON_SIZE,
		ICON_COLUMN,
		ROW_HEIGHT,
		ROW_DIVIDER_HEIGHT,
	};
});
