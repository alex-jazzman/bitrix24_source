/**
 * @module im/messenger/controller/folder/list
 */
jn.define('im/messenger/controller/folder/list', (require, exports, module) => {
	const { FolderListView } = require('im/messenger/controller/folder/list/view');
	const { FolderCard } = require('im/messenger/controller/folder/list/card');

	module.exports = { FolderListView, FolderCard };
});
