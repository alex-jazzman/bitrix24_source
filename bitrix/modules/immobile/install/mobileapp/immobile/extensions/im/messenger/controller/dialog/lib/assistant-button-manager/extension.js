/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager', (require, exports, module) => {
	const { Feature } = require('im/messenger/lib/feature');
	const {
		ReasoningButton,
		ModeMenuButton,
		MCPButton,
		SearchModeButton,
		AgentButton,
	} = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons');
	const {
		AssistantButtonType,
		AssistantButtonDesign,
		AssistantButtonSize,
		AssistantButtonMode,
	} = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/type');

	if (!Feature.isBitrixGptV2Enabled)
	{
		const { LegacyAssistantButtonManager } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/legacy');
		module.exports = {
			AssistantButtonManager: LegacyAssistantButtonManager,
			ReasoningButton,
			MCPButton,
			AssistantButtonType,
			AssistantButtonDesign,
			AssistantButtonSize,
			AssistantButtonMode,
		};

		return;
	}

	const { EventType } = require('im/messenger/const');
	const { ModeMenuManager } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/mode-menu');
	const { MCPManager } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/mcp');
	const { SearchModeManager } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/search-mode');
	const { AgentManager } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/agent');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class AssistantButtonManager
	 */
	class AssistantButtonManager
	{
		/** @type {ModeMenuManager} */
		#modeMenuManager;

		/** @type {MCPManager} */
		#mcpManager;

		/** @type {SearchModeManager} */
		#searchModeManager;

		/** @type {AgentManager} */
		#agentManager;

		/**
		 * @param {DialogLocator} dialogLocator
		 */
		constructor({ dialogLocator })
		{
			this.dialogLocator = dialogLocator;
			this.dialogId = dialogLocator.get('dialogId');
			this.view = this.dialogLocator.get('view');

			const onActiveStateChange = () => this.#syncButtonCollapse();
			const subManagerParams = { dialogLocator, onActiveStateChange };
			this.#modeMenuManager = new ModeMenuManager(subManagerParams);
			this.#mcpManager = new MCPManager(subManagerParams);
			this.#searchModeManager = new SearchModeManager(subManagerParams);
			this.#agentManager = new AgentManager(subManagerParams);
		}

		get isReasoningActive()
		{
			return this.#modeMenuManager.isReasoningActive;
		}

		/**
		 * @returns {number|null}
		 */
		get mcpSelectedAuthId()
		{
			return this.#mcpManager.selectedAuthId;
		}

		subscribeViewEvents()
		{
			this.view.textField.on(EventType.dialog.textField.assistantButtonTap, this.#assistantButtonTapHandler);
		}

		unsubscribeViewEvents()
		{
			this.view.textField.off(EventType.dialog.textField.assistantButtonTap, this.#assistantButtonTapHandler);
		}

		subscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.on('dialoguesModel/copilotModel/update', this.#modeMenuManager.handleAssistantButtonUpdate)
				.on('dialoguesModel/copilotModel/updateCollection', this.#modeMenuManager.handleAssistantButtonUpdate)
			;
		}

		unsubscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.off('dialoguesModel/copilotModel/update', this.#modeMenuManager.handleAssistantButtonUpdate)
				.off('dialoguesModel/copilotModel/updateCollection', this.#modeMenuManager.handleAssistantButtonUpdate)
			;
		}

		/**
		 * @returns {boolean}
		 */
		#hasAnyActiveButton()
		{
			const subManagers = [
				this.#modeMenuManager,
				this.#mcpManager,
				this.#searchModeManager,
				this.#agentManager,
			];

			return subManagers.some((manager) => manager.isActive);
		}

		#syncButtonCollapse()
		{
			const hasAnyActive = this.#hasAnyActiveButton();

			if (!this.#searchModeManager.isActive)
			{
				const text = hasAnyActive ? '' : SearchModeButton.text;
				void this.view.textField.updateAssistantButton(AssistantButtonType.search, { ...SearchModeButton, text });
			}

			if (!this.#agentManager.isActive)
			{
				const text = hasAnyActive ? '' : AgentButton.text;
				void this.view.textField.updateAssistantButton(AssistantButtonType.agent, { ...AgentButton, text });
			}
		}

		#assistantButtonTapHandler = (buttonId) => {
			switch (buttonId)
			{
				case AssistantButtonType.menu:
					void this.#modeMenuManager.menuButtonTapHandler();
					break;
				case AssistantButtonType.mcp:
					void this.#mcpManager.menuButtonTapHandler();
					break;
				case AssistantButtonType.search:
					this.#searchModeManager.menuButtonTapHandler();
					break;
				case AssistantButtonType.agent:
					void this.#agentManager.menuButtonTapHandler();
					break;
				default:
			}
		};
	}

	module.exports = {
		AssistantButtonManager,
		ModeMenuButton,
		MCPButton,
		SearchModeButton,
		AgentButton,
		AssistantButtonType,
		AssistantButtonDesign,
		AssistantButtonSize,
		AssistantButtonMode,
	};
});
