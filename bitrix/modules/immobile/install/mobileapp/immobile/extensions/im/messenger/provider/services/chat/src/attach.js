/**
 * @module im/messenger/provider/services/chat/attach
 */
jn.define('im/messenger/provider/services/chat/attach', (require, exports, module) => {
	const { RestMethod } = require('im/messenger/const/rest');
	const { runAction } = require('im/messenger/lib/rest');
	const { LoggerManager } = require('im/messenger/lib/logger');

	const logger = LoggerManager.getInstance().getLogger('attach-service--chat');

	/**
	 * @class AttachService
	 */
	class AttachService
	{
		/**
		 * @param {number} chatId
		 * @param {number} parentChatId
		 * @return {Promise<{result: true}>}
		 */
		attachToParent(chatId, parentChatId)
		{
			logger.log(`${this.constructor.name}.attachToParent`, { chatId, parentChatId });

			if (!Number.isInteger(chatId) || chatId <= 0
				|| !Number.isInteger(parentChatId) || parentChatId <= 0)
			{
				return Promise.reject(new Error('AttachService.attachToParent: chatId and parentChatId must be positive integers'));
			}

			return runAction(RestMethod.imV2ChatAttachToParent, {
				data: {
					chatId,
					parentChatId,
				},
			});
		}

		/**
		 * @param {number} chatId
		 * @return {Promise<{result: true}>}
		 */
		detachFromParent(chatId)
		{
			logger.log(`${this.constructor.name}.detachFromParent`, { chatId });

			if (!Number.isInteger(chatId) || chatId <= 0)
			{
				return Promise.reject(new Error('AttachService.detachFromParent: chatId must be a positive integer'));
			}

			return runAction(RestMethod.imV2ChatDetachFromParent, {
				data: {
					chatId,
				},
			});
		}
	}

	module.exports = { AttachService };
});
