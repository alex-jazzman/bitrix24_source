/**
 * @module im/messenger/db/query-builder/compiler/src/schema-compiler
 */
jn.define('im/messenger/db/query-builder/compiler/src/schema-compiler', (require, exports, module) => {
	const { Type } = require('type');
	const { SqlFieldType } = require('im/messenger/db/const');

	/**
	 * @class SchemaCompiler
	 */
	class SchemaCompiler
	{
		/**
		 * @param {typeof BaseSchema} schema class with getTableName, getMap, getIndexes, getConstraints
		 * @return {{ createTableSql: string, createIndexSqls: string[] }}
		 */
		compile(schema)
		{
			const tableName = schema.getTableName();
			const fields = schema.getFields();
			const indexes = schema.getIndexes?.() ?? [];

			const primaryFields = fields.filter((field) => field.primary);
			const isCompositePk = primaryFields.length > 1;

			const columnDefs = fields.map((field) => this.#compileColumnDef(field, isCompositePk));

			if (isCompositePk)
			{
				const pkColumns = primaryFields.map((field) => field.name).join(', ');
				columnDefs.push(`PRIMARY KEY (${pkColumns})`);
			}

			const createTableSql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs.join(', ')})`;
			const createIndexSqls = indexes.map((index) => this.#compileIndex(index, tableName));

			return { createTableSql, createIndexSqls };
		}

		/**
		 * DEBUG — all DDL statements joined by `;\n`.
		 *
		 * @param {typeof BaseSchema} schema
		 * @return {string}
		 */
		toSql(schema)
		{
			const { createTableSql, createIndexSqls } = this.compile(schema);

			return [createTableSql, ...createIndexSqls].join(';\n');
		}

		/**
		 * @param {BaseField} field
		 * @param {boolean} [skipPrimaryKey] true when composite PK — emitted as table-level constraint
		 * @return {string} e.g. "dialogId TEXT NOT NULL"
		 */
		#compileColumnDef(field, skipPrimaryKey = false)
		{
			const sqlType = this.#getSqlType(field);
			const parts = [field.name, sqlType];

			if (field.primary && !skipPrimaryKey)
			{
				parts.push('PRIMARY KEY');
			}

			if (field.autocomplete)
			{
				parts.push('AUTOINCREMENT');
			}

			if (!field.nullable)
			{
				parts.push('NOT NULL');
			}

			if (!Type.isUndefined(field.defaultValue))
			{
				parts.push(`DEFAULT ${this.#formatDefault(field.serialize(field.defaultValue))}`);
			}

			return parts.join(' ');
		}

		/**
		 * @param {BaseField} field
		 * @return {string}
		 */
		#getSqlType(field)
		{
			const sqlType = SqlFieldType[field.fieldType];
			if (Type.isNil(sqlType))
			{
				throw new Error(
					`SchemaCompiler: unknown fieldType '${field.fieldType}' for field '${field.name}'. `
					+ 'Ensure the Field subclass defines a `get fieldType()` returning a FieldType constant.',
				);
			}

			return sqlType;
		}

		/**
		 * @param {*} value JS literal (string, number, null, boolean)
		 * @return {string}
		 */
		#formatDefault(value)
		{
			if (Type.isString(value))
			{
				return `'${value.replace(/'/g, "''")}'`;
			}

			if (Type.isNumber(value))
			{
				return String(value);
			}

			if (Type.isNull(value))
			{
				return 'NULL';
			}

			throw new Error(`SchemaCompiler: unexpected DEFAULT value type '${typeof value}'`);
		}

		/**
		 * @param {Index} index
		 * @param {string} tableName
		 * @return {string}
		 */
		#compileIndex(index, tableName)
		{
			const columnNames = index.fields.map((field) => field.name).join(', ');
			const indexName = index.name
				?? `${index.fields.map((f) => f.name).join('_')}_${tableName}_idx`;
			const uniquePrefix = index.unique ? 'UNIQUE ' : '';

			return `CREATE ${uniquePrefix}INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columnNames})`;
		}
	}

	module.exports = { SchemaCompiler };
});
