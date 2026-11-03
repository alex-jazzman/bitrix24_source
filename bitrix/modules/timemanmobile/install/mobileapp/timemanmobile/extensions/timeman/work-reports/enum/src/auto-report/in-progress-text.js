/**
 * @module timeman/work-reports/enum/src/auto-report/in-progress-text
 */
jn.define('timeman/work-reports/enum/src/auto-report/in-progress-text', (require, exports, module) => {
	const { BaseAutoReportTextEnum } = require('timeman/work-reports/enum/src/auto-report/base');

	/**
	 * @extends {BaseAutoReportTextEnum<AutoReportInProgressTextEnum>}
	 */
	class AutoReportInProgressTextEnum extends BaseAutoReportTextEnum
	{
		static DAY = new AutoReportInProgressTextEnum('DAY', {
			gpt: 'M_TIMEMAN_GPT_REPORT_CARD_IN_PROGRESS_TEXT_DAY',
			robot: 'M_TIMEMAN_GPT_REPORT_CARD_IN_PROGRESS_TEXT_DAY_ROBOT',
		});

		static WEEK = new AutoReportInProgressTextEnum('WEEK', {
			gpt: 'M_TIMEMAN_GPT_REPORT_CARD_IN_PROGRESS_TEXT_WEEK',
			robot: 'M_TIMEMAN_GPT_REPORT_CARD_IN_PROGRESS_TEXT_WEEK_ROBOT',
		});

		static MONTH = new AutoReportInProgressTextEnum('MONTH', {
			gpt: 'M_TIMEMAN_GPT_REPORT_CARD_IN_PROGRESS_TEXT_MONTH',
			robot: 'M_TIMEMAN_GPT_REPORT_CARD_IN_PROGRESS_TEXT_MONTH_ROBOT',
		});

		static DAILY = new AutoReportInProgressTextEnum('DAILY', {
			gpt: 'M_TIMEMAN_GPT_REPORT_CARD_IN_PROGRESS_TEXT_DAILY',
			robot: 'M_TIMEMAN_GPT_REPORT_CARD_IN_PROGRESS_TEXT_DAILY_ROBOT',
		});
	}

	module.exports = { AutoReportInProgressTextEnum };
});
