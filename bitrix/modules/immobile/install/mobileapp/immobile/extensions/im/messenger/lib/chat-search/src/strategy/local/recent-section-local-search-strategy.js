/**
 * @module im/messenger/lib/chat-search/src/strategy/local/recent-section-local-search-strategy
 */
jn.define('im/messenger/lib/chat-search/src/strategy/local/recent-section-local-search-strategy', (require, exports, module) => {
	const { PerfPoint } = require('debug/prism');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const {
		CopilotDefaultTitleSearch,
	} = require('im/messenger/lib/chat-search/src/strategy/local/copilot-default-title-search');

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
			const point = new PerfPoint('recent-section-search-db', this.section).start();

			try
			{
				point.startPoint('search-query');
				const items = await this.#searchInLocalDb(searchOptions);
				point.endPoint('search-query', { itemsCount: items.length });

				point.startPoint('model-seed');
				void await this.#setChatsToStorage(items);
				point.endPoint('model-seed');

				const ids = items.map((item) => String(item.id));

				point.startPoint('copilot-default-titles');
				const withCopilotDefaults = await this.#addCopilotDefaultTitles(ids, searchOptions);
				point.endPoint('copilot-default-titles', { itemsCount: withCopilotDefaults.length - ids.length });

				return withCopilotDefaults;
			}
			catch (error)
			{
				// closes the phase that was open when it failed; an already closed key is a no-op
				point.endPoint('search-query', { error });
				point.endPoint('model-seed', { error });
				point.endPoint('copilot-default-titles', { error });

				throw error;
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * The chats of the section the text query cannot reach: those shown under the name of the
		 * assistant instead of their stored title. Only the copilot section has such chats, and only a
		 * query that looks like that name brings them.
		 *
		 * @param {Array<string>} ids
		 * @param {Partial<SearchOptions>} searchOptions
		 * @return {Promise<Array<string>>}
		 */
		async #addCopilotDefaultTitles(ids, searchOptions)
		{
			if (!CopilotDefaultTitleSearch.isInScope(this.section))
			{
				return ids;
			}

			const copilotIds = await CopilotDefaultTitleSearch.search({
				searchText: searchOptions.searchText,
				parentChatId: this.parentChatId,
			});

			return copilotIds.length === 0 ? ids : [...new Set([...ids, ...copilotIds])];
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
