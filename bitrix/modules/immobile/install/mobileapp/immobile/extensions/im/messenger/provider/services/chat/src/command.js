/**
 * @module im/messenger/provider/services/chat/command
 */
jn.define('im/messenger/provider/services/chat/command', (require, exports, module) => {
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');

	/**
	 * @class ChatCommandService
	 */
	class ChatCommandService
	{
		/**
		 * Fetch the raw bot-command list for a chat.
		 * The response is not parsed here - the raw body goes straight to the provider.
		 *
		 * @param {DialogId} dialogId
		 * @return {Promise<{commands: object[], users: object}>}
		 */
		getListByChat(dialogId)
		{
			return runAction(RestMethod.imV2ChatCommandList, {
				data: {
					dialogId,
				},
			});
		}
	}

	module.exports = { ChatCommandService };
});
