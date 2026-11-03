/**
 * @module im/messenger/application/lib/folder-launcher
 */
jn.define('im/messenger/application/lib/folder-launcher', (require, exports, module) => {
	const { Type } = require('type');
	const { Feature } = require('im/messenger/lib/feature');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { FolderDataProvider } = require('im/messenger/provider/data');

	class FolderLauncher
	{
		constructor()
		{
			this.logger = getLoggerWithContext('messenger--folder-launcher', this);
		}

		get #core()
		{
			return serviceLocator.get('core');
		}

		get #messengerInitService()
		{
			return serviceLocator.get('messenger-init-service');
		}

		async restoreModel()
		{
			// isChatFoldersAvailable is this very reason compared to null, so reading the reason instead
			// of the predicate keeps the condition and the order of its checks as they are
			const unavailabilityReason = Feature.getChatFoldersUnavailabilityReason();
			if (unavailabilityReason !== null)
			{
				this.logger.log('restoreModel: folders are unavailable, reason:', unavailabilityReason);

				return;
			}

			try
			{
				const startupFolderList = MessengerParams.get('STARTUP_FOLDER_LIST', []);
				this.logger.log('restoreModel startupFolderList:', startupFolderList);

				const folderDataProvider = new FolderDataProvider();
				if (Type.isArrayFilled(startupFolderList))
				{
					await folderDataProvider.restoreStartupSnapshotToStore(startupFolderList);

					return;
				}

				const folderList = await this.#core.getRepository().folder.getAll();
				this.logger.log('restoreModel folderList:', folderList);

				if (Type.isArrayFilled(folderList))
				{
					await folderDataProvider.restoreToStore(folderList);
				}
			}
			catch (error)
			{
				this.logger.error('restoreModel error:', error);
			}
		}

		subscribeInitResult()
		{
			const unavailabilityReason = Feature.getChatFoldersUnavailabilityReason();
			if (unavailabilityReason !== null)
			{
				this.logger.log('subscribeInitResult: folders are unavailable, reason:', unavailabilityReason);

				return;
			}

			this.#messengerInitService.onInit((data) => {
				const folders = this.#getFoldersFromInitResult(data);
				if (!folders)
				{
					return;
				}

				const folderDataProvider = new FolderDataProvider();
				folderDataProvider.setList(folders).catch((error) => {
					this.logger.error('subscribeInitResult setList error:', error);
				});
			});
		}

		#getFoldersFromInitResult(data)
		{
			const folderListResult = data?.folderList;
			if (!folderListResult)
			{
				return null;
			}

			if (Type.isArray(folderListResult))
			{
				return folderListResult;
			}

			if (Type.isArray(folderListResult.folders))
			{
				return folderListResult.folders;
			}

			return null;
		}
	}

	module.exports = { FolderLauncher };
});
