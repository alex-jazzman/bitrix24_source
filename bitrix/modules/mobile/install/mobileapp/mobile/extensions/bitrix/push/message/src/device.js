/**
 * @module push/message/src/device
 */
jn.define('push/message/src/device', (require, exports, module) => {
	const { BaseMessage } = require('push/message/src/base');

	/**
	 * @class DeviceMessage
	 */
	class DeviceMessage extends BaseMessage
	{}

	module.exports = {
		DeviceMessage,
	};
});
