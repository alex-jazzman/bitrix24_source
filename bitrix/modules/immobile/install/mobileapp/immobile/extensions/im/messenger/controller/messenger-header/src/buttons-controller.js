/**
 * @module im/messenger/controller/messenger-header/src/buttons-controller
 */
jn.define('im/messenger/controller/messenger-header/src/buttons-controller', (require, exports, module) => {
	const { isEqual } = require('utils/object');

	const { resolveFolderHeaderConfig } = require('im/messenger/controller/messenger-header/src/config');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { PopupCreateButton } = require('im/messenger/lib/widget/header-button');

	/**
	 * @class HeaderButtonsController
	 */
	class HeaderButtonsController
	{
		#ui;
		/** @type {Record<string, HeaderButtonsConfig>} */
		#config;

		/**
		 * @param {object} widget
		 * @param {Record<string, HeaderButtonsConfig>} config
		 */
		constructor(widget, config)
		{
			this.#ui = widget;
			this.#config = config;

			/** @private */
			this.rightButtons = null;
		}

		/**
		 * @param {string} tabId
		 * @return {Promise<void>}
		 */
		async redrawRightButtonsIfNeeded(tabId)
		{
			const rightButtons = await this.getRightButtons(tabId);
			if (isEqual(this.rightButtons, rightButtons))
			{
				return;
			}

			this.redrawRightButtons(rightButtons);
		}

		/**
		 * @protected
		 * @param {Array<object>} rightButtons
		 */
		redrawRightButtons(rightButtons)
		{
			const activeRecentId = serviceLocator.get('recent-manager').getActiveRecentId();

			this.#ui.nestedWidgets()[activeRecentId]?.setRightButtons(rightButtons);
		}

		/**
		 * @protected
		 * @param {string} tabId
		 * @return {Promise<Array<object>>}
		 */
		async getRightButtons(tabId)
		{
			const config = this.#config[tabId] ?? resolveFolderHeaderConfig(tabId);
			if (config)
			{
				const filterResults = await Promise.all(
					config.rightButtons.map((button) => button.shouldShow()),
				)

				return config.rightButtons
					.filter((button, index) => filterResults[index])
					.map((button) => button.toWidgetHeaderButton());
			}

			return [];
		}
	}

	module.exports = { HeaderButtonsController };
});
