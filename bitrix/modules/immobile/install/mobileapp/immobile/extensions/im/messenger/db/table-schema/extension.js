/**
 * @module im/messenger/db/table-schema
 */
jn.define('im/messenger/db/table-schema', (require, exports, module) => {
	const { ChatCommandSchema } = require('im/messenger/db/table-schema/src/chat-command');
	const { DialogSchema } = require('im/messenger/db/table-schema/src/dialog');
	const { DraftSchema } = require('im/messenger/db/table-schema/src/draft');
	const { FolderSchema } = require('im/messenger/db/table-schema/src/folder');
	const { FolderChatSchema } = require('im/messenger/db/table-schema/src/folder-chat');
	const { FolderSourceSchema } = require('im/messenger/db/table-schema/src/folder-source');
	const { RecentSchema } = require('im/messenger/db/table-schema/src/recent');
	const { RecentSectionSchema } = require('im/messenger/db/table-schema/src/recent-section');
	const { UserSchema } = require('im/messenger/db/table-schema/src/user');

	module.exports = {
		ChatCommandSchema,
		DialogSchema,
		DraftSchema,
		FolderSchema,
		FolderChatSchema,
		FolderSourceSchema,
		RecentSchema,
		RecentSectionSchema,
		UserSchema,
	};
});
