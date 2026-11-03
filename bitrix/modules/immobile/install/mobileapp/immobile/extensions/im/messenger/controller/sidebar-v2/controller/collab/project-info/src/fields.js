/**
 * @module im/messenger/controller/sidebar-v2/controller/collab/project-info/src/fields
 */
jn.define('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/fields', (require, exports, module) => {
	const { Type } = require('type');
	const { Color, Indent } = require('tokens');
	const { Text4 } = require('ui-system/typography');
	const { Line } = require('utils/skeleton');

	// Every field is read at one size: a label tells itself apart from its value by colour, not by
	// a smaller type, so nothing in the sheet is harder to read than anything else.
	const FIELD_LINE_HEIGHT = 18;
	const FIELD_GAP = Indent.XL.toNumber();
	const LABEL_GAP = Indent.XS2.toNumber();
	const DIVIDER_HEIGHT = 1;
	const SKELETON_WIDTH = '60%';

	/**
	 * A named field of the project: the label above, the value below it. Fields are parted by a
	 * rule, so a value that runs over several lines cannot be read as the beginning of the next
	 * field.
	 *
	 * The three steps of the web block: base3 names the field, base1 states it, and base4 is kept
	 * for the phrase standing in for a value nobody filled in.
	 *
	 * @param {{ label: string, testId: string }} params
	 * @param {...object} children the value of the field
	 * @return {object}
	 */
	function ProjectInfoField({ label, testId }, ...children)
	{
		return View(
			{
				testId,
				style: {
					paddingTop: FIELD_GAP,
					paddingBottom: FIELD_GAP,
				},
			},
			Text4({
				testId: `${testId}-label`,
				text: label,
				color: Color.base3,
				style: {
					marginBottom: LABEL_GAP,
				},
			}),
			...children,
		);
	}

	/**
	 * @param {{ testId: string }} params
	 * @return {object}
	 */
	function ProjectInfoDivider({ testId })
	{
		return View({
			testId,
			style: {
				width: '100%',
				height: DIVIDER_HEIGHT,
				backgroundColor: Color.bgSeparatorSecondary.toHex(),
			},
		});
	}

	/**
	 * The value of a field, or the phrase standing in for one that was never filled in. An unset
	 * field says so in its own words - it is not left blank, which would read as a value that
	 * failed to load.
	 *
	 * @param {{ value: string, emptyText: string, testId: string }} params
	 * @return {object}
	 */
	function ProjectInfoValue({ value, emptyText, testId })
	{
		const isEmpty = !Type.isStringFilled(value);

		return Text4({
			testId,
			text: isEmpty ? emptyText : value,
			color: isEmpty ? Color.base4 : Color.base1,
		});
	}

	/**
	 * @param {{ testId: string }} params
	 * @return {object}
	 */
	function ProjectInfoValueSkeleton({ testId })
	{
		return View(
			{
				testId,
				style: {
					flex: 1,
				},
			},
			Line(SKELETON_WIDTH, FIELD_LINE_HEIGHT),
		);
	}

	module.exports = {
		ProjectInfoField,
		ProjectInfoDivider,
		ProjectInfoValue,
		ProjectInfoValueSkeleton,
		FIELD_LINE_HEIGHT,
		FIELD_GAP,
		LABEL_GAP,
		DIVIDER_HEIGHT,
	};
});
