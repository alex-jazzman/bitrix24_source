/**
 * @module im/messenger/lib/counters/update-system/conflict/strategy/src/base
 */
jn.define('im/messenger/lib/counters/update-system/conflict/strategy/src/base', (require, exports, module) => {

	/**
	 * @abstract
	 * @class BaseStrategy
	 */
	class BaseStrategy
	{
		/**
		 * @abstract
		 * @return {boolean}
		 */
		canResolve()
		{
			throw new Error('Method canResolve must be implemented');
		}

		/**
		 * @abstract
		 * @return {{counterState: CounterModelState, pendingOperations: Array<PendingOperation>}}
		 */
		resolve()
		{
			throw new Error('Method canResolve must be implemented');
		}
	}

	module.exports = { BaseStrategy };
});
