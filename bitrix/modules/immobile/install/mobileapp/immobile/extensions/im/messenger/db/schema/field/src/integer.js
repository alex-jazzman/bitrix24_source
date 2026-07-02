/**
 * @module im/messenger/db/schema/field/src/integer
 */
jn.define('im/messenger/db/schema/field/src/integer', (require, exports, module) => {
	const { FieldType } = require('im/messenger/db/const');
	const { OrderedField } = require('im/messenger/db/schema/field/src/ordered');

	/**
	 * @class IntegerField
	 */
	class IntegerField extends OrderedField
	{
		constructor(name)
		{
			super(name);

			this.size = null;
		}

		get fieldType()
		{
			return FieldType.integer;
		}

		/**
		 * @param {number} size
		 * @return {this}
		 */
		configureSize(size)
		{
			this.size = size;

			return this;
		}

		/**
		 * @protected
		 * @param {BaseField} target
		 */
		copyInto(target)
		{
			super.copyInto(target);
			target.size = this.size;
		}
	}

	module.exports = { IntegerField };
});
