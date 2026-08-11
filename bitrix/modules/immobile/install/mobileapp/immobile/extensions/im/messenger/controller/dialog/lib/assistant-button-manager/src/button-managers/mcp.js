/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/mcp
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/mcp', (require, exports, module) => {
	const { Type } = require('type');
	const { MCPSelector } = require('ai/mcp-selector');
	const { withCurrentDomain } = require('utils/url');

	const { DialogWidgetType } = require('im/messenger/const');
	const { MCPButton } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons');
	const { AssistantButtonType, AssistantButtonDesign } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/type');
	const { Feature } = require('im/messenger/lib/feature');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { ChatService } = require('im/messenger/provider/services/chat');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('dialog--mcp-manager');

	/**
	 * @class MCPManager
	 */
	class MCPManager
	{
		/** @type {DialogId} */
		#dialogId;

		/** @type {string} */
		#dialogType;

		/** @type {Object} */
		#view;

		/** @type {MCPSelector} */
		#mcpSelector;

		/** @type {number|null} */
		#selectedAuthId = null;

		/** @type {string|null} */
		#selectedAuthName = null;

		/** @type {(buttonType?: string, isActive?: boolean) => void} */
		#onActiveStateChange = () => {};

		/** @type {?AssistantButton} */
		#currentButton = null;

		/**
		 * @param {DialogLocator} dialogLocator
		 * @param {string} dialogType
		 * @param {(buttonType?: string, isActive?: boolean) => void} [onActiveStateChange]
		 */
		constructor({ dialogLocator, dialogType, onActiveStateChange })
		{
			this.#dialogId = dialogLocator.get('dialogId');
			this.#dialogType = dialogType;
			this.#view = dialogLocator.get('view');
			this.#onActiveStateChange = Type.isFunction(onActiveStateChange) ? onActiveStateChange : (() => {});
		}

		/**
		 * @returns {Promise<boolean>}
		 */
		async canShow()
		{
			if (this.#dialogType === DialogWidgetType.copilot)
			{
				return Feature.isCopilotMCPButtonAvailable;
			}

			if (this.#dialogType === DialogWidgetType.aiAssistant)
			{
				return Feature.isAiAssistantMCPSelectorAvailable;
			}

			return false;
		}

		/**
		 * @returns {AssistantButton}
		 */
		buildButton()
		{
			return { ...MCPButton };
		}

		/**
		 * @returns {AssistantButton}
		 */
		buildCurrentButton()
		{
			return this.#currentButton ?? this.buildButton();
		}

		/**
		 * @returns {boolean}
		 */
		get isActive()
		{
			return this.#selectedAuthId !== null;
		}

		/**
		 * @returns {number|null}
		 */
		get selectedAuthId()
		{
			return this.#selectedAuthId;
		}

		/**
		 * @returns {string|null}
		 */
		get selectedAuthName()
		{
			return this.#selectedAuthName;
		}

		/**
		 * @returns {DialogId}
		 */
		get dialogId()
		{
			return this.#dialogId;
		}

		async menuButtonTapHandler()
		{
			if (!this.#mcpSelector)
			{
				this.#mcpSelector = new MCPSelector({
					onSelect: this.#selectorSelectHandler,
				});
			}

			await this.#mcpSelector.open();

			AnalyticsService.getInstance().sendClickMCPIntegrations(this.dialogId);
		}

		/**
		 * @param {MCPServer} selectedServer
		 * @param {MCPAuth} selectedAuth
		 * @returns {Promise<void>}
		 */
		#selectorSelectHandler = async ({ selectedServer, selectedAuth }) => {
			logger.log(
				`${this.constructor.name}.#selectorSelectHandler, params: `,
				{ selectedServer, selectedAuth },
			);

			const hasSelected = Type.isObject(selectedAuth) && Type.isObject(selectedServer);
			if (hasSelected)
			{
				/** @type {AssistantButton} */
				const MCPButtonIntegrated = {
					...MCPButton,
					design: AssistantButtonDesign.bitrixGpt,
					text: selectedAuth.name,
					imageUrl: withCurrentDomain(selectedAuth.iconUrl),
					iconName: null,
				};

				this.#selectedAuthId = selectedAuth.id;
				this.#selectedAuthName = selectedAuth.name ?? null;
				await this.#applyButton(MCPButtonIntegrated);
				void this.#sendSelectionHint(this.#selectedAuthId);

				this.#onActiveStateChange(AssistantButtonType.mcp, true);

				return;
			}

			this.#selectedAuthId = null;
			this.#selectedAuthName = null;
			await this.#applyButton({ ...MCPButton });

			this.#onActiveStateChange(AssistantButtonType.mcp, false);
		};

		/**
		 * @param {AssistantButton} button
		 * @returns {Promise<any>}
		 */
		#applyButton(button)
		{
			this.#currentButton = button;

			return this.#view.textField.updateAssistantButton(button.id, button);
		}

		/**
		 * @param {MCPAuth['id']} selectedAuthId
		 */
		async #sendSelectionHint(selectedAuthId)
		{
			await new ChatService().botService.sendAiAssistantMCPSelection(selectedAuthId, this.#dialogId);
		}
	}

	module.exports = { MCPManager };
});
