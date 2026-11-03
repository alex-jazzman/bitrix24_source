/**
 * @module timeman/work-reports/enum/src/record-report-type
 */
jn.define('timeman/work-reports/enum/src/record-report-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @template TRecordReportTypeEnum
	 * @extends {BaseEnum<RecordReportTypeEnum>}
	 */
	class RecordReportTypeEnum extends BaseEnum
	{
		static REPORT = new RecordReportTypeEnum('REPORT', 'REPORT');

		static AI_REPORT = new RecordReportTypeEnum('AI_REPORT', 'AI_REPORT');

		static ROBOT_REPORT = new RecordReportTypeEnum('ROBOT_REPORT', 'ROBOT_REPORT');

		/**
		 * @param {unknown} value
		 * @param {RecordReportTypeEnum|null} [defaultEnum=null]
		 * @returns {RecordReportTypeEnum|null}
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

	module.exports = { RecordReportTypeEnum };
});
