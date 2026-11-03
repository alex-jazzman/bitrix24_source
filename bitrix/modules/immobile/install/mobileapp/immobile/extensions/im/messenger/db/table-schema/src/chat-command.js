/**
 * @module im/messenger/db/table-schema/src/chat-command
 */
jn.define('im/messenger/db/table-schema/src/chat-command', (require, exports, module) => {
	const {
		StringField,
		DateField,
		ObjectField,
	} = require('im/messenger/db/schema/field');
	const { BaseSchema } = require('im/messenger/db/schema/base-schema');

	/**
	 * Per-chat cache of the bot-command list: one row per (dialog, language).
	 *
	 * `payload` stores the whole command-list response `{ commands, users }` verbatim as a
	 * JSON blob and is NOT normalized into separate tables - bot name/avatar are
	 * resolved from `users` by botId, so the map must be persisted for offline render.
	 */
	class ChatCommandSchema extends BaseSchema
	{
		static dialogId = new StringField('dialogId').configurePrimary().configureNullable(false);
		static language = new StringField('language').configurePrimary().configureNullable(false);
		static payload = new ObjectField('payload');
		static updatedAt = new DateField('updatedAt');

		static getTableName()
		{
			return 'b_im_chat_command';
		}

		/** @protected */
		static getMap()
		{
			return [this.dialogId, this.language, this.payload, this.updatedAt];
		}
	}

	module.exports = { ChatCommandSchema };
});
