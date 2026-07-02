/**
 * @module im/messenger/model/folder
 */
jn.define('im/messenger/model/folder', (require, exports, module) => {
	const { folderModel } = require('im/messenger/model/folder/src/model');
	const { folderDefaultElement } = require('im/messenger/model/folder/src/default-element');
	const { normalize } = require('im/messenger/model/folder/src/normalizer');

	module.exports = {
		folderModel,
		folderDefaultElement,
		normalize,
	};
});
