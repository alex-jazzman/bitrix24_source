/**
 * @module im/messenger/db/schema/field/src/expression
 */
jn.define('im/messenger/db/schema/field/src/expression', (require, exports, module) => {
	const { asc, desc } = require('im/messenger/db/query-builder/order');

	/**
	 * @class ExpressionField
	 */
	class ExpressionField
	{
		/**
		 * @param {string} sqlTemplate SQL expression, e.g. 'COUNT(*)' or 'MAX(%s)'
		 * @param {string} alias result key name
		 * @param {Array<BaseField|string>} [buildFrom] Field refs or raw strings for %s substitution
		 */
		constructor(sqlTemplate, alias, buildFrom = [])
		{
			this.sqlTemplate = sqlTemplate;
			this.alias = alias;
			this.buildFrom = buildFrom;

			/** @type {string} */
			this.name = alias;
		}

		/**
		 * @param {function(*): *} fn
		 * @return {this}
		 */
		configureRestore(fn)
		{
			this.restoreCallback = fn;

			return this;
		}

		/**
		 * @param {*} raw
		 * @return {*}
		 */
		restore(raw)
		{
			return this.restoreCallback ? this.restoreCallback(raw) : raw;
		}

		/**
		 * @return {OrderClause}
		 */
		asc()
		{
			return asc(this);
		}

		/**
		 * @return {OrderClause}
		 */
		desc()
		{
			return desc(this);
		}
	}

	/**
	 * @param {string} sqlTemplate
	 * @param {string} alias
	 * @param {Array<BaseField|string>} [buildFrom]
	 * @return {ExpressionField}
	 */
	const expressionField = (sqlTemplate, alias, buildFrom = []) =>
		new ExpressionField(sqlTemplate, alias, buildFrom);

	module.exports = { ExpressionField, expressionField };
});
