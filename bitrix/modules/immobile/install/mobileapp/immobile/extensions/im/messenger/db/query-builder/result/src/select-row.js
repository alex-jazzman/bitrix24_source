/**
 * @module im/messenger/db/query-builder/result/src/select-row
 */
jn.define('im/messenger/db/query-builder/result/src/select-row', (require, exports, module) => {
	const { Type } = require('type');

	const RESERVED_KEYS = new Set(['extract', 'has', 'toJSON']);

	/**
	 * @class SelectRow
	 */
	class SelectRow
	{
		#data;
		#primarySchema;
		#joinMap;

		/**
		 * @param {object} data raw grouped row data
		 * @param {typeof BaseSchema} primarySchema Schema passed to .from()
		 * @param {Map<typeof BaseSchema|SchemaRef, string>|null} joinMap Schema → alias key in data
		 */
		constructor(data, primarySchema, joinMap)
		{
			this.#data = data;
			this.#primarySchema = primarySchema;
			this.#joinMap = joinMap;

			const joinAliases = joinMap ? new Set(joinMap.values()) : new Set();

			for (const key of Object.keys(data))
			{
				if (!joinAliases.has(key) && !RESERVED_KEYS.has(key))
				{
					Object.defineProperty(this, key, {
						get: () => data[key],
						enumerable: true,
					});
				}
			}
		}

		/**
		 * @param {typeof BaseSchema|SchemaRef} schema
		 * @return {object}
		 */
		extract(schema)
		{
			if (schema === this.#primarySchema)
			{
				const result = {};
				for (const field of schema.getFields())
				{
					result[field.name] = this.#data[field.name];
				}

				return result;
			}

			const alias = this.#joinMap?.get(schema);
			if (!alias)
			{
				const name = schema?.getTableName?.() ?? '<unknown>';
				throw new Error(`SelectRow.extract: schema '${name}' is not part of this query`);
			}

			return { ...(this.#data[alias] ?? {}) };
		}

		/**
		 * @param {typeof BaseSchema|SchemaRef} schema
		 * @return {boolean}
		 */
		has(schema)
		{
			if (schema === this.#primarySchema)
			{
				return true;
			}

			const alias = this.#joinMap?.get(schema);
			if (!alias)
			{
				return false;
			}

			const group = this.#data[alias];
			if (!group)
			{
				return false;
			}

			return Object.values(group).some((v) => !Type.isNil(v));
		}

		/** @return {object} */
		toJSON()
		{
			return this.#data;
		}
	}

	module.exports = { SelectRow };
});
