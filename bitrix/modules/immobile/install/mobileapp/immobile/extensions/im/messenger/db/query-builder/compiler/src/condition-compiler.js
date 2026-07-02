/**
 * @module im/messenger/db/query-builder/compiler/src/condition-compiler
 */
jn.define('im/messenger/db/query-builder/compiler/src/condition-compiler', (require, exports, module) => {
	const { Type } = require('type');
	const { ConditionType } = require('im/messenger/db/query-builder/condition');
	const { inlineValues } = require('im/messenger/db/query-builder/utils');

	const SQL_BINARY_OPERATORS = {
		[ConditionType.EQUAL]: '=',
		[ConditionType.NOT_EQUAL]: '!=',
		[ConditionType.GREATER_THAN]: '>',
		[ConditionType.GREATER_THAN_OR_EQUAL]: '>=',
		[ConditionType.LESS_THAN]: '<',
		[ConditionType.LESS_THAN_OR_EQUAL]: '<=',
	};

	const SQL_KEYWORDS = {
		IN: 'IN',
		NOT_IN: 'NOT IN',
		LIKE: 'LIKE',
		NOT_LIKE: 'NOT LIKE',
		IS_NULL: 'IS NULL',
		IS_NOT_NULL: 'IS NOT NULL',
		AND: 'AND',
		OR: 'OR',
	};

	/**
	 * @class ConditionCompiler
	 */
	class ConditionCompiler
	{
		/**
		 * @param {Condition} condition
		 * @param {object} [context] optional context for field resolution
		 * @param {function} [context.resolveField] (field) → SQL column reference string
		 * @return {{ query: string, values: Array<*> }}
		 */
		compile(condition, context = {})
		{
			const binaryOp = SQL_BINARY_OPERATORS[condition.type];
			if (binaryOp)
			{
				return this.#compileBinary(condition, binaryOp, context);
			}

			switch (condition.type)
			{
				case ConditionType.IN:
					return this.#compileInList(condition, SQL_KEYWORDS.IN, context);

				case ConditionType.NOT_IN:
					return this.#compileInList(condition, SQL_KEYWORDS.NOT_IN, context);

				case ConditionType.LIKE:
					return this.#compileLike(condition, SQL_KEYWORDS.LIKE, context);

				case ConditionType.NOT_LIKE:
					return this.#compileLike(condition, SQL_KEYWORDS.NOT_LIKE, context);

				case ConditionType.IS_NULL:
					return this.#compileNullCheck(condition, SQL_KEYWORDS.IS_NULL, context);

				case ConditionType.IS_NOT_NULL:
					return this.#compileNullCheck(condition, SQL_KEYWORDS.IS_NOT_NULL, context);

				case ConditionType.AND:
					return this.#compileComposite(condition, SQL_KEYWORDS.AND, context);

				case ConditionType.OR:
					return this.#compileComposite(condition, SQL_KEYWORDS.OR, context);

				case ConditionType.NOT:
					return this.#compileNot(condition, context);

				case ConditionType.EQUAL_FIELD:
					return this.#compileFieldToField(condition, context);

				default:
					throw new Error(
						`ConditionCompiler: unknown condition type '${condition.type}'`,
					);
			}
		}

		/**
		 * DEBUG ONLY — SQL with values inlined. Never pass to executeSql.
		 *
		 * @param {object} condition
		 * @param {object} [context]
		 * @return {string}
		 */
		toSql(condition, context = {})
		{
			const { query, values } = this.compile(condition, context);

			return inlineValues(query, values);
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

		#compileBinary(condition, sqlOperator, context)
		{
			const serialized = condition.field.serialize(condition.value);

			if (Type.isNull(serialized))
			{
				if (sqlOperator === SQL_BINARY_OPERATORS[ConditionType.EQUAL])
				{
					return this.#compileNullCheck(condition, SQL_KEYWORDS.IS_NULL, context);
				}

				if (sqlOperator === SQL_BINARY_OPERATORS[ConditionType.NOT_EQUAL])
				{
					return this.#compileNullCheck(condition, SQL_KEYWORDS.IS_NOT_NULL, context);
				}
			}

			return {
				query: `${this.#resolveFieldRef(condition.field, context)} ${sqlOperator} ?`,
				values: [serialized],
			};
		}

		#compileInList(condition, sqlOperator, context)
		{
			if (!Type.isArrayFilled(condition.values))
			{
				throw new Error(
					`ConditionCompiler: empty values array passed to ${sqlOperator}-condition for field '${condition.field.name}'. `
					+ 'Filter the empty case upstream before reaching the compiler.',
				);
			}

			const placeholders = condition.values.map(() => '?').join(', ');
			const serializedValues = condition.values.map((v) => condition.field.serialize(v));

			return {
				query: `${this.#resolveFieldRef(condition.field, context)} ${sqlOperator} (${placeholders})`,
				values: serializedValues,
			};
		}

		#compileLike(condition, sqlOperator, context)
		{
			const collationSuffix = condition.field.collation
				? ` COLLATE ${condition.field.collation}`
				: '';

			return {
				query: `${this.#resolveFieldRef(condition.field, context)} ${sqlOperator} ?${collationSuffix}`,
				values: [condition.field.serialize(condition.pattern)],
			};
		}

		#compileNullCheck(condition, sqlOperator, context)
		{
			return {
				query: `${this.#resolveFieldRef(condition.field, context)} ${sqlOperator}`,
				values: [],
			};
		}

		#compileComposite(condition, sqlOperator, context)
		{
			if (!Type.isArrayFilled(condition.children))
			{
				throw new Error(
					`ConditionCompiler: ${sqlOperator}-condition has no children.`,
				);
			}

			const compiledChildren = condition.children.map((child) => this.compile(child, context));
			const queries = compiledChildren.map((c) => c.query).join(` ${sqlOperator} `);
			const values = compiledChildren.flatMap((c) => c.values);

			return {
				query: `(${queries})`,
				values,
			};
		}

		#compileNot(condition, context)
		{
			const childCompiled = this.compile(condition.child, context);

			return {
				query: `NOT (${childCompiled.query})`,
				values: childCompiled.values,
			};
		}

		#compileFieldToField(condition, context)
		{
			return {
				query: `${this.#resolveFieldRef(condition.leftField, context)} = ${this.#resolveFieldRef(condition.rightField, context)}`,
				values: [],
			};
		}
	}

	module.exports = { ConditionCompiler };
});
