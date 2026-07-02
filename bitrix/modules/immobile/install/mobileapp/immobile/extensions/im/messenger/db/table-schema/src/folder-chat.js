/**
 * @module im/messenger/db/table-schema/src/folder-chat
 */
jn.define('im/messenger/db/table-schema/src/folder-chat', (require, exports, module) => {
	const { IntegerField } = require('im/messenger/db/schema/field');
	const { Index } = require('im/messenger/db/schema/index');
	const { BaseSchema } = require('im/messenger/db/schema/base-schema');

	class FolderChatSchema extends BaseSchema
	{
		// composite PK: folderId + chatId — no synthetic compositeId field
		static folderId = new IntegerField('folderId').configurePrimary();
		static chatId = new IntegerField('chatId').configurePrimary();

		static getTableName()
		{
			return 'b_im_folder_chat';
		}

		/** @protected */
		static getMap()
		{
			return [
				this.folderId,
				this.chatId,
			];
		}

		static getIndexes()
		{
			return [
				new Index([this.folderId]),
				new Index([this.chatId]),
			];
		}
	}

	module.exports = { FolderChatSchema };
});
