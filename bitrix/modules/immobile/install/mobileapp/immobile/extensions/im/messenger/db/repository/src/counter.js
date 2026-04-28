/**
 * @module im/messenger/db/repository/counter
 */
jn.define('im/messenger/db/repository/counter', (require, exports, module) => {
	const { Type } = require('type');
	const {
		CounterTable,
		CounterPendingOperationInternalTable,
	} = require('im/messenger/db/table');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { AsyncQueue, createPromiseWithResolvers } = require('im/messenger/lib/utils');

	const logger = getLoggerWithContext('repository--counter', 'CounterRepository');

	/**
	 * @class CounterRepository
	 */
	class CounterRepository
	{
		constructor()
		{
			this.counterTable = new CounterTable();
			this.counterPendingOperationInternalTable = new CounterPendingOperationInternalTable();

			this.queue = new AsyncQueue();
		}

		/**
		 * @return {Promise<{counterList: Array<CounterModelState>, pendingOperationList: Array<PendingOperation>}>}
		 */
		async getAll()
		{
			const counterResult = await this.counterTable.getList({});
			const pendingOperationResult = await this.counterPendingOperationInternalTable.getList({
				order: { timestamp: 'asc' },
			});

			const result = {
				counterList: counterResult.items,
				pendingOperationList: pendingOperationResult.items,
			};

			logger.log('getAll', result);

			return result;
		}

		/**
		 * @param {Array<CounterModelState>} counterList
		 */
		saveCounterStateList(counterList)
		{
			this.queue.enqueue(
				() => {
					const counterListToAdd = this.#prepareCounterStateList(counterList);
					logger.log('save counterListToAdd', counterListToAdd);

					return this.counterTable.add(counterListToAdd, true);
				},
				(error) => {
					logger.error('saveCounterStateList error', error);
				},
			);
		}

		/**
		 * @param {CounterModelState} counterState
		 * @param {PendingOperation} pendingOperation
		 * @return {Promise<unknown>}
		 */
		async saveCounterStateWithPendingOperation(counterState, pendingOperation)
		{
			const { promise, resolve } = createPromiseWithResolvers();
			this.queue.enqueue(
				() => {
					const counterListToAdd = this.#prepareCounterStateList([counterState]);
					logger.log('saveCounterStateWithPendingOperation counterListToAdd', counterListToAdd);

					const pendingOperationsToAdd = this.#preparePendingOperationListToAdd([pendingOperation]);
					logger.log('saveCounterStateWithPendingOperation pendingOperationsToAdd', pendingOperationsToAdd);

					return Promise.all([
						this.counterTable.add(counterListToAdd),
						this.counterPendingOperationInternalTable.add(pendingOperationsToAdd),
					]).then(resolve);
				},
				(error) => {
					logger.error('saveCounterStateWithPendingOperation error', error);

					resolve();
				},
			);

			return promise;
		}

		/**
		 * @param {number} chatId
		 * @param {Array<PendingOperation>} pendingOperationList
		 * @return {Promise<void>}
		 */
		savePendingOperationsByChatId(chatId, pendingOperationList)
		{
			this.queue.enqueue(
				async () => {
					await this.counterPendingOperationInternalTable.delete({ chatId });
					const pendingOperationsToAdd = this.#preparePendingOperationListToAdd(pendingOperationList);
					logger.log('savePendingOperationsByChatId pendingOperationsToAdd', pendingOperationsToAdd);

					return this.counterPendingOperationInternalTable.add(pendingOperationsToAdd, true);
				},
				(error) => {
					logger.error('savePendingOperationsByChatId error', error);
				},
			);
		}

		/**
		 * @param {Array<number>} chatIdList
		 */
		deleteByChatIdList(chatIdList)
		{
			this.queue.enqueue(
				() => {
					if (!Type.isArrayFilled(chatIdList))
					{
						return Promise.resolve([]);
					}

					return Promise.all([
						this.counterTable.deleteByIdList(chatIdList),
						this.counterPendingOperationInternalTable.deleteByChatIdList(chatIdList),
					]);
				},
				(error) => {
					logger.error('deleteByChatIdList error', error);
				},
			);
		}

		/**
		 * @param {number} chatId
		 * @return {Promise<unknown>}
		 */
		async deletePendingOperationsByChatId(chatId)
		{
			const { promise, resolve } = createPromiseWithResolvers();
			this.queue.enqueue(
				() => {
					return this.counterPendingOperationInternalTable.delete({ chatId })
						.then(resolve)
					;
				},
				(error) => {
					logger.error('deletePendingOperationsByChatId error', error);

					resolve();
				},
			);

			return promise;
		}

		clear()
		{
			this.queue.enqueue(
				() => Promise.all([
					this.counterTable.truncate(),
					this.counterPendingOperationInternalTable.truncate(),
				]),
				(error) => {
					logger.error('clear error', error);
				},
			);
		}

		/**
		 * Clear all counters in database except those in openlines (recentSections includes 'lines').
		 * @return {Promise<void>}
		 */
		async clearAllCountersExceptOpenlines()
		{
			const { promise, resolve } = createPromiseWithResolvers();
			this.queue.enqueue(
				async () => {
				// Get all counters from database
					const result = await this.counterTable.getList({});
					const counterList = result.items;

					const updatingCounters = [];
					for (const counter of counterList)
					{
						if (Type.isArrayFilled(counter.recentSections)
						&& counter.recentSections.includes('lines'))
						{
							continue;
						}

						if (counter.counter > 0 || counter.isMarkedAsUnread)
						{
							updatingCounters.push({
								...counter,
								counter: 0,
								isMarkedAsUnread: false,
							});
						}
					}

					if (!Type.isArrayFilled(updatingCounters))
					{
						logger.log('clearAllCountersExceptOpenlines: no counters to update');

						return resolve();
					}
					const counterListToUpdate = this.#prepareCounterStateList(updatingCounters);

					logger.log('clearAllCountersExceptOpenlines: updating counters', counterListToUpdate.length);

					return this.counterTable.add(counterListToUpdate, true).then(resolve);
				},
				(error) => {
					logger.error('clearAllCountersExceptOpenlines error', error);
					resolve();
				},
			);

			return promise;
		}

		async clearAllPendingOperations()
		{
			const { promise, resolve } = createPromiseWithResolvers();
			this.queue.enqueue(
				async () => {
					await this.counterPendingOperationInternalTable.truncate();
					resolve();
				},
				(error) => {
					logger.error('clearAllPendingOperations error', error);
				},
			);

			return promise;
		}

		/**
		 * @param {Array<CounterModelState>} counterStateList
		 * @return {Array}
		 */
		#prepareCounterStateList(counterStateList)
		{
			return counterStateList.map((counter) => (
				this.counterTable.validate(counter)
			));
		}

		/**
		 * @param {Array<PendingOperation>} pendingOperationList
		 * @return {Array}
		 */
		#preparePendingOperationListToAdd(pendingOperationList)
		{
			return pendingOperationList.map((pendingOperation) => (
				this.counterPendingOperationInternalTable.validate(pendingOperation)
			));
		}
	}

	module.exports = {
		CounterRepository,
	};
});
