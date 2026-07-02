/**
 * @module im/messenger/db/query-builder/builder/src/insert-query-builder
 */
jn.define('im/messenger/db/query-builder/builder/src/insert-query-builder', (require, exports, module) => {
	const { BaseInsertQueryBuilder } = require('im/messenger/db/query-builder/builder/src/base-insert-query-builder');

	/**
	 * @class InsertQueryBuilder
	 *
	 * Standard INSERT INTO — aborts on conflict (default SQLite behavior).
	 */
	class InsertQueryBuilder extends BaseInsertQueryBuilder
	{
		/**
		 * @protected
		 * @override
		 * @return {string}
		 */
		getSqlPrefix()
		{
			return 'INSERT';
		}
	}

	module.exports = { InsertQueryBuilder };
});
