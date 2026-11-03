/**
 * @module timeman/work-reports/enum/src/auto-report/title
 */
jn.define('timeman/work-reports/enum/src/auto-report/title', (require, exports, module) => {
	const { BaseAutoReportTextEnum } = require('timeman/work-reports/enum/src/auto-report/base');

	/**
	 * @extends {BaseAutoReportTextEnum<AutoReportTitleEnum>}
	 */
	class AutoReportTitleEnum extends BaseAutoReportTextEnum
	{
		static DAY = new AutoReportTitleEnum('DAY', {
			gpt: 'M_TIMEMAN_GPT_REPORT_CARD_TITLE_DAY',
			robot: 'M_TIMEMAN_GPT_REPORT_CARD_TITLE_DAY_ROBOT',
		});

		static WEEK = new AutoReportTitleEnum('WEEK', {
			gpt: 'M_TIMEMAN_GPT_REPORT_CARD_TITLE_WEEK',
			robot: 'M_TIMEMAN_GPT_REPORT_CARD_TITLE_WEEK_ROBOT',
		});

		static MONTH = new AutoReportTitleEnum('MONTH', {
			gpt: 'M_TIMEMAN_GPT_REPORT_CARD_TITLE_MONTH',
			robot: 'M_TIMEMAN_GPT_REPORT_CARD_TITLE_MONTH_ROBOT',
		});

		static DAILY = new AutoReportTitleEnum('DAILY', {
			gpt: 'M_TIMEMAN_GPT_REPORT_CARD_TITLE_DAILY',
			robot: 'M_TIMEMAN_GPT_REPORT_CARD_TITLE_DAILY_ROBOT',
		});
	}

	module.exports = { AutoReportTitleEnum };
});
