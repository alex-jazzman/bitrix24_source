/**
 * @module im/messenger/db/schema/field/src/boolean
 */
jn.define('im/messenger/db/schema/field/src/boolean', (require, exports, module) => {
	const { Type } = require('type');
	const { FieldType } = require('im/messenger/db/const');
	const { ScalarField } = require('im/messenger/db/schema/field/src/scalar');

	/**
	 * @class BooleanField
	 */
	class BooleanField extends ScalarField
	{
		constructor(name)
		{
			super(name);

			this.falseValue = '0';
			this.trueValue = '1';
		}

		get fieldType()
		{
			return FieldType.boolean;
		}

		/**
		 * @param {*} falseValue
		 * @param {*} trueValue
		 * @return {this}
		 */
		configureValues(falseValue, trueValue)
		{
			this.falseValue = falseValue;
			this.trueValue = trueValue;

			return this;
		}

		serializeDefault(value)
		{
			return Boolean(value) ? this.trueValue : this.falseValue;
		}

		restoreDefault(raw)
		{
			return raw === this.trueValue;
		}

		/**
		 * @return {EqualCondition}
		 */
		isTrue()
		{
			return this.equal(true);
		}

		/**
		 * @return {EqualCondition}
		 */
		isFalse()
		{
			return this.equal(false);
		}

		/**
		 * @protected
		 * @param {BaseField} target
		 */
		copyInto(target)
		{
			super.copyInto(target);
			target.falseValue = this.falseValue;
			target.trueValue = this.trueValue;
		}
	}

	module.exports = { BooleanField };
});
