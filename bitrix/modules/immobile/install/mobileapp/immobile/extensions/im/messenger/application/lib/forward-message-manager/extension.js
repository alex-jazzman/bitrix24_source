/**
 * @module im/messenger/application/lib/forward-message-manager
 */
jn.define('im/messenger/application/lib/forward-message-manager', (require, exports, module) => {
	const { ForwardMessageManager } = require(
		'im/messenger/application/lib/forward-message-manager/src/forward-message-manager',
	);
	const { ForwardMessageOperation } = require(
		'im/messenger/application/lib/forward-message-manager/src/forward-message-operation',
	);
	const {
		ForwardResultMapper,
		ForwardDeliveryStatus,
		ForwardFailureGroup,
	} = require('im/messenger/application/lib/forward-message-manager/src/result-mapper');

	module.exports = {
		ForwardMessageManager,
		ForwardMessageOperation,
		ForwardResultMapper,
		ForwardDeliveryStatus,
		ForwardFailureGroup,
	};
});
