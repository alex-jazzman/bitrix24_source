/**
 * @module timeman/work-reports/ui/skeleton/src/list
 */
jn.define('timeman/work-reports/ui/skeleton/src/list', (require, exports, module) => {
	const { Line, Circle } = require('utils/skeleton');
	const { Indent, Component, Color } = require('tokens');

	const SCREEN_HEIGHT = device.screen.height;
	const PADDING = Component.paddingLr.toNumber();

	const ICON_SIZE = 24;
	const AVATAR_SIZE = 24;

	const ROWS_PER_GROUP = 4;
	const ROW_HEIGHT = Indent.XS.toNumber() + Indent.M.toNumber() * 2 + 18 + 1;
	const HEADER_HEIGHT = Indent.XL4.toNumber() + Indent.XL2.toNumber() + AVATAR_SIZE;
	const GROUP_HEIGHT = HEADER_HEIGHT + ROW_HEIGHT * ROWS_PER_GROUP;

	class WorkReportListSkeleton extends LayoutComponent
	{
		render()
		{
			return View(
				{ style: { flex: 1 } },
				...this.#renderGroups(),
			);
		}

		#renderGroups()
		{
			const count = Math.max(1, Math.ceil(SCREEN_HEIGHT / GROUP_HEIGHT));

			return Array.from({ length: count }, (_, index) => this.#renderGroup(index));
		}

		#renderGroup(groupIndex)
		{
			return View(
				{ key: `group-${groupIndex}` },
				this.#renderUserHeader(),
				...Array.from({ length: ROWS_PER_GROUP }, (_, rowIndex) => (
					this.#renderRow(groupIndex, rowIndex)
				)),
			);
		}

		#renderUserHeader()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: PADDING,
						paddingTop: Indent.XL4.toNumber(),
						paddingBottom: Indent.XL2.toNumber(),
					},
				},
				Circle(AVATAR_SIZE),
				View(
					{ style: { marginLeft: Indent.L.toNumber() } },
					Line(150, 17),
				),
			);
		}

		#renderRow(groupIndex, rowIndex)
		{
			return View(
				{
					key: `row-${groupIndex}-${rowIndex}`,
					style: {
						paddingHorizontal: PADDING,
						paddingTop: Indent.XS.toNumber(),
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							paddingTop: Indent.M.toNumber(),
							paddingBottom: Indent.M.toNumber(),
						},
					},
					View(
						{ style: { flex: 1 } },
						Line(120, 16),
					),
					Circle(ICON_SIZE),
				),
				View({
					style: {
						height: 1,
						backgroundColor: Color.bgSeparatorSecondary.toHex(),
					},
				}),
			);
		}
	}

	module.exports = { WorkReportListSkeleton };
});
