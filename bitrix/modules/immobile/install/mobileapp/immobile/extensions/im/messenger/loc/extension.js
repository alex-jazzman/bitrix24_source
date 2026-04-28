/**
 * @module im/messenger/loc
 */
jn.define('im/messenger/loc', (require, exports, module) => {
	const { Loc: MobileLoc } = require('loc');
	const { MessengerParams } = require('im/messenger/lib/params');

	const IMMOBILE_COPILOT_BOT_NAME_KEY = 'IMMOBILE_COPILOT_BOT_NAME';

	/**
	 * @class Loc
	 */
	class Loc extends MobileLoc
	{
		/**
		 * @desc It must be called before initializing the messenger
		 */
		static initMessages()
		{
			Loc.setAiAssistantStatusMessages();
			Loc.setCopilotBotNameMessage();
		}

		/**
		 * @private
		 */
		static setAiAssistantStatusMessages()
		{
			const configMessages = MessengerParams.get('MESSAGES', {});
			if ('AI_ASSISTANT' in configMessages)
			{
				Object.entries(configMessages.AI_ASSISTANT).forEach(([code, phase]) => {
					Loc.setMessage(code, phase);
				});
			}
		}

		/**
		 * @private
		 */
		static setCopilotBotNameMessage()
		{
			Loc.setMessage(IMMOBILE_COPILOT_BOT_NAME_KEY, MessengerParams.getCopilotBotName());
		}

		/**
		 * @param {string} messageId
		 * @param {object?} replacements
		 * @return {?string}
		 */
		static getMessageWithCopilotBotName(messageId, replacements = {})
		{
			return Loc.getMessage(messageId, {
				...replacements,
				'#COPILOT_NAME#': Loc.getMessage(IMMOBILE_COPILOT_BOT_NAME_KEY),
			});
		}
	}

	module.exports = { Loc };
});
