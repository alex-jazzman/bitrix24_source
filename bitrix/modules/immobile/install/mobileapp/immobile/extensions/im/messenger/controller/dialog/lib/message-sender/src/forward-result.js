/**
 * @module im/messenger/controller/dialog/lib/message-sender/src/forward-result
 */
jn.define('im/messenger/controller/dialog/lib/message-sender/src/forward-result', (require, exports, module) => {
	const getFailedForwardMessages = (forwardingMessages = [], failureMap = {}) => {
		const failures = failureMap ?? {};

		return forwardingMessages
			.filter(({ templateId }) => Object.prototype.hasOwnProperty.call(failures, templateId))
			.map(({ templateId }) => ({
				templateId,
				code: failures[templateId],
			}))
		;
	};

	module.exports = { getFailedForwardMessages };
});
