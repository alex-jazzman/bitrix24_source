/**
 * @module mail/message/actions
 */
jn.define('mail/message/actions', (require, exports, module) => {
	const { changeFolder, openFolderSelector } = require('mail/message/actions/src/change-folder');
	const { changeReadStatus } = require('mail/message/actions/src/change-read-status');

	module.exports = { changeFolder, openFolderSelector, changeReadStatus };
});
