/**
 * @module im/messenger/db/schema/schema-ref
 */
jn.define('im/messenger/db/schema/schema-ref', (require, exports, module) => {
	/** @type {WeakMap<BaseField, SchemaRef>} */
	const fieldOwners = new WeakMap();

	/**
	 * Returns the SchemaRef that owns this field, or null for schema-static fields.
	 *
	 * @param {BaseField} field
	 * @return {SchemaRef|null}
	 */
	const getFieldOwner = (field) => fieldOwners.get(field) ?? null;

	/**
	 * An independently-cloned snapshot of a Schema for use in self-JOIN queries.
	 * Each field instance is unique so that === identity distinguishes the two copies
	 * of the same table in one query.
	 *
	 * Mirrors the static API of BaseSchema as instance methods.
	 * Named field properties are available directly: `ref.id`, `ref.name`, etc.
	 *
	 * Created via BaseSchema.createRef() — do not instantiate directly.
	 *
	 * @class SchemaRef
	 */
	class SchemaRef
	{
		#tableName;
		#fields;

		/**
		 * @param {typeof import('../base-schema/extension').BaseSchema} SchemaClass
		 */
		constructor(SchemaClass)
		{
			this.#tableName = SchemaClass.getTableName();
			this.#fields = SchemaClass.getFields().map((field) => {
				const cloned = field.clone();
				fieldOwners.set(cloned, this);
				this[field.name] = cloned;

				return cloned;
			});
		}

		/**
		 * @return {string}
		 */
		getTableName()
		{
			return this.#tableName;
		}

		/**
		 * @return {Array<BaseField>}
		 */
		getFields()
		{
			return this.#fields;
		}

		/**
		 * @param {string} name
		 * @return {BaseField|null}
		 */
		getField(name)
		{
			return this.#fields.find((field) => field.name === name) ?? null;
		}

		/**
		 * @return {Array<BaseField>}
		 */
		getPrimaryFields()
		{
			return this.#fields.filter((field) => field.primary === true);
		}
	}

	module.exports = { SchemaRef, getFieldOwner };
});
