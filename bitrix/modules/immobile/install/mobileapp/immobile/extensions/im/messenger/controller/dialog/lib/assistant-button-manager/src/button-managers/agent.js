/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/agent
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/agent', (require, exports, module) => {
	const { Type } = require('type');

	const { AgentButton } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons');
	const { AssistantButtonType, AssistantButtonDesign } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/type');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('dialog--agent-manager');

	/**
	 * @class AgentManager
	 */
	class AgentManager
	{
		/** @type {Object} */
		#view;

		/** @type {boolean} */
		#isActive = false;

		/** @type {() => void} */
		#onActiveStateChange = () => {};

		/**
		 * @param {DialogLocator} dialogLocator
		 * @param {Function} [onActiveStateChange]
		 */
		constructor({ dialogLocator, onActiveStateChange })
		{
			this.#view = dialogLocator.get('view');
			this.#onActiveStateChange = Type.isFunction(onActiveStateChange) ? onActiveStateChange : (() => {});
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

			await this.#view.textField.updateAssistantButton(AssistantButtonType.agent, {
				...AgentButton,
				design: AssistantButtonDesign.bitrixGpt,
			});

			this.#onActiveStateChange();
		}

		async #deactivate()
		{
			logger.log(`${this.constructor.name}.deactivate`);

			this.#isActive = false;

			await this.#view.textField.updateAssistantButton(AssistantButtonType.agent, { ...AgentButton });

			this.#onActiveStateChange();
		}
	}

	module.exports = { AgentManager };
});
