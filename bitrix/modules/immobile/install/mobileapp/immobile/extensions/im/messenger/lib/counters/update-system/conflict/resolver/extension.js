/**
 * @module im/messenger/lib/counters/update-system/conflict/resolver
 */
jn.define('im/messenger/lib/counters/update-system/conflict/resolver', (require, exports, module) => {

	/**
	 * @class CounterConflictResolver
	 */
	class CounterConflictResolver
	{
		/**
		 * @param {Array<BaseStrategy>} strategyList
		 * @return {{counterState: CounterModelState, pendingOperations: Array<PendingOperation>}}
		 */
		static resolveConflict(strategyList)
		{
			for (const strategy of strategyList)
			{
				if (strategy.canResolve())
				{
					return strategy.resolve();
				}
			}

			throw new Error('CounterConflictResolver.resolveConflict: No strategy works.');
		}
	}

	module.exports = { CounterConflictResolver };
});
