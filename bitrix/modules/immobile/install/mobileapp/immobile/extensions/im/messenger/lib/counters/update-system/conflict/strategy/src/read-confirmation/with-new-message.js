/**
 * @module im/messenger/lib/counters/update-system/conflict/strategy/src/read-confirmation/with-new-message
 */
jn.define('im/messenger/lib/counters/update-system/conflict/strategy/src/read-confirmation/with-new-message', (require, exports, module) => {
	const { Type } = require('type');
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { BaseStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/base');

	/**
	 * @class ConfirmationWithNewMessageStrategy
	 */
	class ConfirmationWithNewMessageStrategy extends BaseStrategy
	{
		/**
		 *
		 * @param {{chatId, actionUuid, lastReadId, counter}} confirmationData
		 * @param {Array<PendingOperation>} pendingOperations
		 * @param {CounterModelState} counterState
		 */
		constructor({
			confirmationData,
			pendingOperations,
			counterState,
		})
		{
			super();

			this.confirmationData = confirmationData;
			this.pendingOperations = pendingOperations;
			this.counterState = counterState;
		}

		canResolve()
		{
			if (!Type.isArrayFilled(this.pendingOperations))
			{
				return false;
			}

			const lastType = this.#getLastOperation().type;

			return lastType === PendingOperationType.newParticipantPullMessage
				|| lastType === PendingOperationType.newOwnPullMessage
			;
		}

		/**
	 * @return {{counterState: CounterModelState, pendingOperations: Array<PendingOperation>}}
	 */
		resolve()
		{
			const filteredOperations = this.pendingOperations.filter((operation) => {
				if (operation.actionUuid === this.confirmationData.actionUuid)
				{
					return false;
				}

				// Remove ALL new messages - server counter already includes them
				if (
					operation.type === PendingOperationType.newParticipantPullMessage
					|| operation.type === PendingOperationType.newOwnPullMessage
				)
				{
					return false;
				}

				return true;
			});

			let finalCounter = this.confirmationData.counter;
			for (const operation of filteredOperations)
			{
				if (operation.type === PendingOperationType.localReadMessage)
				{
					finalCounter = Math.max(0, finalCounter - operation.data.delta);
				}
			}

			return {
				counterState: {
					...this.counterState,
					counter: finalCounter,
				},
				pendingOperations: filteredOperations,
			};
		}

		/**
		 * @return {PendingOperation}
		 */
		#getLastOperation()
		{
			return this.pendingOperations[this.pendingOperations.length - 1];
		}
	}

	module.exports = { ConfirmationWithNewMessageStrategy };
});
