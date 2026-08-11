/**
 * @module im/messenger/controller/dialog/lib/optimistic-chat-manager/assistant-button-manager
 */
jn.define('im/messenger/controller/dialog/lib/optimistic-chat-manager/assistant-button-manager', (require, exports, module) => {
	const { DialogWidgetType } = require('im/messenger/const');
	const {
		ReasoningButton,
		ModeMenuButton,
		MCPButton,
		SearchModeButton,
		AgentButton,
	} = require('im/messenger/controller/dialog/lib/assistant-button-manager');
	const { Feature } = require('im/messenger/lib/feature');

	/**
	 * @class OptimisticAssistantButtonManager
	 */
	class OptimisticAssistantButtonManager
	{
		/**
		 * @param {string} dialogType
		 * @returns {AssistantButton[]}
		 */
		static buildButtons(dialogType)
		{
			if (!Feature.isBitrixGptV2Enabled)
			{
				return OptimisticAssistantButtonManager.#buildLegacyButtons(dialogType);
			}

			const buttons = [];

			if (dialogType === DialogWidgetType.copilot)
			{
				buttons.push({ ...ModeMenuButton });

				if (Feature.isCopilotMCPButtonAvailable)
				{
					buttons.push({ ...MCPButton });
				}

				if (Feature.isSearchModeButtonAvailable)
				{
					buttons.push({ ...SearchModeButton });
				}

				if (Feature.isAgentButtonAvailable)
				{
					buttons.push({ ...AgentButton });
				}
			}

			if (dialogType === DialogWidgetType.aiAssistant && Feature.isAiAssistantMCPSelectorAvailable)
			{
				buttons.push({ ...MCPButton });
			}

			return buttons;
		}

		/**
		 * @param {string} dialogType
		 * @returns {AssistantButton[]}
		 */
		static #buildLegacyButtons(dialogType)
		{
			const buttons = [];

			if (dialogType === DialogWidgetType.copilot && Feature.isCopilotReasoningAvailable)
			{
				buttons.push({ ...ReasoningButton });
			}

			if (dialogType === DialogWidgetType.aiAssistant && Feature.isAiAssistantMCPSelectorAvailable)
			{
				buttons.push({ ...MCPButton });
			}

			return buttons;
		}
	}

	module.exports = { OptimisticAssistantButtonManager };
});
