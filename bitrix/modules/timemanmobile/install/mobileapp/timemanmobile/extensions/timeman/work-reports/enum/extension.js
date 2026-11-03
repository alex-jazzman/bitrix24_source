/**
 * @module timeman/work-reports/enum
 */
jn.define('timeman/work-reports/enum', (require, exports, module) => {
	const { AutoReportInProgressTextEnum } = require('timeman/work-reports/enum/src/auto-report/in-progress-text');
	const { AutoReportTitleEnum } = require('timeman/work-reports/enum/src/auto-report/title');
	const { MarkEnum } = require('timeman/work-reports/enum/src/mark');
	const { RecordReportTypeEnum } = require('timeman/work-reports/enum/src/record-report-type');
	const { ReportTypeEnum } = require('timeman/work-reports/enum/src/report-type');

	module.exports = {
		AutoReportInProgressTextEnum,
		AutoReportTitleEnum,
		MarkEnum,
		RecordReportTypeEnum,
		ReportTypeEnum,
	};
});
