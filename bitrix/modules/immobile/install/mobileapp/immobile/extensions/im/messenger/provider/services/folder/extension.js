/**
 * @module im/messenger/provider/services/folder
 */
jn.define('im/messenger/provider/services/folder', (require, exports, module) => {
	const { FolderService: FolderServiceClass } = require('im/messenger/provider/services/folder/src/service');

	module.exports = {
		FolderService: new FolderServiceClass(),
	};
});
