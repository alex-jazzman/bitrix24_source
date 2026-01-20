/**
 * @module whats-new/ui-manager
 */
jn.define('whats-new/ui-manager', (require, exports, module) => {
	const { BackgroundUIManager } = require('background/ui-manager');
	const { ComponentOpener, WHATS_NEW_COMPONENT_NAME } = require('whats-new/ui-manager/component-opener');

	class WhatsNewUIManager
	{
		/**
		 * @public
		 * @return {void}
		 */
		static openComponent()
		{
			ComponentOpener.open();
		}

		static openComponentInBackground()
		{
			BackgroundUIManager.openComponent(WHATS_NEW_COMPONENT_NAME, WhatsNewUIManager.openComponent, 10);
		}

		/**
		 * @public
		 * @return {boolean}
		 */
		static canOpenComponentInBackground()
		{
			return BackgroundUIManager.canOpenComponentInBackground();
		}
	}

	module.exports = {
		WhatsNewUIManager,
		WHATS_NEW_COMPONENT_NAME,
	};
});
