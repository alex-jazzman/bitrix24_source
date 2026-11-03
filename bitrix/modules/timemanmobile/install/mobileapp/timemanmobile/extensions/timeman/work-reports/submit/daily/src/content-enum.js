/**
 * @module timeman/work-reports/submit/daily/src/content-enum
 */
jn.define('timeman/work-reports/submit/daily/src/content-enum', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @template TContentEnum
	 * @extends {BaseEnum<ContentEnum>}
	 */
	class ContentEnum extends BaseEnum
	{
		static STATUS = new ContentEnum('STATUS', 'status');

		static REPORT = new ContentEnum('REPORT', 'report');

		isReport()
		{
			return this.equal(ContentEnum.REPORT);
		}
	}

	module.exports = { ContentEnum };
});
