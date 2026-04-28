/**
 * @module im/messenger/lib/counters/update-system/repository
 */
jn.define('im/messenger/lib/counters/update-system/repository', (require, exports, module) => {
	const { Type } = require('type');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('counters--update-system', 'ChatCounterRepository');

	/**
	 * @class ChatCounterRepository
	 */
	class ChatCounterRepository
	{
		/**
		 * @param {MessengerCoreStore} store
		 * @param {CounterRepository} dbRepository
		 */
		constructor({ store, dbRepository })
		{
			/** @type {MessengerCoreStore} */
			this.store = store;
			/** @type {CounterRepository} */
			this.repository = dbRepository;
			/** @type {Map<number, Array<PendingOperation>>} */
			this.pendingOperationCollection = new Map();
		}

		/**
		 * @param {number} chatId
		 * @return {boolean}
		 */
		hasPendingOperations(chatId)
		{
			return Type.isArrayFilled(this.pendingOperationCollection.get(chatId));
		}

		/**
		 * @param chatId
		 * @return {Array<PendingOperation>}
		 */
		getPendingOperationList(chatId)
		{
			return this.pendingOperationCollection.get(chatId) ?? [];
		}

		/**
		 * @param {number} chatId
		 * @return {?CounterModelState}
		 */
		getCounterState(chatId)
		{
			return this.store.getters['counterModel/getByChatId'](chatId);
		}

		/**
		 * @param {number} chatId
		 * @return {?DialoguesModelState}
		 */
		getChatData(chatId)
		{
			return this.store.getters['dialoguesModel/getByChatId'](chatId);
		}

		/**
		 * @return {Record<number, CounterModelState>}
		 */
		getCounterCollection()
		{
			return this.store.getters['counterModel/getCollection']();
		}

		/**
		 * @param {number} chatId
		 * @param {CounterModelState} counterState
		 * @param {Array<PendingOperation>} pendingOperationList
		 * @return {Promise<void>}
		 */
		async saveCounterStateWithPendingOperationList(chatId, counterState, pendingOperationList)
		{
			this.pendingOperationCollection.set(chatId, pendingOperationList);

			await this.store.dispatch('counterModel/setList', {
				counterList: [counterState],
			});

			await this.repository.saveCounterStateList([counterState]);
			await this.repository.savePendingOperationsByChatId(chatId, pendingOperationList);
		}

		/**
		 * @param {number} chatId
		 * @param {CounterModelState} counterState
		 * @param {PendingOperation} pendingOperation
		 * @return {Promise<void>}
		 */
		async saveCounterStateWithPendingOperation(chatId, counterState, pendingOperation)
		{
			if (!this.pendingOperationCollection.has(chatId))
			{
				this.pendingOperationCollection.set(chatId, []);
			}

			this.pendingOperationCollection.get(chatId).push(pendingOperation);

			await this.store.dispatch('counterModel/setList', {
				counterList: [counterState],
			});

			await this.repository.saveCounterStateWithPendingOperation(counterState, pendingOperation);
		}

		/**
		 * @param {Array<CounterModelState>} counterStateList
		 * @return {Promise<void>}
		 */
		async saveCounterStateList(counterStateList)
		{
			await this.store.dispatch('counterModel/setList', {
				counterList: counterStateList,
			});

			await this.repository.saveCounterStateList(counterStateList);
		}

		/**
		 * @param {Array<CounterModelState>} counterList
		 * @param {Map<number, Array<PendingOperation>>} pendingOperationCollection
		 * @return {Promise<void>}
		 */
		async fillStoreFromRestorer(counterList, pendingOperationCollection)
		{
			this.pendingOperationCollection = pendingOperationCollection;
			await this.store.dispatch('counterModel/setList', {
				counterList,
			});
		}

		/**
		 * @param {Array<number>} chatIdList
		 * @return {Promise<void>}
		 */
		async deleteByChatIdList(chatIdList)
		{
			if (!Type.isArrayFilled(chatIdList))
			{
				return;
			}

			logger.log('deleteByChatIdList', chatIdList);

			await this.store.dispatch('counterModel/delete', {
				chatIdList,
			});

			this.repository.deleteByChatIdList(chatIdList);
		}

		async deleteOperationsByChatId(chatId)
		{
			this.pendingOperationCollection.delete(chatId);

			await this.repository.deletePendingOperationsByChatId(chatId);
		}

		/**
		 * Save multiple counters with their pending operations in batch
		 * @param {Array<CounterModelState>} counterStateList
		 * @param {Object<number, Array<PendingOperation>>} pendingOperationsByChatId
		 * @return {Promise<void>}
		 */
		async saveMultipleCountersWithOperations(counterStateList, pendingOperationsByChatId)
		{
		// Save all pending operations to collection
			for (const [chatId, operations] of Object.entries(pendingOperationsByChatId))
			{
				this.pendingOperationCollection.set(Number(chatId), operations);
			}

			// Save counters to store
			await this.store.dispatch('counterModel/setList', {
				counterList: counterStateList,
			});

			// Save to database
			await this.repository.saveCounterStateList(counterStateList);

			// Save pending operations to database
			for (const [chatId, operations] of Object.entries(pendingOperationsByChatId))
			{
				await this.repository.savePendingOperationsByChatId(Number(chatId), operations);
			}
		}

		/**
		 * Clear all counters in database (except openlines).
		 * Also clears all pending operations from memory and database.
		 * @return {Promise<void>}
		 */
		async clearAllCountersInDatabase()
		{
			await this.repository.clearAllCountersExceptOpenlines();

			await this.clearAllPendingOperations();
		}

		async clearAllPendingOperations()
		{
			this.pendingOperationCollection.clear();
			await this.repository.clearAllPendingOperations();
		}
	}

	module.exports = { ChatCounterRepository };
});
