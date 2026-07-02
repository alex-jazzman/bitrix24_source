/**
 * @module im/messenger/db/schema/field/src/ordered
 */
jn.define('im/messenger/db/schema/field/src/ordered', (require, exports, module) => {
	const { ScalarField } = require('im/messenger/db/schema/field/src/scalar');

	const {
		greaterThan: greaterThanFactory,
		greaterThanOrEqual: greaterThanOrEqualFactory,
		lessThan: lessThanFactory,
		lessThanOrEqual: lessThanOrEqualFactory,
		inList: inListFactory,
		notInList: notInListFactory,
	} = require('im/messenger/db/query-builder/condition');

	/**
	 * @class OrderedField
	 * @abstract
	 */
	class OrderedField extends ScalarField
	{
		// ─── range comparisons ─────────────────────────────────────────────

		/**
		 * @param {*} value
		 * @return {Condition}
		 */
		greaterThan(value)
		{
			return greaterThanFactory(this, value);
		}

		/**
		 * @param {*} value
		 * @return {Condition}
		 */
		greaterThanOrEqual(value)
		{
			return greaterThanOrEqualFactory(this, value);
		}

		/**
		 * @param {*} value
		 * @return {Condition}
		 */
		lessThan(value)
		{
			return lessThanFactory(this, value);
		}

		/**
		 * @param {*} value
		 * @return {Condition}
		 */
		lessThanOrEqual(value)
		{
			return lessThanOrEqualFactory(this, value);
		}

		// ─── set membership ────────────────────────────────────────────────

		/**
		 * @param {Array<*>} values
		 * @return {Condition}
		 */
		in(values)
		{
			return inListFactory(this, values);
		}

		/**
		 * @param {Array<*>} values
		 * @return {Condition}
		 */
		notIn(values)
		{
			return notInListFactory(this, values);
		}
	}

	module.exports = { OrderedField };
});
