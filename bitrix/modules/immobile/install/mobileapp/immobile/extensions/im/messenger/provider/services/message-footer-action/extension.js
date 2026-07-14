/**
 * @module im/messenger/provider/services/message-footer-action
 */
jn.define('im/messenger/provider/services/message-footer-action', (require, exports, module) => {
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');

	/**
	 * @class MessageFooterActionService
	 */
	class MessageFooterActionService
	{
		/**
		 * @param {string} messageId
		 * @param {'like'|'dislike'} value
		 * @return {Promise}
		 */
		sendVote(messageId, value)
		{
			return runAction(RestMethod.imV2ChatMessageVoteSend, {
				data: {
					messageId: Number(messageId),
					value,
				},
			});
		}

		/**
		 * @param {string} messageId
		 * @return {Promise}
		 */
		sendRegenerate(messageId)
		{
			return runAction(RestMethod.imV2CopilotMessageRegenerate, {
				data: {
					messageId: Number(messageId),
				},
			});
		}
	}

	module.exports = { MessageFooterActionService };
});
