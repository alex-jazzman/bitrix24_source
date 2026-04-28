/**
 * @module im/messenger/controller/messenger-header/buttons-controller
 */
jn.define('im/messenger/controller/messenger-header/buttons-controller', (require, exports, module) => {
	const { isEqual } = require('utils/object');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { PopupCreateButton } = require('im/messenger/lib/widget/header-button/popup-create-button');
	const { headerControllerConfig } = require('im/messenger/controller/messenger-header/config');

	/**
	 * @class HeaderButtonsController
	 */
	class HeaderButtonsController
	{
		#ui;

		constructor(widget)
		{
			this.#ui = widget;
			/** @private */
			this.rightButtons = null;
		}

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
		 * @param {string} tabId
		 */
		async getRightButtons(tabId)
		{
			const config = headerControllerConfig[tabId];
			if (config)
			{
				const filterResults = await Promise.all(config.rightButtons.map(async (button) => {
					if (button instanceof PopupCreateButton)
					{
						return button.shouldShow();
					}

					return true;
				}));

				return config.rightButtons
					.filter((button, index) => filterResults[index])
					.map((button) => button.toWidgetHeaderButton());
			}

			return [];
		}

		/**
		 * @protected
		 * @param rightButtons
		 */
		redrawRightButtons(rightButtons)
		{
			const activeRecentId = serviceLocator.get('recent-manager').getActiveRecentId();

			this.#ui.nestedWidgets()[activeRecentId]?.setRightButtons(rightButtons);
		}
	}

	module.exports = { HeaderButtonsController };
});
