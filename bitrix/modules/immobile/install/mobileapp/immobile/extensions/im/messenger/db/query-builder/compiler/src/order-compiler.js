/**
 * @module im/messenger/db/query-builder/compiler/src/order-compiler
 */
jn.define('im/messenger/db/query-builder/compiler/src/order-compiler', (require, exports, module) => {
	const { Type } = require('type');
	const { OrderClause } = require('im/messenger/db/query-builder/order');

	/**
	 * @class OrderCompiler
	 */
	class OrderCompiler
	{
		/**
		 * @param {Array<OrderClause>} clauses ordered list (left = highest priority)
		 * @param {object} [context] reserved for JOIN-phase alias resolution
		 * @return {string} comma-separated `field DIRECTION [NULLS ...]` parts
		 */
		compile(clauses, context = {})
		{
			if (!Type.isArray(clauses))
			{
				throw new Error(
					`OrderCompiler: expected an array of OrderClause, got '${clauses?.constructor?.name ?? typeof clauses}'`,
				);
			}

			if (!Type.isArrayFilled(clauses))
			{
				return '';
			}

			return clauses.map((clause) => this.#compileOne(clause, context)).join(', ');
		}

		/**
		 * @param {Array<OrderClause>} clauses
		 * @param {object} [context]
		 * @return {string}
		 */
		toSql(clauses, context = {})
		{
			return this.compile(clauses, context);
		}

		/**
		 * @param {OrderClause} clause
		 * @param {object} context
		 * @return {string}
		 */
		#compileOne(clause, context)
		{
			if (!(clause instanceof OrderClause))
			{
				throw new Error(
					`OrderCompiler: expected OrderClause, got '${clause?.constructor?.name ?? typeof clause}'`,
				);
			}

			const columnRef = this.#resolveFieldRef(clause.field, context);
			const nullsSuffix = clause.nulls ? ` NULLS ${clause.nulls}` : '';

			return `${columnRef} ${clause.direction}${nullsSuffix}`;
		}

		/**
		 * @param {BaseField} field
		 * @param {object} context
		 * @return {string}
		 */
		#resolveFieldRef(field, context = {})
		{
			if (context.resolveField)
			{
				return context.resolveField(field);
			}

			return field.name;
		}
	}

	module.exports = { OrderCompiler };
});
