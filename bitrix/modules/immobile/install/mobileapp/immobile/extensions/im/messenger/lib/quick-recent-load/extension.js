/**
 * @module im/messenger/lib/quick-recent-load
 */
jn.define('im/messenger/lib/quick-recent-load', (require, exports, module) => {
	const { RecentViewCache } = require('im/messenger/cache');
	const { MessengerParams } = require('im/messenger/lib/params');

	/**
	 * @class QuickRecentLoader
	 */
	class QuickRecentLoader
	{
		constructor(ui, cacheName = this.getCacheName())
		{
			/** @typedef {RecentViewCache}  */
			this.cache = new RecentViewCache(cacheName);
		}

		destructor()
		{
			this.cache.destructor();
		}

		getCacheName()
		{
			return `${MessengerParams.getComponentCode() || 'im.messenger'}/recent`;
		}

		/**
		 * @param {Array<JNListWidgetSectionItem>} sections
		 * @param {Array<RecentWidgetItem|RecentItem>} items
		 */
		saveCache(sections, items)
		{
			this.cache.save(sections, items);
		}

		/**
		 * @desc Reads the snapshot without showing it: the tab path puts it through the render
		 * queue instead of calling the native list directly. The read is also the validation point of
		 * the item button contract: an incompatible profile drops the whole snapshot here, so a
		 * `button` the current client no longer accepts never reaches the render queue.
		 * @return {RecentViewCacheData|boolean} false when there is no snapshot, or the theme, the
		 * database generation or the item button contract profile changed
		 */
		getCachedSnapshot()
		{
			return this.cache.get();
		}

		/**
		 * @desc Drops the stored snapshot. The snapshot lives in its own storage, so wiping the local
		 * database leaves it behind: without this the next start shows chats of a database that no
		 * longer exists.
		 */
		clearCache()
		{
			this.cache.clear();
		}
	}

	module.exports = {
		QuickRecentLoader,
	};
});
