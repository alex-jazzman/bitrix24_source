/**
 * @module im/messenger/controller/recent/service/floating-button/dummy
 */
jn.define('im/messenger/controller/recent/service/floating-button/dummy', (require, exports, module) => {
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {IFloatingButtonService}
	 * @class DummyFloatingButtonService
	 */
	class DummyFloatingButtonService extends BaseRecentService
	{
		renderAccentButton;
		renderButton;

		onInit()
		{
			this.logger.log('onInit');
		}

		subscribeEvents()
		{
			this.logger.log('subscribeEvents');
		}

		unsubscribeEvents()
		{
			this.logger.log('unsubscribeEvents');
		}

		redraw()
		{
			this.logger.log('redraw');
		}
	}

	module.exports = DummyFloatingButtonService;
});
