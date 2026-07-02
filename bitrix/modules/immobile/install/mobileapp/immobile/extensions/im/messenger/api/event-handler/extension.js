/**
 * @module im/messenger/api/event-handler
 */
jn.define('im/messenger/api/event-handler', (require, exports, module) => {
	const { navigationHandler } = require('im/messenger/api/event-handler/navigation');
	const { dialogHandler } = require('im/messenger/api/event-handler/dialog');

	module.exports = {
		navigationHandler,
		dialogHandler,
	};
});
