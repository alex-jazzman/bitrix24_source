/**
 * @module im/messenger/lib/chat-search/src/strategy/local/dialog-local-search-strategy
 */
jn.define('im/messenger/lib/chat-search/src/strategy/local/dialog-local-search-strategy', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper, UserHelper } = require('im/messenger/lib/helper');

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
		 * @param {Boolean} [params.excludeGuests=false] — drop im-guest 1-1 dialogs from results
		 */
		constructor({ dialogTypes, exceptDialogTypes, excludeGuests } = {})
		{
			this.dialogTypes = dialogTypes;
			this.exceptDialogTypes = exceptDialogTypes;
			this.excludeGuests = excludeGuests ?? false;

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
			const activeItems = await this.#setChatsToStorage(items);

			const filteredItems = this.excludeGuests
				? activeItems.filter((item) => !this.#isGuestUserDialog(item.dialog))
				: activeItems;

			return filteredItems.map((item) => String(item.dialog.dialogId));
		}

		/**
		 * @param {object} dialog
		 * @return {boolean}
		 */
		#isGuestUserDialog(dialog)
		{
			if (DialogHelper.isDialogId(dialog.dialogId))
			{
				return false;
			}

			return UserHelper.createByUserId(Number(dialog.dialogId))?.isGuest === true;
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
			const activeItems = await this.#setChatsToStorage(items);

			return activeItems.map((item) => String(item.dialog.dialogId));
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
		 * Saves chats to store and returns items with inactive 1:1 users filtered out.
		 * Group chats (non-numeric dialogId) are always kept.
		 * Items without a loaded user profile are treated as active.
		 *
		 * @param {Array<DialogWithRecent>} items
		 * @returns {Promise<Array<DialogWithRecent>>}
		 */
		async #setChatsToStorage(items)
		{
			if (!Type.isArrayFilled(items))
			{
				return [];
			}

			const userRepository = serviceLocator.get('core').getRepository().user;
			const userIds = items
				.map((item) => item.dialog)
				.filter((dialog) => DialogHelper.isChatId(dialog.dialogId))
				.map((dialog) => Number(dialog.dialogId))
			;
			const users = await userRepository.getListByIds(userIds);

			const inactiveUserIds = new Set(
				users.items
					.filter((user) => user.active === false)
					.map((user) => user.id),
			);

			const activeItems = items.filter((item) =>
			{
				const { dialogId } = item.dialog;

				if (!DialogHelper.isChatId(dialogId))
				{
					return true;
				}

				return !inactiveUserIds.has(Number(dialogId));
			});

			const dialogues = activeItems.map((item) => item.dialog);
			await this.store.dispatch('dialoguesModel/set', dialogues);

			const recentItems = activeItems
				.map((item) => item.recent)
				.filter(Boolean)
			;
			if (recentItems.length > 0)
			{
				await this.store.dispatch('recentModel/setFromLocalDatabase', recentItems);
			}

			const activeUsers = users.items.filter((user) => user.active !== false);
			await this.store.dispatch('usersModel/setFromLocalDatabase', activeUsers);

			return activeItems;
		}
	}

	module.exports = { DialogLocalSearchStrategy };
});
