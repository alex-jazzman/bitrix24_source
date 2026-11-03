/**
 * @module layout/ui/field-filter/values/src/enums/boolean-value
 */
jn.define('layout/ui/field-filter/values/src/enums/boolean-value', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * Boolean field values (CONTRACT-DTO-01). A missing key means "not set",
	 * so the control is three-state rather than a two-position switch.
	 * @extends {BaseEnum<BooleanValue>}
	 */
	class BooleanValue extends BaseEnum
	{
		static YES = new BooleanValue('YES', 'Y');

		static NO = new BooleanValue('NO', 'N');
	}

	module.exports = {
		BooleanValue: BooleanValue.export(),
	};
});
