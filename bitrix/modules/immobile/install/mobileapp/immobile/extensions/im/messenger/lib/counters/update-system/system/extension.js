/**
 * @module im/messenger/lib/counters/update-system/system
 */
jn.define('im/messenger/lib/counters/update-system/system', (require, exports, module) => {
	const { Type } = require('type');
	const { SUBTREE_MAX_DEPTH } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('counters--update-system', 'CountersUpdateSystem');

	/**
	 * @class CountersUpdateSystem
	 */
	class CountersUpdateSystem
	{
		/**
		 * @param {CountersUpdateSystemDeps} deps
		 */
		constructor(deps)
		{
		/** @private */
			this.dispatcher = deps.dispatcher;
			/** @private */
			this.repository = deps.chatCounterRepository;
			/** @private */
			this.restorer = deps.restorer;
			/** @private */
			this.readRequestQueue = deps.readRequestQueue;
			/** @private */
			this.store = deps.store;
		}

		/**
		 * @param {CounterAction} action
		 * @return {Promise<void>}
		 */
		async dispatch(action)
		{
			return this.dispatcher.dispatch(action);
		}

		async restoreCounters()
		{
			return this.restorer.restore();
		}

		/**
		 * @param {PendingOperation<LocalReadMessage>} readPendingOperation
		 * @return {Promise<void>}
		 */
		async addReadRequestToQueue(readPendingOperation)
		{
			this.readRequestQueue.addOperation(readPendingOperation);
			this.readRequestQueue.tryReading();
		}

		disableReadingQueue()
		{
			this.readRequestQueue.disable();
		}

		enableReadingQueue()
		{
			this.readRequestQueue.enable();
		}

		startReadingQueue()
		{
			return this.readRequestQueue.tryReading();
		}

		getChatCounterRepository()
		{
			return this.repository;
		}

		/**
		 * Clear all chat counters (except openlines) from Vuex and database
		 * @return {Promise<void>}
		 */
		async readAllChats()
		{
			await this.store.dispatch('counterModel/readAllChats').catch((error) => {
				logger.error('readAllChats: counterModel/readAllChats error', error);
			});

			await this.store.dispatch('recentModel/readAllChats').catch((error) => {
				logger.error('readAllChats: recentModel/readAllChats error', error);
			});

			await this.repository.clearAllCountersInDatabase().catch((error) => {
				logger.error('readAllChats: clearAllCountersInDatabase error', error);
			});
		}

		/**
		 * @param {number} chatId
		 * @return {Promise<void>}
		 */
		async readChat(chatId)
		{
			const counterState = this.repository.getCounterState(chatId);

			await this.updateCounterState({
				...counterState,
				counter: 0,
				isMarkedAsUnread: false,
			});

			await this.repository.deleteOperationsByChatId(chatId);
		}

		/**
		 * @param {number} chatId
		 * @return {Promise<void>}
		 */
		async readChildren(chatId)
		{
			// getActiveDescendants returns children with counter > 0 OR isMarkedAsUnread.
			// getByParentChatId would keep only counter > 0 and miss a child that is
			// marked-as-unread with a zero counter — its badge would hang on the parent.
			const promises = this.store.getters['counterModel/getActiveDescendants'](chatId)
				.map((counterState) => {
					return this.readChat(counterState.chatId);
				});

			await Promise.all(promises);
		}

		/**
		 * @param {RecentTab[keyof RecentTab]} recentSection
		 * @param {?number} [parentChatId] null — entry points = every chat in the section at any depth;
		 *   0 — only top-level chats in the section; >0 — the given chat as the single entry point.
		 * @return {Promise<Array<number>>} chatIds whose counters were actually cleared.
		 */
		async readByRecentSection(recentSection, parentChatId = null)
		{
			const clearedChatIds = await this.readByRecentSectionInVuex(recentSection, parentChatId);

			await this.persistReadByRecentSection(clearedChatIds);

			return clearedChatIds;
		}

		/**
		 * Optimistic in-memory clear only (recent items + counters in Vuex). The local DB is left
		 * untouched on purpose: same as readAllMessages, we persist only after the backend call returns,
		 * so an interrupted request keeps the original counters for the next app start.
		 *
		 * Anchors are intentionally not touched here — this system owns counters only. The caller
		 * (read service / pull handler) clears anchors via anchorModel/clearByChatIdList on the returned ids.
		 * @param {RecentTab[keyof RecentTab]} recentSection
		 * @param {?number} [parentChatId]
		 * @return {Promise<Array<number>>} chatIds whose counters were actually cleared.
		 */
		async readByRecentSectionInVuex(recentSection, parentChatId = null)
		{
			const subtreeChatIds = [...this.#collectSubtreeChatIds(recentSection, parentChatId)];

			await this.store.dispatch('recentModel/readByRecentSection', {
				recentSection,
				parentChatId,
			}).catch((error) => {
				logger.error('readByRecentSectionInVuex: recentModel/readByRecentSection error', error);
			});

			return this.#clearCountersInVuex(subtreeChatIds);
		}

		/**
		 * Persist the already-cleared counters to the local DB. Call only after the backend confirms
		 * the read, so an interrupted request leaves the DB intact for the next app start.
		 * @param {Array<number>} chatIdList
		 * @return {Promise<void>}
		 */
		async persistReadByRecentSection(chatIdList)
		{
			if (!Type.isArrayFilled(chatIdList))
			{
				return;
			}

			const storedStateList = chatIdList
				.map((chatId) => this.store.getters['counterModel/getByChatId'](chatId))
				.filter(Boolean);

			if (Type.isArrayFilled(storedStateList))
			{
				await this.repository.saveCounterStateList(storedStateList).catch((error) => {
					logger.error('persistReadByRecentSection: saveCounterStateList error', error);
				});
			}

			await this.repository.deleteOperationsByChatIdList(chatIdList);
		}

		/**
		 * Single setList mutation for the whole batch — native tab-bar can drop
		 * intermediate badge updates when the per-chat mutations arrive too fast.
		 * @param {Array<number>} chatIdList
		 * @return {Promise<Array<number>>} chatIds whose counters were actually cleared.
		 */
		async #clearCountersInVuex(chatIdList)
		{
			const counterStateList = chatIdList
				.map((chatId) => this.repository.getCounterState(chatId))
				.filter((state) => Type.isNumber(state?.chatId) && (state.counter > 0 || state.isMarkedAsUnread))
				.map((state) => ({
					...state,
					counter: 0,
					isMarkedAsUnread: false,
				}));

			if (!Type.isArrayFilled(counterStateList))
			{
				return [];
			}

			await this.store.dispatch('counterModel/setList', { counterList: counterStateList }).catch((error) => {
				logger.error('#clearCountersInVuex: counterModel/setList error', error);
			});

			return counterStateList.map((state) => state.chatId);
		}

		/**
		 * @return {Set<number>} Mirrors server-side ChatTreeScope: entry points + their descendants filtered by recentSection.
		 */
		#collectSubtreeChatIds(recentSection, parentChatId)
		{
			const entryPointIds = this.#collectEntryPointIds(recentSection, parentChatId);

			return this.#expandToSubtree(entryPointIds, recentSection);
		}

		/**
		 * @param {RecentTab[keyof RecentTab]} recentSection
		 * @param {?number} parentChatId
		 * @return {Array<number>}
		 */
		#collectEntryPointIds(recentSection, parentChatId)
		{
			if (Type.isNil(parentChatId))
			{
				return this.#findAllEntryPoints(recentSection);
			}

			if (parentChatId === 0)
			{
				return this.#findTopLevelEntryPoints(recentSection);
			}

			return [parentChatId];
		}

		/**
		 * Active counters at any depth whose section chain reaches recentSection.
		 * @param {RecentTab[keyof RecentTab]} recentSection
		 * @return {Array<number>}
		 */
		#findAllEntryPoints(recentSection)
		{
			const getters = this.store.getters;

			return getters['counterModel/getList']()
				.filter((counterState) => {
					return (counterState.counter > 0 || counterState.isMarkedAsUnread)
						&& getters['counterModel/belongsToRecentSection'](counterState, recentSection);
				})
				.map((counterState) => counterState.chatId);
		}

		/**
		 * Top-level ancestors of active counters that belong to recentSection directly.
		 * @param {RecentTab[keyof RecentTab]} recentSection
		 * @return {Array<number>}
		 */
		#findTopLevelEntryPoints(recentSection)
		{
			const getters = this.store.getters;
			const topLevelEntries = new Set();
			const activeCounters = getters['counterModel/getList']()
				.filter((counterState) => counterState.counter > 0 || counterState.isMarkedAsUnread);

			for (const counterState of activeCounters)
			{
				const topLevelId = getters['counterModel/getTopLevelAncestorChatId'](counterState.chatId);
				if (topLevelId === null)
				{
					continue;
				}

				const topLevelState = getters['counterModel/getByChatId'](topLevelId);
				if (topLevelState && topLevelState.recentSections.includes(recentSection))
				{
					topLevelEntries.add(topLevelId);
				}
			}

			return [...topLevelEntries];
		}

		/**
		 * @param {Array<number>} entryPointIds
		 * @param {RecentTab[keyof RecentTab]} recentSection
		 * @return {Set<number>} entry points and descendants belonging to recentSection.
		 *   Mirrors the server-side ChatAncestorFilter that applies typeCondition to every subtree level,
		 *   bounded to the same descendant depth (SUBTREE_MAX_DEPTH = ChatAncestorNavigator::DEFAULT_DEPTH).
		 *
		 * Note: the server starts the subtree filter at depth=1 (direct children), so the entry chat
		 * itself is never cleared on the backend. We mirror that and rely on belongsToRecentSection
		 * for both entries and descendants — entries that happen to match the section get cleared
		 * locally and on the server alike; entries outside the section stay untouched on both sides.
		 */
		#expandToSubtree(entryPointIds, recentSection)
		{
			const getters = this.store.getters;
			const result = new Set();

			const addIfInSection = (chatId) => {
				const state = getters['counterModel/getByChatId'](chatId);
				if (state && getters['counterModel/belongsToRecentSection'](state, recentSection))
				{
					result.add(chatId);
				}
			};

			for (const entryId of entryPointIds)
			{
				addIfInSection(entryId);

				// Bound the BFS to the server's ChatTreeScope depth so the client clears exactly
				// the chats the backend marks read (see SUBTREE_MAX_DEPTH).
				const descendants = getters['counterModel/getDescendantChatIds'](entryId, SUBTREE_MAX_DEPTH);
				for (const descendantId of descendants)
				{
					addIfInSection(descendantId);
				}
			}

			return result;
		}

		/**
		 * Delete counters by chat IDs from Vuex and database
		 * @param {Array<number>} chatIdList
		 * @return {Promise<void>}
		 */
		async deleteCountersByChatIdList(chatIdList)
		{
			try
			{
				this.readRequestQueue.clearQueueOfChatIdList(chatIdList);
				await this.repository.deleteByChatIdList(chatIdList);
			}
			catch (error)
			{
				logger.error('deleteCountersByChatIdList error', error);
			}
		}

		/**
		 * Update counter state in Vuex and database
		 * @param {CounterModelState} counterState
		 * @return {Promise<void>}
		 */
		async updateCounterState(counterState)
		{
			if (!Type.isNumber(counterState?.chatId))
			{
				logger.error('updateCounterState: invalid counterState', counterState);

				return;
			}

			await this.store.dispatch('counterModel/setList', {
				counterList: [counterState],
			}).catch((error) => {
				logger.error('updateCounterState: counterModel/setList error', error);
			});

			const storedCounterState = this.store.getters['counterModel/getByChatId'](counterState.chatId);
			if (!storedCounterState)
			{
				logger.error('updateCounterState: stored counter state not found', counterState);

				return;
			}

			await this.repository.saveCounterStateList([storedCounterState]).catch((error) => {
				logger.error('updateCounterState: saveCounterStateList error', error);
			});
		}
	}

	module.exports = { CountersUpdateSystem };
});
