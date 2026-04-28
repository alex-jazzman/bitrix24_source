/**
 * @module im/messenger/lib/counters/update-system/action/read-message/pull
 */
jn.define('im/messenger/lib/counters/update-system/action/read-message/pull', (require, exports, module) => {
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { CounterAction } = require('im/messenger/lib/counters/update-system/action/base');
	const { CounterConflictResolver } = require('im/messenger/lib/counters/update-system/conflict/resolver');
	const {
		ServerWinStrategy,
		ReadMessagePullStrategy,
	} = require('im/messenger/lib/counters/update-system/conflict/strategy');

	/**
	 * @class ReadMessagePullAction
	 * Handles PULL events for message reading from other devices
	 */
	class ReadMessagePullAction extends CounterAction
	{
		/**
		 * @param {number} chatId
		 * @param {CounterModelState} incomingCounterState
		 * @param {number} lastReadId
		 */
		constructor({ chatId, incomingCounterState, lastReadId })
		{
			super();
			this.chatId = chatId;
			this.incomingCounterState = incomingCounterState;
			this.lastReadId = lastReadId;
		}

		getType()
		{
			return PendingOperationType.readMessagePull;
		}

		/**
		 * @param {ChatCounterRepository} repository
		 * @return {Promise<void>}
		 */
		async execute(repository)
		{
			if (!repository.hasPendingOperations(this.chatId))
			{
				await repository.saveCounterStateList([this.incomingCounterState]);

				return;
			}

			const { counterState, pendingOperations } = this.#resolveCounter(repository);

			await repository.saveCounterStateWithPendingOperationList(
				this.chatId,
				counterState,
				pendingOperations,
			);
		}

		/**
		 * @param {ChatCounterRepository} repository
		 * @return {{counterState: CounterModelState, pendingOperations: Array<PendingOperation>}}
		 */
		#resolveCounter(repository)
		{
			return CounterConflictResolver.resolveConflict(this.#getResolvingStrategies(repository));
		}

		/**
		 * @param {ChatCounterRepository} repository
		 * @return {Array<BaseStrategy>}
		 */
		#getResolvingStrategies(repository)
		{
			const currentCounterState = repository.getCounterState(this.chatId);
			const pendingOperations = repository.getPendingOperationList(this.chatId);

			return [
				new ReadMessagePullStrategy({
					counterState: currentCounterState,
					incomingCounterState: this.incomingCounterState,
					lastReadId: this.lastReadId,
					pendingOperations,
				}),
				new ServerWinStrategy({
					counterState: currentCounterState,
					incomingCounterData: this.incomingCounterState,
				}),
			];
		}
	}

	module.exports = { ReadMessagePullAction };
});
