/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/mcp
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/mcp', (require, exports, module) => {
	const { Type } = require('type');
	const { MCPSelector } = require('ai/mcp-selector');
	const { withCurrentDomain } = require('utils/url');

	const { MCPButton } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons');
	const { AssistantButtonDesign } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/type');
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

		/** @type {Object} */
		#view;

		/** @type {MCPSelector} */
		#mcpSelector;

		/** @type {number|null} */
		#selectedAuthId = null;

		/** @type {() => void} */
		#onActiveStateChange = () => {};

		/**
		 * @param {DialogLocator} dialogLocator
		 * @param {() => void} [onActiveStateChange]
		 */
		constructor({ dialogLocator, onActiveStateChange })
		{
			this.#dialogId = dialogLocator.get('dialogId');
			this.#view = dialogLocator.get('view');
			this.#onActiveStateChange = Type.isFunction(onActiveStateChange) ? onActiveStateChange : (() => {});
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
				await this.#view.textField.updateAssistantButton(MCPButton.id, MCPButtonIntegrated);
				void this.#sendSelectionHint(this.#selectedAuthId);

				this.#onActiveStateChange();

				return;
			}

			this.#selectedAuthId = null;
			await this.#view.textField.updateAssistantButton(MCPButton.id, MCPButton);

			this.#onActiveStateChange();
		};

		/**
		 * @param {MCPAuth['id']} selectedAuthId
		 */
		async #sendSelectionHint(selectedAuthId)
		{
			await new ChatService().botService.sendAiAssistantMCPSelection(selectedAuthId);
		}
	}

	module.exports = { MCPManager };
});
