/**
 * @module im/messenger/controller/dialog/lib/message-menu
 */
jn.define('im/messenger/controller/dialog/lib/message-menu', (require, exports, module) => {
	const { MessageMenuController } = require('im/messenger/controller/dialog/lib/message-menu/controller');
	const { MessageMenu } = require('im/messenger/controller/dialog/lib/message-menu/menu');

	module.exports = {
		MessageMenuController,
		MessageMenu,
	};
});
