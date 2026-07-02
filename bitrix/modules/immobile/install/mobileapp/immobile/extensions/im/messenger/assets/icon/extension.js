/**
 * @module im/messenger/assets/icon
 */
jn.define('im/messenger/assets/icon', (require, exports, module) => {
	const { MessengerIcon, IconType } = require('im/messenger/assets/icon/src/messenger-icon');
	const { MessengerIconLoader } = require('im/messenger/assets/icon/src/messenger-icon-loader');

	module.exports = { MessengerIcon, MessengerIconLoader, IconType };
});
