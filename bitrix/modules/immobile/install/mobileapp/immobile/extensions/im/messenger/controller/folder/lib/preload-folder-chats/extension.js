/**
 * @module im/messenger/controller/folder/lib/preload-folder-chats
 */
jn.define('im/messenger/controller/folder/lib/preload-folder-chats', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { FolderService } = require('im/messenger/provider/services/folder');

	const logger = getLoggerWithContext('folder--preload-folder-chats', 'preloadFolderChats');

	/**
	 * Ensures the folder editor has full chat+user data in local models without
	 * a guaranteed REST round-trip. If every chatId from the local folderModel
	 * already has a dialoguesModel entry with a real chatId, the call returns
	 * straight from cache. Only when at least one chat is missing locally
	 * (typical for chats hidden from recent) does it call im.v2.Folder.get and
	 * write chats + companion users into dialoguesModel/usersModel.
	 *
	 * Returns null if the store is unavailable or the server call fails — caller
	 * falls back to whatever is currently in the local model.
	 *
	 * @param {number} folderId
	 * @return {Promise<{folder: object, chatIds: number[], source: 'local'|'server'}|null>}
	 */
	const preloadFolderChats = async (folderId) => {
		const store = serviceLocator.get('core')?.getStore();
		if (!store)
		{
			return null;
		}

		const localFolder = store.getters['folderModel/getById'](folderId);
		const localChatIds = Array.isArray(localFolder?.chatIds) ? localFolder.chatIds : null;

		if (localFolder && localChatIds)
		{
			const hasMissing = localChatIds.some((chatId) => {
				const dialog = store.getters['dialoguesModel/getByChatId'](chatId);

				return !dialog || !(dialog.chatId > 0);
			});

			if (!hasMissing)
			{
				const result = { folder: localFolder, chatIds: [...localChatIds], source: 'local' };
				logger.log(`folderId=${folderId} cache hit`, result);

				return result;
			}
		}

		try
		{
			const { folder, chats, users } = await FolderService.getFolder({ folderId });
			if (!folder)
			{
				return null;
			}

			const dispatches = [];
			if (users.length > 0)
			{
				dispatches.push(store.dispatch('usersModel/set', users));
			}
			if (chats.length > 0)
			{
				dispatches.push(store.dispatch('dialoguesModel/set', chats));
			}
			if (dispatches.length > 0)
			{
				await Promise.all(dispatches);
			}

			const result = {
				folder,
				chatIds: chats.map((chat) => Number(chat.id)).filter((id) => Number.isInteger(id) && id > 0),
				source: 'server',
			};
			logger.warn(`folderId=${folderId} fetched from server`, result);

			return result;
		}
		catch (error)
		{
			logger.error(`folderId=${folderId} preload failed`, error);

			return null;
		}
	};

	module.exports = { preloadFolderChats };
});
