/**
 * @module im/messenger/controller/messenger-header/src/buttons-controller
 */
jn.define('im/messenger/controller/messenger-header/src/buttons-controller', (require, exports, module) => {
	const { isEqual } = require('utils/object');

	const { resolveFolderHeaderConfig } = require('im/messenger/controller/messenger-header/src/config');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @type {Readonly<Record<string, keyof HeaderButtonsConfig>>}
	 */
	const ButtonsSide = Object.freeze({
		right: 'rightButtons',
		left: 'leftButtons',
	});

	/**
	 * @type {Record<keyof HeaderButtonsConfig, string>}
	 */
	const WidgetButtonsSetter = Object.freeze({
		[ButtonsSide.right]: 'setRightButtons',
		[ButtonsSide.left]: 'setLeftButtons',
	});

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
			/** @private */
			this.leftButtons = null;
		}

		/**
		 * @param {string} tabId
		 * @return {Promise<void>}
		 */
		async redrawRightButtonsIfNeeded(tabId)
		{
			const rightButtons = await this.getButtons(tabId, ButtonsSide.right);
			if (isEqual(this.rightButtons, rightButtons))
			{
				return;
			}

			this.redrawButtons(rightButtons, ButtonsSide.right);
		}

		/**
		 * @param {string} tabId
		 * @return {Promise<void>}
		 */
		async redrawLeftButtonsIfNeeded(tabId)
		{
			const leftButtons = await this.getButtons(tabId, ButtonsSide.left);
			if (isEqual(this.leftButtons, leftButtons))
			{
				return;
			}

			this.redrawButtons(leftButtons, ButtonsSide.left);
		}

		/**
		 * @protected
		 * @param {Array<object>} buttons
		 * @param {keyof HeaderButtonsConfig} side
		 */
		redrawButtons(buttons, side)
		{
			const activeRecentId = serviceLocator.get('recent-manager').getActiveRecentId();
			const setter = WidgetButtonsSetter[side];

			this.#ui.nestedWidgets()[activeRecentId]?.[setter]?.(buttons);
		}

		/**
		 * @protected
		 * @param {string} tabId
		 * @param {keyof HeaderButtonsConfig} side
		 * @return {Promise<Array<object>>}
		 */
		async getButtons(tabId, side)
		{
			const config = this.#config[tabId] ?? resolveFolderHeaderConfig(tabId);
			const buttons = config?.[side];
			if (!buttons)
			{
				return [];
			}

			const filterResults = await Promise.all(
				buttons.map((button) => button.shouldShow()),
			);

			return buttons
				.filter((button, index) => filterResults[index])
				.map((button) => button.toWidgetHeaderButton());
		}
	}

	module.exports = { HeaderButtonsController };
});
