/**
 * @module im/messenger/controller/recent/service/external/dummy
 */
jn.define('im/messenger/controller/recent/service/external/dummy', (require, exports, module) => {
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {IExternalService}
	 * @class DummyExternalService
	 */
	class DummyExternalService extends BaseRecentService
	{
		getCallList;

		onInit()
		{
			this.logger.log('on init');
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

	module.exports = DummyExternalService;
});
