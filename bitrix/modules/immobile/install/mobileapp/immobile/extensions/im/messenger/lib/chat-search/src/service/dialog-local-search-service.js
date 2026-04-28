/**
* @module im/messenger/lib/chat-search/src/service/dialog-local-search-service
*/
jn.define('im/messenger/lib/chat-search/src/service/dialog-local-search-service', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');

	class DialogLocalSearchService
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
		 * @param {DialoguesFilter} filter
		 * @return {Promise<Array<string>>}
		 */
		async search(searchOptions, filter)
		{
			const searchDbResult = await this.#searchInLocalDb(searchOptions, filter);
			void await this.#setChatsToStorage(searchDbResult);

			return this.#getDialogIds(searchDbResult);
		}

		/**
		 * @description The local database is being searched. The result is recorded in the storage
		 * @param {Partial<SearchOptions>} searchOptions
		 * @param {DialoguesFilter} filter
		 * @return {Promise<Array<DialoguesModelState>>}
		 */
		async #searchInLocalDb(searchOptions, filter)
		{
			const dialogRepository = serviceLocator.get('core').getRepository().dialog;
			const searchDbResult = await dialogRepository.searchByText({
				searchOptions,
				filter,
			});

			return searchDbResult.items;
		}

		/**
		 * @param {Array<DialoguesModelState>} dialogModels
		 * @return {Array<string>}
		 */
		#getDialogIds(dialogModels)
		{
			return dialogModels.map((item) => String(item.dialogId));
		}

		/**
		 * @param {Array<DialoguesModelState>} dialogues
		 * @returns {Promise<void>}
		 */
		async #setChatsToStorage(dialogues)
		{
			await this.store.dispatch('dialoguesModel/set', dialogues);

			const userRepository = serviceLocator.get('core').getRepository().user;
			const userIds = dialogues
				.filter((chat) => DialogHelper.isChatId(chat.dialogId))
				.map((chat) => Number(chat.dialogId));
			const users = await userRepository.getListByIds(userIds);
			await this.store.dispatch('usersModel/setFromLocalDatabase', users.items);
		}
	}

	module.exports = { DialogLocalSearchService };
});
