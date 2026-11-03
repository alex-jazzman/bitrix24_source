/**
 * @module layout/ui/field-filter/values/src/enums/number-operator
 */
jn.define('layout/ui/field-filter/values/src/enums/number-operator', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * Number comparison operators (main UI\Filter\NumberType).
	 * @extends {BaseEnum<NumberOperator>}
	 */
	class NumberOperator extends BaseEnum
	{
		static EXACT = new NumberOperator('EXACT', 'exact');

		static RANGE = new NumberOperator('RANGE', 'range');

		static MORE = new NumberOperator('MORE', 'more');

		static LESS = new NumberOperator('LESS', 'less');
	}

	module.exports = {
		NumberOperator: NumberOperator.export(),
	};
});
