/**
 * @module im/messenger/db/schema/field/src/string
 */
jn.define('im/messenger/db/schema/field/src/string', (require, exports, module) => {
	const { FieldType } = require('im/messenger/db/const');
	const { OrderedField } = require('im/messenger/db/schema/field/src/ordered');

	const {
		like: likeFactory,
		notLike: notLikeFactory,
	} = require('im/messenger/db/query-builder/condition');

	/**
	 * @class StringField
	 */
	class StringField extends OrderedField
	{
		constructor(name)
		{
			super(name);

			this.size = null;
			this.collation = null;
		}

		get fieldType()
		{
			return FieldType.text;
		}

		/**
		 * @param {number} size
		 * @return {this}
		 */
		configureSize(size)
		{
			this.size = size;

			return this;
		}

		/**
		 * @param {string} collation e.g. `'NOCASE'`
		 * @return {this}
		 */
		configureCollation(collation)
		{
			this.collation = collation;

			return this;
		}

		/**
		 * @param {string} pattern SQL LIKE pattern with `%` and `_` wildcards
		 * @return {LikeCondition}
		 */
		like(pattern)
		{
			return likeFactory(this, pattern);
		}

		notLike(pattern)
		{
			return notLikeFactory(this, pattern);
		}

		/**
		 * @protected
		 * @param {BaseField} target
		 */
		copyInto(target)
		{
			super.copyInto(target);
			target.size = this.size;
			target.collation = this.collation;
		}
	}

	module.exports = { StringField };
});
