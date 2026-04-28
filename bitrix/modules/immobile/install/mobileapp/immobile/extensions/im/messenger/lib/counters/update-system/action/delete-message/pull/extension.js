/**
 * @module im/messenger/lib/counters/update-system/action/delete-message/pull
 */
jn.define('im/messenger/lib/counters/update-system/action/delete-message/pull', (require, exports, module) => {
	const { UuidManager } = require('im/messenger/lib/uuid-manager');

	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { CounterAction } = require('im/messenger/lib/counters/update-system/action/base');
	const { CounterConflictResolver } = require('im/messenger/lib/counters/update-system/conflict/resolver');
	const {
		ServerWinStrategy,
		DeleteMessageStrategy,
	} = require('im/messenger/lib/counters/update-system/conflict/strategy');

	/**
	 * @class DeleteMessagePullAction
	 */
	class DeleteMessagePullAction extends CounterAction
	{
		/**
		 * @param {number} chatId
		 * @param {CounterModelState} incomingCounterState
		 * @param {Array<number>} deletedMessageIds
		 */
		constructor({
			chatId,
			incomingCounterState,
			deletedMessageIds,
		})
		{
			super();
			this.chatId = chatId;
			this.incomingCounterState = incomingCounterState;
			this.deletedMessageIds = deletedMessageIds;
		}

		/**
		 * @param {ChatCounterRepository} repository
		 * @return {Promise<void>}
		 */
		async execute(repository)
		{
			// If no pending operations, just save the new counter state
			if (!repository.hasPendingOperations(this.chatId))
			{
				await repository.saveCounterStateList([this.incomingCounterState]);

				return;
			}

			// Resolve conflict with local operations
			const { counterState, pendingOperations } = this.#resolveCounter(repository);

			await repository.saveCounterStateWithPendingOperationList(
				this.chatId,
				counterState,
				pendingOperations,
			);
		}

		getType()
		{
			return PendingOperationType.deleteMessagePull;
		}

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

			// Order strategies from most specific to most general
			return [
				new DeleteMessageStrategy({
					counterState: currentCounterState,
					incomingCounterState: this.incomingCounterState,
					deletedMessageIds: this.deletedMessageIds,
					pendingOperations,
				}),
				new ServerWinStrategy({
					counterState: currentCounterState,
					incomingCounterData: this.incomingCounterState,
				}),
			];
		}
	}

	module.exports = { DeleteMessagePullAction };
});
