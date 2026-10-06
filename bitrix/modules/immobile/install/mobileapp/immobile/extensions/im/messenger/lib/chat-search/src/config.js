/**
 * @module im/messenger/lib/chat-search/src/config
 */
jn.define('im/messenger/lib/chat-search/src/config', (require, exports, module) => {
	/**
	 * @implements {BaseSearchConfig}
	 */
	class ChatSearchConfig
	{
		/**
		 * @param {number | null} [parentId=undefined]
		 */
		constructor(parentId = undefined)
		{
			this.id = 'search-experimental';
			this.clearUnavailableItems = false;
			this.context = 'IM_CHAT_SEARCH';
			this.preselectedItems = [];
			this.parentId = parentId;
			this.entities = [
				{
					id: 'im-recent-v2',
					dynamicSearch: true,
					dynamicLoad: true,
				},
			];
		}

		/**
		 * Merges new options into existing ones; `parentId` is always re-applied last.
		 *
		 * @param {ChatSearchConfigSetOptionParams} options
		 */
		setOption(options = {})
		{
			this.entities[0].options = {
				...(this.entities[0].options ?? {}),
				...options,
				parentId: this.parentId,
			};
		}

		getConfig()
		{
			/** @type {ajaxConfig} */
			return {
				json: {
					dialog: {
						entities: this.entities,
						preselectedItems: this.preselectedItems,
						clearUnavailableItems: this.clearUnavailableItems,
						context: this.context,
						id: this.id,
					},
				},
			};
		}

		getLoadLatestResultEndpoint()
		{
			return 'ui.entityselector.load';
		}

		getSaveItemEndpoint()
		{
			return 'ui.entityselector.saveRecentItems';
		}

		getSearchRequestEndpoint()
		{
			return 'ui.entityselector.doSearch';
		}
	}

	module.exports = { ChatSearchConfig };
});
