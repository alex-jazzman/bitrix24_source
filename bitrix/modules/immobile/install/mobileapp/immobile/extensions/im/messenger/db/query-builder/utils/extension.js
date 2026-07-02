/**
 * @module im/messenger/db/query-builder/utils
 */
jn.define('im/messenger/db/query-builder/utils', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * DEBUG ONLY — inlines `?` placeholders with already-serialized values for logging.
	 * Expects values after Field.serialize() — strings, numbers, or null.
	 *
	 * @param {string} query SQL with `?` placeholders
	 * @param {Array<*>} values serialized values to inline (in order of placeholders)
	 * @return {string}
	 */
	const inlineValues = (query, values) => {
		let index = 0;

		return query.replace(/\?/g, () => {
			const value = values[index++];

			if (Type.isNil(value))
			{
				return 'NULL';
			}

			if (Type.isNumber(value))
			{
				return String(value);
			}

			return `'${String(value).replace(/'/g, "''")}'`;
		});
	};

	module.exports = { inlineValues };
});
