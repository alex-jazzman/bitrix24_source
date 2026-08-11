/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/legacy
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/legacy', (require, exports, module) => {
	const { Type } = require('type');
	const { MCPSelector } = require('ai/mcp-selector');
	const { withCurrentDomain } = require('utils/url');

	const { Analytics, EventType, DialogWidgetType } = require('im/messenger/const');
	const {
		ReasoningButton,
		MCPButton,
		ASSISTANT_BUTTON_PRIORITY,
	} = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons');
	const { AssistantButtonType, AssistantButtonDesign } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/type');
	const { MarketManager } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/market');
	const { Feature } = require('im/messenger/lib/feature');
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

		/** @type {MarketManager} */
		#marketManager;

		/** @type {Map<string, AssistantButton>} */
		#visibleButtons = new Map();

		/** @type {boolean} */
		#flushScheduled = false;

		/**
		 * @param {DialogLocator} dialogLocator
		 * @param {string} dialogType
		 */
		constructor({ dialogLocator, dialogType })
		{
			this.dialogLocator = dialogLocator;
			this.dialogId = dialogLocator.get('dialogId');
			this.dialogType = dialogType;

			this.store = this.dialogLocator.get('store');
			this.view = this.dialogLocator.get('view');

			this.state = {
				isReasoningActive: false,
			};

			this.#marketManager = new MarketManager({ dialogLocator });
		}

		/**
		 * @desc Stream-rendering of legacy assistant buttons. Fast buttons (reasoning, mcp)
		 *       are pushed immediately, market joins as soon as its REST call resolves.
		 *       State of pressed buttons is preserved through #visibleButtons.
		 */
		buildInitialButtons()
		{
			this.#visibleButtons.clear();

			if (this.dialogType === DialogWidgetType.copilot && Feature.isCopilotReasoningAvailable)
			{
				const design = Reasoning.isSupported(this.dialogId)
					? AssistantButtonDesign.grey
					: AssistantButtonDesign.disabledAlike;

				this.#applyButton({ ...ReasoningButton, design });
			}

			if (this.dialogType === DialogWidgetType.aiAssistant && Feature.isAiAssistantMCPSelectorAvailable)
			{
				this.#applyButton({ ...MCPButton });
			}

			this.#scheduleFlush();

			this.#marketManager.canShow()
				.then((visible) => {
					if (visible)
					{
						this.#applyButton(this.#marketManager.buildButton());
						this.#scheduleFlush();
					}
				})
				.catch((error) => logger.error(`${this.constructor.name}.buildInitialButtons: market canShow failed`, error))
			;
		}

		#scheduleFlush()
		{
			if (this.#flushScheduled)
			{
				return;
			}

			this.#flushScheduled = true;
			Promise.resolve().then(() => {
				this.#flushScheduled = false;
				this.#flush();
			});
		}

		#flush()
		{
			const buttons = [...this.#visibleButtons.values()]
				.sort((a, b) => (ASSISTANT_BUTTON_PRIORITY[a.id] ?? Infinity) - (ASSISTANT_BUTTON_PRIORITY[b.id] ?? Infinity));

			void this.view.textField.showAssistantButtons(buttons);
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

		/**
		 * @desc Snapshot of AI settings for analytics (TPL-01). A field is `null` when
		 *       the corresponding button is not rendered in this chat. Reasoning state
		 *       is read from the manager state, MCP from the selected auth.
		 * @returns {ModesState}
		 */
		getSettingsSnapshot()
		{
			const hasReasoningButton = this.#visibleButtons.has(ReasoningButton.id);
			const hasMcpButton = this.#visibleButtons.has(MCPButton.id);

			return {
				mcp: hasMcpButton ? this.#mcpSelectedAuthId !== null : null,
				mcpServerName: null,
				reasoning: hasReasoningButton ? this.state.isReasoningActive : null,
				webSearch: null,
				agentMode: null,
			};
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
			return this.#applyButton({ ...button, id });
		}

		/**
		 * @param {AssistantButton} button
		 * @returns {Promise<any>}
		 */
		#applyButton(button)
		{
			this.#visibleButtons.set(button.id, button);

			return this.view.textField.updateAssistantButton(button.id, button);
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
				case AssistantButtonType.market:
					this.#marketManager.menuButtonTapHandler();
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

			const modesState = this.getSettingsSnapshot();
			const willBeActive = !this.state.isReasoningActive;

			const design = this.state.isReasoningActive ? AssistantButtonDesign.grey : AssistantButtonDesign.primary;

			/** @type {AssistantButton} */
			const newButton = {
				...ReasoningButton,
				design,
			};

			await this.updateAssistantButton(AssistantButtonType.reasoning, newButton);
			this.state.isReasoningActive = willBeActive;
			AnalyticsService.getInstance().sendToggleReasoning({
				dialogId: this.dialogId,
				isActive: this.state.isReasoningActive,
			});

			AnalyticsService.getInstance().sendModeChange({
				dialogId: this.dialogId,
				mode: willBeActive ? Analytics.ChatMode.reasoningOn : Analytics.ChatMode.reasoningOff,
				modesState,
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
			void this.#applyButton(newButton);
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
			await new ChatService().botService.sendAiAssistantMCPSelection(selectedAuthId, this.dialogId);
		}

	}

	module.exports = { LegacyAssistantButtonManager };
});
