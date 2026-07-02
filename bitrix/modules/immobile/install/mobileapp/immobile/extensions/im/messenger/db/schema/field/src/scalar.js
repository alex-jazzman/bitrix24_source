/**
 * @module im/messenger/db/schema/field/src/scalar
 */
jn.define('im/messenger/db/schema/field/src/scalar', (require, exports, module) => {
	const { BaseField } = require('im/messenger/db/schema/field/src/base');

	const {
		equal: equalFactory,
		notEqual: notEqualFactory,
	} = require('im/messenger/db/query-builder/condition');

	/**
	 * @class ScalarField
	 * @abstract
	 */
	class ScalarField extends BaseField
	{
		constructor(name)
		{
			super(name);

			this.autocomplete = false;
		}

		// ─── DDL specific to primitive columns ─────────────────────────────

		/**
		 * @return {this}
		 */
		configurePrimary()
		{
			this.primary = true;

			return this;
		}

		/**
		 * @return {this}
		 */
		configureAutocomplete()
		{
			this.autocomplete = true;

			return this;
		}

		/**
		 * @protected
		 * @param {BaseField} target
		 */
		copyInto(target)
		{
			super.copyInto(target);
			target.autocomplete = this.autocomplete;
		}

		// ─── equality (universal for primitives) ───────────────────────────

		/**
		 * @param {*} value
		 * @return {Condition}
		 */
		equal(value)
		{
			return equalFactory(this, value);
		}

		/**
		 * @param {*} value
		 * @return {Condition}
		 */
		notEqual(value)
		{
			return notEqualFactory(this, value);
		}
	}

	module.exports = { ScalarField };
});
