/**
 * @module im/messenger/db/query-builder/compiler/src/helpers
 */
jn.define('im/messenger/db/query-builder/compiler/src/helpers', (require, exports, module) => {
	/**
	 * @param {typeof BaseSchema} schema class with static getMap()
	 * @param {{ prefix?: string }} [options]
	 * @return {string}
	 */
	const compileSelectColumns = (schema, options = {}) => {
		const { prefix = null } = options;
		const fields = schema.getFields();

		if (prefix)
		{
			return fields.map((field) => `${prefix}.${field.name}`).join(', ');
		}

		return fields.map((field) => field.name).join(', ');
	};

	/**
	 * @param {typeof BaseSchema} schema class with static getMap()
	 * @param {Array<object>} items objects to insert
	 * @return {{ columnsClause: string, valuesClause: string, values: Array<*> }}
	 */
	const compileInsertParts = (schema, items) => {
		const fields = schema.getFields();
		const fieldNames = fields.map((field) => field.name);

		const columnsClause = `(${fieldNames.join(', ')})`;

		const singlePlaceholder = `(${fieldNames.map(() => '?').join(', ')})`;
		const valuesClause = items.map(() => singlePlaceholder).join(', ');

		const values = items.flatMap((item) => {
			return fields.map((field) => field.serialize(item[field.name] ?? null));
		});

		return { columnsClause, valuesClause, values };
	};

	/**
	 * @param {typeof BaseSchema} schema class with static getMap()
	 * @param {{ columns: string[], rows: Array<Array<*>> }} result from executeSql
	 * @param {{ applyRestore?: boolean }} [options] default { applyRestore: true }
	 * @return {Array<object>}
	 */
	const restoreRows = (schema, result, options = {}) => {
		const { applyRestore = true } = options;

		if (!result || !result.columns || !result.rows)
		{
			return [];
		}

		const fieldsByName = {};
		if (applyRestore)
		{
			for (const field of schema.getFields())
			{
				fieldsByName[field.name] = field;
			}
		}

		return result.rows.map((row) => {
			const obj = {};

			for (let i = 0; i < result.columns.length; i++)
			{
				const columnName = result.columns[i];
				const rawValue = row[i];

				const field = fieldsByName[columnName];
				obj[columnName] = field ? field.restore(rawValue) : rawValue;
			}

			return obj;
		});
	};

	module.exports = {
		compileSelectColumns,
		compileInsertParts,
		restoreRows,
	};
});
