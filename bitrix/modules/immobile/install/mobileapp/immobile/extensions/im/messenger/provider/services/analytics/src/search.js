/**
 * @module im/messenger/provider/services/analytics/src/search
 */
jn.define('im/messenger/provider/services/analytics/src/search', (require, exports, module) => {
	const { Type } = require('type');
	const { AnalyticsEvent } = require('analytics');

	const { Analytics, ChatSearchSelectorSection } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	const SUB_SECTION_CODE = {
		[ChatSearchSelectorSection.carousel]: 'recent_chats',
		[ChatSearchSelectorSection.recent]: 'recent_search',
	};

	/**
	 * @class SearchAnalytics
	 */
	class SearchAnalytics
	{
		constructor()
		{
			/**
			 * @private
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();

			/** @private */
			this.logger = getLoggerWithContext('analytics-service', this);
		}

		sendOpenSearch()
		{
			try
			{
				const sectionCode = AnalyticsHelper.getSectionCode();
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.messenger)
					.setEvent(Analytics.Event.openSearch)
					.setSection(sectionCode)
					.send();
			}
			catch (error)
			{
				this.logger.error('sendOpenSearch error', error);
			}
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {string} recentSelectorSection
		 */
		sendClickRecentSuggest(dialogId, recentSelectorSection)
		{
			try
			{
				const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
				if (Type.isNil(dialog))
				{
					return;
				}

				const sectionCode = AnalyticsHelper.getSectionCode();
				const p1Code = AnalyticsHelper.getP1ByDialog(dialog);
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.messenger)
					.setEvent(Analytics.Event.clickRecentSuggest)
					.setSection(sectionCode)
					.setSubSection(SUB_SECTION_CODE[recentSelectorSection])
					.setP1(p1Code)
					.send();
			}
			catch (error)
			{
				this.logger.error('sendClickRecentSuggest error', error);
			}
		}

		sendStartSearch()
		{
			try
			{
				const sectionCode = AnalyticsHelper.getSectionCode();
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.messenger)
					.setEvent(Analytics.Event.startSearch)
					.setSection(sectionCode)
					.send();
			}
			catch (error)
			{
				this.logger.error('sendStartSearch error', error);
			}
		}

		/**
		 * @param {boolean} hasResult
		 */
		sendSearchResult(hasResult)
		{
			try
			{
				const sectionCode = AnalyticsHelper.getSectionCode();
				const statusCode = hasResult ? Analytics.Status.success : Analytics.Status.notFound;
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.messenger)
					.setEvent(Analytics.Event.searchResult)
					.setSection(sectionCode)
					.setStatus(statusCode)
					.send();
			}
			catch (error)
			{
				this.logger.error('sendSearchResult error', error);
			}
		}

		sendCancelSearch()
		{
			try
			{
				const sectionCode = AnalyticsHelper.getSectionCode();
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.messenger)
					.setEvent(Analytics.Event.cancelSearch)
					.setSection(sectionCode)
					.send();
			}
			catch (error)
			{
				this.logger.error('sendCancelSearch error', error);
			}
		}

		/**
		 * @param {number} position
		 */
		sendSelectSearchResult(position)
		{
			try
			{
				const sectionCode = AnalyticsHelper.getSectionCode();
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.messenger)
					.setEvent(Analytics.Event.selectSearchResult)
					.setSection(sectionCode)
					.setP3(`position_${position + 1}`)
					.send();
			}
			catch (error)
			{
				this.logger.error('sendSelectSearchResult error', error);
			}
		}
	}

	module.exports = {
		SearchAnalytics,
	};
});
