/**
 * @module im/messenger/db/query-builder/result/src/select-result
 */
jn.define('im/messenger/db/query-builder/result/src/select-result', (require, exports, module) => {
	const { Type } = require('type');
	const { SelectRow } = require('im/messenger/db/query-builder/result/src/select-row');
	const { getFieldOwner } = require('im/messenger/db/schema/schema-ref');

	/**
	 * @class SelectResult
	 * @extends {Array<SelectRow>}
	 */
	class SelectResult extends Array
	{
		#primarySchema;
		#joinMap;

		/**
		 * @param {Array<object>} rawRows plain grouped objects from the builder
		 * @param {typeof BaseSchema} primarySchema Schema passed to .from()
		 * @param {Map<typeof BaseSchema|SchemaRef, string>|null} joinMap Schema → alias key
		 */
		constructor(rawRows, primarySchema, joinMap)
		{
			super();

			this.#primarySchema = primarySchema;
			this.#joinMap = joinMap;

			for (const data of rawRows)
			{
				this.push(new SelectRow(data, primarySchema, joinMap));
			}
		}

		/**
		 * @return {typeof Array}
		 */
		static get [Symbol.species]()
		{
			return Array;
		}

		/**
		 * @param {function(SelectRow, number): boolean} [predicate]
		 * @return {SelectRow|null}
		 */
		first(predicate)
		{
			if (!Type.isFunction(predicate))
			{
				return this[0] ?? null;
			}

			return this.find(predicate) ?? null;
		}

		/**
		 * @return {boolean}
		 */
		isEmpty()
		{
			return this.length === 0;
		}

		/**
		 * @return {boolean}
		 */
		isNotEmpty()
		{
			return this.length > 0;
		}

		/**
		 * @param {string} alias
		 * @return {*}
		 */
		scalar(alias)
		{
			const first = this[0];

			return first ? first[alias] : undefined;
		}

		/**
		 * @param {typeof BaseSchema|SchemaRef} schema
		 * @return {Array<object>}
		 */
		extract(schema)
		{
			return this.map((row) => row.extract(schema));
		}

		/**
		 * @param {string|BaseField} keyOrField
		 * @return {Array<*>}
		 */
		pluck(keyOrField)
		{
			if (Type.isString(keyOrField))
			{
				return this.map((row) => row[keyOrField]);
			}

			const schema = this.#findSchemaForField(keyOrField);
			if (!schema)
			{
				throw new Error(
					`SelectResult.pluck: field '${keyOrField?.name ?? '<unknown>'}' is not part of this query`,
				);
			}

			return this.map((row) => row.extract(schema)[keyOrField.name]);
		}

		/** @return {Array<object>} */
		toJSON()
		{
			return Array.from(this);
		}

		#findSchemaForField(field)
		{
			if (!field || !Type.isObject(field))
			{
				return null;
			}

			if (this.#primarySchema?.getMap?.().includes(field))
			{
				return this.#primarySchema;
			}

			if (this.#joinMap)
			{
				for (const schema of this.#joinMap.keys())
				{
					if (schema.getFields().includes(field))
					{
						return schema;
					}
				}
			}

			if (this.#joinMap?.has(getFieldOwner(field)))
			{
				return getFieldOwner(field);
			}

			return null;
		}
	}

	module.exports = { SelectResult };
});
