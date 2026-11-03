/**
 * @module layout/ui/field-filter/filter/src/layout/collapsible-group
 */
jn.define('layout/ui/field-filter/filter/src/layout/collapsible-group', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Text2 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const {
		BadgeCounter,
		BadgeCounterDesign,
		BadgeCounterSize,
	} = require('ui-system/blocks/badges/counter');
	const {
		getRowStyle,
		RowDivider,
		ROW_ICON_SIZE,
	} = require('layout/ui/field-filter/filter/src/layout/row-layout');
	const { createTestIdGenerator } = require('utils/test');

	/**
	 * Leading icon of the group, in the size `SettingSelector` gives the icon of a row: the group
	 * row and the field rows under it share one icon column.
	 * @type {number}
	 */
	const ICON_SIZE = ROW_ICON_SIZE;

	/**
	 * Size of the chevron, the same one the "show all fields" row carries.
	 * @type {number}
	 */
	const CHEVRON_SIZE = 20;

	/**
	 * Group of fields inside the section of the form: a row that opens and closes it (BXML accordion
	 * of a client entity) and, while it is open, the rows of the group under it.
	 *
	 * The groups share one section instead of taking an area each: an area per group spreads four
	 * closed rows over the whole sheet, while the mockup keeps them as a list of rows one under
	 * another, in the metrics of every other row of the filter.
	 *
	 * The name of the group is one step above the names of its fields (`Text2` over the `Text3` of
	 * `SettingSelector`), which is why the row is laid out here and not given to that component: it
	 * draws its title in one size only.
	 *
	 * The children are built by the caller only when the group is open: a closed group of a CRM
	 * filter holds dozens of rows, and building them to hide them costs the opening of the drawer.
	 *
	 * @param {CollapsibleFilterGroupProps} props
	 * @param {...*} children
	 */
	function CollapsibleFilterGroup(props = {}, ...children)
	{
		const {
			testId,
			title,
			icon = null,
			expanded = false,
			counter = 0,
			isLast = false,
			onToggle,
		} = props;

		const getTestId = createTestIdGenerator({ prefix: testId });

		return View(
			{
				testId,
				style: { flexDirection: 'column' },
			},
			renderToggleRow({ getTestId, title, icon, expanded, counter, onToggle }),
			...(expanded ? children : []),
			// the hairline between the groups starts at the edge of the rows and not past the icon
			// column: it separates two groups, not two fields of one
			isLast ? null : RowDivider({ testId: getTestId('divider') }),
		);
	}

	function renderToggleRow({ getTestId, title, icon, expanded, counter, onToggle })
	{
		const rowStyle = getRowStyle({ hasIcon: Boolean(icon), iconColumn: true });

		return View(
			{
				testId: getTestId('toggle'),
				style: {
					...rowStyle,
					// `SettingSelector` pads its own content by `Indent.XS2` on top of the padding it
					// is given, so the group row repeats it and stands as high as a field row
					paddingVertical: rowStyle.paddingVertical + Indent.XS2.toNumber(),
					flexDirection: 'row',
					alignItems: 'center',
				},
				onClick: onToggle,
			},
			View(
				{
					style: { flex: 1, flexDirection: 'row', alignItems: 'center' },
				},
				icon
					? IconView({
						testId: getTestId('icon'),
						icon,
						size: ICON_SIZE,
						color: Color.accentMainPrimary,
						style: { marginRight: Indent.XS.toNumber() },
					})
					: null,
				Text2({
					testId: getTestId('title'),
					text: title,
					color: Color.base1,
					// the name of a group is one line high, the same way a field row cuts its own
					numberOfLines: 1,
					ellipsize: 'end',
					style: { flexShrink: 1 },
				}),
				renderCounter({ getTestId, counter }),
			),
			IconView({
				testId: getTestId('chevron'),
				icon: expanded ? Icon.CHEVRON_UP : Icon.CHEVRON_DOWN,
				size: CHEVRON_SIZE,
				color: Color.base4,
			}),
		);
	}

	/**
	 * How many fields of the group the filter is set by. A group set by nothing says nothing: a zero on
	 * the row would read as a condition of its own.
	 *
	 * The badge stands by the name and not by the chevron, because it belongs to the group and not to
	 * the state of the row - a closed group carries it as well as an open one.
	 */
	function renderCounter({ getTestId, counter })
	{
		if (!counter)
		{
			return null;
		}

		return View(
			{
				style: { marginLeft: Indent.XS.toNumber() },
			},
			BadgeCounter({
				testId: getTestId('counter'),
				value: counter,
				design: BadgeCounterDesign.PRIMARY,
				size: BadgeCounterSize.S,
			}),
		);
	}

	module.exports = { CollapsibleFilterGroup };
});
