/**
 * @module im/messenger/provider/services/sync/fillers/counter
 */
jn.define('im/messenger/provider/services/sync/fillers/counter', (require, exports, module) => {
	const { SyncFillerBase } = require('im/messenger/provider/services/sync/fillers/base');
	const {
		WaitingEntity,
		EventType,
		ComponentCode,
	} = require('im/messenger/const');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { CounterHelper } = require('im/messenger/lib/helper');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('sync-service');

	/**
	 * @class SyncFillerCounter
	 */
	class SyncFillerCounter extends SyncFillerBase
	{
		/**
		 * @param {CounterStorageWriter} storageWriter
		 */
		constructor(storageWriter)
		{
			super();
			/** @type {CounterStorageWriter} */
			this.storageWriter = storageWriter;
		}

		getUuidPrefix()
		{
			return WaitingEntity.sync.filler.counter;
		}

		/**
		 * @override
		 * @param {SyncListResult} result
		 * @return {SyncListResult}
		 */
		prepareResult(result)
		{
			return result;
		}

		async fillData(data)
		{
			logger.log(`${this.constructor.name}.fillData`, data);
			const {
				uuid,
				result,
			} = data;

			const counterCollectionToUpdate = this.#prepareCounterCollectionToUpdate(result);
			logger.log(`${this.constructor.name}.fillData counterCollectionToUpdate`, counterCollectionToUpdate);

			const chatIdListToDelete = this.#prepareChatIdListToDelete(result);
			logger.log(`${this.constructor.name}.fillData chatIdListToDelete`, chatIdListToDelete);

			void this.storageWriter.setCollection(counterCollectionToUpdate);
			void this.storageWriter.deleteFromCollection(chatIdListToDelete);

			MessengerEmitter.emit(
				EventType.sync.requestResultSaved,
				{ uuid },
				ComponentCode.imMessenger,
			);
		}

		/**
		 * @param {SyncListResult} syncListResult
		 * @return {CounterStateCollection}
		 */
		#prepareCounterCollectionToUpdate(syncListResult)
		{
			/** @type {CounterStateCollection} */
			const counterCollection = {};

			syncListResult.addedChats.forEach((dialog) => {
				const chatId = dialog.id;
				counterCollection[chatId] = {
					chatId,
					counter: dialog.counter,
					parentChatId: dialog.parent_chat_id,
					type: CounterHelper.getCounterTypeByDialogType(dialog.type),
				};
			});

			return counterCollection;
		}

		/**
		 * @param {SyncListResult} syncListResult
		 * @return {Array<number>}
		 */
		#prepareChatIdListToDelete(syncListResult)
		{
			return [
				...Object.values(syncListResult.deletedChats),
				...Object.values(syncListResult.completeDeletedChats),
			];
		}
	}

	module.exports = { SyncFillerCounter };
});
