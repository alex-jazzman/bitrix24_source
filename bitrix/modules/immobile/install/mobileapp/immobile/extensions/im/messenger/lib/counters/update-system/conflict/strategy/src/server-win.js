/**
 * @module im/messenger/lib/counters/update-system/conflict/strategy/src/server-win
 */
jn.define('im/messenger/lib/counters/update-system/conflict/strategy/src/server-win', (require, exports, module) => {
	const { BaseStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/base');

	/**
	 * @class ServerWinStrategy
	 */
	class ServerWinStrategy extends BaseStrategy
	{
		/**
		 * @param {CounterModelState} counterState
		 * @param {Partial<CounterModelState>} incomingCounterData
		 */
		constructor({ counterState, incomingCounterData })
		{
			super();
			this.counterState = counterState;
			this.incomingCounterData = incomingCounterData;
		}

		canResolve()
		{
			return true;
		}

		/**
		 * @return {{counterState: CounterModelState, pendingOperations: Array<PendingOperation>}}
		 */
		resolve()
		{
			return {
				counterState: {
					...this.counterState,
					...this.incomingCounterData,
				},
				pendingOperations: [],
			};
		}
	}

	module.exports = { ServerWinStrategy };
});
