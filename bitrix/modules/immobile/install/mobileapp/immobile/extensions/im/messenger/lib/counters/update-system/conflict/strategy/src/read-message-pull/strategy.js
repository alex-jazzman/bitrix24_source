/**
 * @module im/messenger/lib/counters/update-system/conflict/strategy/src/read-message-pull/strategy
 */
jn.define('im/messenger/lib/counters/update-system/conflict/strategy/src/read-message-pull/strategy', (require, exports, module) => {
	const { Type } = require('type');
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { BaseStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/base');

	/**
	 * @desc Strategy for resolving conflicts when read event comes from PULL with unregistered actionUuid.
	 * Uses lastReadId to filter obsolete pending operations.
	 * @class ReadMessagePullStrategy
	 */
	class ReadMessagePullStrategy extends BaseStrategy
	{
		/**
		 * @param {CounterModelState} counterState
		 * @param {CounterModelState} incomingCounterState
		 * @param {number} lastReadId - Last read message ID from server
		 * @param {Array<PendingOperation>} pendingOperations
		 */
		constructor({ counterState, incomingCounterState, lastReadId, pendingOperations })
		{
			super();
			this.counterState = counterState;
			this.incomingCounterState = incomingCounterState;
			this.lastReadId = lastReadId;
			this.pendingOperations = pendingOperations;
		}

		canResolve()
		{
			return Type.isArrayFilled(this.pendingOperations);
		}

		/**
		 * @return {{counterState: CounterModelState, pendingOperations: Array<PendingOperation>}}
		 */
		resolve()
		{
			// Filter pending operations based on lastReadId
			const filteredOperations = this.pendingOperations.filter((operation) => {
				// Check localReadMessage - remove if all messages <= lastReadId
				if (operation.type === PendingOperationType.localReadMessage)
				{
					// Keep only if there are messages that haven't been read on server yet
					return operation.data.messageIdList.some((messageId) => messageId > this.lastReadId);
				}

				// Check newMessage - remove if messageId <= lastReadId (already read on server)
				if (
					operation.type === PendingOperationType.newParticipantPullMessage
				|| operation.type === PendingOperationType.newOwnPullMessage
				)
				{
					const messageId = operation.data.messageId;

					return messageId > this.lastReadId;
				}

				return true;
			});

			let finalCounter = this.incomingCounterState.counter;

			// Only newParticipantPullMessage increases counter, newOwnPullMessage doesn't
			const newMessageCount = filteredOperations.filter((operation) => {
				return operation.type === PendingOperationType.newParticipantPullMessage;
			}).length;

			finalCounter += newMessageCount;

			return {
				counterState: {
					...this.incomingCounterState,
					counter: finalCounter,
				},
				pendingOperations: filteredOperations,
			};
		}
	}

	module.exports = { ReadMessagePullStrategy };
});
