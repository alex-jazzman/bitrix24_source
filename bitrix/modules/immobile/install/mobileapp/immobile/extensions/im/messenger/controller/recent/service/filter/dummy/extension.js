/**
 * @module im/messenger/controller/recent/service/filter/dummy
 */
jn.define('im/messenger/controller/recent/service/filter/dummy', (require, exports, module) => {
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {IFilterService}
	 * @class DummyFilterService
	 */
	class DummyFilterService extends BaseUiRecentService
	{
		onInit()
		{
			this.logger.log('onInit');
		}

		async onUiReady(ui)
		{
			this.logger.log('onUiReady');
		}

		/**
		 * @param {FilterId} filterId
		 */
		async applyFilter(filterId)
		{
			this.logger.log('applyFilter', filterId);
		}

		/**
		 * @returns {string}
		 */
		getCurrentFilterId()
		{
			this.logger.log('getCurrentFilterId');

			return '';
		}

		/**
		 * @returns {boolean}
		 */
		hasSelectedFilter()
		{
			this.logger.log('getCurrentFilterId');

			return false;
		}
	}

	module.exports = DummyFilterService;
});
