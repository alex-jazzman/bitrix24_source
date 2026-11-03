/**
 * @module timeman/work-reports/enum/src/auto-report/base
 */
jn.define('timeman/work-reports/enum/src/auto-report/base', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');
	const { Loc } = require('timeman/work-reports/loc');
	const { ReportTypeEnum } = require('timeman/work-reports/enum/src/report-type');

	/**
	 * @abstract
	 * @extends {BaseEnum<BaseAutoReportTextEnum>}
	 */
	class BaseAutoReportTextEnum extends BaseEnum
	{
		/**
		 * @param {{ isRobot?: boolean, replacements?: Record<string, string> }} [options]
		 * @returns {string}
		 */
		getText({ isRobot = false, replacements } = {})
		{
			const { gpt, robot } = this.getValue();

			return Loc.getMessage(isRobot ? robot : gpt, replacements);
		}

		/**
		 * @param {ReportTypeEnum|null|undefined} reportType
		 * @returns {BaseAutoReportTextEnum}
		 */
		static fromReportType(reportType)
		{
			if (!ReportTypeEnum.has(reportType))
			{
				return this.WEEK;
			}

			if (reportType.equal(ReportTypeEnum.DAY))
			{
				return this.DAY;
			}

			if (reportType.equal(ReportTypeEnum.MONTH))
			{
				return this.MONTH;
			}

			return this.WEEK;
		}
	}

	module.exports = { BaseAutoReportTextEnum };
});
