/**
 * @module im/messenger/lib/counters/update-system/restorer
 */
jn.define('im/messenger/lib/counters/update-system/restorer', (require, exports, module) => {
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');

	/**
	 * @class CounterRestorer
	 */
	class CounterRestorer
	{
		/**
		 * @param {CounterRepository} dbRepository
		 * @param {ChatCounterRepository} chatCounterRepository
		 * @param {ReadRequestQueue} readRequestQueue
		 */
		constructor({
			dbRepository,
			chatCounterRepository,
			readRequestQueue,
		})
		{
			this.repository = dbRepository;
			this.chatCounterRepository = chatCounterRepository;
			this.readRequestQueue = readRequestQueue;
		}

		async restore()
		{
			const { counterList, pendingOperationList } = await this.repository.getAll();

			const pendingOperationCollection = new Map();
			const readMessagesOperations = [];
			for (const pendingOperation of pendingOperationList)
			{
				if (pendingOperation.type === PendingOperationType.localReadMessage)
				{
					readMessagesOperations.push(pendingOperation);
				}

				if (!pendingOperationCollection.has(pendingOperation.chatId))
				{
					pendingOperationCollection.set(pendingOperation.chatId, []);
				}

				pendingOperationCollection.get(pendingOperation.chatId).push(pendingOperation);
			}

			this.readRequestQueue.fillQueue(readMessagesOperations);
			await this.chatCounterRepository.fillStoreFromRestorer(counterList, pendingOperationCollection);
		}
	}

	module.exports = { CounterRestorer };
});
