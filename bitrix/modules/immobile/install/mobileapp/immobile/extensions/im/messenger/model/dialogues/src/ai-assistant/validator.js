/**
 * @module im/messenger/model/dialogues/ai-assistant/validator
 */

jn.define('im/messenger/model/dialogues/ai-assistant/validator', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @param {AiAssistantNotifyPanelModelState} fields
	 */
	function validateNotifyPanel(fields)
	{
		const result = {};

		if (Type.isBoolean(fields.isClosedNotifyPanel))
		{
			result.isClosedNotifyPanel = fields.isClosedNotifyPanel;
		}

		return result;
	}

	/**
	 * @param {AiAssistantMCPModelState} fields
	 */
	function validateMCP(fields)
	{
		const result = {};

		if (Type.isInteger(fields.selectedAuthId))
		{
			result.selectedAuthId = fields.selectedAuthId;
		}

		if (Type.isStringFilled(fields.name))
		{
			result.name = fields.name;
		}

		if (Type.isStringFilled(fields.iconUrl))
		{
			result.iconUrl = fields.iconUrl;
		}

		return result;
	}

	module.exports = {
		validateNotifyPanel,
		validateMCP,
	};
});
