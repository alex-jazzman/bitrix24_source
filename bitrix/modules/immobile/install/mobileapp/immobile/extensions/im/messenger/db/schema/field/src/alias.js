/**
 * @module im/messenger/db/schema/field/src/alias
 */
jn.define('im/messenger/db/schema/field/src/alias', (require, exports, module) => {
	/**
	 * Wraps a field with a custom result-key alias.
	 * Created via BaseField.as('alias') — do not instantiate directly.
	 *
	 * @class FieldAlias
	 */
	class FieldAlias
	{
		/** @type {BaseField} */
		#field;

		/** @type {string} */
		#alias;

		/**
		 * @param {BaseField} field
		 * @param {string} alias
		 */
		constructor(field, alias)
		{
			this.#field = field;
			this.#alias = alias;
		}

		/** @returns {BaseField} */
		get field()
		{
			return this.#field;
		}

		/** @returns {string} */
		get alias()
		{
			return this.#alias;
		}
	}

	module.exports = { FieldAlias };
});
