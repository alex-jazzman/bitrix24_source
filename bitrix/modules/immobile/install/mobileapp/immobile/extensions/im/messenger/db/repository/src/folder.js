/**
 * @module im/messenger/db/repository/folder
 */
jn.define('im/messenger/db/repository/folder', (require, exports, module) => {
	const { Type } = require('type');
	const { Feature } = require('im/messenger/lib/feature');
	const { Query } = require('im/messenger/db/query-builder/builder');
	const {
		FolderSchema,
		FolderChatSchema,
	} = require('im/messenger/db/table-schema');
	const { validateFolder } = require('im/messenger/db/repository/validators/folder');

	class FolderRepository
	{
		/**
		 * Batch upsert folders + replace their membership in FolderChatSchema.
		 *
		 * @param {Array<FolderModelState>} folders
		 * @return {Promise<void>}
		 */
		async save(folders)
		{
			if (!Feature.isLocalStorageEnabled || !Type.isArrayFilled(folders))
			{
				return;
			}

			await Query.insertOrReplace().from(FolderSchema).values(folders).execute();

			// Single DELETE + single INSERT instead of N+1 saveChatIds calls.
			// On 20 folders this is 2 queries vs 40 (and atomic at the table level).
			const folderIds = folders
				.map((folder) => folder.id)
				.filter((id) => Type.isNumber(id))
			;

			if (folderIds.length === 0)
			{
				return;
			}

			await Query.delete()
				.from(FolderChatSchema)
				.where(FolderChatSchema.folderId.in(folderIds))
				.execute()
			;

			const membershipRows = folders.flatMap((folder) => {
				if (!Type.isNumber(folder.id) || !Type.isArrayFilled(folder.chatIds))
				{
					return [];
				}

				return folder.chatIds.map((chatId) => ({ folderId: folder.id, chatId }));
			});

			if (membershipRows.length === 0)
			{
				return;
			}

			await Query.insertOrReplace()
				.from(FolderChatSchema)
				.values(membershipRows)
				.execute()
			;
		}

		/**
		 * @param {Array<FolderModelState>} folders
		 * @return {Promise<void>}
		 */
		async replaceAll(folders)
		{
			if (!Feature.isLocalStorageEnabled)
			{
				return;
			}

			await Query.delete().from(FolderChatSchema).execute();
			await Query.delete().from(FolderSchema).execute();

			if (!Type.isArrayFilled(folders))
			{
				return;
			}

			const normalizedFolders = this.#normalizeFullFolderList(folders);

			await Query.insertOrReplace().from(FolderSchema).values(normalizedFolders).execute();
			await Promise.all(normalizedFolders.map((folder) => this.saveChatIds(folder.id, folder.chatIds || [])));
		}

		/**
		 * Replace the entire membership of a folder.
		 *
		 * @param {number} folderId
		 * @param {Array<number>} chatIds
		 * @return {Promise<void>}
		 */
		async saveChatIds(folderId, chatIds)
		{
			if (!Feature.isLocalStorageEnabled || !Type.isNumber(folderId))
			{
				return;
			}

			await Query.delete()
				.from(FolderChatSchema)
				.where(FolderChatSchema.folderId.equal(folderId))
				.execute();

			if (!Type.isArrayFilled(chatIds))
			{
				return;
			}

			await Query.insertOrReplace()
				.from(FolderChatSchema)
				.values(chatIds.map((chatId) => ({ folderId, chatId })))
				.execute();
		}

		/**
		 * @return {Promise<Array<FolderModelState>>}
		 */
		async getAll()
		{
			if (!Feature.isLocalStorageEnabled)
			{
				return [];
			}

			const folderRows = await Query.select().from(FolderSchema).execute();
			const folders = folderRows.map((row) => row.extract(FolderSchema));

			// chatIds — FolderChatSchema is the source of truth; we recompute the denormalized array
			const chatRows = await Query.select().from(FolderChatSchema).execute();
			const byFolder = new Map();
			for (const row of chatRows)
			{
				const { folderId, chatId } = row.extract(FolderChatSchema);
				if (!byFolder.has(folderId))
				{
					byFolder.set(folderId, []);
				}
				byFolder.get(folderId).push(chatId);
			}

			return folders.map((folder) => ({
				...folder,
				chatIds: byFolder.get(folder.id) || [],
			}));
		}

		/**
		 * @param {number} folderId
		 * @return {Promise<void>}
		 */
		async deleteById(folderId)
		{
			if (!Feature.isLocalStorageEnabled || !Type.isNumber(folderId))
			{
				return;
			}

			await Query.delete()
				.from(FolderChatSchema)
				.where(FolderChatSchema.folderId.equal(folderId))
				.execute();

			await Query.delete()
				.from(FolderSchema)
				.where(FolderSchema.id.equal(folderId))
				.execute();
		}

		#normalizeFullFolderList(folders)
		{
			return folders
				.map((folder) => validateFolder(folder))
				.filter((folder) => Type.isNumber(folder.id) && folder.id > 0);
		}
	}

	module.exports = { FolderRepository };
});
