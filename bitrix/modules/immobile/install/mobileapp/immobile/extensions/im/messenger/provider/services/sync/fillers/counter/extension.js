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
	const { EntityReady } = require('entity-ready');
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
			this.processedResultUuidCollection = new Set();

			// TODO remove after updating freeze debug
			this.debugInfo = {
				steps: [],
				isViewLoaded: null,
				readyEntitiesCollection: [],
				fillDataMethodExecuted: false,
			};

			this.isReady = true;
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
			if (this.processedResultUuidCollection.has(data.uuid))
			{
				MessengerEmitter.emit(
					EventType.sync.requestResultSaved,
					{ uuid },
					ComponentCode.imMessenger,
				);

				return;
			}

			this.debugInfo = {
				data,
				steps: [],
				isViewLoaded: null,
				readyEntitiesCollection: [],
				fillDataMethodExecuted: true,
			};

			this.debugInfo.isViewLoaded = window.isViewLoaded;
			this.debugInfo.readyEntitiesCollection = [...EntityReady.readyEntitiesCollection];
			this.debugInfo.steps.push(1);
			logger.log(`${this.constructor.name}.fillData`, data);
			const {
				uuid,
				result,
			} = data;

			try
			{
				this.debugInfo.steps.push(2);
				const counterCollectionToUpdate = this.#prepareCounterCollectionToUpdate(result);
				logger.log(`${this.constructor.name}.fillData counterCollectionToUpdate`, counterCollectionToUpdate);
				this.debugInfo.steps.push(3);
				const chatIdListToDelete = this.#prepareChatIdListToDelete(result);
				logger.log(`${this.constructor.name}.fillData chatIdListToDelete`, chatIdListToDelete);
				this.debugInfo.steps.push(5);
				void this.storageWriter.setCollection(counterCollectionToUpdate);
				this.debugInfo.steps.push(6);
				void this.storageWriter.deleteFromCollection(chatIdListToDelete);
				this.debugInfo.steps.push(7);
				MessengerEmitter.emit(
					EventType.sync.requestResultSaved,
					{ uuid },
					ComponentCode.imMessenger,
				);
				this.debugInfo.steps.push(8);

				this.processedResultUuidCollection.add(uuid);
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.fillData catch:`, error);

				MessengerEmitter.emit(EventType.sync.requestResultSaved, {
					uuid,
					error: `${this.constructor.name}.fillData error: ${error.message}`,
				}, ComponentCode.imMessenger);
			}
		}

		/**
		 * @param {SyncListResult} syncListResult
		 * @return {CounterStateCollection}
		 */
		#prepareCounterCollectionToUpdate(syncListResult)
		{
			/** @type {CounterStateCollection} */
			const counterCollection = {};

			const addedChatsIdSet = new Set(Object.values(syncListResult.chatSync.addedChats));
			const addedChats = syncListResult.chats.filter((chat) => {
				return addedChatsIdSet.has(chat.id);
			});

			addedChats.forEach((dialog) => {
				const chatId = dialog.id;
				counterCollection[chatId] = {
					chatId,
					counter: dialog.counter,
					parentChatId: dialog.parentChatId,
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
				...Object.values(syncListResult.chatSync.deletedChats),
				...Object.values(syncListResult.chatSync.completeDeletedChats),
			];
		}
	}

	module.exports = { SyncFillerCounter };
});
