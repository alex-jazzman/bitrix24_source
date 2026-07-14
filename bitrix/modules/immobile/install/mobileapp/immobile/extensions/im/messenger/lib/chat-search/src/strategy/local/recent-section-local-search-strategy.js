/**
 * @module im/messenger/lib/chat-search/src/strategy/local/recent-section-local-search-strategy
 */
jn.define('im/messenger/lib/chat-search/src/strategy/local/recent-section-local-search-strategy', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');

	/**
	 * @class RecentSectionLocalSearchStrategy
	 * @implements {LocalSearchStrategy}
	 */
	class RecentSectionLocalSearchStrategy
	{
		/**
		 * @param {object} params
		 * @param {string} params.section
		 * @param {number | null} [params.parentChatId]
		 */
		constructor({ section, parentChatId })
		{
			this.section = section;
			this.parentChatId = parentChatId ?? null;

			/**
			 * @private
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {Partial<SearchOptions>} searchOptions
		 * @return {Promise<Array<string>>}
		 */
		async search(searchOptions)
		{
			const items = await this.#searchInLocalDb(searchOptions);
			void await this.#setChatsToStorage(items);

			return items.map((item) => String(item.id));
		}

		/**
		 * @param {Partial<SearchOptions>} searchOptions
		 * @return {Promise<Array<object>>}
		 */
		async #searchInLocalDb(searchOptions)
		{
			const recentRepository = serviceLocator.get('core').getRepository().recent;
			const searchDbResult = await recentRepository.searchByText({
				searchText: searchOptions.searchText,
				section: this.section,
				parentChatId: this.parentChatId,
				limit: searchOptions.limit,
			});

			return searchDbResult.items;
		}

		/**
		 * @param {Array<object>} items
		 * @returns {Promise<void>}
		 */
		async #setChatsToStorage(items)
		{
			const dialogues = items.map((item) => item.chat).filter(Boolean);
			await this.store.dispatch('dialoguesModel/set', dialogues);

			const userRepository = serviceLocator.get('core').getRepository().user;
			const userIds = dialogues
				.filter((chat) => DialogHelper.isChatId(chat.dialogId))
				.map((chat) => Number(chat.dialogId))
			;
			const users = await userRepository.getListByIds(userIds);
			await this.store.dispatch('usersModel/setFromLocalDatabase', users.items);
		}
	}

	module.exports = { RecentSectionLocalSearchStrategy };
});
