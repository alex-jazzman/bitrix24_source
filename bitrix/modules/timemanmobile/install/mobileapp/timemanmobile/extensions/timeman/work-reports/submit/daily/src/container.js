/**
 * @module timeman/work-reports/submit/daily/src/container
 */
jn.define('timeman/work-reports/submit/daily/src/container', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { AutoReportTitleEnum, ReportTypeEnum } = require('timeman/work-reports/enum');
	const { Loc } = require('timeman/work-reports/loc');
	const { formatDate } = require('timeman/work-reports/utils');
	const { ContentEnum } = require('timeman/work-reports/submit/daily/src/content-enum');
	const { StatusView } = require('timeman/work-reports/submit/daily/src/status-view');
	const { WorkReportForm } = require('timeman/work-reports/ui/form');

	class DailyReportContainer extends PureComponent
	{
		/**
		 * @param {DailyReportContainerProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				contentId: ContentEnum.STATUS,
			};
		}

		render()
		{
			const { contentId } = this.state;

			return contentId.isReport()
				? this.#renderReport()
				: this.#renderStatus();
		}

		#renderStatus()
		{
			const { data, layoutWidget, parentWidget, analytics } = this.props;

			return new StatusView({
				layoutWidget,
				parentWidget,
				hasGpt: Boolean(data.hasGpt),
				hasAutoReport: Boolean(data.hasAutoReport),
				date: formatDate(data.dateReport),
				analytics,
				onContinue: this.#onShowReport,
			});
		}

		#renderReport()
		{
			const { data, layoutWidget, onSave, onReportChange } = this.props;

			return new WorkReportForm({
				layoutWidget,
				buttonText: Loc.getMessage('M_TIMEMAN_DAILY_REPORT_SAVE_BUTTON'),
				onClick: onSave,
				onReportChange,
				...data,
				period: ReportTypeEnum.DAY,
				reportTitle: AutoReportTitleEnum.DAILY.getText({ isRobot: !data.hasGpt }),
				formTitle: Loc.getMessage(
					'M_TIMEMAN_DAILY_REPORT_TITLE',
					{ '#DATE#': formatDate(data.dateReport) },
				),
			});
		}

		#onShowReport = () => {
			const { data, layoutWidget } = this.props;
			const { checkInCount, hasAutoReport, hasGpt } = data;

			const newHeight = WorkReportForm.getContentHeight({
				hasAutoReport,
				hasGpt,
				hasMap: checkInCount > 0,
			});

			layoutWidget.setBottomSheetParams({ mediumPositionHeight: newHeight });
			layoutWidget.setBottomSheetHeight(newHeight);

			this.setState({ contentId: ContentEnum.REPORT });
		};
	}

	module.exports = { DailyReportContainer };
});
