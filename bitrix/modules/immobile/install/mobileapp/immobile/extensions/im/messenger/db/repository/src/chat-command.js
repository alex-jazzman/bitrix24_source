/**
 * @module im/messenger/db/repository/chat-command
 */
jn.define('im/messenger/db/repository/chat-command', (require, exports, module) => {
	const { Type } = require('type');
	const { Feature } = require('im/messenger/lib/feature');
	const { Query } = require('im/messenger/db/query-builder/builder');
	const { ChatCommandSchema } = require('im/messenger/db/table-schema');

	/**
	 * Thin CRUD over ChatCommandSchema - the per-chat cache of the bot-command list.
	 * No in-memory layer on top of SQLite (same as the other repositories); every
	 * method is a no-op when local storage is disabled.
	 */
	class ChatCommandRepository
	{
		/**
		 * @param {DialogId} dialogId
		 * @param {string} language
		 * @return {Promise<{dialogId: string, language: string, payload: object, updatedAt: Date}|null>}
		 */
		async getByDialogId(dialogId, language)
		{
			if (!Feature.isLocalStorageEnabled || !Type.isStringFilled(dialogId))
			{
				return null;
			}

			const result = await Query.select()
				.from(ChatCommandSchema)
				.where(
					ChatCommandSchema.dialogId.equal(dialogId),
					ChatCommandSchema.language.equal(language),
				)
				.limit(1)
				.execute()
			;

			const row = result.first();

			return row ? row.extract(ChatCommandSchema) : null;
		}

		/**
		 * Full row replacement for the (dialog, language) pair.
		 *
		 * @param {DialogId} dialogId
		 * @param {string} language
		 * @param {object} payload - the whole command-list response `{ commands, users }`.
		 * @return {Promise<void>}
		 */
		async save(dialogId, language, payload)
		{
			if (!Feature.isLocalStorageEnabled || !Type.isStringFilled(dialogId))
			{
				return;
			}

			await Query.insertOrReplace()
				.from(ChatCommandSchema)
				.values([{
					dialogId,
					language,
					payload,
					updatedAt: new Date(),
				}])
				.execute()
			;
		}

		/**
		 * Remove every language row of the dialog.
		 *
		 * @param {DialogId} dialogId
		 * @return {Promise<void>}
		 */
		async deleteByDialogId(dialogId)
		{
			if (!Feature.isLocalStorageEnabled || !Type.isStringFilled(dialogId))
			{
				return;
			}

			await Query.delete()
				.from(ChatCommandSchema)
				.where(ChatCommandSchema.dialogId.equal(dialogId))
				.execute()
			;
		}
	}

	module.exports = { ChatCommandRepository };
});
