/**
 * @module im/messenger/db/query-builder/builder/src/base-insert-query-builder
 */
jn.define('im/messenger/db/query-builder/builder/src/base-insert-query-builder', (require, exports, module) => {
	const { Type } = require('type');
	const { inlineValues } = require('im/messenger/db/query-builder/utils');
	const { InsertResult } = require('im/messenger/db/query-builder/result');

	/** SQLite default SQLITE_LIMIT_VARIABLE_NUMBER is 999; use 900 as a safe margin. */
	const SQLITE_MAX_VARIABLE_NUMBER = 900;

	/**
	 * @class BaseInsertQueryBuilder
	 * @abstract
	 */
	class BaseInsertQueryBuilder
	{
		#schema = null;
		#connection;
		#items = [];

		/**
		 * @param {object} params
		 * @param {object} params.connection { executeSql({ query, values }) }
		 */
		constructor({ connection })
		{
			this.#connection = connection;
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
		 * @param {Array<object>|object} items
		 * @return {this}
		 */
		values(items)
		{
			this.#items = Type.isArray(items) ? items : [items];

			return this;
		}

		/**
		 * @return {Promise<InsertResult>}
		 */
		async execute()
		{
			if (!this.#schema)
			{
				throw new Error('InsertQueryBuilder: call .from(schema) before .execute().');
			}

			if (!Type.isArrayFilled(this.#items))
			{
				return new InsertResult({ lastInsertId: null, affected: 0 });
			}

			await this.#connection.ensureSchema(this.#schema);

			const fields = this.#schema.getFields();
			const fieldNames = fields.map((f) => f.name);
			const columnsClause = `(${fieldNames.join(', ')})`;
			const sqlPrefix = this.getSqlPrefix();
			const tableName = this.#schema.getTableName();

			const maxRowsPerChunk = Math.floor(SQLITE_MAX_VARIABLE_NUMBER / fieldNames.length) || 1;

			let lastInsertId = null;
			let totalAffected = 0;

			for (let i = 0; i < this.#items.length; i += maxRowsPerChunk)
			{
				const chunk = this.#items.slice(i, i + maxRowsPerChunk);
				const result = await this.#executeChunk(
					sqlPrefix,
					tableName,
					columnsClause,
					fieldNames,
					fields,
					chunk,
				);

				lastInsertId = result.lastInsertId ?? lastInsertId;
				totalAffected += result.changes ?? 0;
			}

			return new InsertResult({ lastInsertId, affected: totalAffected });
		}

		/**
		 * Debug helper — returns the final SQL for all chunks with values inlined.
		 *
		 * @return {string}
		 */
		toSql()
		{
			if (!this.#schema)
			{
				throw new Error('InsertQueryBuilder: call .from(schema) before .toSql().');
			}

			if (!Type.isArrayFilled(this.#items))
			{
				return '';
			}

			const fields = this.#schema.getFields();
			const fieldNames = fields.map((f) => f.name);
			const columnsClause = `(${fieldNames.join(', ')})`;
			const sqlPrefix = this.getSqlPrefix();
			const tableName = this.#schema.getTableName();
			const maxRowsPerChunk = Math.floor(SQLITE_MAX_VARIABLE_NUMBER / fieldNames.length) || 1;

			const statements = [];
			for (let i = 0; i < this.#items.length; i += maxRowsPerChunk)
			{
				const chunk = this.#items.slice(i, i + maxRowsPerChunk);
				const { query, values } = this.#compileChunk(
					sqlPrefix, tableName, columnsClause, fieldNames, fields, chunk,
				);
				statements.push(inlineValues(query, values));
			}

			return statements.join(';\n');
		}

		/**
		 * @abstract
		 * @protected
		 * @return {string} 'INSERT' | 'INSERT OR REPLACE' | 'INSERT OR IGNORE'
		 */
		getSqlPrefix()
		{
			throw new Error('BaseInsertQueryBuilder: getSqlPrefix must be overridden');
		}

		/**
		 * @return {{ query: string, values: Array<*> }}
		 */
		#compileChunk(sqlPrefix, tableName, columnsClause, fieldNames, fields, chunk)
		{
			const singlePlaceholder = `(${fieldNames.map(() => '?').join(', ')})`;
			const valuesClause = chunk.map(() => singlePlaceholder).join(', ');

			const values = chunk.flatMap((item) => {
				return fields.map((field) => this.#resolveInsertValue(field, item, tableName));
			});

			const query = `${sqlPrefix} INTO ${tableName} ${columnsClause} VALUES ${valuesClause}`;

			return { query, values };
		}

		/**
		 * @param {BaseField} field
		 * @param {object} item
		 * @param {string} tableName
		 * @return {*}
		 */
		#resolveInsertValue(field, item, tableName)
		{
			// 1. Value provided — serialize it
			if (field.name in item)
			{
				const value = item[field.name];

				return field.serialize(value);
			}

			// 2. Default value configured — serialize it
			if (!Type.isUndefined(field.defaultValue))
			{
				return field.serialize(field.defaultValue);
			}

			// 3. NOT NULL without defaultValue — developer error
			if (!field.nullable)
			{
				throw new Error(
					`InsertQueryBuilder: field '${field.name}' in '${tableName}' is NOT NULL, `
					+ 'but no value or defaultValue was provided. '
					+ `Item: ${JSON.stringify(item)}`,
				);
			}

			// 4. Missing value — use raw (no serialization)
			return field.missingValue;
		}

		async #executeChunk(sqlPrefix, tableName, columnsClause, fieldNames, fields, chunk)
		{
			const { query, values } = this.#compileChunk(
				sqlPrefix, tableName, columnsClause, fieldNames, fields, chunk,
			);

			return this.#connection.executeSql({ query, values });
		}

	}

	module.exports = { BaseInsertQueryBuilder };
});
