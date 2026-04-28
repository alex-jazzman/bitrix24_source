/**
 * @module im/messenger/lib/counters/update-system/action/read-message/server/src/confirmation
 */
jn.define('im/messenger/lib/counters/update-system/action/read-message/server/src/confirmation', (require, exports, module) => {
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { CounterAction } = require('im/messenger/lib/counters/update-system/action/base');
	const { CounterConflictResolver } = require('im/messenger/lib/counters/update-system/conflict/resolver');
	const {
		ServerWinStrategy,
		ConfirmationOnlyLocalReadOperationStrategy,
		ConfirmationWithNewMessageStrategy,
		ConfirmationWithMixedOperationsStrategy,
	} = require('im/messenger/lib/counters/update-system/conflict/strategy');

	/**
	 * @class ConfirmationReadMessageAction
	 */
	class ConfirmationReadMessageAction extends CounterAction
	{
		/**
		 * @param {number} chatId
		 * @param {string} actionUuid
		 * @param {number} lastReadId
		 * @param {number} counter
		 */
		constructor({
			chatId,
			actionUuid,
			lastReadId,
			counter,
		})
		{
			super();
			this.chatId = chatId;
			this.actionUuid = actionUuid;
			this.lastReadId = lastReadId;
			this.counter = counter;
		}

		getType()
		{
			return PendingOperationType.confirmationReadMessage;
		}

		async execute(repository)
		{
			try
			{
				const counterState = repository.getCounterState(this.chatId);
				const pendingOperations = repository.getPendingOperationList(this.chatId);

				const result = this.#resolveCounter(repository, counterState, pendingOperations);

				await repository.saveCounterStateWithPendingOperationList(
					this.chatId,
					result.counterState,
					result.pendingOperations,
				);
			}
			catch (error)
			{
				this.logger.error('execute error', error);
			}
		}

		/**
		 * @param {ChatCounterRepository} repository
		 * @param {CounterModelState} counterState
		 * @param {Array<PendingOperation>} pendingOperations
		 * @return {{counterState: CounterModelState, pendingOperations: Array<PendingOperation>}}
		 */
		#resolveCounter(repository, counterState, pendingOperations)
		{
			const strategies = this.#getResolvingStrategies(counterState, pendingOperations);

			return CounterConflictResolver.resolveConflict(strategies);
		}

		/**
		 * @param {CounterModelState} counterState
		 * @param {Array<PendingOperation>} pendingOperations
		 * @return {Array<BaseStrategy>}
		 */
		#getResolvingStrategies(counterState, pendingOperations)
		{
			const confirmationData = this.#getConfirmationData();

			// Order strategies from most specific to most general
			return [
				new ConfirmationWithMixedOperationsStrategy({
					confirmationData,
					counterState,
					pendingOperations,
				}),
				new ConfirmationWithNewMessageStrategy({
					confirmationData,
					counterState,
					pendingOperations,
				}),
				new ConfirmationOnlyLocalReadOperationStrategy({
					confirmationData,
					counterState,
					pendingOperations,
				}),
				new ServerWinStrategy({
					counterState,
					incomingCounterData: { counter: this.counter },
				}),
			];
		}

		#getConfirmationData()
		{
			return {
				chatId: this.chatId,
				actionUuid: this.actionUuid,
				lastReadId: this.lastReadId,
				counter: this.counter,
			};
		}
	}

	module.exports = { ConfirmationReadMessageAction };
});
