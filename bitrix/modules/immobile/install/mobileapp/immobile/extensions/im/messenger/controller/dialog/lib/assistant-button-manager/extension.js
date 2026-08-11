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
		MarketButton,
		ASSISTANT_BUTTON_PRIORITY,
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
		};

		return;
	}

	const { EventType, Analytics } = require('im/messenger/const');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { ModeMenuManager } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/mode-menu');
	const { MCPManager } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/mcp');
	const { SearchModeManager } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/search-mode');
	const { AgentManager } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/agent');
	const { MarketManager } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/market');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('dialog--assistant-button-manager');

	// AssistantButtonType -> on/off ChatMode labels for the mode_change analytics event
	const MODE_LABELS_BY_BUTTON_TYPE = {
		[AssistantButtonType.reasoning]: { on: Analytics.ChatMode.reasoningOn, off: Analytics.ChatMode.reasoningOff },
		[AssistantButtonType.search]: { on: Analytics.ChatMode.webSearchOn, off: Analytics.ChatMode.webSearchOff },
		[AssistantButtonType.agent]: { on: Analytics.ChatMode.agentModeOn, off: Analytics.ChatMode.agentModeOff },
		[AssistantButtonType.mcp]: { on: Analytics.ChatMode.mcpOn, off: Analytics.ChatMode.mcpOff },
	};

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

		/** @type {MarketManager} */
		#marketManager;

		/** @type {Set<object>} */
		#visibleManagers = new Set();

		/** @type {boolean} */
		#flushScheduled = false;

		/** @type {?ModesState} */
		#previousModesState = null;

		/** @type {?string} */
		#previousRoleCode = null;

		/**
		 * @param {DialogLocator} dialogLocator
		 * @param {string} dialogType
		 */
		constructor({ dialogLocator, dialogType })
		{
			this.dialogLocator = dialogLocator;
			this.dialogId = dialogLocator.get('dialogId');
			this.view = this.dialogLocator.get('view');
			this.#previousRoleCode = this.#getCurrentRoleCode();

			const onActiveStateChange = (buttonType, isActive) => {
				this.#syncButtonCollapse();
				this.#sendAnalyticsModeChange(buttonType, isActive);
			};
			const subManagerParams = { dialogLocator, dialogType, onActiveStateChange };
			this.#modeMenuManager = new ModeMenuManager(subManagerParams);
			this.#mcpManager = new MCPManager(subManagerParams);
			this.#searchModeManager = new SearchModeManager(subManagerParams);
			this.#agentManager = new AgentManager(subManagerParams);
			this.#marketManager = new MarketManager(subManagerParams);
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

		/**
		 * @returns {boolean}
		 */
		get isSearchModeActive()
		{
			return this.#searchModeManager.isActive;
		}

		/**
		 * @returns {boolean}
		 */
		get isAgentModeActive()
		{
			return this.#agentManager.isActive;
		}

		/**
		 * @desc Snapshot of AI settings for analytics (TPL-01). A field is `null` when
		 *       the corresponding button is not available in this chat (sub-manager is
		 *       not part of the rendered #visibleManagers set). Pure read, no side effects.
		 * @returns {ModesState}
		 */
		getSettingsSnapshot()
		{
			const mcpAvailable = this.#visibleManagers.has(this.#mcpManager);
			const mcpActive = mcpAvailable ? this.#mcpManager.isActive : null;

			return {
				mcp: mcpActive,
				mcpServerName: mcpActive ? this.#mcpManager.selectedAuthName : null,
				reasoning: this.#visibleManagers.has(this.#modeMenuManager) && Feature.isCopilotReasoningAvailable
					? this.#modeMenuManager.isReasoningActive
					: null,
				webSearch: this.#visibleManagers.has(this.#searchModeManager)
					? this.#searchModeManager.isActive
					: null,
				agentMode: this.#visibleManagers.has(this.#agentManager)
					? this.#agentManager.isActive
					: null,
			};
		}

		/**
		 * @desc Stream-rendering of assistant buttons. Each sub-manager's canShow() is
		 *       resolved independently — fast managers flush on the first microtask,
		 *       market joins the rendered set as soon as its REST call resolves.
		 *       Button order is governed by ASSISTANT_BUTTON_PRIORITY, runtime state
		 *       of already-rendered buttons is preserved via sub-manager #currentButton.
		 */
		buildInitialButtons()
		{
			this.#visibleManagers.clear();

			this.#getSubManagers().forEach((manager) => {
				manager.canShow()
					.then((visible) => {
						if (visible)
						{
							this.#visibleManagers.add(manager);
						}
					})
					.catch((error) => logger.error(`${this.constructor.name}.canShow failed`, error))
					.finally(() => this.#scheduleFlush())
				;
			});
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
				.on('dialoguesModel/copilotModel/update', this.#handleCopilotRoleUpdate)
				.on('dialoguesModel/copilotModel/updateCollection', this.#handleCopilotRoleUpdate)
			;
		}

		unsubscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.off('dialoguesModel/copilotModel/update', this.#modeMenuManager.handleAssistantButtonUpdate)
				.off('dialoguesModel/copilotModel/updateCollection', this.#modeMenuManager.handleAssistantButtonUpdate)
				.off('dialoguesModel/copilotModel/update', this.#handleCopilotRoleUpdate)
				.off('dialoguesModel/copilotModel/updateCollection', this.#handleCopilotRoleUpdate)
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
			const buttons = [...this.#visibleManagers]
				.map((manager) => manager.buildCurrentButton())
				.sort((a, b) => ASSISTANT_BUTTON_PRIORITY[a.id] - ASSISTANT_BUTTON_PRIORITY[b.id]);

			void this.view.textField.showAssistantButtons(buttons);

			this.#syncButtonCollapse();

			// keep the analytics baseline in sync with the rendered button set
			this.#previousModesState = this.getSettingsSnapshot();
		}

		/**
		 * @returns {boolean}
		 */
		#hasAnyActiveButton()
		{
			return [...this.#visibleManagers].some((manager) => manager.isActive);
		}

		#syncButtonCollapse()
		{
			const hasAnyActive = this.#hasAnyActiveButton();

			this.#visibleManagers.forEach((manager) => {
				manager.applyCollapsedOverlay?.(hasAnyActive);
			});
		}

		/**
		 * @desc Emits a mode_change event for a user toggle of a visible button.
		 *       p4 carries the modes state BEFORE the change. Refreshes the snapshot
		 *       baseline on every call so the next event reports an accurate before-state.
		 *       Called without arguments for non-toggle state changes — analytics is skipped.
		 * @param {string} [buttonType] - one of AssistantButtonType
		 * @param {boolean} [isActive] - state AFTER the toggle
		 */
		#sendAnalyticsModeChange(buttonType, isActive)
		{
			const before = this.#previousModesState;
			this.#previousModesState = this.getSettingsSnapshot();

			const labels = buttonType ? MODE_LABELS_BY_BUTTON_TYPE[buttonType] : null;
			if (!labels || !before)
			{
				return;
			}

			AnalyticsService.getInstance().sendModeChange({
				dialogId: this.dialogId,
				mode: isActive ? labels.on : labels.off,
				modesState: before,
			});
		}

		/**
		 * @returns {?string}
		 */
		#getCurrentRoleCode()
		{
			const store = serviceLocator.get('core').getStore();

			return store.getters['dialoguesModel/copilotModel/getMainRoleByDialogId'](this.dialogId)?.code ?? null;
		}

		/**
		 * @desc Detects a copilot role change via the copilot model and emits role_change.
		 *       Covers both the mode-menu and the sidebar role selectors.
		 */
		#handleCopilotRoleUpdate = () => {
			const currentRoleCode = this.#getCurrentRoleCode();
			if (!currentRoleCode || currentRoleCode === this.#previousRoleCode)
			{
				return;
			}

			const previousRoleCode = this.#previousRoleCode;
			this.#previousRoleCode = currentRoleCode;

			if (previousRoleCode)
			{
				AnalyticsService.getInstance().sendRoleChange({
					dialogId: this.dialogId,
					modesState: this.getSettingsSnapshot(),
				});
			}
		};

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
				case AssistantButtonType.market:
					void this.#marketManager.menuButtonTapHandler();
					break;
				default:
			}
		};

		/**
		 * @returns {Array<{canShow: () => Promise<boolean>, buildButton: () => AssistantButton, buildCurrentButton: () => AssistantButton}>}
		 */
		#getSubManagers()
		{
			return [
				this.#modeMenuManager,
				this.#mcpManager,
				this.#searchModeManager,
				this.#agentManager,
				this.#marketManager,
			];
		}
	}

	module.exports = {
		AssistantButtonManager,
		ModeMenuButton,
		MCPButton,
		SearchModeButton,
		AgentButton,
		MarketButton,
		MarketManager,
		AssistantButtonType,
		AssistantButtonDesign,
		AssistantButtonSize,
		AssistantButtonMode,
	};
});
