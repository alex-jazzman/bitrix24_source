/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/search-mode
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/search-mode', (require, exports, module) => {
	const { Type } = require('type');

	const { SearchModeButton } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons');
	const { AssistantButtonType, AssistantButtonDesign } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/type');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('dialog--search-mode-manager');

	/**
	 * @class SearchModeManager
	 */
	class SearchModeManager
	{
		/** @type {Object} */
		#view;

		/** @type {boolean} */
		#isActive = false;

		/** @type {() => void} */
		#onActiveStateChange = () => {};

		/**
		 * @param {DialogLocator} dialogLocator
		 * @param {() => void} [onActiveStateChange]
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
			// TODO: wait BE implementation
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

			await this.#view.textField.updateAssistantButton(AssistantButtonType.search, {
				...SearchModeButton,
				design: AssistantButtonDesign.bitrixGpt,
			});

			this.#onActiveStateChange();
		}

		async #deactivate()
		{
			logger.log(`${this.constructor.name}.deactivate`);

			this.#isActive = false;

			await this.#view.textField.updateAssistantButton(AssistantButtonType.search, { ...SearchModeButton });

			this.#onActiveStateChange();
		}
	}

	module.exports = { SearchModeManager };
});
