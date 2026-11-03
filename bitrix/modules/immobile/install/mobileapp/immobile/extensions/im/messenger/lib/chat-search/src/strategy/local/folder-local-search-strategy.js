/**
 * @module im/messenger/lib/chat-search/src/strategy/local/folder-local-search-strategy
 */
jn.define('im/messenger/lib/chat-search/src/strategy/local/folder-local-search-strategy', (require, exports, module) => {
	const { PerfPoint } = require('debug/prism');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const {
		CopilotDefaultTitleSearch,
	} = require('im/messenger/lib/chat-search/src/strategy/local/copilot-default-title-search');

	/**
	 * Local search over the composition of a folder: the whole set of sections the folder is made of
	 * goes to the recent storage as one scope, so the answer costs a single query whatever the
	 * composition holds.
	 *
	 * The composition is asked for on every search rather than captured once: the search provider is
	 * built once per controller and lives the whole session, while the composition arrives with the
	 * folder list and changes while the tab is open.
	 *
	 * @class FolderLocalSearchStrategy
	 * @implements {LocalSearchStrategy}
	 */
	class FolderLocalSearchStrategy
	{
		/**
		 * @param {object} params
		 * @param {function(): (Set<string>|Array<string>)} params.getSections
		 * @param {number | null} [params.parentChatId]
		 */
		constructor({ getSections, parentChatId })
		{
			this.getSections = getSections;
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
			const sections = [...this.getSections()];
			const point = new PerfPoint('recent-folder-search-db', `${sections.length} sections`).start();

			try
			{
				point.startPoint('search-query');
				const items = await this.#searchInLocalDb(searchOptions, sections);
				point.endPoint('search-query', { itemsCount: items.length });

				point.startPoint('model-seed');
				await this.#setChatsToStorage(items);
				point.endPoint('model-seed');

				const ids = items.map((item) => String(item.id));

				point.startPoint('copilot-default-titles');
				const withCopilotDefaults = await this.#addCopilotDefaultTitles(ids, searchOptions, sections);
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
		 * The chats of the composition the text query cannot reach: those shown under the name of the
		 * assistant instead of their stored title. Nothing is added while the composition holds no
		 * copilot section, and nothing while the query does not look like that name.
		 *
		 * @param {Array<string>} ids
		 * @param {Partial<SearchOptions>} searchOptions
		 * @param {Array<string>} sections
		 * @return {Promise<Array<string>>}
		 */
		async #addCopilotDefaultTitles(ids, searchOptions, sections)
		{
			if (!CopilotDefaultTitleSearch.isInScope(sections))
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
		 * @param {Array<string>} sections
		 * @return {Promise<Array<object>>}
		 */
		async #searchInLocalDb(searchOptions, sections)
		{
			const recentRepository = serviceLocator.get('core').getRepository().recent;
			const searchDbResult = await recentRepository.searchByText({
				searchText: searchOptions.searchText,
				sections,
				parentChatId: this.parentChatId,
				limit: searchOptions.limit,
			});

			return searchDbResult.items;
		}

		/**
		 * @param {Array<object>} items
		 * @return {Promise<void>}
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

	module.exports = { FolderLocalSearchStrategy };
});
