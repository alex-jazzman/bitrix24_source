/**
 * @module im/messenger/provider/service/classes/sync/fillers/sync-filler-database
 */
jn.define('im/messenger/provider/service/classes/sync/fillers/sync-filler-database', (require, exports, module) => {
	const { SyncFillerBase } = require('im/messenger/provider/service/classes/sync/fillers/sync-filler-base');
	const { EventType, ComponentCode, WaitingEntity } = require('im/messenger/const');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { clone } = require('utils/object');
	const logger = LoggerManager.getInstance().getLogger('sync-service');

	/**
	 * @class SyncFillerDatabase
	 */
	class SyncFillerDatabase extends SyncFillerBase
	{
		/**
		 * @param {object} data
		 * @param {string} data.uuid
		 * @param {SyncListResult} data.result
		 */
		async fillData(data)
		{
			logger.log('SyncFillerDatabase.fillData:', data);
			const {
				uuid,
				result,
			} = data;

			try
			{
				await this.updateDatabase(this.prepareResult(result));

				MessengerEmitter.emit(EventType.sync.requestResultSaved, {
					uuid,
				}, ComponentCode.imMessenger);
			}
			catch (error)
			{
				logger.error('SyncFillerDatabase.fillData error: ', error);

				MessengerEmitter.emit(EventType.sync.requestResultSaved, {
					uuid,
					error: `SyncFillerDatabase.fillData error: ${error.message}`,
				}, ComponentCode.imMessenger);
			}
		}

		/**
		 * @param {SyncListResult} result
		 * @return {SyncListResult}
		 */
		prepareResult(result)
		{
			return this.filterUsers(result);
		}

		/**
		 * @param {SyncListResult} result
		 * @return {SyncListResult}
		 */
		filterUsers(result)
		{
			const cloneResult = clone(result);
			cloneResult.addedRecent = cloneResult.addedRecent.map((recentItem) => {
				if (recentItem.user?.id === 0)
				{
					// eslint-disable-next-line no-param-reassign
					recentItem.user = null;
				}

				return recentItem;
			});

			cloneResult.updatedMessages.users = result.updatedMessages.users.filter((user) => user.id !== 0);
			cloneResult.messages.users = result.messages.users.filter((user) => user.id !== 0);
			cloneResult.addedPins.users = result.messages.users.filter((user) => user.id !== 0);

			return cloneResult;
		}

		getUuidPrefix()
		{
			return WaitingEntity.sync.filler.database;
		}
	}

	module.exports = { SyncFillerDatabase };
});
