/**
 * @module im/messenger/lib/chat-search/src/strategy/local/copilot-default-title-search
 */
jn.define('im/messenger/lib/chat-search/src/strategy/local/copilot-default-title-search', (require, exports, module) => {
	const { Type } = require('type');
	const { DialogType, RecentTab } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('chat-search', 'CopilotDefaultTitleSearch');

	const COPILOT_SECTION = RecentTab.copilot;
	const CHATS_LIMIT = 50;

	/**
	 * The half of the local search the text query cannot reach.
	 *
	 * A copilot chat nobody renamed is drawn under the name of the assistant, while the base keeps the
	 * title the server generated for it ("Вопрос №12"): the substitution lives in the interface
	 * ({@see ChatTitle}), not in the data. The text search of the base runs over the stored name, so
	 * such a chat is never found by the name the user reads on the screen - and the user reads the same
	 * name on every one of them.
	 *
	 * So when the query looks like the name of the assistant, the chats of the copilot section are
	 * taken by their type and kept by their DISPLAYED title - by the very rule that drew the rows the
	 * user is looking at. A renamed chat shows its own title, does not pass that rule and stays with
	 * the text search, where it belongs.
	 *
	 * @class CopilotDefaultTitleSearch
	 */
	class CopilotDefaultTitleSearch
	{
		/**
		 * Whether the scope of a search reaches the copilot section at all: the tab of the assistant
		 * stands on that section, and the composite folder holds it when the user added it.
		 *
		 * @param {Set<string>|Array<string>|string} sections
		 * @return {boolean}
		 */
		static isInScope(sections)
		{
			if (Type.isString(sections))
			{
				return sections === COPILOT_SECTION;
			}

			return [...(sections ?? [])].includes(COPILOT_SECTION);
		}

		/**
		 * Chats of the copilot section shown under the name of the assistant, or nothing at all when
		 * the query does not look like that name. The chats found are put into the store: the rule
		 * that keeps them reads the interface, and the interface reads the store.
		 *
		 * @param {object} params
		 * @param {string} params.searchText
		 * @param {number|null} [params.parentChatId]
		 * @param {number} [params.limit]
		 * @return {Promise<Array<string>>} dialog ids
		 */
		static async search({ searchText, parentChatId = null, limit = CHATS_LIMIT })
		{
			try
			{
				if (!CopilotDefaultTitleSearch.#matchesAgentName(searchText))
				{
					return [];
				}

				const items = await CopilotDefaultTitleSearch.#loadCopilotChats({ parentChatId, limit });
				if (items.length === 0)
				{
					return [];
				}

				await CopilotDefaultTitleSearch.#setChatsToStorage(items);

				return items
					.map((item) => String(item.id))
					.filter((dialogId) => CopilotDefaultTitleSearch.#isShownUnder(dialogId, searchText))
				;
			}
			catch (error)
			{
				// the branch only adds rows to the answer of the text search: its failure is not a
				// failure of the search itself
				logger.error('search:', error);

				return [];
			}
		}

		/**
		 * @private
		 * @param {string} searchText
		 * @return {boolean}
		 */
		static #matchesAgentName(searchText)
		{
			// without the second version of the assistant the interface keeps the stored title, and
			// then there is nothing here the text search has not found already
			if (!Feature.isBitrixGptV2Available)
			{
				return false;
			}

			const agentName = Loc.getCopilotAgentName();

			return Type.isStringFilled(agentName) && CopilotDefaultTitleSearch.#startsWord(agentName, searchText);
		}

		/**
		 * @private
		 * @param {object} params
		 * @param {number|null} params.parentChatId
		 * @param {number} params.limit
		 * @return {Promise<Array<object>>}
		 */
		static async #loadCopilotChats({ parentChatId, limit })
		{
			const recentRepository = serviceLocator.get('core').getRepository().recent;
			const result = await recentRepository.getListBySectionAndTypes({
				section: COPILOT_SECTION,
				dialogTypes: [DialogType.copilot],
				parentChatId,
				limit,
			});

			return result?.items ?? [];
		}

		/**
		 * @private
		 * @param {Array<object>} items
		 * @return {Promise<void>}
		 */
		static async #setChatsToStorage(items)
		{
			const dialogues = items.map((item) => item.chat).filter(Boolean);
			if (dialogues.length === 0)
			{
				return;
			}

			// a copilot chat is a group chat: it carries no user of its own to put into the store
			await serviceLocator.get('core').getStore().dispatch('dialoguesModel/set', dialogues);
		}

		/**
		 * @private
		 * @param {string} dialogId
		 * @param {string} searchText
		 * @return {boolean}
		 */
		static #isShownUnder(dialogId, searchText)
		{
			const title = ChatTitle.createFromDialogId(dialogId).getTitle();

			return Type.isStringFilled(title) && CopilotDefaultTitleSearch.#startsWord(title, searchText);
		}

		/**
		 * Twin of the condition the base search is built with
		 * ({@see im/messenger/db/helper/start-words}): the text stands at the beginning of the title or
		 * at the beginning of a word inside it. Case is ignored on both sides, as it is there.
		 *
		 * @private
		 * @param {string} text
		 * @param {string} searchText
		 * @return {boolean}
		 */
		static #startsWord(text, searchText)
		{
			if (!Type.isStringFilled(text) || !Type.isStringFilled(searchText))
			{
				return false;
			}

			const haystack = text.toLocaleLowerCase(env.languageId);
			const needle = searchText.trim().toLocaleLowerCase(env.languageId);

			return needle !== '' && (haystack.startsWith(needle) || haystack.includes(` ${needle}`));
		}
	}

	module.exports = { CopilotDefaultTitleSearch };
});
