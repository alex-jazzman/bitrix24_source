/**
 * @module im/messenger/lib/counters/update-system/action/new-message/pull/src/participant-message
 */
jn.define('im/messenger/lib/counters/update-system/action/new-message/pull/src/participant-message', (require, exports, module) => {
	const { UuidManager } = require('im/messenger/lib/uuid-manager');

	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { CounterAction } = require('im/messenger/lib/counters/update-system/action/base');
	const { CounterConflictResolver } = require('im/messenger/lib/counters/update-system/conflict/resolver');
	const {
		NewMessageAfterLocalReadStrategy,
		ServerWinStrategy,
	} = require('im/messenger/lib/counters/update-system/conflict/strategy');

	/**
	 * @class NewParticipantPullMessageAction
	 */
	class NewParticipantPullMessageAction extends CounterAction
	{
		/**
		 * @param {number} chatId
		 * @param {CounterModelState} incomingCounterState
		 * @param {number} previousMessageId
		 * @param {number} messageId
		 * @param {string} templateId
		 */
		constructor({
			chatId,
			incomingCounterState,
			previousMessageId,
			messageId,
			templateId = UuidManager.getInstance().getActionUuid(),
		})
		{
			super();
			this.chatId = chatId;
			this.incomingCounterState = incomingCounterState;
			this.previousMessageId = previousMessageId;
			this.messageId = messageId;
			this.templateId = templateId;
		}

		/**
		 *
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

		getType()
		{
			return PendingOperationType.newParticipantPullMessage;
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
		 *
		 * @param {ChatCounterRepository} repository
		 * @return {Array<NewMessageAfterLocalReadStrategy>}
		 */
		#getResolvingStrategies(repository)
		{
			const counterState = repository.getCounterState(this.chatId);

			return [
				new NewMessageAfterLocalReadStrategy({
					counterState,
					pendingOperations: repository.getPendingOperationList(this.chatId),
					newMessagePendingOperation: this.#createPendingOperation(),
				}),
				new ServerWinStrategy({
					counterState,
					incomingCounterData: this.incomingCounterState,
				}),
			];
		}

		/**
		 * @return {PendingOperation<NewParticipantPullMessage>}
		 */
		#createPendingOperation()
		{
			return {
				type: this.getType(),
				chatId: this.chatId,
				actionUuid: this.templateId,
				timestamp: Date.now(),
				data: {
					incomingCounterState: this.incomingCounterState,
					messageId: this.messageId,
					previousMessageId: this.previousMessageId,
				},
			};
		}
	}

	module.exports = { NewParticipantPullMessageAction };

});
