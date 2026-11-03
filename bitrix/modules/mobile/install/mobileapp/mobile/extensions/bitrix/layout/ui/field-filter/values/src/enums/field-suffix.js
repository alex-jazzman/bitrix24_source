/**
 * @module layout/ui/field-filter/values/src/enums/field-suffix
 */
jn.define('layout/ui/field-filter/values/src/enums/field-suffix', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * Serialized key suffixes (main UI\Filter\Options).
	 * @extends {BaseEnum<FieldSuffix>}
	 */
	class FieldSuffix extends BaseEnum
	{
		static FROM = new FieldSuffix('FROM', '_from');

		static TO = new FieldSuffix('TO', '_to');

		static DATE_SELECT = new FieldSuffix('DATE_SELECT', '_datesel');

		static NUMBER_SELECT = new FieldSuffix('NUMBER_SELECT', '_numsel');

		static ALLOW_YEAR = new FieldSuffix('ALLOW_YEAR', '_allow_year');

		static DAYS = new FieldSuffix('DAYS', '_days');

		static MONTH = new FieldSuffix('MONTH', '_month');

		static QUARTER = new FieldSuffix('QUARTER', '_quarter');

		static YEAR = new FieldSuffix('YEAR', '_year');
	}

	module.exports = {
		FieldSuffix: FieldSuffix.export(),
	};
});
