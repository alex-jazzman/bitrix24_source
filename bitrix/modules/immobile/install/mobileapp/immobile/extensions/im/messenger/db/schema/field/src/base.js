/**
 * @module im/messenger/db/schema/field/src/base
 */
jn.define('im/messenger/db/schema/field/src/base', (require, exports, module) => {
	const { Type } = require('type');
	const { isNull: isNullFactory, isNotNull: isNotNullFactory } = require('im/messenger/db/query-builder/condition');
	const { asc, desc } = require('im/messenger/db/query-builder/order');
	const { FieldAlias } = require('im/messenger/db/schema/field/src/alias');

	/**
	 * @class BaseField
	 * @abstract
	 */
	class BaseField
	{
		#saveCallback = null;
		#restoreCallback = null;

		/**
		 * @param {string} name SQL column name
		 */
		constructor(name)
		{
			this.name = name;

			this.nullable = true;
			this.primary = false;
			this.defaultValue = undefined;
			this.missingValue = '';
		}

		// ─── DDL configuration (universal) ─────────────────────────────────

		/**
		 * @param {boolean} value pass `false` for NOT NULL
		 * @return {this}
		 */
		configureNullable(value = true)
		{
			this.nullable = value;

			return this;
		}

		/**
		 * @param {*} value JS literal used for DDL DEFAULT and as fallback in INSERT when field is missing
		 * @return {this}
		 */
		configureDefaultValue(value)
		{
			this.defaultValue = value;

			return this;
		}

		/**
		 * Raw value to use in INSERT when field is missing and no defaultValue is set.
		 * Skips serialization — written to SQL as-is. For legacy compatibility.
		 *
		 * @param {*} value
		 * @return {this}
		 */
		configureMissingValue(value)
		{
			this.missingValue = value;

			return this;
		}

		// ─── clone / alias ─────────────────────────────────────────────────

		/**
		 * @return {BaseField}
		 */
		clone()
		{
			const cloned = new this.constructor(this.name);
			this.copyInto(cloned);

			return cloned;
		}

		/**
		 * @protected
		 * @param {BaseField} target
		 */
		copyInto(target)
		{
			target.nullable = this.nullable;
			target.primary = this.primary;
			target.defaultValue = this.defaultValue;
			target.missingValue = this.missingValue;

			if (this.#saveCallback)
			{
				target.configureSaveCallback(this.#saveCallback);
			}

			if (this.#restoreCallback)
			{
				target.configureRestoreCallback(this.#restoreCallback);
			}
		}

		/**
		 * @param {string} alias result key name
		 * @return {FieldAlias}
		 */
		as(alias)
		{
			return new FieldAlias(this, alias);
		}

		// ─── serialize / restore (universal, template-method) ──────────────

		/**
		 * @param {function(*): *} fn receives JS value, returns the value to write
		 * @return {this}
		 */
		configureSaveCallback(fn)
		{
			this.#saveCallback = fn;

			return this;
		}

		/**
		 * @param {function(*): *} fn receives raw DB value, returns JS value
		 * @return {this}
		 */
		configureRestoreCallback(fn)
		{
			this.#restoreCallback = fn;

			return this;
		}

		/**
		 * @param {*} value
		 * @return {*}
		 */
		serialize(value)
		{
			if (this.#saveCallback)
			{
				return this.#saveCallback(value);
			}

			if (Type.isNil(value))
			{
				return null;
			}

			return this.serializeDefault(value);
		}

		/**
		 * @param {*} raw
		 * @return {*}
		 */
		restore(raw)
		{
			if (this.#restoreCallback)
			{
				return this.#restoreCallback(raw);
			}

			if (Type.isNil(raw))
			{
				return null;
			}

			return this.restoreDefault(raw);
		}

		/**
		 * @param {*} value
		 * @return {*}
		 */
		serializeDefault(value)
		{
			return value;
		}

		/**
		 * @param {*} raw
		 * @return {*}
		 */
		restoreDefault(raw)
		{
			return raw;
		}

		// ─── presence checks (universal) ───────────────────────────────────

		/**
		 * @return {IsNullCondition}
		 */
		isNull()
		{
			return isNullFactory(this);
		}

		isNotNull()
		{
			return isNotNullFactory(this);
		}

		// ─── sort (universal) ──────────────────────────────────────────────

		/**
		 * @return {OrderClause}
		 */
		asc()
		{
			return asc(this);
		}

		/**
		 * @return {OrderClause}
		 */
		desc()
		{
			return desc(this);
		}
	}

	module.exports = { BaseField };
});
