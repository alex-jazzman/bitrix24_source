/**
 * @module im/messenger/provider/pull/message
 */
jn.define('im/messenger/provider/pull/message', (require, exports, module) => {
	const { MessagePullHandler } = require('im/messenger/provider/pull/message/handler');

	module.exports = { MessagePullHandler };
});
