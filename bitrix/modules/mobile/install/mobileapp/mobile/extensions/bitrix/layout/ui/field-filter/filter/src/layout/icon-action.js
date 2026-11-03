/**
 * @module layout/ui/field-filter/filter/src/layout/icon-action
 */
jn.define('layout/ui/field-filter/filter/src/layout/icon-action', (require, exports, module) => {
	const { Color } = require('tokens');
	const { IconView } = require('ui-system/blocks/icon');
	const { ROW_ICON_SIZE } = require('layout/ui/field-filter/filter/src/layout/row-layout');

	/** Size the design system draws the action icon of a row or of a section title with. */
	const ICON_SIZE = ROW_ICON_SIZE;

	/**
	 * The smallest square a control may be tapped in, as both platforms name it (HIG "Layout",
	 * Material "Accessibility"). An icon answers taps in its own size only, so an icon of the design
	 * size is a target of 24 - half the area a finger is aimed with, which is what makes the
	 * neighbouring icons of one row hard to tell apart by touch.
	 * @type {number}
	 */
	const MIN_HIT_AREA = 44;

	/**
	 * How wide an icon of the given size answers taps: never narrower than the icon itself.
	 *
	 * @param {number} size
	 * @return {number}
	 */
	const getHitArea = (size = ICON_SIZE) => Math.max(size, MIN_HIT_AREA);

	/**
	 * How far the area of an icon of the given size reaches past the icon on each side. What the row
	 * has to take back on its outer edge, so that the icon itself stands where it stood.
	 *
	 * @param {number} size
	 * @return {number}
	 */
	const getHitOverhang = (size = ICON_SIZE) => Math.round((getHitArea(size) - size) / 2);

	/**
	 * An icon a tap is handled on. The handler belongs to the box around the icon rather than to the
	 * icon itself, so the area of the tap is the one of the guidelines while the icon keeps the size
	 * of the design. `hitSlop` would be the way to ask the native layer for the same, and JN has none.
	 *
	 * Boxes of one row stand side by side and never overlap: in an overlap the last one drawn wins
	 * every tap, which is the very defect this is fixed against. The gap between the icons is what
	 * their boxes bring - pass `marginRight`/`marginLeft` only to take the area back on the outer edge
	 * of the row (`getHitOverhang`), so that the icon itself stands where it stood.
	 *
	 * `verticalOverhang` is how far the area may grow above and below the icon: the vertical padding
	 * of the row it stands in, no more. That much makes the area as tall as the whole row - the area
	 * of the next row starts where this one ends - while anything above it reaches into a row that
	 * answers taps of its own. It costs the row no height either: the growth is taken back by a margin.
	 *
	 * @param {IconActionProps} props
	 */
	function IconAction(props = {})
	{
		const {
			testId,
			icon,
			size = ICON_SIZE,
			color = Color.base4,
			marginLeft = 0,
			marginRight = 0,
			verticalOverhang = 0,
			forwardRef,
			onClick,
		} = props;

		// negating zero gives -0, which strict comparison tells apart from 0: a margin of -0 means
		// nothing to the layout, but a box that grew by nothing stops comparing equal to a bare one
		const verticalMargin = (verticalOverhang === 0 ? 0 : -verticalOverhang);

		return View(
			{
				testId,
				ref: forwardRef,
				onClick,
				style: {
					// a fixed box rather than a padding around the icon: the row of a preset holds a
					// `flex: 1` name next to the icons, and everything that lets itself be shrunk is -
					// a shrunk box is a smaller target, which is what this is added against
					width: getHitArea(size),
					height: size + 2 * verticalOverhang,
					flexShrink: 0,
					alignItems: 'center',
					justifyContent: 'center',
					marginTop: verticalMargin,
					marginBottom: verticalMargin,
					marginLeft,
					marginRight,
				},
			},
			IconView({ icon, size, color }),
		);
	}

	module.exports = { IconAction, MIN_HIT_AREA, ICON_SIZE, getHitArea, getHitOverhang };
});
