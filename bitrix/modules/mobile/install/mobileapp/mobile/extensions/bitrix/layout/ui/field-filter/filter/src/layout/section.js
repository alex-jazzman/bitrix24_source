/**
 * @module layout/ui/field-filter/filter/src/layout/section
 */
jn.define('layout/ui/field-filter/filter/src/layout/section', (require, exports, module) => {
	const { Component, Color, Indent } = require('tokens');
	const { Area } = require('ui-system/layout/area');
	const { Text4 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');

	/**
	 * Cells of a section go edge to edge, so the horizontal padding belongs to the row
	 * and not to the area (BXML `noPadding="left-right"`).
	 * @type {number}
	 */
	const ROW_PADDING = Component.areaPaddingLr.toNumber();

	/**
	 * Section of the filter drawer: a full-width area with a grey title and an optional
	 * action on the right of that title (BXML `Area` + `TitleAction`).
	 *
	 * The title is the one of `Area` itself, which brings the vertical rhythm of the design system
	 * with it. `AreaTop` has no slot for an action, so the only section that carries one keeps a row
	 * of its own repeating those metrics - the same exception `layout/ui/context-menu/section` makes.
	 *
	 * Pass `titleAction` at all - even as null - to keep the own title row of the section: the
	 * native layer applies changed properties but not a child that comes and goes, so the title
	 * must not move between `AreaTop` and the row as the action appears.
	 *
	 * @param {FilterSectionProps} props
	 * @param {...*} children
	 */
	function FilterSection(props = {}, ...children)
	{
		const {
			testId,
			title = null,
			titleAction,
			isFirst = false,
			divider = true,
		} = props;

		const hasOwnTitleRow = Boolean(title) && titleAction !== undefined;

		return Area(
			{
				testId,
				title: hasOwnTitleRow ? null : title,
				isFirst,
				divider,
				excludePaddingSide: { horizontal: true },
			},
			hasOwnTitleRow ? renderTitleRow({ testId, title, titleAction }) : null,
			...children,
		);
	}

	function renderTitleRow({ testId, title, titleAction })
	{
		const getTestId = createTestIdGenerator({ prefix: testId });

		return View(
			{
				testId: getTestId('title'),
				style: {
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					paddingHorizontal: ROW_PADDING,
					paddingVertical: Indent.L.toNumber(),
				},
			},
			Text4({
				testId: getTestId('title-text'),
				text: title,
				color: Color.base4,
				numberOfLines: 1,
			}),
			titleAction ?? null,
		);
	}

	module.exports = { FilterSection, ROW_PADDING };
});
