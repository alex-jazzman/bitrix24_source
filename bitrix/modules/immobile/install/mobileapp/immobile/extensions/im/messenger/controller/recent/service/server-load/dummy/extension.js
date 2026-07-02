/**
 * @module im/messenger/controller/recent/service/server-load/dummy
 */
jn.define('im/messenger/controller/recent/service/server-load/dummy', (require, exports, module) => {
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {IServerLoadService}
	 * @class DummyServerLoadService
	 */
	class DummyServerLoadService extends BaseRecentService
	{
		onInit()
		{
			this.logger.log('onInit');
		}

		getInitRequestMethod(mode)
		{
			this.logger.log('getInitRequestMethod: return chatsList');

			return 'chatsList';
		}

		/**
		 * @param {RefreshModeType} mode
		 * @return {object}
		 */
		getInitRequestOptions(mode)
		{
			return {};
		}

		async handleInitResult(mode, initResult)
		{
			this.logger.log('handleInitResult', mode, initResult);
		}

		loadNextPage()
		{
			this.logger.log('loadNextPage');

			return Promise.resolve({ hasMore: false, lastItem: {} });
		}

		setLastItem(lastItem)
		{
			this.logger.log('setLastItem', lastItem);
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

	module.exports = DummyServerLoadService;
});
