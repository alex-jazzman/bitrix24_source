/**
 * @module im/messenger/db/schema/base-schema
 */
jn.define('im/messenger/db/schema/base-schema', (require, exports, module) => {
	const { SchemaRef } = require('im/messenger/db/schema/schema-ref');
	/**
	 * @class BaseSchema
	 * @abstract
	 */
	class BaseSchema
	{
		/** @protected */
		static mapCache = null;

		/**
		 * @abstract
		 * @return {string} SQL table name (e.g., 'b_im_dialog')
		 */
		static getTableName()
		{
			throw new Error('BaseSchema: getTableName() must be overridden');
		}

		/**
		 * @final
		 * @return {Array<BaseField>} cached ordered list of columns
		 */
		static getFields()
		{
			if (!this.mapCache)
			{
				this.mapCache = this.getMap();
			}

			return this.mapCache;
		}

		/**
		 * @abstract
		 * @protected
		 * @return {Array<BaseField>} ordered list of columns; order is the DDL order
		 */
		static getMap()
		{
			throw new Error('BaseSchema: getMap() must be overridden');
		}

		/**
		 * @return {Array<Index>} default: no indexes
		 */
		static getIndexes()
		{
			return [];
		}

		/**
		 * @param {string} name
		 * @return {BaseField|null}
		 */
		static getField(name)
		{
			return this.getFields().find((field) => field.name === name) ?? null;
		}

		/**
		 * @return {Array<BaseField>}
		 */
		static getPrimaryFields()
		{
			return this.getFields().filter((field) => field.primary === true);
		}

		/**
		 * Creates an independently-cloned ref for self-JOIN queries.
		 *
		 * @return {SchemaRef}
		 */
		static createRef()
		{
			return new SchemaRef(this);
		}
	}

	module.exports = { BaseSchema };
});
