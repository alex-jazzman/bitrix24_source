/**
 * @module im/messenger/lib/utils/src/async-queue
 */
jn.define('im/messenger/lib/utils/src/async-queue', (require, exports, module) => {
	const { createPromiseWithResolvers } = require('im/messenger/lib/utils/promise');

	/**
	 * @class AsyncQueue
	 */
	class AsyncQueue
	{
		#queue = Promise.resolve();
		#generation = 0;

		/**
		 * @param {() => (void | Promise<void>)} task
		 * @param {(error: any) => (void | Promise<void>)} fallback
		 * @return {Promise<void>}
		 */
		async enqueue(task, fallback = () => {})
		{
			const { resolve, promise } = createPromiseWithResolvers();

			const myGeneration = this.#generation;

			this.#queue = this.#queue
				.then(() => {
					if (myGeneration !== this.#generation)
					{
						const error = new Error('AsyncQueue cleared');
						error.name = 'AsyncQueueCleared';
						throw error;
					}

					return task();
				})
				.catch((error) => {
					if (error?.name !== 'AsyncQueueCleared')
					{
						console.error('AsyncQueue error in callback. Run fallback', error);
					}

					return fallback(error);
				})
				.catch((error) => {
					console.error('AsyncQueue error in fallback!', error);
				})
				.finally(resolve)
			;

			await promise;
		}

		clear()
		{
			// Bumping the generation tells every task that has not started yet that the queue was cleared.
			this.#generation += 1;
			this.#queue = Promise.resolve();
		}
	}

	module.exports = {
		AsyncQueue,
	};
});
