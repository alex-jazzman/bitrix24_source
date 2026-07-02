/**
 * @module im/messenger/controller/messenger-header
 */
jn.define('im/messenger/controller/messenger-header', (require, exports, module) => {
	const { MessengerHeaderController } = require('im/messenger/controller/messenger-header/src/controller');
	const { MessengerHeaderManager } = require('im/messenger/controller/messenger-header/src/manager');

	module.exports = { MessengerHeaderController, MessengerHeaderManager };
});
