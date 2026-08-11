/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/agent
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/agent', (require, exports, module) => {
	const { Type } = require('type');

	const { DialogWidgetType } = require('im/messenger/const');
	const { AgentButton } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons');
	const { AssistantButtonType, AssistantButtonDesign } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/type');
	const { Feature } = require('im/messenger/lib/feature');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('dialog--agent-manager');

	/**
	 * @class AgentManager
	 */
	class AgentManager
	{
		/** @type {Object} */
		#view;

		/** @type {string} */
		#dialogType;

		/** @type {boolean} */
		#isActive = false;

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
			this.#view = dialogLocator.get('view');
			this.#dialogType = dialogType;
			this.#onActiveStateChange = Type.isFunction(onActiveStateChange) ? onActiveStateChange : (() => {});
		}

		/**
		 * @returns {Promise<boolean>}
		 */
		async canShow()
		{
			return this.#dialogType === DialogWidgetType.copilot && Feature.isAgentButtonAvailable;
		}

		/**
		 * @returns {AssistantButton}
		 */
		buildButton()
		{
			return { ...AgentButton };
		}

		/**
		 * @returns {AssistantButton}
		 */
		buildCurrentButton()
		{
			return this.#currentButton ?? this.buildButton();
		}

		/**
		 * @param {boolean} hasAnyActive
		 */
		applyCollapsedOverlay(hasAnyActive)
		{
			if (this.isActive)
			{
				return;
			}

			const text = hasAnyActive ? '' : AgentButton.text;
			void this.#applyButton({ ...AgentButton, text });
		}

		/**
		 * @returns {boolean}
		 */
		get isActive()
		{
			return this.#isActive;
		}

		menuButtonTapHandler()
		{
			if (this.#isActive)
			{
				void this.#deactivate();
			}
			else
			{
				void this.#activate();
			}
		}

		async #activate()
		{
			logger.log(`${this.constructor.name}.activate`);

			this.#isActive = true;

			await this.#applyButton({
				...AgentButton,
				design: AssistantButtonDesign.bitrixGpt,
			});

			this.#onActiveStateChange(AssistantButtonType.agent, true);
		}

		async #deactivate()
		{
			logger.log(`${this.constructor.name}.deactivate`);

			this.#isActive = false;

			await this.#applyButton({ ...AgentButton });

			this.#onActiveStateChange(AssistantButtonType.agent, false);
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

	module.exports = { AgentManager };
});
