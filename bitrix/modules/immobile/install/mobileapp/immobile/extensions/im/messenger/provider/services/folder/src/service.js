/**
 * @module im/messenger/provider/services/folder/service
 */
jn.define('im/messenger/provider/services/folder/src/service', (require, exports, module) => {
	const { Type } = require('type');
	const { RestMethod } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { runAction } = require('im/messenger/lib/rest');
	const { RestManager } = require('im/messenger/lib/rest-manager');
	const { FolderDataProvider } = require('im/messenger/provider/data');

	const logger = getLoggerWithContext('provider--services--folder', 'FolderService');

	class FolderService
	{
		#dataProvider = null;
		#dataProviderCore = null;

		get core()
		{
			return serviceLocator.get('core');
		}

		get store()
		{
			return this.core.getStore();
		}

		get dataProvider()
		{
			const core = this.#assertCoreReady();
			if (this.#dataProviderCore !== core)
			{
				this.#dataProvider = new FolderDataProvider();
				this.#dataProviderCore = core;
			}

			return this.#dataProvider;
		}

		/**
		 * @param {object} options
		 * @param {string} options.title
		 * @param {Array<number>} [options.chatIds]
		 * @return {Promise<FolderModelState>}
		 */
		async createFolder(options = {})
		{
			this.#assertCoreReady();

			const title = this.#normalizeTitle(options.title);
			const chatIds = this.#normalizeNumberList(options.chatIds);

			try
			{
				const response = await runAction(RestMethod.imV2FolderAdd, {
					data: { fields: { title, chatIds } },
				});
				const folder = response?.folder;
				if (!folder)
				{
					throw new TypeError(`${this.constructor.name}.createFolder: REST response is empty.`);
				}

				await this.dataProvider.add(folder);

				return folder;
			}
			catch (error)
			{
				logger.error('createFolder error', error);

				throw error;
			}
		}

		/**
		 * @param {object} options
		 * @param {number} options.folderId
		 * @param {string} options.title
		 * @param {Array<number>} [options.addChatIds]
		 * @param {Array<number>} [options.removeChatIds]
		 * @return {Promise<FolderModelState|null>}
		 */
		async updateFolder(options = {})
		{
			const folderId = options.folderId;
			if (!Type.isInteger(folderId) || folderId <= 0)
			{
				throw new TypeError(`${this.constructor.name}.updateFolder: folderId is required.`);
			}

			const currentFolder = this.#getFolderById(folderId);
			if (!currentFolder)
			{
				throw [{ code: 'FOLDER_NOT_FOUND' }];
			}

			const normalizedTitle = this.#normalizeTitle(options.title);
			const normalizedAdd = this.#normalizeNumberList(options.addChatIds);
			const normalizedRemove = this.#normalizeNumberList(options.removeChatIds);

			const manager = new RestManager();
			if (currentFolder.title !== normalizedTitle)
			{
				manager.on(RestMethod.imV2FolderUpdate, { folderId, fields: { title: normalizedTitle } });
			}
			if (Type.isArrayFilled(normalizedAdd))
			{
				manager.on(RestMethod.imV2FolderAddChats, { folderId, chatIds: normalizedAdd });
			}
			if (Type.isArrayFilled(normalizedRemove))
			{
				manager.on(RestMethod.imV2FolderDeleteChats, { folderId, chatIds: normalizedRemove });
			}

			if (manager.methodCollection.size === 0)
			{
				return currentFolder;
			}

			// Final authoritative fetch — its result is applied even on per-step failures.
			manager.on(RestMethod.imV2FolderList, {});

			let batchResult;
			try
			{
				batchResult = await manager.callBatch();
			}
			catch (rejected)
			{
				batchResult = rejected;
			}

			const { authoritativeFolders, errors } = this.#parseUpdateBatchResult(batchResult);

			if (authoritativeFolders)
			{
				await this.dataProvider.setList(authoritativeFolders);
			}

			if (errors.length > 0)
			{
				logger.error('updateFolder per-step errors', errors);

				throw errors;
			}

			return authoritativeFolders?.find((f) => f.id === folderId) ?? null;
		}

		#parseUpdateBatchResult(result)
		{
			const errors = [];
			let authoritativeFolders = null;

			if (!result || typeof result !== 'object')
			{
				return { authoritativeFolders, errors };
			}

			for (const [methodKey, ajaxResult] of Object.entries(result))
			{
				if (!ajaxResult || typeof ajaxResult.error !== 'function')
				{
					continue;
				}

				const method = methodKey.split('|')[0];
				if (method === RestMethod.imV2FolderList)
				{
					if (!ajaxResult.error())
					{
						authoritativeFolders = ajaxResult.data()?.folders ?? null;
					}
					continue;
				}

				const err = ajaxResult.error();
				if (err)
				{
					errors.push({ method, error: err });
				}
			}

			return { authoritativeFolders, errors };
		}

		/**
		 * @param {object} options
		 * @param {number} options.folderId
		 * @return {Promise<void>}
		 */
		async deleteFolder(options = {})
		{
			const folderId = options.folderId;
			if (!Type.isInteger(folderId) || folderId <= 0)
			{
				throw new TypeError(`${this.constructor.name}.deleteFolder: folderId is required.`);
			}

			try
			{
				await runAction(RestMethod.imV2FolderDelete, {
					data: { folderId },
				});
				await this.dataProvider.delete(folderId);
			}
			catch (error)
			{
				logger.error('deleteFolder error', error);

				throw error;
			}
		}

		/**
		 * @param {object} options
		 * @param {Array<number>} options.folderIds
		 * @return {Promise<void>}
		 */
		async sortFolders(options = {})
		{
			const sortedIds = this.#normalizeNumberList(options.folderIds);

			try
			{
				await runAction(RestMethod.imV2FolderSort, {
					data: { folderIds: sortedIds },
				});

				const sortedFolders = this.#createSortedFolderList(
					sortedIds,
					this.store.getters['folderModel/getList'](),
				);
				await this.dataProvider.setList(sortedFolders);
			}
			catch (error)
			{
				logger.error('sortFolders error', error);

				throw error;
			}
		}

		/**
		 * @param {object} options
		 * @param {number} options.chatId
		 * @param {Array<number>} options.folderIds
		 * @return {Promise<void>}
		 */
		async setChatFolders(options = {})
		{
			const chatId = options.chatId;
			if (!Type.isInteger(chatId) || chatId <= 0)
			{
				throw new TypeError(`${this.constructor.name}.setChatFolders: chatId is required.`);
			}

			const folderIds = this.#normalizeNumberList(options.folderIds);

			try
			{
				await runAction(RestMethod.imV2FolderSetChatFolders, {
					data: { chatId, folderIds },
				});

				const targetFolderIds = new Set(folderIds);
				const personalFolders = this.store.getters['folderModel/getPersonalFolders']();
				await Promise.all(personalFolders.map((folder) => {
					const chatIds = new Set(folder.chatIds);
					if (targetFolderIds.has(folder.id))
					{
						chatIds.add(chatId);
					}
					else
					{
						chatIds.delete(chatId);
					}

					return this.dataProvider.update(folder.id, { chatIds: [...chatIds] });
				}));
			}
			catch (error)
			{
				logger.error('setChatFolders error', error);

				throw error;
			}
		}

		/**
		 * Loads folder editor payload: folder + chats (including hidden-from-recent)
		 * + companion users for private chats. Personal folders return their full
		 * static chat membership; system folders return empty chats/users (their
		 * content is dynamic, fetched via getRecentTail).
		 *
		 * @param {object} options
		 * @param {number} options.folderId
		 * @return {Promise<{folder: object, chats: Array, users: Array}>}
		 */
		async getFolder(options = {})
		{
			const folderId = Number(options.folderId);
			if (!Type.isInteger(folderId) || folderId <= 0)
			{
				throw new TypeError(`${this.constructor.name}.getFolder: folderId is required.`);
			}

			const response = await runAction(RestMethod.imV2FolderGet, {
				data: { folderId },
			});

			return {
				folder: response?.folder ?? null,
				chats: Type.isArray(response?.chats) ? response.chats : [],
				users: Type.isArray(response?.users) ? response.users : [],
			};
		}

		/**
		 * @param {object} options
		 * @param {number} options.folderId
		 * @param {number} [options.limit]
		 * @param {number|string} [options.lastMessageDate]
		 * @return {Promise<RestResult>}
		 */
		getRecentTail(options = {})
		{
			if (!Type.isNumber(options.folderId))
			{
				throw new TypeError(`${this.constructor.name}.getRecentTail: options.folderId is required.`);
			}

			const data = {
				folderId: options.folderId,
				filter: {},
			};

			if (Type.isNumber(options.limit))
			{
				data.limit = options.limit;
			}

			if (Type.isNumber(options.lastMessageDate) || Type.isStringFilled(options.lastMessageDate))
			{
				data.filter.lastMessageDate = options.lastMessageDate;
			}

			return runAction(RestMethod.imV2FolderRecentTail, { data });
		}

		#getFolderById(folderId)
		{
			const folder = this.store.getters['folderModel/getById'](folderId);
			if (!folder)
			{
				return null;
			}

			return {
				...folder,
				chatIds: [...(folder.chatIds || [])],
			};
		}

		#assertCoreReady()
		{
			const core = this.core;
			if (!core)
			{
				throw new TypeError(`${this.constructor.name}: messenger core is not ready.`);
			}

			return core;
		}

		#normalizeTitle(title)
		{
			return Type.isString(title) ? title.trim() : '';
		}

		#normalizeNumberList(items)
		{
			if (!Type.isArray(items))
			{
				return [];
			}

			return [...new Set(
				items
					.map((id) => Number(id))
					.filter((id) => Type.isInteger(id) && id > 0),
			)];
		}

		#createSortedFolderList(sortedIds, snapshot)
		{
			const byId = new Map(snapshot.map((folder) => [folder.id, folder]));
			const usedIds = new Set();
			const result = [];

			sortedIds.forEach((id, index) => {
				const folder = byId.get(id);
				if (!folder)
				{
					return;
				}

				usedIds.add(id);
				result.push({
					...folder,
					sort: index,
				});
			});

			for (const folder of snapshot)
			{
				if (!usedIds.has(folder.id))
				{
					result.push({
						...folder,
						sort: result.length,
					});
				}
			}

			return result;
		}
	}

	module.exports = { FolderService };
});
