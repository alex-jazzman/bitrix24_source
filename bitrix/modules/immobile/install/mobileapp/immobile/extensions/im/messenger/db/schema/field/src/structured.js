/**
 * @module im/messenger/db/schema/field/src/structured
 */
jn.define('im/messenger/db/schema/field/src/structured', (require, exports, module) => {
	const { BaseField } = require('im/messenger/db/schema/field/src/base');

	/**
	 * @class StructuredField
	 * @abstract
	 */
	class StructuredField extends BaseField
	{
		/**
		 * @abstract
		 * @param {*} value
		 * @return {*}
		 */
		serializeDefault(value)
		{
			throw new Error(`StructuredField '${this.name}': serializeDefault() must be overridden in subclass`);
		}

		/**
		 * @abstract
		 * @param {*} raw
		 * @return {*}
		 */
		restoreDefault(raw)
		{
			throw new Error(`StructuredField '${this.name}': restoreDefault() must be overridden in subclass`);
		}
	}

	module.exports = { StructuredField };
});
