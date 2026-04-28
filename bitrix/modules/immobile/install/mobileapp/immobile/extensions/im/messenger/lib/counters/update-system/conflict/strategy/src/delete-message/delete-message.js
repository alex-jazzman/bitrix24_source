/**
 * @module im/messenger/lib/counters/update-system/conflict/strategy/src/delete-message/delete-message
 */
jn.define('im/messenger/lib/counters/update-system/conflict/strategy/src/delete-message/delete-message', (require, exports, module) => {
	const { Type } = require('type');
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { BaseStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/base');

	/**
	 * @desc Strategy to resolve conflict when messages are deleted while there are pending operations.
	 * Handles localReadMessage and newMessage operations (newMessage can only exist alongside localRead in pending).
	 * @class DeleteMessageStrategy
	 */
	class DeleteMessageStrategy extends BaseStrategy
	{
		/**
		 * @param {CounterModelState} counterState
		 * @param {CounterModelState} incomingCounterState
		 * @param {Array<number>} deletedMessageIds
		 * @param {Array<PendingOperation>} pendingOperations
		 */
		constructor({
			counterState,
			incomingCounterState,
			deletedMessageIds,
			pendingOperations,
		})
		{
			super();
			this.counterState = counterState;
			this.incomingCounterState = incomingCounterState;
			this.deletedMessageIds = new Set(deletedMessageIds);
			this.pendingOperations = pendingOperations;
		}

		canResolve()
		{
			return Type.isArrayFilled(this.pendingOperations)
				&& this.pendingOperations.some((operation) => {
					return operation.type === PendingOperationType.localReadMessage;
				});
		}

		/**
		 * @return {{counterState: CounterModelState, pendingOperations: Array<PendingOperation>}}
		 */
		resolve()
		{
			const adjustedPendingOperations = this.pendingOperations.map((operation) => {
				if (operation.type === PendingOperationType.localReadMessage)
				{
					return this.#adjustLocalReadOperation(operation);
				}

				if (
					operation.type === PendingOperationType.newParticipantPullMessage
					|| operation.type === PendingOperationType.newOwnPullMessage
				)
				{
					const messageId = operation.data.messageId;
					if (this.deletedMessageIds.has(messageId))
					{
						// Remove this operation - the new message was deleted
						return null;
					}
				}

				return operation;
			}).filter((operation) => operation !== null);

			let finalCounter = this.incomingCounterState.counter;

			for (const operation of adjustedPendingOperations)
			{
				if (operation.type === PendingOperationType.localReadMessage)
				{
					finalCounter = Math.max(0, finalCounter - operation.data.delta);
				}
			}

			return {
				counterState: {
					...this.incomingCounterState,
					counter: finalCounter,
				},
				pendingOperations: adjustedPendingOperations,
			};
		}

		/**
		 * Adjust localReadMessage operation by removing deleted messages
		 * @param {PendingOperation<LocalReadMessage>} operation
		 * @return {PendingOperation<LocalReadMessage>|null}
		 */
		#adjustLocalReadOperation(operation)
		{
			const adjustedMessageIdList = operation.data.messageIdList
				.filter((messageId) => !this.deletedMessageIds.has(messageId))
			;
			// If all messages in this operation were deleted, mark it for removal
			if (adjustedMessageIdList.length === 0)
			{
				return null;
			}

			// Remove deleted messages from unreadMessages
			const adjustedUnreadMessages = operation.data.unreadMessages
				.filter((messageId) => !this.deletedMessageIds.has(messageId))
			;

			// Recalculate delta
			const deletedUnreadCount = operation.data.unreadMessages.length - adjustedUnreadMessages.length;
			const adjustedDelta = operation.data.delta - deletedUnreadCount;

			return {
				...operation,
				data: {
					...operation.data,
					messageIdList: adjustedMessageIdList,
					unreadMessages: adjustedUnreadMessages,
					delta: adjustedDelta,
					expectedCounter: Math.max(0, operation.data.expectedCounter - deletedUnreadCount),
				},
			};
		}
	}

	module.exports = { DeleteMessageStrategy };
});
