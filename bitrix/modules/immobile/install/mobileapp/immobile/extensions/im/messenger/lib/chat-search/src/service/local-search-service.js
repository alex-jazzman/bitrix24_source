/**
 * @module im/messenger/lib/chat-search/src/service/local-search-service
 */
jn.define('im/messenger/lib/chat-search/src/service/local-search-service', (require, exports, module) => {
	const { Type } = require('type');
	const { DialogType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogLocalSearchService } = require('im/messenger/lib/chat-search/src/service/dialog-local-search-service');
	const { UserLocalSearchService } = require('im/messenger/lib/chat-search/src/service/user-local-search-service');

	class LocalSearchService
	{
		constructor()
		{
			/**
			 * @private
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();

			/**
			 * @private
			 * @type {DialogLocalSearchService}
			 */
			this.dialogLocalSearchService = new DialogLocalSearchService();

			/**
			 * @private
			 * @type {UserLocalSearchService}
			 */
			this.userLocalSearchService = new UserLocalSearchService();
		}

		/**
		 * @param {Partial<SearchOptions>} searchOptions
		 * @param {DialoguesFilter} filter
		 * @return {Promise<Array<string>>}
		 */
		async search(searchOptions, filter)
		{
			const result = [];
			const limit = searchOptions.limit;
			const searchDialogIdsResult = await this.dialogLocalSearchService.search(searchOptions, filter);
			result.push(...searchDialogIdsResult);

			if (this.#isUserDialogIncluded(filter))
			{
				const searchUsersIdsResult = await this.userLocalSearchService.search(searchOptions);
				result.push(...searchUsersIdsResult);
			}

			return [...new Set(result)].slice(0, limit);
		}

		/**
		 * @param {DialoguesFilter} filter
		 * @return {boolean}
		 */
		#isUserDialogIncluded(filter)
		{
			const { dialogTypes, exceptDialogTypes } = filter;
			const isExpectedUsers = exceptDialogTypes?.includes(DialogType.user)
				|| dialogTypes?.includes(DialogType.private);
			const isNeedsUsers = dialogTypes?.includes(DialogType.user)
				|| dialogTypes?.includes(DialogType.private);

			return !isExpectedUsers && (isNeedsUsers || !Type.isArrayFilled(dialogTypes));
		}
	}

	module.exports = { LocalSearchService };
});
