/**
 * @module im/messenger/lib/counters/update-system/action/read-message/server
 */
jn.define('im/messenger/lib/counters/update-system/action/read-message/server', (require, exports, module) => {
	const { ConfirmationReadMessageAction } = require('im/messenger/lib/counters/update-system/action/read-message/server/src/confirmation');
	const { ErrorReadMessageAction } = require('im/messenger/lib/counters/update-system/action/read-message/server/src/error');

	module.exports = {
		ConfirmationReadMessageAction,
		ErrorReadMessageAction,
	};
});
