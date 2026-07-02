/**
 * @module im/messenger/db/schema/index
 */
jn.define('im/messenger/db/schema/index', (require, exports, module) => {
	/**
	 * @class Index
	 */
	class Index
	{
		/**
		 * @param {Array<BaseField>} fields ordered list of Field instances
		 */
		constructor(fields)
		{
			this.fields = fields;
			this.unique = false;
			this.name = null;
		}

		/**
		 * @return {this}
		 */
		configureUnique()
		{
			this.unique = true;

			return this;
		}

		/**
		 * @param {string} sqlName
		 * @return {this}
		 */
		configureName(sqlName)
		{
			this.name = sqlName;

			return this;
		}
	}

	module.exports = { Index };
});
