/**
 * @module im/messenger/lib/counters/update-system/system
 */
jn.define('im/messenger/lib/counters/update-system/system', (require, exports, module) => {
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('counters--update-system', 'CountersUpdateSystem');

	/**
	 * @class CountersUpdateSystem
	 */
	class CountersUpdateSystem
	{
		/**
		 * @param {CountersUpdateSystemDeps} deps
		 */
		constructor(deps)
		{
		/** @private */
			this.dispatcher = deps.dispatcher;
			/** @private */
			this.repository = deps.chatCounterRepository;
			/** @private */
			this.restorer = deps.restorer;
			/** @private */
			this.readRequestQueue = deps.readRequestQueue;
			/** @private */
			this.store = deps.store;
		}

		/**
		 * @param {CounterAction} action
		 * @return {Promise<void>}
		 */
		async dispatch(action)
		{
			return this.dispatcher.dispatch(action);
		}

		async restoreCounters()
		{
			return this.restorer.restore();
		}

		/**
		 * @param {PendingOperation<LocalReadMessage>} readPendingOperation
		 * @return {Promise<void>}
		 */
		async addReadRequestToQueue(readPendingOperation)
		{
			this.readRequestQueue.addOperation(readPendingOperation);
			this.readRequestQueue.tryReading();
		}

		disableReadingQueue()
		{
			this.readRequestQueue.disable();
		}

		enableReadingQueue()
		{
			this.readRequestQueue.enable();
		}

		startReadingQueue()
		{
			return this.readRequestQueue.tryReading();
		}

		getChatCounterRepository()
		{
			return this.repository;
		}

		/**
		 * Clear all chat counters (except openlines) from Vuex and database
		 * @return {Promise<void>}
		 */
		async readAllChats()
		{
			await this.store.dispatch('counterModel/readAllChats').catch((error) => {
				logger.error('readAllChats: counterModel/readAllChats error', error);
			});

			await this.repository.clearAllCountersInDatabase().catch((error) => {
				logger.error('readAllChats: clearAllCountersInDatabase error', error);
			});
		}

		/**
		 * @param {number} chatId
		 * @return {Promise<void>}
		 */
		async readChat(chatId)
		{
			const counterState = this.repository.getCounterState(chatId);

			await this.updateCounterState({
				...counterState,
				counter: 0,
				isMarkedAsUnread: false,
			});

			await this.repository.deleteOperationsByChatId(chatId);
		}

		/**
		 * @param {number} chatId
		 * @return {Promise<void>}
		 */
		async readChildren(chatId)
		{
			const promises = this.store.getters['counterModel/getByParentChatId'](chatId)
				.map((counterState) => {
					return this.readChat(counterState.chatId);
				});

			await Promise.all(promises);
		}

		/**
		 * @param {RecentTab[keyof RecentTab]} recentSection
		 * @return {Promise<void>}
		 */
		async readByRecentSection(recentSection)
		{
			const promises = this.store.getters['counterModel/getByRecentSection'](recentSection)
				.map((counterState) => {
					return this.readChat(counterState.chatId);
				});

			await Promise.all(promises);
		}

		/**
		 * Delete counters by chat IDs from Vuex and database
		 * @param {Array<number>} chatIdList
		 * @return {Promise<void>}
		 */
		async deleteCountersByChatIdList(chatIdList)
		{
			try
			{
				this.readRequestQueue.clearQueueOfChatIdList(chatIdList);
				await this.repository.deleteByChatIdList(chatIdList);
			}
			catch (error)
			{
				logger.error('deleteCountersByChatIdList error', error);
			}
		}

		/**
		 * Update counter state in Vuex and database
		 * @param {CounterModelState} counterState
		 * @return {Promise<void>}
		 */
		async updateCounterState(counterState)
		{
			await this.store.dispatch('counterModel/setList', {
				counterList: [counterState],
			}).catch((error) => {
				logger.error('updateCounterState: counterModel/setList error', error);
			});

			const storedCounterState = this.store.getters['counterModel/getByChatId'](counterState.chatId);

			await this.repository.saveCounterStateList([storedCounterState]).catch((error) => {
				logger.error('updateCounterState: saveCounterStateList error', error);
			});
		}
	}

	module.exports = { CountersUpdateSystem };
});
