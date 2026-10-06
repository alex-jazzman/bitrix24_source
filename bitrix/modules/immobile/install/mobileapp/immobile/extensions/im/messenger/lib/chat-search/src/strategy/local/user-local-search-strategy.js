/**
 * @module im/messenger/lib/chat-search/src/strategy/local/user-local-search-strategy
 */
jn.define('im/messenger/lib/chat-search/src/strategy/local/user-local-search-strategy', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { UserType } = require('im/messenger/const');

	class UserLocalSearchStrategy
	{
		constructor()
		{
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
			const searchDbResult = await this.#searchInLocalDb(searchOptions);
			const visibleUsers = this.#filterGuests(this.#filterHiddenBots(searchDbResult));
			void await this.#setUsersToStorage(visibleUsers);

			return this.#getDialogIds(visibleUsers);
		}

		/**
		 * @description Drops im-guest users from results. Guests with whom the current user
		 * had a dialog stay visible because they are returned by the parallel
		 * RecentSectionLocalSearchStrategy (which queries the recent table).
		 * @param {Array<UsersModelState>} users
		 * @return {Array<UsersModelState>}
		 */
		#filterGuests(users)
		{
			return users.filter((user) => user && user.type !== UserType.guest);
		}

		/**
		 * @description The local database is being searched. The result is recorded in the storage
		 * @param {Partial<SearchOptions>} searchOptions
		 * @return {Promise<Array<UsersModelState>>}
		 */
		async #searchInLocalDb(searchOptions)
		{
			const userRepository = serviceLocator.get('core').getRepository().user;
			const searchDbResult = await userRepository.searchByText(searchOptions);

			return searchDbResult.items;
		}

		/**
		 * @param {Array<UsersModelState>} users
		 * @return {Array<UsersModelState>}
		 */
		#filterHiddenBots(users)
		{
			return users.filter((user) => user?.botData?.isHidden !== true);
		}

		/**
		 * @param {Array<UsersModelState>} userModels
		 * @return {Array<string>}
		 */
		#getDialogIds(userModels)
		{
			return userModels.map((item) => String(item.id));
		}

		/**
		 * @param {Array<UsersModelState>} users
		 * @returns {Promise<void>}
		 */
		async #setUsersToStorage(users)
		{
			if (!Type.isArrayFilled(users))
			{
				return;
			}

			await this.store.dispatch('usersModel/setFromLocalDatabase', users);
		}
	}

	module.exports = { UserLocalSearchStrategy };
});
