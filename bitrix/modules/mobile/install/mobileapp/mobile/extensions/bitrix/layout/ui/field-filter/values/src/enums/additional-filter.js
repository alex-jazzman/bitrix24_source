/**
 * @module layout/ui/field-filter/values/src/enums/additional-filter
 */
jn.define('layout/ui/field-filter/values/src/enums/additional-filter', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * Condition on the presence of a value instead of on the value itself, the "---" menu of the web
	 * filter (BX.Filter.AdditionalFilter). The value is also the suffix of the serialized key, which
	 * is why these two are not in FieldSuffix: the vocabulary would then live in two places.
	 *
	 * @extends {BaseEnum<AdditionalFilter>}
	 */
	class AdditionalFilter extends BaseEnum
	{
		static IS_EMPTY = new AdditionalFilter('IS_EMPTY', 'isEmpty');

		static HAS_ANY_VALUE = new AdditionalFilter('HAS_ANY_VALUE', 'hasAnyValue');
	}

	module.exports = {
		AdditionalFilter: AdditionalFilter.export(),
	};
});
