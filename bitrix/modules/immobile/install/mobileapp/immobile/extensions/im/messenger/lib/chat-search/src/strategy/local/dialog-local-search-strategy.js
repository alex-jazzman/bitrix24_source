/**
 * @module im/messenger/lib/chat-search/src/strategy/local/dialog-local-search-strategy
 */
jn.define('im/messenger/lib/chat-search/src/strategy/local/dialog-local-search-strategy', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');

	/**
	 * @class DialogLocalSearchStrategy
	 * @implements {LocalSearchStrategy}
	 */
	class DialogLocalSearchStrategy
	{
		/**
		 * @param {object} [params]
		 * @param {Array<string>} [params.dialogTypes] - positive whitelist; takes precedence over exceptDialogTypes
		 * @param {Array<string>} [params.exceptDialogTypes]
		 */
		constructor({ dialogTypes, exceptDialogTypes } = {})
		{
			this.dialogTypes = dialogTypes;
			this.exceptDialogTypes = exceptDialogTypes;

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

			return items.map((item) => String(item.dialog.dialogId));
		}

		/**
		 * @param {object} params
		 * @param {Array<string>} params.types
		 * @param {number} [params.limit]
		 * @return {Promise<Array<string>>}
		 */
		async preload({ types, limit })
		{
			const dialogRepository = serviceLocator.get('core').getRepository().dialog;
			const { items } = await dialogRepository.getRecentListByTypes({ types, limit });
			void await this.#setChatsToStorage(items);

			return items.map((item) => String(item.dialog.dialogId));
		}

		/**
		 * @param {Partial<SearchOptions>} searchOptions
		 * @return {Promise<Array<DialogWithRecent>>}
		 */
		async #searchInLocalDb(searchOptions)
		{
			const dialogRepository = serviceLocator.get('core').getRepository().dialog;
			const searchDbResult = await dialogRepository.searchByText({
				searchText: searchOptions.searchText,
				dialogTypes: this.dialogTypes,
				exceptDialogTypes: this.exceptDialogTypes,
				limit: searchOptions.limit,
			});

			return searchDbResult.items;
		}

		/**
		 * @param {Array<DialogWithRecent>} items
		 * @returns {Promise<void>}
		 */
		async #setChatsToStorage(items)
		{
			if (!Type.isArrayFilled(items))
			{
				return;
			}

			const dialogues = items.map((item) => item.dialog);
			await this.store.dispatch('dialoguesModel/set', dialogues);

			const recentItems = items
				.map((item) => item.recent)
				.filter(Boolean)
			;
			if (recentItems.length > 0)
			{
				await this.store.dispatch('recentModel/setFromLocalDatabase', recentItems);
			}

			const userRepository = serviceLocator.get('core').getRepository().user;
			const userIds = dialogues
				.filter((dialog) => DialogHelper.isChatId(dialog.dialogId))
				.map((dialog) => Number(dialog.dialogId))
			;
			const users = await userRepository.getListByIds(userIds);
			await this.store.dispatch('usersModel/setFromLocalDatabase', users.items);
		}
	}

	module.exports = { DialogLocalSearchStrategy };
});
