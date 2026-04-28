/**
 * @module im/messenger/controller/recent/service/filter/common
 */
jn.define('im/messenger/controller/recent/service/filter/common', (require, exports, module) => {
	const { Type } = require('type');

	const { RecentFilterId } = require('im/messenger/const');
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	/**
	 * @implements {IFilterService}
	 * @class CommonFilterService
	 * @extends BaseUiRecentService<CommonFilterServiceProps>
	 */
	class CommonFilterService extends BaseUiRecentService
	{
		/**
		 * @returns {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @returns {string}
		 */
		get tabId()
		{
			return this.recentLocator.get('id');
		}

		onInit()
		{
			this.logger.log('onInit');

			const defaultFilterId = this.props?.defaultFilterId ?? RecentFilterId.all;
			const currentFilterId = this.store.getters['recentModel/recentFilteredModel/getCurrentFilterId'](this.tabId);

			if (!currentFilterId || currentFilterId === RecentFilterId.all)
			{
				void this.store.dispatch('recentModel/recentFilteredModel/setCurrentFilter', {
					tabId: this.tabId,
					filterId: defaultFilterId,
				});
			}
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

			if (!Type.isStringFilled(filterId))
			{
				this.logger.warn('applyFilter: invalid filterId, skip', filterId);

				return;
			}

			const currentFilterId = this.store.getters['recentModel/recentFilteredModel/getCurrentFilterId'](this.tabId);

			if (currentFilterId === filterId)
			{
				this.logger.log('applyFilter: same filter, skip');

				return;
			}

			await this.store.dispatch('recentModel/recentFilteredModel/setCurrentFilter', {
				tabId: this.tabId,
				filterId,
			});

			this.#sendAnalyticsEventBySelectedFilter(filterId);
		}

		/**
		 * @returns {string}
		 */
		getCurrentFilterId()
		{
			return this.store.getters['recentModel/recentFilteredModel/getCurrentFilterId'](this.tabId);
		}

		/**
		 * @returns {boolean}
		 */
		hasSelectedFilter()
		{
			return this.store.getters['recentModel/recentFilteredModel/hasSelectedFilter'](this.tabId);
		}

		/**
		 * @param {FilterId} filterId
		 */
		#sendAnalyticsEventBySelectedFilter(filterId)
		{
			if (filterId === RecentFilterId.unread)
			{
				AnalyticsService.getInstance().recentAnalytics.sendTapShowUnread(this.tabId);
			}
		}
	}

	module.exports = CommonFilterService;
});
