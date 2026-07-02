/**
 * @module im/messenger/controller/messenger-header/src/configurator
 */
jn.define('im/messenger/controller/messenger-header/src/configurator', (require, exports, module) => {
	const { HeaderTitleController } = require('im/messenger/controller/messenger-header/src/title-controller');
	const { HeaderButtonsController } = require('im/messenger/controller/messenger-header/src/buttons-controller');
	const { MessengerHeaderController } = require('im/messenger/controller/messenger-header/src/controller');
	const { GlobalTitleParamsProvider } = require('im/messenger/controller/messenger-header/src/title-params-provider/global');
	const { NestedTitleParamsProvider } = require('im/messenger/controller/messenger-header/src/title-params-provider/nested');
	const { headerControllerConfig, nestedHeaderControllerConfig } = require('im/messenger/controller/messenger-header/src/config');

	/**
	 * @class HeaderConfigurator
	 *
	 * Assembles MessengerHeaderController with the correct dependencies
	 * for global or nested navigation contexts.
	 */
	class HeaderConfigurator
	{
		/**
		 * @param {object} widget
		 * @return {MessengerHeaderController}
		 */
		static createGlobalController(widget)
		{
			return new MessengerHeaderController(
				new HeaderTitleController(widget, new GlobalTitleParamsProvider()),
				new HeaderButtonsController(widget, headerControllerConfig),
			);
		}

		/**
		 * @param {object} widget
		 * @param {DialogId} dialogId
		 * @return {MessengerHeaderController}
		 */
		static createNestedController(widget, dialogId)
		{
			return new MessengerHeaderController(
				new HeaderTitleController(widget, new NestedTitleParamsProvider(dialogId)),
				new HeaderButtonsController(widget, nestedHeaderControllerConfig),
			);
		}
	}

	module.exports = { HeaderConfigurator };
});
