/**
 * @module im/messenger/db/query-builder/builder/src/update-query-builder
 */
jn.define('im/messenger/db/query-builder/builder/src/update-query-builder', (require, exports, module) => {
	const { Type } = require('type');
	const { and } = require('im/messenger/db/query-builder/condition');
	const { inlineValues } = require('im/messenger/db/query-builder/utils');
	const { UpdateResult } = require('im/messenger/db/query-builder/result');

	/**
	 * @class UpdateQueryBuilder
	 */
	class UpdateQueryBuilder
	{
		#schema = null;
		#connection;
		#conditionCompiler;
		#setEntries = [];
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
		 * @param {object} fieldsMap { fieldName: value, ... }
		 * @return {this}
		 */
		set(fieldsMap)
		{
			if (!this.#schema)
			{
				throw new Error('UpdateQueryBuilder: call .from(schema) before .set().');
			}

			const schemaFields = this.#schema.getFields();
			const fieldsByName = {};
			for (const field of schemaFields)
			{
				fieldsByName[field.name] = field;
			}

			for (const [name, value] of Object.entries(fieldsMap))
			{
				const field = fieldsByName[name];
				if (!field)
				{
					throw new Error(
						`UpdateQueryBuilder: unknown field '${name}' for table '${this.#schema.getTableName()}'.`,
					);
				}

				this.#setEntries.push({ field, value });
			}

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
		 * @return {Promise<UpdateResult>}
		 */
		async execute()
		{
			if (!this.#schema)
			{
				throw new Error('UpdateQueryBuilder: call .from(schema) before .execute().');
			}

			if (!Type.isArrayFilled(this.#setEntries))
			{
				throw new Error('UpdateQueryBuilder: no fields to update. Call .set({ ... }) before .execute().');
			}

			await this.#connection.ensureSchema(this.#schema);

			const { query, values } = this.#compile();
			const result = await this.#connection.executeSql({ query, values });

			return new UpdateResult({ affected: result.changes ?? 0 });
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
				throw new Error('UpdateQueryBuilder: call .from(schema) before .toSql().');
			}

			if (!Type.isArrayFilled(this.#setEntries))
			{
				throw new Error('UpdateQueryBuilder: call .set({ ... }) before .toSql().');
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

			const setClauses = this.#setEntries.map((entry) => {
				values.push(entry.field.serialize(entry.value));

				return `${entry.field.name} = ?`;
			});

			parts.push(`UPDATE ${this.#schema.getTableName()} SET ${setClauses.join(', ')}`);

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

	module.exports = { UpdateQueryBuilder };
});
