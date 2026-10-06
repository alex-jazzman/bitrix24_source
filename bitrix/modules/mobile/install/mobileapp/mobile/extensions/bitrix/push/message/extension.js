/**
 * @module push/message
 */
jn.define('push/message', (require, exports, module) => {
	const { ApplicationMessage } = require('push/message/src/application');
	const { DeviceMessage } = require('push/message/src/device');

	module.exports = {
		ApplicationMessage,
		DeviceMessage,
	};
});
