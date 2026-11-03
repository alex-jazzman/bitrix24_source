/**
 * @module timeman/work-reports/enum/src/report-type
 */
jn.define('timeman/work-reports/enum/src/report-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @template TReportTypeEnum
	 * @extends {BaseEnum<ReportTypeEnum>}
	 */
	class ReportTypeEnum extends BaseEnum
	{
		static DAY = new ReportTypeEnum('DAY', 'day');

		static WEEK = new ReportTypeEnum('WEEK', 'week');

		static MONTH = new ReportTypeEnum('MONTH', 'month');

		static NONE = new ReportTypeEnum('NONE', 'none');

		/**
		 * @param {unknown} value
		 * @param {ReportTypeEnum|null} [defaultEnum=null]
		 * @returns {ReportTypeEnum|null}
		 */
		static fromValue(value, defaultEnum = null)
		{
			if (!this.isDefined(value))
			{
				return defaultEnum;
			}

			return this.getEnums().find((item) => item.getValue() === value) ?? defaultEnum;
		}
	}

	module.exports = { ReportTypeEnum };
});
