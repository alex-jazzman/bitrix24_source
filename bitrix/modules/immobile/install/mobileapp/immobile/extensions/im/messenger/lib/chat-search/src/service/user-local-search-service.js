/**
 * @module im/messenger/lib/chat-search/src/service/user-local-search-service
 */
jn.define('im/messenger/lib/chat-search/src/service/user-local-search-service', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	class UserLocalSearchService
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
			void await this.#setUsersToStorage(searchDbResult);

			return this.#getDialogIds(searchDbResult);
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

	module.exports = { UserLocalSearchService };
});
