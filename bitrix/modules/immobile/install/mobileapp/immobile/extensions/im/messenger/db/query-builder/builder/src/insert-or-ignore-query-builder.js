/**
 * @module im/messenger/db/query-builder/builder/src/insert-or-ignore-query-builder
 */
jn.define('im/messenger/db/query-builder/builder/src/insert-or-ignore-query-builder', (require, exports, module) => {
	const { BaseInsertQueryBuilder } = require('im/messenger/db/query-builder/builder/src/base-insert-query-builder');

	/**
	 * @class InsertOrIgnoreQueryBuilder
	 *
	 * INSERT OR IGNORE — silently skips rows that conflict.
	 */
	class InsertOrIgnoreQueryBuilder extends BaseInsertQueryBuilder
	{
		/**
		 * @protected
		 * @override
		 * @return {string}
		 */
		getSqlPrefix()
		{
			return 'INSERT OR IGNORE';
		}
	}

	module.exports = { InsertOrIgnoreQueryBuilder };
});
