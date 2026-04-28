/**
 * @module im/messenger/lib/counters/update-system/conflict/strategy/src/read-confirmation/with-mixed-operations
 */
jn.define('im/messenger/lib/counters/update-system/conflict/strategy/src/read-confirmation/with-mixed-operations', (require, exports, module) => {
	const { Type } = require('type');
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { ConfirmationWithNewMessageStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/read-confirmation/with-new-message');

	/**
	 * @desc Universal strategy for read confirmation with mixed operations.
	 * Extends ConfirmationWithNewMessageStrategy (same resolve logic)
	 * but has a broader canResolve() that handles complex combinations:
	 * multiple localReadMessage, localReadMessage + newMessage.
	 * @class ConfirmationWithMixedOperationsStrategy
	 */
	class ConfirmationWithMixedOperationsStrategy extends ConfirmationWithNewMessageStrategy
	{
		canResolve()
		{
			const localReadOps = this.pendingOperations.filter(
				(op) => op.type === PendingOperationType.localReadMessage,
			);
			const hasNewMessage = this.pendingOperations.some(
				(op) => op.type === PendingOperationType.newParticipantPullMessage
					|| op.type === PendingOperationType.newOwnPullMessage,
			);

			// Handle complex cases:
			// 1. Multiple localReadMessage operations
			// 2. localReadMessage + newMessage
			return Type.isArrayFilled(this.pendingOperations)
			&& localReadOps.length > 0
			&& (localReadOps.length > 1 || hasNewMessage);
		}
	}

	module.exports = { ConfirmationWithMixedOperationsStrategy };
});
