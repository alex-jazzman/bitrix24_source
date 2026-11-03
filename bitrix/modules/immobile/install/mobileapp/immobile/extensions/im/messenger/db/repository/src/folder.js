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
		FolderSourceSchema,
	} = require('im/messenger/db/table-schema');
	const { validateFolder } = require('im/messenger/db/repository/validators/folder');

	class FolderRepository
	{
		/**
		 * Batch upsert folders + replace their membership in FolderChatSchema and
		 * their source composition in FolderSourceSchema.
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

			// Single DELETE + single INSERT instead of N+1 per-folder calls.
			// On 20 folders this is a handful of queries vs dozens (and atomic at the table level).
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

			await Query.delete()
				.from(FolderSourceSchema)
				.where(FolderSourceSchema.folderId.in(folderIds))
				.execute()
			;

			const membershipRows = folders.flatMap((folder) => {
				if (!Type.isNumber(folder.id) || !Type.isArrayFilled(folder.chatIds))
				{
					return [];
				}

				return folder.chatIds.map((chatId) => ({ folderId: folder.id, chatId }));
			});

			const sourceRows = folders.flatMap((folder) => {
				if (!Type.isNumber(folder.id) || !Type.isArrayFilled(folder.sourceFolders))
				{
					return [];
				}

				return folder.sourceFolders.map((sourceFolderCode) => ({ folderId: folder.id, sourceFolderCode }));
			});

			if (membershipRows.length > 0)
			{
				await Query.insertOrReplace()
					.from(FolderChatSchema)
					.values(membershipRows)
					.execute()
				;
			}

			if (sourceRows.length > 0)
			{
				await Query.insertOrReplace()
					.from(FolderSourceSchema)
					.values(sourceRows)
					.execute()
				;
			}
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
			await Query.delete().from(FolderSourceSchema).execute();
			await Query.delete().from(FolderSchema).execute();

			if (!Type.isArrayFilled(folders))
			{
				return;
			}

			const normalizedFolders = this.#normalizeFullFolderList(folders);

			await Query.insertOrReplace().from(FolderSchema).values(normalizedFolders).execute();
			await Promise.all(normalizedFolders.map((folder) => this.saveChatIds(folder.id, folder.chatIds || [])));
			await Promise.all(
				normalizedFolders.map((folder) => this.saveSourceFolders(folder.id, folder.sourceFolders || [])),
			);
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
		 * Replace the entire source composition of a folder.
		 *
		 * @param {number} folderId
		 * @param {Array<string>} sourceFolders
		 * @return {Promise<void>}
		 */
		async saveSourceFolders(folderId, sourceFolders)
		{
			if (!Feature.isLocalStorageEnabled || !Type.isNumber(folderId))
			{
				return;
			}

			await Query.delete()
				.from(FolderSourceSchema)
				.where(FolderSourceSchema.folderId.equal(folderId))
				.execute();

			if (!Type.isArrayFilled(sourceFolders))
			{
				return;
			}

			await Query.insertOrReplace()
				.from(FolderSourceSchema)
				.values(sourceFolders.map((sourceFolderCode) => ({ folderId, sourceFolderCode })))
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
			const chatsByFolder = new Map();
			for (const row of chatRows)
			{
				const { folderId, chatId } = row.extract(FolderChatSchema);
				if (!chatsByFolder.has(folderId))
				{
					chatsByFolder.set(folderId, []);
				}
				chatsByFolder.get(folderId).push(chatId);
			}

			// sourceFolders - same rebuild, with FolderSourceSchema as the source of truth
			const sourceRows = await Query.select().from(FolderSourceSchema).execute();
			const sourcesByFolder = new Map();
			for (const row of sourceRows)
			{
				const { folderId, sourceFolderCode } = row.extract(FolderSourceSchema);
				if (!sourcesByFolder.has(folderId))
				{
					sourcesByFolder.set(folderId, []);
				}
				sourcesByFolder.get(folderId).push(sourceFolderCode);
			}

			return folders.map((folder) => ({
				...folder,
				chatIds: chatsByFolder.get(folder.id) || [],
				sourceFolders: sourcesByFolder.get(folder.id) || [],
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
				.from(FolderSourceSchema)
				.where(FolderSourceSchema.folderId.equal(folderId))
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
