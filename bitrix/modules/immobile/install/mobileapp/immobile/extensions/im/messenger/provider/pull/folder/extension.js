/**
 * @module im/messenger/provider/pull/folder
 */
jn.define('im/messenger/provider/pull/folder', (require, exports, module) => {
	const { Type } = require('type');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { BasePullHandler } = require('im/messenger/provider/pull/base');
	const { FolderDataProvider } = require('im/messenger/provider/data');
	const {
		folderDefaultElement,
		normalize,
	} = require('im/messenger/model/folder');

	/**
	 * Handles folder pull events: folderCreate / folderUpdate / folderDelete /
	 * folderSort / folderChatAdd / folderChatDelete. Each handler keeps store
	 * + SQLite consistent. Per-folder chat-pin events are handled by
	 * RecentPullHandler.
	 */
	class FolderPullHandler extends BasePullHandler
	{
		#folderDataProvider = null;

		constructor()
		{
			super({ logger: getLoggerWithContext('pull-handler--folder', FolderPullHandler) });
		}

		/**
		 * @return {FolderRepository}
		 */
		get folderRepository()
		{
			return serviceLocator.get('core').getRepository().folder;
		}

		/**
		 * @return {FolderDataProvider}
		 */
		get folderDataProvider()
		{
			if (!this.#folderDataProvider)
			{
				this.#folderDataProvider = new FolderDataProvider();
			}

			return this.#folderDataProvider;
		}

		/**
		 * @param {object} params
		 * @param {object} params.folder
		 */
		async handleFolderCreate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleFolderCreate:', params);

			const rawFolder = params?.folder;
			if (!Type.isPlainObject(rawFolder))
			{
				return;
			}

			const folder = { ...folderDefaultElement, ...normalize(rawFolder) };
			if (!Type.isNumber(folder.id) || folder.id <= 0)
			{
				return;
			}

			await this.folderDataProvider.addFromPull(folder);
		}

		/**
		 * @param {object} params
		 * @param {object} params.folder
		 */
		async handleFolderUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleFolderUpdate:', params);

			const rawFolder = params?.folder;
			if (!Type.isPlainObject(rawFolder))
			{
				return;
			}

			const incoming = normalize(rawFolder);
			if (!Type.isNumber(incoming.id) || incoming.id <= 0)
			{
				return;
			}

			// Read full snapshot to avoid losing fields when persisting via
			// `repository.save()` (insertOrReplace).
			const currentResult = await this.folderDataProvider.get(incoming.id);
			const current = currentResult?.getData?.() ?? null;
			const fullSnapshot = {
				...folderDefaultElement,
				...(current || {}),
				...incoming,
			};

			await this.folderDataProvider.update(incoming.id, fullSnapshot);
		}

		/**
		 * @param {object} params
		 * @param {number} params.folderId
		 */
		async handleFolderDelete(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleFolderDelete:', params);

			const folderId = params?.folderId;
			if (!Type.isNumber(folderId) || folderId <= 0)
			{
				return;
			}

			await this.folderDataProvider.delete(folderId);
		}

		/**
		 * @param {object} params
		 * @param {Array<number>} params.folderIds
		 */
		async handleFolderSort(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleFolderSort:', params);

			const sortedIds = Type.isArray(params?.folderIds)
				? params.folderIds.filter((id) => Type.isNumber(id))
				: null;
			if (!sortedIds)
			{
				return;
			}

			await this.store.dispatch('folderModel/sort', { sortedIds });

			// Persist full snapshot — sort field updated for each folder.
			const folders = this.store.getters['folderModel/getList']();
			if (Type.isArrayFilled(folders))
			{
				await this.folderRepository.save(folders);
			}
		}

		/**
		 * @param {object} params
		 * @param {object} params.folder Full folder snapshot after the chats were added.
		 */
		async handleFolderChatAdd(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleFolderChatAdd:', params);

			await this.#applyChatSnapshot(params);
		}

		/**
		 * @param {object} params
		 * @param {object} params.folder Full folder snapshot after the chats were removed.
		 */
		async handleFolderChatDelete(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleFolderChatDelete:', params);

			await this.#applyChatSnapshot(params);
		}

		/**
		 * Both `folderChatAdd` and `folderChatDelete` pull events carry the same
		 * payload shape — a full post-mutation folder snapshot. Apply the chat
		 * membership as a snapshot via `folderModel/setChats`.
		 *
		 * @param {object} params
		 * @param {object} params.folder
		 * @return {Promise<void>}
		 */
		async #applyChatSnapshot(params)
		{
			const rawFolder = params?.folder;
			if (!Type.isPlainObject(rawFolder))
			{
				return;
			}

			const incoming = normalize(rawFolder);
			const folderId = incoming.id;
			if (!Type.isNumber(folderId) || folderId <= 0)
			{
				return;
			}

			const chatIds = Type.isArray(incoming.chatIds) ? incoming.chatIds : [];
			await this.store.dispatch('folderModel/setChats', { folderId, chatIds });

			await this.folderRepository.saveChatIds(folderId, chatIds);
		}
	}

	module.exports = { FolderPullHandler };
});
