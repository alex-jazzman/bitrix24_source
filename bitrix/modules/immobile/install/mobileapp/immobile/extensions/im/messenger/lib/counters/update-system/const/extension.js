/**
 * @module im/messenger/lib/counters/update-system/const
 */
jn.define('im/messenger/lib/counters/update-system/const', (require, exports, module) => {
	const PendingOperationType = {
		counterMap: 'counterMap',
		localReadMessage: 'localReadMessage',
		confirmationReadMessage: 'confirmationReadMessage',
		errorReadMessageAction: 'errorReadMessage',
		newOwnPullMessage: 'newOwnPullMessage',
		newParticipantPullMessage: 'newParticipantPullMessage',
		deleteMessagePull: 'deleteMessagePull',
		readMessagePull: 'readMessagePull',
	};

	module.exports = { PendingOperationType };
});
