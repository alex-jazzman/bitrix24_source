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
		#isChangedBySelf = false;

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

		/**
		 * @returns {number}
		 */
		get parentChatId()
		{
			return this.recentLocator.get('parentChatId');
		}

		onInit()
		{
			this.logger.log('onInit');

			const defaultFilterId = this.props?.defaultFilterId ?? RecentFilterId.all;
			const currentFilterId = this.store.getters['recentModel/recentFilteredModel/getCurrentFilterId'](this.tabId, this.parentChatId);

			if (!currentFilterId || currentFilterId === RecentFilterId.all)
			{
				void this.store.dispatch('recentModel/recentFilteredModel/setCurrentFilter', {
					tabId: this.tabId,
					parentChatId: this.parentChatId,
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
		 * @param {{ bySelf?: boolean }} [options] bySelf marks a filter change made by the user
		 */
		async applyFilter(filterId, options = {})
		{
			this.logger.log('applyFilter', filterId, options);

			if (!Type.isStringFilled(filterId))
			{
				this.logger.warn('applyFilter: invalid filterId, skip', filterId);

				return;
			}

			const currentFilterId = this.store.getters['recentModel/recentFilteredModel/getCurrentFilterId'](this.tabId, this.parentChatId);
			let effectiveFilterId = filterId;

			if (currentFilterId === filterId && filterId !== RecentFilterId.all)
			{
				this.logger.log('applyFilter: same filter, reset to all');
				effectiveFilterId = RecentFilterId.all;
			}
			else if (currentFilterId === filterId)
			{
				this.logger.log('applyFilter: same filter, skip');

				return;
			}

			this.#isChangedBySelf = options.bySelf === true;

			await this.store.dispatch('recentModel/recentFilteredModel/setCurrentFilter', {
				tabId: this.tabId,
				parentChatId: this.parentChatId,
				filterId: effectiveFilterId,
			});

			this.#sendAnalyticsEventBySelectedFilter(effectiveFilterId);
		}

		/**
		 * @param {{ bySelf?: boolean }} [options]
		 * @returns {Promise<void>}
		 */
		async resetFilter(options = {})
		{
			await this.applyFilter(RecentFilterId.all, options);
		}

		/**
		 * @desc Reads and drops the mark of a filter change made by the user. The mark is set by
		 * applyFilter and consumed by the handler that puts the filtered item list into the render queue,
		 * because the recalculation chain is not finished by the time applyFilter returns.
		 * @returns {boolean}
		 */
		consumeChangedBySelf()
		{
			const isChangedBySelf = this.#isChangedBySelf;
			this.#isChangedBySelf = false;

			return isChangedBySelf;
		}

		/**
		 * @returns {string}
		 */
		getCurrentFilterId()
		{
			return this.store.getters['recentModel/recentFilteredModel/getCurrentFilterId'](this.tabId, this.parentChatId);
		}

		/**
		 * @returns {boolean}
		 */
		hasSelectedFilter()
		{
			return this.store.getters['recentModel/recentFilteredModel/hasSelectedFilter'](this.tabId, this.parentChatId);
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
