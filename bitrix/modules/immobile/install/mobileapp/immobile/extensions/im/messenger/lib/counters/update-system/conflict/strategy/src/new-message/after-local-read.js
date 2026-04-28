/**
 * @module im/messenger/lib/counters/update-system/conflict/strategy/src/new-message/after-local-read
 */
jn.define('im/messenger/lib/counters/update-system/conflict/strategy/src/new-message/after-local-read', (require, exports, module) => {
	const { Type } = require('type');
	const { COUNTER_OVERFLOW_LIMIT } = require('im/messenger/const');
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { BaseStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/base');

	/**
	 * @desc
	 * @class AfterLocalReadStrategy
	 */
	class NewMessageAfterLocalReadStrategy extends BaseStrategy
	{
		/**
		 * @param {CounterModelState} counterState
		 * @param {PendingOperation<NewParticipantPullMessage>} newMessagePendingOperation
		 * @param {Array<PendingOperation>} pendingOperations
		 *
		 */
		constructor({
			counterState,
			newMessagePendingOperation,
			pendingOperations,
		})
		{
			super();
			this.counterState = counterState;
			this.newMessagePendingOperation = newMessagePendingOperation;
			this.pendingOperations = pendingOperations;
		}

		/**
		 * @return {boolean}
		 */
		canResolve()
		{
			return Type.isArrayFilled(this.pendingOperations)
				&& this.pendingOperations.some((operation) => operation.type === PendingOperationType.localReadMessage)
			;
		}

		/**
		 * @return {{counterState: CounterModelState, pendingOperations: Array<PendingOperation>}}
		 */
		resolve()
		{
			return {
				counterState: {
					...this.counterState,
					...this.newMessagePendingOperation.data.incomingCounterState,
					counter: this.#getNewCounter(),
				},
				pendingOperations: [...this.pendingOperations, this.newMessagePendingOperation],
			};
		}

		/**
		 * @return {number}
		 */
		#getNewCounter()
		{
			return this.counterState.counter + 1 < COUNTER_OVERFLOW_LIMIT
				? this.counterState.counter + 1
				: COUNTER_OVERFLOW_LIMIT
			;
		}
	}

	module.exports = { NewMessageAfterLocalReadStrategy };
});
