/**
 * @module im/messenger/db/table-schema
 */
jn.define('im/messenger/db/table-schema', (require, exports, module) => {
	const { DialogSchema } = require('im/messenger/db/table-schema/src/dialog');
	const { DraftSchema } = require('im/messenger/db/table-schema/src/draft');
	const { FolderSchema } = require('im/messenger/db/table-schema/src/folder');
	const { FolderChatSchema } = require('im/messenger/db/table-schema/src/folder-chat');
	const { RecentSchema } = require('im/messenger/db/table-schema/src/recent');

	module.exports = {
		DialogSchema,
		DraftSchema,
		FolderSchema,
		FolderChatSchema,
		RecentSchema,
	};
});
