/**
 * @module im/messenger/controller/attach-chat/flow
 */
jn.define('im/messenger/controller/attach-chat/flow', (require, exports, module) => {
	const { ConfirmWidget } = require('im/messenger/controller/attach-chat/flow/src/confirm-widget');
	const {
		runAttachFlow,
		runDetachFlow,
		runAttachFromProject,
		resolveErrorText,
	} = require('im/messenger/controller/attach-chat/flow/src/workflow');

	module.exports = {
		ConfirmWidget,
		runAttachFlow,
		runDetachFlow,
		runAttachFromProject,
		resolveErrorText,
	};
});
