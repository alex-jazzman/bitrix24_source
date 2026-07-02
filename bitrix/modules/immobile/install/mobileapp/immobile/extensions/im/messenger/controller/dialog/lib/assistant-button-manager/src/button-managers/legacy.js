/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/legacy
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/legacy', (require, exports, module) => {
	const { Type } = require('type');
	const { MCPSelector } = require('ai/mcp-selector');
	const { withCurrentDomain } = require('utils/url');

	const { EventType } = require('im/messenger/const');
	const {
		ReasoningButton,
		MCPButton,
	} = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons');
	const { AssistantButtonType, AssistantButtonDesign } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Reasoning } = require('im/messenger/lib/reasoning');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { ChatService } = require('im/messenger/provider/services/chat');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('dialog--assistant-button-manager-legacy');

	/**
	 * @class LegacyAssistantButtonManager
	 */
	class LegacyAssistantButtonManager
	{
		/** @type {MCPSelector} */
		#mcpSelector;

		/** @type {number|null} */
		#mcpSelectedAuthId = null;

		/**
		 * @param {DialogLocator} dialogLocator
		 */
		constructor({ dialogLocator })
		{
			this.dialogLocator = dialogLocator;
			this.dialogId = dialogLocator.get('dialogId');

			this.store = this.dialogLocator.get('store');
			this.view = this.dialogLocator.get('view');

			this.state = {
				isReasoningActive: false,
			};
		}

		get isReasoningActive()
		{
			return this.state.isReasoningActive;
		}

		/**
		 * @returns {number|null}
		 */
		get mcpSelectedAuthId()
		{
			return this.#mcpSelectedAuthId;
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
				.on('dialoguesModel/copilotModel/update', this.#handleAssistantButtonUpdate)
				.on('dialoguesModel/copilotModel/updateCollection', this.#handleAssistantButtonUpdate)
			;
		}

		unsubscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.off('dialoguesModel/copilotModel/update', this.#handleAssistantButtonUpdate)
				.off('dialoguesModel/copilotModel/updateCollection', this.#handleAssistantButtonUpdate)
			;
		}

		/**
		 * @param {AssistantButton['id']} id
		 * @param {AssistantButton} button
		 * @return {Promise<any>}
		 */
		updateAssistantButton(id, button)
		{
			return this.view.textField.updateAssistantButton(id, button);
		}

		#assistantButtonTapHandler = (buttonId) => {
			switch (buttonId)
			{
				case AssistantButtonType.reasoning:
					void this.#reasoningButtonTapHandler();
					break;
				case MCPButton.id:
					void this.#mcpButtonTapHandler();
					break;
				default:
			}
		};

		async #reasoningButtonTapHandler()
		{
			const isSupported = Reasoning.isSupported(this.dialogId);
			if (!isSupported)
			{
				Notification.showToast(ToastType.reasoningDisabled);

				return;
			}

			logger.log(`${this.constructor.name}.reasoningButtonTapHandler, isReasoningActive: `, this.state.isReasoningActive);

			const design = this.state.isReasoningActive ? AssistantButtonDesign.grey : AssistantButtonDesign.primary;

			/** @type {AssistantButton} */
			const newButton = {
				...ReasoningButton,
				design,
			};

			await this.updateAssistantButton(AssistantButtonType.reasoning, newButton);
			this.state.isReasoningActive = !this.state.isReasoningActive;
			AnalyticsService.getInstance().sendToggleReasoning({
				dialogId: this.dialogId,
				isActive: this.state.isReasoningActive,
			});
		}

		/**
		 * @param {MutationPayload<
		 * CopilotUpdateData | CopilotUpdateCollectionData,
		 * CopilotUpdateActions | CopilotUpdateActions
		 * >} mutation.payload
		 */
		#handleAssistantButtonUpdate = (mutation) => {
			const { payload } = mutation;
			if (!this.#isRelevantModelUpdate(payload))
			{
				return;
			}

			const isReasoningSupported = Reasoning.isSupported(this.dialogId);
			const { isReasoningActive } = this.state;
			if (isReasoningSupported && isReasoningActive)
			{
				return;
			}

			logger.log(`${this.constructor.name}.handleAssistantButtonUpdate, payload:`, payload);
			const design = isReasoningSupported ? AssistantButtonDesign.grey : AssistantButtonDesign.disabledAlike;
			/** @type {AssistantButton} */
			const newButton = {
				...ReasoningButton,
				design,
			};
			void this.view.textField.updateAssistantButton(AssistantButtonType.reasoning, newButton);
		};

		/**
		 * @param {MutationPayload<
		 * CopilotUpdateData | CopilotUpdateCollectionData,
		 * CopilotUpdateActions | CopilotUpdateActions
		 * >} payload
		 * @return {boolean}
		 */
		#isRelevantModelUpdate = (payload) => {
			const { data, actionName } = payload;
			if (actionName === 'update')
			{
				return data.dialogId === this.dialogId && !Type.isNil(data.fields.engine);
			}

			if (actionName === 'setCollection')
			{
				return data.updateItems.some((item) => item.dialogId === this.dialogId && !Type.isNil(item?.fields.engine));
			}

			return false;
		};

		#mcpButtonTapHandler = async () => {
			if (!this.#mcpSelector)
			{
				this.#mcpSelector = new MCPSelector({
					onSelect: this.#mcpSelectorSelectHandler,
				});
			}

			await this.#mcpSelector.open();

			AnalyticsService.getInstance().sendClickMCPIntegrations(this.dialogId);
		};

		/**
		 * @param {MCPServer} selectedServer
		 * @param {MCPAuth} selectedAuth
		 * @returns {Promise<void>}
		 */
		#mcpSelectorSelectHandler = async ({ selectedServer, selectedAuth }) => {
			logger.log(
				`${this.constructor.name}.#mcpSelectorSelectHandler, params: `,
				{ selectedServer, selectedAuth },
			);

			const hasSelected = Type.isObject(selectedAuth) && Type.isObject(selectedServer);
			if (hasSelected)
			{
				/** @type {AssistantButton} */
				const MCPButtonIntegrated = {
					...MCPButton,
					design: AssistantButtonDesign.primary,
					text: selectedAuth.name,
					imageUrl: withCurrentDomain(selectedAuth.iconUrl),
					iconName: null,
				};

				this.#mcpSelectedAuthId = selectedAuth.id;
				await this.updateAssistantButton(MCPButton.id, MCPButtonIntegrated);
				void this.#sendSelectionHint(this.#mcpSelectedAuthId);

				return;
			}

			this.#mcpSelectedAuthId = null;
			await this.updateAssistantButton(MCPButton.id, MCPButton);
		};

		/**
		 * @param {MCPAuth['id']} selectedAuthId
		 */
		async #sendSelectionHint(selectedAuthId)
		{
			await new ChatService().botService.sendAiAssistantMCPSelection(selectedAuthId);
		}

	}

	module.exports = { LegacyAssistantButtonManager };
});
