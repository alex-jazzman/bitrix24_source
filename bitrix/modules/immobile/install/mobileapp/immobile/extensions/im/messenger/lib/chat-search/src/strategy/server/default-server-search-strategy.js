/**
 * @module im/messenger/lib/chat-search/src/strategy/server/default-server-search-strategy
 */
jn.define('im/messenger/lib/chat-search/src/strategy/server/default-server-search-strategy', (require, exports, module) => {
	const { Type } = require('type');
	const { ChatServerSearchService } = require('im/messenger/lib/chat-search/src/service/server-search-service');

	/**
	 * @class DefaultServerSearchStrategy
	 * @implements {ServerSearchStrategy}
	 */
	class DefaultServerSearchStrategy
	{
		/**
		 * @param {object} params
		 * @param {BaseSearchConfig} params.config
		 * @param {string} [params.recentTab]
		 * @param {() => object} [params.dynamicOptions]
		 *        — function returning options applied to config via setOption() before each call.
		 *          Use for runtime-dependent options like contextChatId or per-context exclude lists.
		 */
		constructor({ config, recentTab, dynamicOptions })
		{
			this.config = config;
			this.recentTab = recentTab;
			this.dynamicOptions = dynamicOptions;

			/**
			 * @private
			 * @type {ChatServerSearchService}
			 */
			this.serverService = new ChatServerSearchService(config);
		}

		/**
		 * @return {StoreUpdater}
		 */
		get storeUpdater()
		{
			return this.serverService.storeUpdater;
		}

		/**
		 * @param {Array<string>} searchingWords
		 * @param {string} originalQuery
		 * @return {Promise<RecentSearchResult>}
		 */
		async search(searchingWords, originalQuery)
		{
			this.#applyDynamicOptions();

			return this.serverService.search(searchingWords, originalQuery, this.recentTab);
		}

		/**
		 * @return {Promise<Array<string>>}
		 */
		async loadRecent()
		{
			this.#applyDynamicOptions();

			return this.serverService.loadRecent(this.recentTab);
		}

		/**
		 * @param {DialogId} dialogId
		 * @return {Promise<*>}
		 */
		async saveItemToRecent(dialogId)
		{
			return this.serverService.saveItemToRecent(dialogId);
		}

		#applyDynamicOptions()
		{
			if (Type.isFunction(this.dynamicOptions))
			{
				this.config.setOption(this.dynamicOptions());
			}
		}
	}

	module.exports = { DefaultServerSearchStrategy };
});
