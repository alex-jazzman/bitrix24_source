/**
 * @module utils/async-queue
 */
jn.define('utils/async-queue', (require, exports, module) => {
	/**
	 * @class AsyncQueue
	 */
	class AsyncQueue
	{
		constructor()
		{
			this.queueList = [];
			this.result = [];
			this.runPromise = null;
		}

		/**
		 * @param {Object} task
		 * @param {string} task.name
		 * @param {Function} task.task
		 * @return {AsyncQueue}
		 */
		add(task)
		{
			if (!task || typeof task.task !== 'function')
			{
				console.error('AsyncQueue: Invalid task. Task must have a "task" function property.');

				return this;
			}

			if (!task.name)
			{
				console.error('AsyncQueue: Task without name. Consider adding a name for better debugging.');
			}

			this.queueList.push(task);

			return this;
		}

		/**
		 * @return {Promise<Object[]>}
		 */
		async run()
		{
			if (this.runPromise)
			{
				return this.runPromise;
			}

			if (this.queueList.length === 0)
			{
				return Promise.resolve([]);
			}

			this.runPromise = this.#executeQueue();

			try
			{
				return await this.runPromise;
			}
			finally
			{
				const hasNewTasks = this.queueList.length > 0;

				this.runPromise = null;

				if (hasNewTasks)
				{
					void this.run();
				}
			}
		}

		/**
		 * @return {Promise<Object[]>}
		 */
		async #executeQueue()
		{
			const tasks = [...this.queueList];
			this.queueList = [];

			this.#clearResult();

			await tasks.reduce(
				async (previousPromise, task) => {
					await previousPromise;
					await this.#executeTask(task);
				},
				Promise.resolve(),
			);

			return [...this.result];
		}

		/**
		 * @param {Object} task
		 * @return {Promise<void>}
		 */
		async #executeTask(task)
		{
			try
			{
				const promiseResult = await task.task();
				this.result.push({ name: task.name, result: promiseResult });
			}
			catch (error)
			{
				console.error(`AsyncQueue: Error executing task "${task.name}":`, error);
				this.result.push({ name: task.name, result: null, error });
			}
		}

		/**
		 * @return {number}
		 */
		size()
		{
			return this.queueList.length;
		}

		/**
		 * @return {boolean}
		 */
		isEmpty()
		{
			return this.queueList.length === 0;
		}

		/**
		 * @return {boolean}
		 */
		isRunning()
		{
			return this.runPromise !== null;
		}

		/**
		 * @return {void}
		 */
		clear()
		{
			this.queueList = [];
			this.#clearResult();
		}

		/**
		 * @return {Object[]}
		 */
		getResults()
		{
			return [...this.result];
		}

		/**
		 * @return {void}
		 */
		#clearResult()
		{
			this.result = [];
		}
	}

	module.exports = { AsyncQueue };
});
