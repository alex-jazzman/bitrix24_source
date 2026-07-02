/**
 * @module im/messenger/db/query-builder/builder/src/delete-query-builder
 */
jn.define('im/messenger/db/query-builder/builder/src/delete-query-builder', (require, exports, module) => {
	const { Type } = require('type');
	const { and } = require('im/messenger/db/query-builder/condition');
	const { inlineValues } = require('im/messenger/db/query-builder/utils');
	const { DeleteResult } = require('im/messenger/db/query-builder/result');

	/**
	 * @class DeleteQueryBuilder
	 */
	class DeleteQueryBuilder
	{
		#schema = null;
		#connection;
		#conditionCompiler;
		#conditions = [];

		/**
		 * @param {object} params
		 * @param {object} params.connection { executeSql({ query, values }) }
		 * @param {ConditionCompiler} params.conditionCompiler
		 */
		constructor({ connection, conditionCompiler })
		{
			this.#connection = connection;
			this.#conditionCompiler = conditionCompiler;
		}

		/**
		 * @param {typeof BaseSchema|SchemaRef} schema
		 * @return {this}
		 */
		from(schema)
		{
			this.#schema = schema;

			return this;
		}

		/**
		 * @param {...(Condition|null|undefined|false)} conditions
		 * @return {this}
		 */
		where(...conditions)
		{
			this.#conditions.push(...conditions.filter(Boolean));

			return this;
		}

		/**
		 * @return {Promise<DeleteResult>}
		 */
		async execute()
		{
			if (!this.#schema)
			{
				throw new Error('DeleteQueryBuilder: call .from(schema) before .execute().');
			}

			await this.#connection.ensureSchema(this.#schema);

			const { query, values } = this.#compile();
			const result = await this.#connection.executeSql({ query, values });

			return new DeleteResult({ affected: result.changes ?? 0 });
		}

		/**
		 * Debug helper — returns the final SQL with values inlined.
		 *
		 * @return {string}
		 */
		toSql()
		{
			if (!this.#schema)
			{
				throw new Error('DeleteQueryBuilder: call .from(schema) before .toSql().');
			}

			const { query, values } = this.#compile();

			return inlineValues(query, values);
		}

		/**
		 * @return {{ query: string, values: Array<*> }}
		 */
		#compile()
		{
			const values = [];
			const parts = [];

			parts.push(`DELETE FROM ${this.#schema.getTableName()}`);

			if (Type.isArrayFilled(this.#conditions))
			{
				const whereCondition = and(...this.#conditions);
				if (whereCondition)
				{
					const compiled = this.#conditionCompiler.compile(whereCondition);
					parts.push(`WHERE ${compiled.query}`);
					values.push(...compiled.values);
				}
			}

			return { query: parts.join(' '), values };
		}

	}

	module.exports = { DeleteQueryBuilder };
});
