/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/mode-menu
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/mode-menu', (require, exports, module) => {
	const { Type } = require('type');
	const { Icon } = require('assets/icons');

	const { Loc } = require('im/messenger/loc');
	const { DialogWidgetType } = require('im/messenger/const');
	const { ModeMenuButton } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons');
	const { AssistantButtonType, AssistantButtonDesign } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/type');
	const { Feature } = require('im/messenger/lib/feature');
	const { Reasoning } = require('im/messenger/lib/reasoning');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('dialog--mode-menu');

	const ModeMenuItemId = {
		reasoning: 'reasoning',
		roleSelect: 'role-select',
	};

	const ModeMenuButtonTextByItemId = {
		[ModeMenuItemId.reasoning]: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ASSISTANT_BUTTON_REASONING'),
	};

	const ModeMenuSectionCode = {
		general: 'general',
	};

	/**
	 * @class ModeMenuManager
	 */
	class ModeMenuManager
	{
		/** @type {DialogId} */
		#dialogId;

		/** @type {string} */
		#dialogType;

		/** @type {Object} */
		#view;

		/** @type {DialogPopupMenu} */
		#popupMenu;

		/** @type {Set<string>} */
		#activeModes = new Set();

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
			return this.#dialogType === DialogWidgetType.copilot;
		}

		/**
		 * @returns {AssistantButton}
		 */
		buildButton()
		{
			return { ...ModeMenuButton };
		}

		/**
		 * @returns {AssistantButton}
		 */
		buildCurrentButton()
		{
			return this.#currentButton ?? this.buildButton();
		}

		/**
		 * @desc Called by AssistantButtonManager after a flush — recalculates the
		 *       collapsed-mode text overlay so the value survives the next flush.
		 * @param {boolean} hasAnyActive
		 */
		applyCollapsedOverlay(hasAnyActive)
		{
			if (this.isActive)
			{
				return;
			}

			const text = hasAnyActive ? '' : ModeMenuButton.text;
			void this.#applyButton({ ...ModeMenuButton, text });
		}

		/**
		 * @returns {DialogId}
		 */
		get dialogId()
		{
			return this.#dialogId;
		}

		/**
		 * @returns {boolean}
		 */
		get isReasoningActive()
		{
			return this.#activeModes.has(ModeMenuItemId.reasoning);
		}

		/**
		 * @returns {boolean}
		 */
		get hasMultipleModesActive()
		{
			return this.#activeModes.size > 1;
		}

		/**
		 * @returns {boolean}
		 */
		get isActive()
		{
			return this.#activeModes.size > 0;
		}

		/**
		 * @param {MutationPayload<
		 * CopilotUpdateData | CopilotUpdateCollectionData,
		 * CopilotUpdateActions | CopilotUpdateActions
		 * >} mutation.payload
		 */
		handleAssistantButtonUpdate = (mutation) => {
			const { payload } = mutation;
			if (!this.#isRelevantModelUpdate(payload))
			{
				return;
			}

			const isReasoningSupported = Reasoning.isSupported(this.dialogId);
			if (!isReasoningSupported && this.isReasoningActive)
			{
				logger.log(`${this.constructor.name}.handleAssistantButtonUpdate: reasoning no longer supported, deactivating`);
				void this.deactivateReasoning();
			}
		};

		menuButtonTapHandler()
		{
			this.#openPopupMenu();
		}

		async activateReasoning()
		{
			logger.log(`${this.constructor.name}.activateReasoning`);

			await this.#activateMode(ModeMenuItemId.reasoning);

			AnalyticsService.getInstance().sendToggleReasoning({
				dialogId: this.dialogId,
				isActive: true,
			});
		}

		async deactivateReasoning()
		{
			logger.log(`${this.constructor.name}.deactivateReasoning`);

			await this.#deactivateMode(ModeMenuItemId.reasoning);

			AnalyticsService.getInstance().sendToggleReasoning({
				dialogId: this.dialogId,
				isActive: false,
			});
		}

		#openPopupMenu()
		{
			const isReasoningSupported = Reasoning.isSupported(this.dialogId);

			const menuItems = [
				Feature.isCopilotReasoningAvailable && {
					id: ModeMenuItemId.reasoning,
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ASSISTANT_BUTTON_REASONING'),
					sectionCode: ModeMenuSectionCode.general,
					iconName: Icon.AI_STARS.getIconName(),
					checked: this.isReasoningActive,
					disable: !isReasoningSupported,
				},
				{
					id: ModeMenuItemId.roleSelect,
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ASSISTANT_BUTTON_ROLE_SELECT'),
					sectionCode: ModeMenuSectionCode.general,
					iconName: Icon.ROLES_LIBRARY.getIconName(),
				},
			].filter((item) => Type.isPlainObject(item));

			const sections = [{ id: ModeMenuSectionCode.general }];

			this.#popupMenu = window.dialogs.createPopupMenu();
			this.#popupMenu.setTarget(ModeMenuButton.viewId);
			this.#popupMenu.setData(menuItems, sections, (event, item) => {
				if (event === 'onItemSelected')
				{
					this.#popupMenuItemTapHandler(item.id);
				}
			});
			this.#popupMenu.show();
		}

		/**
		 * @param {string} itemId
		 */
		#popupMenuItemTapHandler(itemId)
		{
			this.#popupMenu.hide();

			switch (itemId)
			{
				case ModeMenuItemId.reasoning:
					void this.#reasoningMenuItemTapHandler();
					break;
				case ModeMenuItemId.roleSelect:
					void this.#copilotRoleMenuItemTapHandler();
					break;
				default:
			}
		}

		#reasoningMenuItemTapHandler()
		{
			if (!Reasoning.isSupported(this.dialogId))
			{
				Notification.showToast(ToastType.reasoningDisabled);

				return;
			}

			if (this.isReasoningActive)
			{
				void this.deactivateReasoning();
			}
			else
			{
				void this.activateReasoning();
			}
		}

		async #copilotRoleMenuItemTapHandler()
		{
			logger.log(`${this.constructor.name}.copilotRoleMenuItemTapHandler`);

			const { CopilotRoleSelector } = await requireLazy('layout/ui/copilot-role-selector');
			const { CopilotRest } = await requireLazy('im:messenger/provider/rest');

			try
			{
				const result = await CopilotRoleSelector.open({
					isBitrixGptV2Enabled: Feature.isBitrixGptV2Enabled,
					showOpenFeedbackItem: true,
					openWidgetConfig: {
						backdrop: {
							mediumPositionPercent: 75,
							horizontalSwipeAllowed: false,
							onlyMediumPosition: false,
						},
					},
				});

				if (result?.role?.code)
				{
					await CopilotRest.changeRole({ dialogId: this.dialogId, roleCode: result.role.code });
				}
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.copilotRoleMenuItemTapHandler`, error);
			}
		}

		/**
		 * @param {string} modeMenuItemId
		 */
		async #activateMode(modeMenuItemId)
		{
			this.#activeModes.add(modeMenuItemId);

			await this.#updateModeMenuButton();

			this.#onActiveStateChange(this.#getButtonTypeByModeItem(modeMenuItemId), true);
		}

		/**
		 * @param {string} modeMenuItemId
		 */
		async #deactivateMode(modeMenuItemId)
		{
			this.#activeModes.delete(modeMenuItemId);

			await this.#updateModeMenuButton();

			this.#onActiveStateChange(this.#getButtonTypeByModeItem(modeMenuItemId), false);
		}

		/**
		 * @param {string} modeMenuItemId
		 * @returns {?string} one of AssistantButtonType, or null for modes without a toggle button
		 */
		#getButtonTypeByModeItem(modeMenuItemId)
		{
			return modeMenuItemId === ModeMenuItemId.reasoning ? AssistantButtonType.reasoning : null;
		}

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

		async #updateModeMenuButton()
		{
			if (this.hasMultipleModesActive)
			{
				await this.#applyButton({
					...ModeMenuButton,
					design: AssistantButtonDesign.bitrixGpt,
				});

				return;
			}

			if (this.isActive)
			{
				const [activeModeMenuItemId] = this.#activeModes;
				const text = ModeMenuButtonTextByItemId[activeModeMenuItemId] ?? '';
				await this.#applyButton({
					...ModeMenuButton,
					text,
					design: AssistantButtonDesign.bitrixGpt,
				});

				return;
			}

			await this.#applyButton({ ...ModeMenuButton });
		}

		/**
		 * @param {AssistantButton} button
		 * @returns {Promise<any>}
		 */
		#applyButton(button)
		{
			this.#currentButton = button;

			return this.#view.textField.updateAssistantButton(button.id, button);
		}
	}

	module.exports = { ModeMenuManager };
});
