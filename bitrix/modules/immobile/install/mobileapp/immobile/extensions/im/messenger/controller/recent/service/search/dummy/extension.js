/**
 * @module im/messenger/controller/recent/service/search/dummy
 */
jn.define('im/messenger/controller/recent/service/search/dummy', (require, exports, module) => {
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {ISearchService}
	 * @class DummySearchService
	 */
	class DummySearchService extends BaseRecentService
	{
		onInit()
		{
			this.logger.log('onInit');
		}

		openSearch()
		{
			this.logger.log('openSearch');
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

	module.exports = DummySearchService;
});
