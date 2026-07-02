/**
 * @module im/messenger/db/query-builder/result
 */
jn.define('im/messenger/db/query-builder/result', (require, exports, module) => {
	const { SelectRow } = require('im/messenger/db/query-builder/result/src/select-row');
	const { SelectResult } = require('im/messenger/db/query-builder/result/src/select-result');
	const { InsertResult } = require('im/messenger/db/query-builder/result/src/insert-result');
	const { UpdateResult } = require('im/messenger/db/query-builder/result/src/update-result');
	const { DeleteResult } = require('im/messenger/db/query-builder/result/src/delete-result');

	module.exports = {
		SelectRow,
		SelectResult,
		InsertResult,
		UpdateResult,
		DeleteResult,
	};
});
