/**
 * @module im/messenger/controller/folder/lib/ui/folder-form
 */
jn.define('im/messenger/controller/folder/lib/ui/folder-form', (require, exports, module) => {
	const { FolderFormView } = require('im/messenger/controller/folder/lib/ui/folder-form/view');
	const { FolderChatItem } = require('im/messenger/controller/folder/lib/ui/folder-form/chat-item');

	module.exports = {
		FolderFormView,
		FolderChatItem,
	};
});
