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
		onInit()
		{
			this.logger.log('on init');
		}
	}

	module.exports = DummyExternalService;
});
