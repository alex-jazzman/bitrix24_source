/**
 * @module im/messenger/controller/recent/service/search/common
 */
jn.define('im/messenger/controller/recent/service/search/common', (require, exports, module) => {
	const { ChatSearchSelector } = require('im/messenger/lib/chat-search');
	const { EventType } = require('im/messenger/const');

	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {ISearchService}
	 * @class CommonSearchService
	 */
	class CommonSearchService extends BaseUiRecentService
	{
		onInit()
		{
			this.logger.log('onInit');
		}

		/**
		 * @param {BaseList} ui
		 */
		async onUiReady(ui)
		{
			this.logger.log('onUiReady');

			this.searchSelector = new ChatSearchSelector(ui, {
				filter: this.props.filter,
				recentTab: this.props.recentTab,
				sections: this.props.sections,
			});

			ui?.on(EventType.recent.searchHide, this.closeSearchHandler.bind(this));
		}

		async openSearch()
		{
			this.logger.log('openSearch');

			try
			{
				await this.uiReadyPromise;
				this.searchSelector.open();
			}
			catch (error)
			{
				this.logger.error('openSearch error: ', error);
			}
		}

		closeSearchHandler()
		{
			this.logger.log('closeSearchHandler');

			try
			{
				this.searchSelector.close();
			}
			catch (error)
			{
				this.logger.error('closeSearchHandler error: ', error);
			}
		}
	}

	module.exports = CommonSearchService;
});
