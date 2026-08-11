/**
 * @module im/messenger/loc
 */
jn.define('im/messenger/loc', (require, exports, module) => {
	const { Loc: MobileLoc } = require('loc');
	const { Type } = require('type');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { featurePhrases } = require('im/messenger/loc/src/feature-phrases');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('loc', 'Loc');

	const IMMOBILE_COPILOT_BOT_NAME_KEY = 'IMMOBILE_COPILOT_BOT_NAME';
	const IMMOBILE_COPILOT_AGENT_NAME_KEY = 'IMMOBILE_COPILOT_AGENT_NAME';

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
			Loc.setCopilotAgentNameMessage();
			Loc.setNavigationTabTitles();
			Loc.applyFeaturePhrases();
		}

		static applyFeaturePhrases()
		{
			for (const { isFeatureEnabled, phrases } of featurePhrases)
			{
				if (isFeatureEnabled())
				{
					continue;
				}

				for (const [newPhraseCode, legacyPhraseCode] of Object.entries(phrases))
				{
					const legacyValue = Loc.getMessage(legacyPhraseCode);
					if (!legacyValue || legacyValue === legacyPhraseCode)
					{
						logger.error(`applyFeaturePhrases: missing legacy "${legacyPhraseCode}" for "${newPhraseCode}"`);
						continue;
					}
					Loc.setMessage(newPhraseCode, legacyValue);
				}
			}
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
		 * @private
		 */
		static setCopilotAgentNameMessage()
		{
			Loc.setMessage(IMMOBILE_COPILOT_AGENT_NAME_KEY, MessengerParams.getCopilotAgentName());
		}

		/**
		 * @private
		 */
		static setNavigationTabTitles()
		{
			/** @type {Object<string, string>} */
			const { NAVIGATION_TAB_TITLES: titles = {} } = MessengerParams.get('MESSAGES', {});
			for (const [tabId, title] of Object.entries(titles))
			{
				Loc.setMessage(`IMMOBILE_NAVIGATION_TAB_TITLE_${tabId.toUpperCase()}`, title);
			}
		}

		/**
		 * @param {string} tabId
		 * @return {?string}
		 */
		static getNavigationTabTitle(tabId)
		{
			return Loc.getMessage(`IMMOBILE_NAVIGATION_TAB_TITLE_${tabId.toUpperCase()}`);
		}

		/**
		 * @return {string[]}
		 */
		static getCopilotSuggests()
		{
			const { COPILOT_SUGGESTS: suggests = [] } = MessengerParams.get('MESSAGES', {});

			if (Type.isArray(suggests))
			{
				return suggests.filter((suggest) => Type.isStringFilled(suggest));
			}

			return [];
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

		/**
		 * @return {?string}
		 */
		static getCopilotAgentName()
		{
			return Loc.getMessage(IMMOBILE_COPILOT_AGENT_NAME_KEY);
		}
	}

	module.exports = { Loc };
});
