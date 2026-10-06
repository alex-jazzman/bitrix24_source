/**
 * @module push/message/src/application
 */
jn.define('push/message/src/application', (require, exports, module) => {
	const { BaseMessage } = require('push/message/src/base');

	/**
	 * @class ApplicationMessage
	 */
	class ApplicationMessage extends BaseMessage
	{}

	module.exports = {
		ApplicationMessage,
	};
});
