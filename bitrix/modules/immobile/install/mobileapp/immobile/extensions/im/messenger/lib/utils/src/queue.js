/**
 * @module im/messenger/lib/utils/src/queue
 */
jn.define('im/messenger/lib/utils/src/queue', (require, exports, module) => {

	/**
	 * @class Queue
	 */
	class Queue
	{
		#items = [];

		/**
		 * @return {number}
		 */
		get size()
		{
			return this.#items.length;
		}

		/**
		 * @return {boolean}
		 */
		isEmpty()
		{
			return this.size === 0;
		}

		/**
		 * @param element
		 */
		enqueue(element)
		{
			this.#items.push(element);
		}

		/**
		 * @return {undefined|*}
		 */
		dequeue()
		{
			if (this.isEmpty())
			{
				// eslint-disable-next-line unicorn/no-useless-undefined
				return undefined;
			}

			return this.#items.shift();
		}
	}

	module.exports = {
		Queue,
	};
});
