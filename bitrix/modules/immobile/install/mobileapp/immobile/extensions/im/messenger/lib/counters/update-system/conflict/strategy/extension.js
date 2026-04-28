/**
 * @module im/messenger/lib/counters/update-system/conflict/strategy
 */
jn.define('im/messenger/lib/counters/update-system/conflict/strategy', (require, exports, module) => {
	const { ServerWinStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/server-win');
	const { ConfirmationOnlyLocalReadOperationStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/read-confirmation/only-local-read');
	const { ConfirmationWithNewMessageStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/read-confirmation/with-new-message');
	const { NewMessageAfterLocalReadStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/new-message/after-local-read');
	const { DeleteMessageStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/delete-message/delete-message');
	const { ConfirmationWithMixedOperationsStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/read-confirmation/with-mixed-operations');
	const { ReadMessagePullStrategy } = require('im/messenger/lib/counters/update-system/conflict/strategy/src/read-message-pull/strategy');

	module.exports = {
		ServerWinStrategy,
		ConfirmationOnlyLocalReadOperationStrategy,
		ConfirmationWithNewMessageStrategy,
		ConfirmationWithMixedOperationsStrategy,

		NewMessageAfterLocalReadStrategy,

		DeleteMessageStrategy,

		ReadMessagePullStrategy,
	};
});
