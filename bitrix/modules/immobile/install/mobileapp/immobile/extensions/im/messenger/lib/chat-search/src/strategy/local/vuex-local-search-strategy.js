/**
 * @module im/messenger/lib/chat-search/src/strategy/local/vuex-local-search-strategy
 */
jn.define('im/messenger/lib/chat-search/src/strategy/local/vuex-local-search-strategy', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { getWordsFromText } = require('im/messenger/lib/chat-search/src/helper/get-words-from-text');

	const normalize = (text) => text.toLocaleLowerCase(env.languageId);
	const normalizeWords = (text) => getWordsFromText(text).map(normalize);

	/**
	 * @class VuexLocalSearchStrategy
	 * @implements {LocalSearchStrategy}
	 * @description Local search over Vuex models. Filters already-loaded dialogues collection
	 * by dialog/user fields. Used when SQLite is unavailable (embedded mode) — covers both
	 * dialogs preloaded by loadLatestSearch and dialogs added by previous server-search hits.
	 */
	class VuexLocalSearchStrategy
	{
		/**
		 * @param {object} [params]
		 * @param {Array<string>} [params.exceptDialogTypes]
		 */
		constructor({ exceptDialogTypes } = {})
		{
			this.exceptDialogTypes = Type.isArrayFilled(exceptDialogTypes)
				? new Set(exceptDialogTypes)
				: null;

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
		async search({ searchText, limit })
		{
			const queryWords = normalizeWords(searchText);
			if (queryWords.length === 0)
			{
				return [];
			}

			const dialogs = this.store.getters['dialoguesModel/getList']();
			const hasLimit = Type.isNumber(limit);
			const result = [];

			for (const dialog of dialogs)
			{
				if (hasLimit && result.length >= limit)
				{
					break;
				}

				if (this.exceptDialogTypes?.has(dialog.type))
				{
					continue;
				}

				const fields = this.#collectSearchFields(dialog, dialog.dialogId);
				if (this.#matchesAllWords(fields, queryWords))
				{
					result.push(String(dialog.dialogId));
				}
			}

			return result;
		}

		/**
		 * @private
		 * @param {DialoguesModelState} dialog
		 * @param {DialogId} dialogId
		 * @return {Array<string>}
		 */
		#collectSearchFields(dialog, dialogId)
		{
			const fields = [];

			if (Type.isStringFilled(dialog.name))
			{
				fields.push(...normalizeWords(dialog.name));
			}

			if (DialogHelper.isChatId(dialogId))
			{
				const user = this.store.getters['usersModel/getById'](Number(dialogId));
				if (user)
				{
					if (Type.isStringFilled(user.name))
					{
						fields.push(...normalizeWords(user.name));
					}
					if (Type.isStringFilled(user.workPosition))
					{
						fields.push(...normalizeWords(user.workPosition));
					}
				}
			}

			return fields;
		}

		/**
		 * @private
		 * @param {Array<string>} fields
		 * @param {Array<string>} queryWords
		 * @return {boolean}
		 */
		#matchesAllWords(fields, queryWords)
		{
			return queryWords.every(
				(queryWord) => fields.some((field) => field.startsWith(queryWord)),
			);
		}
	}

	module.exports = { VuexLocalSearchStrategy };
});
