/**
 * @module im/messenger/lib/counters/tab-counters/src/nested
 */
jn.define('im/messenger/lib/counters/tab-counters/src/nested', (require, exports, module) => {
	const {
		NavigationTabId,
		RecentTabByNavigationTab,
		RecentTab,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { BaseTabCounters } = require('im/messenger/lib/counters/tab-counters/src/base');

	const logger = getLoggerWithContext('counters--nested-tab', 'NestedTabCounters');

	/**
	 * Tab IDs that appear in nested (collab) navigation.
	 * @type {string[]}
	 */
	const NESTED_TAB_IDS = [
		NavigationTabId.collabDefault,
		NavigationTabId.task,
		NavigationTabId.collabChat,
		// collabCopilot may be absent from the widget when Feature.isCopilotEnabled is off;
		// updateItem for a missing tab is a safe no-op, so the id stays unconditional here.
		NavigationTabId.collabCopilot,
		NavigationTabId.calendar,
	];

	/**
	 * @class NestedTabCounters
	 *
	 * Keeps tab counter badges up-to-date for a single nested navigation widget,
	 * scoped to a specific parentChatId.
	 */
	class NestedTabCounters extends BaseTabCounters
	{
		#parentChatId;
		#storeManager = null;

		/**
		 * @param {object} widget — tabs widget from PageManager.openWidget
		 * @param {number} parentChatId — chatId of the parent collab chat
		 */
		constructor(widget, parentChatId)
		{
			super(widget);
			this.#parentChatId = parentChatId;
			this.#subscribeStoreEvents();
		}

		/**
		 * Calculates the counter for a single tab.
		 * Used by NestedNavigationOpener at widget open time.
		 *
		 * @param {object} store — Vuex store
		 * @param {string|undefined} recentSection
		 * @param {number} parentChatId
		 * @returns {number}
		 */
		static calculateTabCounter(store, recentSection, parentChatId)
		{
			if (!recentSection)
			{
				return 0;
			}

			const activeDescendants = store.getters['counterModel/getActiveDescendants'](parentChatId);

			return NestedTabCounters.#sumBySection(store, activeDescendants, recentSection, parentChatId);
		}

		/** @override */
		update()
		{
			this.clearUpdateTimeout();

			const store = this.store;
			const parentChatId = this.#parentChatId;
			const activeDescendants = store.getters['counterModel/getActiveDescendants'](parentChatId);

			const counters = {};
			for (const tabId of NESTED_TAB_IDS)
			{
				const recentSection = RecentTabByNavigationTab[tabId];
				counters[tabId] = NestedTabCounters.#sumBySection(
					store,
					activeDescendants,
					recentSection,
					parentChatId,
				);
			}

			logger.log('update', parentChatId, counters);

			this.updateUi(counters);
		}

		destructor()
		{
			this.clearUpdateTimeout();
			this.#unsubscribeStoreEvents();
		}

		/**
		 * Sums effective counters for descendants that belong to the given section.
		 *
		 * @param {object} store
		 * @param {Array<CounterModelState>} activeDescendants
		 * @param {string|undefined} recentSection
		 * @param {number} parentChatId
		 * @returns {number}
		 */
		static #sumBySection(store, activeDescendants, recentSection, parentChatId)
		{
			if (!recentSection)
			{
				return 0;
			}

			const belongsTo = store.getters['counterModel/belongsToRecentSection'];

			let counter = activeDescendants
				.filter((counterState) => belongsTo(counterState, recentSection))
				.reduce((sum, counterState) => sum + NestedTabCounters.#getEffectiveCounter(counterState), 0)
			;

			if (recentSection === RecentTab.collabDefault)
			{
				const parentCounterState = store.getters['counterModel/getByChatId'](parentChatId);
				if (parentCounterState)
				{
					counter += NestedTabCounters.#getEffectiveCounter(parentCounterState);
				}
			}

			return counter;
		}

		/**
		 * @param {CounterModelState} counterState
		 * @returns {number}
		 */
		static #getEffectiveCounter(counterState)
		{
			if (counterState.isMuted)
			{
				return 0;
			}

			if (counterState.counter > 0)
			{
				return counterState.counter;
			}

			if (counterState.isMarkedAsUnread)
			{
				return 1;
			}

			return 0;
		}

		#subscribeStoreEvents()
		{
			this.#storeManager = serviceLocator.get('core').getStoreManager();
			this.#storeManager
				.on('counterModel/set', this.#counterSetHandler)
				.on('counterModel/delete', this.#counterDeleteHandler)
			;
		}

		#unsubscribeStoreEvents()
		{
			if (this.#storeManager)
			{
				this.#storeManager
					.off('counterModel/set', this.#counterSetHandler)
					.off('counterModel/delete', this.#counterDeleteHandler)
				;
			}
		}

		/**
		 * @param {MutationPayload<CounterSetData, CounterSetActions>} mutation
		 */
		#counterSetHandler = ({ payload }) => {
			const { counterList, previousParentChatIdList = [] } = payload.data;
			// A child detached from this parent no longer appears in its descendants index,
			// so #hasRelevantChatIds can't see it; previousParentChatIdList catches that case.
			if (
				previousParentChatIdList.includes(this.#parentChatId)
				|| this.#hasRelevantChatIds(counterList?.map((c) => c.chatId))
			)
			{
				this.update();
			}
		};

		/**
		 * @param {MutationPayload<CounterDeleteData, CounterDeleteActions>} mutation
		 */
		#counterDeleteHandler = ({ payload }) => {
			const { chatIdList, parentChatIdList = [] } = payload.data;
			if (this.#hasAffectedParentChatId(chatIdList, parentChatIdList))
			{
				this.update();
			}
		};

		/**
		 * Checks relevance using live store data (descendants index).
		 * Suitable for `set` mutations where the data is still in the store.
		 *
		 * @param {number[]} chatIds
		 * @return {boolean}
		 */
		#hasRelevantChatIds(chatIds)
		{
			if (!chatIds || chatIds.length === 0)
			{
				return false;
			}

			const descendants = this.store.getters['counterModel/getDescendantChatIds'](this.#parentChatId);

			return chatIds.some((id) => id === this.#parentChatId || descendants.has(id));
		}

		/**
		 * Checks whether deleted counters affected this nested widget.
		 * Uses parentChatIdList from the mutation payload because
		 * the descendants index is already cleaned up by the time subscribers fire.
		 *
		 * @param {number[]} chatIdList
		 * @param {number[]} parentChatIdList
		 * @return {boolean}
		 */
		#hasAffectedParentChatId(chatIdList, parentChatIdList)
		{
			return chatIdList?.some((id) => id === this.#parentChatId)
				|| parentChatIdList?.some((id) => id === this.#parentChatId);
		}
	}

	module.exports = { NestedTabCounters };
});
