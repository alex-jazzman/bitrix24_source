/**
 * @module im/messenger/lib/counters/update-system/conflict/strategy/src/read-confirmation/only-local-read
 */
jn.define('im/messenger/lib/counters/update-system/conflict/strategy/src/read-confirmation/only-local-read', (require, exports, module) => {
	const { Type } = require('type');
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { BaseStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/base');

	/**
	 * @desc The strategy assumes that there are several local reads, with no other operations,
	 * and a response has arrived from the server.
	 * @example LocalRead1 -> LocalRead2 -> ServerResponse1 -> ServerResponse2
	 * confirmationData is one of the ServerResponse
	 * @class OnlyLocalReadOperationStrategy
	 */
	class ConfirmationOnlyLocalReadOperationStrategy extends BaseStrategy
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
			return Type.isArrayFilled(this.pendingOperations)
				&& this.#hasOnlyLocalReadMessages()
			;
		}

		/**
		 * @return {{counterState: CounterModelState, pendingOperations: Array<PendingOperation>}}
		 */
		resolve()
		{
			const filteredOperations = this.pendingOperations
				.filter((operation) => operation.actionUuid !== this.confirmationData.actionUuid);

			if (filteredOperations.length === 0)
			{
				// Last confirmation -- trust the server counter entirely
				return {
					pendingOperations: [],
					counterState: {
						...this.counterState,
						counter: this.confirmationData.counter,
					},
				};
			}

			// Not the last confirmation -- recalculate based on server counter
			// and subtract remaining pending read deltas
			let finalCounter = this.confirmationData.counter;
			for (const operation of filteredOperations)
			{
				finalCounter = Math.max(0, finalCounter - operation.data.delta);
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
		 * @return {boolean}
		 */
		#hasOnlyLocalReadMessages()
		{
			return this.pendingOperations
				.every((operation) => PendingOperationType.localReadMessage === operation.type)
			;
		}
	}

	module.exports = { ConfirmationOnlyLocalReadOperationStrategy };
});
