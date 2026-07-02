/**
 * @module im/messenger/db/connection
 */
jn.define('im/messenger/db/connection', (require, exports, module) => {
	/* globals DatabaseTable, include */
	include('sqlite');

	const { SchemaCompiler } = require('im/messenger/db/query-builder/compiler');

	const HOLDER_TABLE_NAME = '__b_connection';
	const HOLDER_FIELDS = [
		{ name: '_', type: 'integer' },
	];

	/** @type {DatabaseConnection|null} */
	let instance = null;

	/**
	 * @class DatabaseConnection
	 */
	class DatabaseConnection
	{
		#holder = null;
		#schemaCompiler = null;
		/** @type {Map<string, Promise<boolean>>} */
		#ensuredSchemas = new Map();

		/**
		 * @param {object} [nativeTable] injected holder for testing; omit for production singleton
		 */
		constructor(nativeTable)
		{
			if (!nativeTable && instance)
			{
				return instance;
			}

			this.#holder = nativeTable ?? new DatabaseTable(HOLDER_TABLE_NAME, HOLDER_FIELDS);
			this.#schemaCompiler = new SchemaCompiler();

			if (!nativeTable)
			{
				instance = this;
			}
		}

		/**
		 * @return {DatabaseConnection}
		 */
		static getInstance()
		{
			if (!instance)
			{
				instance = new DatabaseConnection();
			}

			return instance;
		}

		/**
		 * @param {{ query: string, values?: Array<*> }} params
		 * @return {Promise<{ columns: string[], rows: Array<Array<*>>, lastInsertId: *, changes: number }>}
		 */
		executeSql({ query, values = [] })
		{
			return this.#holder.executeSql({ query, values });
		}

		/**
		 * @param {string} tableName
		 * @return {Promise<boolean>}
		 */
		async tableExists(tableName)
		{
			const result = await this.executeSql({
				query: "SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type = 'table' AND name = ?",
				values: [tableName],
			});

			return result.rows.length > 0 && result.rows[0][0] > 0;
		}

		/**
		 * Ensures the table for `schemaClass` exists. Single-flight: concurrent calls
		 * for the same schema share one Promise; subsequent calls resolve instantly.
		 *
		 * @param {typeof BaseSchema} schemaClass
		 * @return {Promise<boolean>} true if created, false if already existed
		 */
		ensureSchema(schemaClass)
		{
			const tableName = schemaClass.getTableName();

			if (this.#ensuredSchemas.has(tableName))
			{
				return this.#ensuredSchemas.get(tableName);
			}

			const promise = this.#createSchema(schemaClass);
			this.#ensuredSchemas.set(tableName, promise);

			return promise;
		}

		/**
		 * Drops the table for `schemaClass` and removes it from the ensure cache.
		 *
		 * @param {typeof BaseSchema} schemaClass
		 * @return {Promise<void>}
		 */
		async dropSchema(schemaClass)
		{
			const tableName = schemaClass.getTableName();

			await this.executeSql({ query: `DROP TABLE IF EXISTS ${tableName}` });

			this.#ensuredSchemas.delete(tableName);
		}

		/**
		 * @param {typeof BaseSchema} schemaClass
		 * @return {Promise<boolean>}
		 */
		async #createSchema(schemaClass)
		{
			const { createTableSql, createIndexSqls } = this.#schemaCompiler.compile(schemaClass);

			await this.executeSql({ query: createTableSql });

			for (const indexSql of createIndexSqls)
			{
				await this.executeSql({ query: indexSql });
			}

			return true;
		}
	}

	module.exports = { DatabaseConnection };
});
