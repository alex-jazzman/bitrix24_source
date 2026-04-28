/**
 * @module im/messenger/lib/counters/update-system/action/new-message/pull
 */
jn.define('im/messenger/lib/counters/update-system/action/new-message/pull', (require, exports, module) => {
	const { NewOwnPullMessageAction } = require('im/messenger/lib/counters/update-system/action/new-message/pull/src/own-message');
	const { NewParticipantPullMessageAction } = require('im/messenger/lib/counters/update-system/action/new-message/pull/src/participant-message');

	module.exports = {
		NewOwnPullMessageAction,
		NewParticipantPullMessageAction,
	};
});
