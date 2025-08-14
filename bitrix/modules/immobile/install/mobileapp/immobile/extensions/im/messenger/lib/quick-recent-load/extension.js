/**
 * @module im/messenger/lib/quick-recent-load
 */
jn.define('im/messenger/lib/quick-recent-load', (require, exports, module) => {
	/* global dialogList */
	const { RecentViewCache } = require('im/messenger/cache');
	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('recent--quick-load');

	/**
	 * @class QuickRecentLoader
	 */
	class QuickRecentLoader
	{
		constructor()
		{
			/** @typedef {RecentViewCache}  */
			this.cache = new RecentViewCache();
		}

		/**
		 * @void
		 */
		static renderItemsOnViewLoaded()
		{
			logger.warn('QuickRecentLoader.renderCachedItems');

			new QuickRecentLoader().renderWhenViewIsReady();
		}

		/**
		 * @param {Array<JNListWidgetSectionItem>} sections
		 * @param {Array<RecentWidgetItem>} items
		 */
		saveCache(sections, items)
		{
			this.cache.save(sections, items);
		}

		/**
		 * @void
		 */
		renderWhenViewIsReady()
		{
			const cache = this.cache.get();

			BX.onViewLoaded(() => {
				if (cache)
				{
					this.renderCachedItems(cache);
				}
			});
		}

		/**
		 * @param {RecentViewCacheData} cacheData
		 * @void
		 */
		renderCachedItems(cacheData)
		{
			try
			{
				dialogList.setItems(cacheData.items, cacheData.sections);
				logger.log(`${this.constructor.name}.renderCachedItems dialogList.setItems:`, cacheData.items, cacheData.sections);
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.renderCachedItems dialogList.setItems.catch:`, error);
			}
		}
	}

	module.exports = {
		QuickRecentLoader,
	};
});
