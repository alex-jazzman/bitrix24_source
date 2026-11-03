/**
 * @module timeman/work-reports/review/list/src/report-item
 */
jn.define('timeman/work-reports/review/list/src/report-item', (require, exports, module) => {
	const { Color, Indent, Component } = require('tokens');
	const { Base } = require('layout/ui/simple-list/items/base');
	const { Text3 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');
	const { formatPeriod } = require('timeman/work-reports/utils');
	const { ApproveButton } = require('timeman/work-reports/ui/approve-button');
	const { MarkEnum } = require('timeman/work-reports/enum');

	const REPORT_ITEM_TYPE = 'WorkReportRow';

	class ReportItem extends Base
	{
		/** @param {ReportItemProps} props */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: `work-report-row-${props.item.id}`,
				context: this,
			});

			// The icon of the row reports its ref once, at mount, while ApproveButton is rebuilt on every
			// rerender of the row: the holder keeps the target the menu stands at.
			this.markMenuTarget = { current: null };
		}

		renderItemContent()
		{
			const { item } = this.props;
			const report = this.#getReport();
			const showBorder = Boolean(item.showBorder);
			const markState = MarkEnum.toState(report?.mark);

			return View(
				{
					testId: this.getTestId('row'),
					style: {
						paddingHorizontal: Component.paddingLr.toNumber(),
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
					Text3({
						testId: this.getTestId('period'),
						text: formatPeriod(report.dateFrom, report.dateTo),
						color: Color.base1,
						numberOfLines: 1,
						ellipsize: 'end',
						style: {
							flex: 1,
							marginRight: Indent.S.toNumber(),
						},
					}),
					ApproveButton({
						state: markState,
						testId: this.getTestId('approve-button'),
						userId: report?.userId,
						onChange: (nextState) => item.onMarkChange?.(item.id, nextState),
						markMenuTarget: this.markMenuTarget,
					}),
				),
				showBorder && View({
					testId: this.getTestId('divider'),
					style: {
						height: 1,
						backgroundColor: Color.bgSeparatorSecondary.toHex(),
					},
				}),
			);
		}

		#getReport()
		{
			const { item } = this.props;

			return item?.report ?? item;
		}
	}

	module.exports = {
		ReportItem,
		REPORT_ITEM_TYPE,
	};
});
