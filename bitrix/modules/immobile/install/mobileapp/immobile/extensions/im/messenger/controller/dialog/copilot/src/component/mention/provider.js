/**
 * @module im/messenger/controller/dialog/copilot/component/mention/provider
 */
jn.define('im/messenger/controller/dialog/copilot/component/mention/provider', (require, exports, module) => {
	const { MentionProvider } = require('im/messenger/controller/dialog/lib/mention/provider');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { BotCode } = require('im/messenger/const');

	class CopilotMentionProvider extends MentionProvider
	{
		/**
		 * @override
		 * @param {RawUser} user
		 * @return {boolean}
		 */
		filterChatParticipant(user)
		{
			const isCopilot = user.bot && user.botData?.code === BotCode.copilot;

			return (Number(user.id) !== MessengerParams.getUserId()) && !isCopilot;
		}

		/**
		 * @param {number} chatId
		 */
		setOptionConfig(chatId)
		{
			this.config.setOption({ exclude: ['chats', 'bots'], contextChatId: chatId });
		}
	}

	module.exports = { CopilotMentionProvider };
});
