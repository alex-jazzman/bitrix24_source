/**
 * @module im/messenger/controller/recent/service/vuex/dummy
 */
jn.define('im/messenger/controller/recent/service/vuex/dummy', (require, exports, module) => {
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {IVuexService}
	 * @class DummyVuexService
	 */
	class DummyVuexService extends BaseRecentService
	{
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
	}

	module.exports = DummyVuexService;
});
