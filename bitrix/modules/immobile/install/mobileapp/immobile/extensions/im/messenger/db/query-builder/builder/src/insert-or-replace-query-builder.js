/**
 * @module im/messenger/db/query-builder/builder/src/insert-or-replace-query-builder
 */
jn.define('im/messenger/db/query-builder/builder/src/insert-or-replace-query-builder', (require, exports, module) => {
	const { BaseInsertQueryBuilder } = require('im/messenger/db/query-builder/builder/src/base-insert-query-builder');

	/**
	 * @class InsertOrReplaceQueryBuilder
	 *
	 * INSERT OR REPLACE — on conflict, deletes the existing row and inserts new.
	 */
	class InsertOrReplaceQueryBuilder extends BaseInsertQueryBuilder
	{
		/**
		 * @protected
		 * @override
		 * @return {string}
		 */
		getSqlPrefix()
		{
			return 'INSERT OR REPLACE';
		}
	}

	module.exports = { InsertOrReplaceQueryBuilder };
});
