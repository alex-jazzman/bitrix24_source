/**
 * @module timeman/work-days/ui/skeleton
 */
jn.define('timeman/work-days/ui/skeleton', (require, exports, module) => {
	const { Line, Circle } = require('utils/skeleton');
	const { Color, Corner, Indent, Component } = require('tokens');
	const { WorkDaysListSkeleton } = require('timeman/work-days/ui/skeleton/list');
	const { WorkDaysLegendSkeleton } = require('timeman/work-days/ui/skeleton/legend');
	const { WorkDaysCalendarSkeleton } = require('timeman/work-days/ui/skeleton/calendar');

	const PADDING = Component.paddingLr.toNumber();
	const LEFT_PADDING = PADDING - 5;
	const RIGHT_PADDING = PADDING + 5;
	const FILTER_AVATAR_SIZE = 18;
	const FILTER_USER_LINE_WIDTH = 85;
	const FILTER_USER_LINE_HEIGHT = 18;
	const FILTER_USER_CHEVRON_WIDTH = 14;
	const FILTER_USER_CHEVRON_HEIGHT = 8;
	const FILTER_MONTH_LINE_WIDTH = 110;

	class WorkDaysSkeleton extends LayoutComponent
	{
		render()
		{
			return View(
				{
					style: {
						flex: 1,
						backgroundColor: Color.bgContentSecondary.toHex(),
					},
				},
				this.#renderHeader(),
				WorkDaysListSkeleton(),
			);
		}

		#renderHeader()
		{
			return View(
				{
					style: {
						backgroundColor: Color.bgContentPrimary.toHex(),
						borderBottomRightRadius: Corner.XL.toNumber(),
						borderBottomLeftRadius: Corner.XL.toNumber(),
					},
				},
				this.#renderFilterBar(),
				WorkDaysCalendarSkeleton(),
				WorkDaysLegendSkeleton(),
			);
		}

		#renderFilterBar()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						paddingLeft: LEFT_PADDING,
						paddingRight: RIGHT_PADDING,
						paddingVertical: Indent.M.toNumber(),
					},
				},
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
							alignItems: 'center',
							marginLeft: 3,
							marginTop: 1,
						},
					},
					Circle(FILTER_AVATAR_SIZE),
					View(
						{ style: { marginLeft: Indent.S.toNumber() } },
						Line(FILTER_USER_LINE_WIDTH, FILTER_USER_LINE_HEIGHT),
					),
					View(
						{ style: { marginLeft: Indent.S.toNumber() } },
						Line(FILTER_USER_CHEVRON_WIDTH, FILTER_USER_CHEVRON_HEIGHT),
					),
				),
				Line(FILTER_MONTH_LINE_WIDTH, 14),
			);
		}
	}

	module.exports = {
		WorkDaysSkeleton,
		WorkDaysListSkeleton,
		WorkDaysLegendSkeleton,
		WorkDaysCalendarSkeleton,
	};
});
