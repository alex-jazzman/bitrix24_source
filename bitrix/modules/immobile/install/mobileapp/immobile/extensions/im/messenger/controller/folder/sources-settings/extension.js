/**
 * @module im/messenger/controller/folder/sources-settings
 */
jn.define('im/messenger/controller/folder/sources-settings', (require, exports, module) => {
	const { FolderSourcesSettings } = require('im/messenger/controller/folder/sources-settings/settings');
	const { FolderSourcesDraft } = require('im/messenger/controller/folder/sources-settings/draft');
	const { FolderSourceIcon } = require('im/messenger/controller/folder/sources-settings/source-icon');

	module.exports = { FolderSourcesSettings, FolderSourcesDraft, FolderSourceIcon };
});
