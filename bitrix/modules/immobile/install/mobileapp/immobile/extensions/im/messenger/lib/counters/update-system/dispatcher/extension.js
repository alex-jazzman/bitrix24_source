/**
 * @module im/messenger/lib/counters/update-system/dispatcher
 */
jn.define('im/messenger/lib/counters/update-system/dispatcher', (require, exports, module) => {
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { AsyncQueue, createPromiseWithResolvers } = require('im/messenger/lib/utils');

	/**
	 * @class ActionDispatcher
	 */
	class ActionDispatcher
	{
		#queue = new AsyncQueue();

		/**
		 * @param {ChatCounterRepository} chatCounterRepository
		 */
		constructor({ chatCounterRepository })
		{
			this.repository = chatCounterRepository;
			this.logger = getLoggerWithContext('counters--update-system', this);
		}

		/**
		 * @param {CounterAction} action
		 * @return {Promise<void>}
		 */
		dispatch(action)
		{
			const { resolve, reject, promise } = createPromiseWithResolvers();
			this.#queue.enqueue(
				async () => {
					const result = await action.execute(this.repository);

					resolve(result);
				},
				(error) => {
					this.logger.error('dispatch error', action, error);

					reject(error);
				},
			);

			return promise;
		}
	}

	module.exports = { ActionDispatcher };
});
