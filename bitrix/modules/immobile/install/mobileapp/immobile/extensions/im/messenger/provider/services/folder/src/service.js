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
	const { folderDefaultElement } = require('im/messenger/model/folder');
	const { FolderDataProvider } = require('im/messenger/provider/data');

	const logger = getLoggerWithContext('provider--services--folder', 'FolderService');

	// An empty chatIds reads on the server as "composition not provided", so a full clear cannot travel
	// as one: the scalar sentinel is the only shape the update transport takes for it
	// (im/lib/V2/Folder/Update/UpdateFields.php). The web client sends the same value.
	const CLEAR_COMPOSITION_FLAG = 'N';

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
		 * @param {Array<number>} [options.chatIds] - the whole composition to set; omit it to rename only,
		 *   the folder keeps the composition it has. An empty array asks for a full clear
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

			const title = this.#normalizeTitle(options.title);
			// An absent composition must stay absent in the request: the server leaves the folder
			// composition alone while the key is missing - and takes an empty array for the same
			// "not provided", which is why a clear goes as CLEAR_COMPOSITION_FLAG below.
			const chatIds = Type.isArray(options.chatIds) ? this.#normalizeNumberList(options.chatIds) : null;

			if (this.#isFolderUnchanged(currentFolder, title, chatIds))
			{
				return currentFolder;
			}

			const fields = chatIds === null
				? { title }
				: { title, chatIds: chatIds.length === 0 ? CLEAR_COMPOSITION_FLAG : chatIds };

			const manager = new RestManager();
			manager.on(RestMethod.imV2FolderUpdate, { folderId, fields });
			// Final authoritative fetch: its result is applied even when the update fails.
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

		/**
		 * A save with nothing edited must not cost the user a network round trip, so both
		 * the update and the authoritative fetch are skipped.
		 *
		 * @param {FolderModelState} currentFolder
		 * @param {string} title normalized
		 * @param {Array<number>|null} chatIds normalized, null when the composition is not being set
		 * @return {boolean}
		 */
		#isFolderUnchanged(currentFolder, title, chatIds)
		{
			if (this.#normalizeTitle(currentFolder.title) !== title)
			{
				return false;
			}

			if (chatIds === null)
			{
				return true;
			}

			// The model guarantees neither the order nor the numeric type of chatIds.
			const currentChatIds = new Set(this.#normalizeNumberList(currentFolder.chatIds));

			return currentChatIds.size === chatIds.length
				&& chatIds.every((chatId) => currentChatIds.has(chatId));
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
		 * Loads the sources settings payload of a composite folder: the source items in the
		 * order the server built them and the folder objects behind them, linked by folderId.
		 * Both collections are returned to the caller as they came and live in the screen
		 * state only: the folder normalizer is a strict whitelist, and source folders have no
		 * place in the common folder registry.
		 *
		 * @param {object} options
		 * @param {number} options.folderId
		 * @return {Promise<{sources: Array, folders: Array}>}
		 */
		async getSources(options = {})
		{
			this.#assertCoreReady();

			const folderId = Number(options.folderId);
			if (!Type.isInteger(folderId) || folderId <= 0)
			{
				throw new TypeError(`${this.constructor.name}.getSources: folderId is required.`);
			}

			const response = await runAction(RestMethod.imV2FolderGetSources, {
				data: { folderId },
			});

			return {
				sources: Type.isArray(response?.sources) ? response.sources : [],
				folders: Type.isArray(response?.folders) ? response.folders : [],
			};
		}

		/**
		 * Saves the composition of a composite folder and applies what the server saved back.
		 * The server normalizes the input silently: an unknown code is dropped and the mandatory
		 * source is written back, so the composition to apply comes from the response, never
		 * from the set that was sent.
		 *
		 * A rejection means the composition was not saved on the server: everything after the
		 * request is best effort and never turns a save that did happen into a refusal.
		 *
		 * @param {object} options
		 * @param {number} options.folderId
		 * @param {Array<string>} options.sourceCodes - the whole set of codes that must stay
		 *   enabled. An empty array is legal and goes as is: the transport drops the empty key
		 *   and the server reads a missing sourceCodes as an empty set
		 * @return {Promise<Array<string>>} the composition the server saved
		 */
		async updateSources(options = {})
		{
			this.#assertCoreReady();

			const folderId = Number(options.folderId);
			if (!Type.isInteger(folderId) || folderId <= 0)
			{
				throw new TypeError(`${this.constructor.name}.updateSources: folderId is required.`);
			}

			// A missing set would reach the server as "disable everything", so it is a caller
			// error rather than something to substitute with an empty one.
			if (!Type.isArray(options.sourceCodes))
			{
				throw new TypeError(`${this.constructor.name}.updateSources: sourceCodes must be an array.`);
			}

			// Preflight, as in updateFolder(): once the request has gone through the composition
			// is saved on the server, and a refusal after that would report a failure that did
			// not happen.
			if (!this.#getFolderById(folderId))
			{
				throw new TypeError(`${this.constructor.name}.updateSources: folder ${folderId} is not in the model.`);
			}

			let appliedCodes = [];
			try
			{
				const response = await runAction(RestMethod.imV2FolderUpdateSources, {
					data: { folderId, sourceCodes: options.sourceCodes },
				});
				appliedCodes = Type.isArray(response?.sourceFolders) ? response.sourceFolders : [];
			}
			catch (error)
			{
				logger.error('updateSources error', error);

				throw error;
			}

			// Past this point the composition is saved on the server and the push is on its way, so
			// the local copy is caught up as best effort: a failing store dispatch or SQLite write is
			// logged and left behind, never raised. Raising it would show the user a save that did
			// happen as a refusal - the sheet would stay open and the list would not be rebuilt.
			await this.#storeSavedComposition(folderId, appliedCodes);

			return appliedCodes;
		}

		/**
		 * @param {object} options
		 * @param {number} options.folderId
		 * @param {number} [options.limit]
		 * @param {number|string} [options.lastMessageDate]
		 * @param {'Y'} [options.unread]
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

			if (options.unread === 'Y')
			{
				data.filter.unread = 'Y';
			}

			return runAction(RestMethod.imV2FolderRecentTail, { data });
		}

		/**
		 * Applies the composition the server saved to the local copy of the folder. Best effort by
		 * contract: the server already holds the composition, so nothing here is allowed to reach
		 * the caller as a failed save.
		 *
		 * @param {number} folderId
		 * @param {Array<string>} appliedCodes
		 * @return {Promise<void>}
		 */
		async #storeSavedComposition(folderId, appliedCodes)
		{
			// The folder can still leave the model while the request is in flight. The server
			// holds the composition either way, so the local write is skipped rather than
			// bringing the dropped row back.
			const currentFolder = this.#getFolderById(folderId);
			if (!currentFolder)
			{
				return;
			}

			try
			{
				// The whole folder goes to the provider, not the composition alone: the row is
				// persisted with insertOrReplace, so every field left out would be recreated with
				// its schema default. The default element covers an incomplete folder in the model.
				await this.dataProvider.update(folderId, {
					...folderDefaultElement,
					...currentFolder,
					sourceFolders: appliedCodes,
				});
			}
			catch (error)
			{
				// The next folder list from the server brings the composition back into the model,
				// so the local copy repairs itself without the user doing anything.
				logger.error('updateSources: local composition write error', error);
			}
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
