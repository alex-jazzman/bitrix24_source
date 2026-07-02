/**
 * @module im/messenger/db/query-builder/builder
 */
jn.define('im/messenger/db/query-builder/builder', (require, exports, module) => {
	const { SchemaRef, getFieldOwner } = require('im/messenger/db/schema/schema-ref');
	const { QueryFactory } = require('im/messenger/db/query-builder/builder/src/query-factory');
	const { SelectQueryBuilder } = require('im/messenger/db/query-builder/builder/src/select-query-builder');
	const { InsertQueryBuilder } = require('im/messenger/db/query-builder/builder/src/insert-query-builder');
	const { InsertOrReplaceQueryBuilder } = require('im/messenger/db/query-builder/builder/src/insert-or-replace-query-builder');
	const { InsertOrIgnoreQueryBuilder } = require('im/messenger/db/query-builder/builder/src/insert-or-ignore-query-builder');
	const { UpdateQueryBuilder } = require('im/messenger/db/query-builder/builder/src/update-query-builder');
	const { DeleteQueryBuilder } = require('im/messenger/db/query-builder/builder/src/delete-query-builder');

	module.exports = {
		SchemaRef,
		getFieldOwner,
		QueryFactory,
		SelectQueryBuilder,
		InsertQueryBuilder,
		InsertOrReplaceQueryBuilder,
		InsertOrIgnoreQueryBuilder,
		UpdateQueryBuilder,
		DeleteQueryBuilder,

		Query: new QueryFactory(),
	};
});
