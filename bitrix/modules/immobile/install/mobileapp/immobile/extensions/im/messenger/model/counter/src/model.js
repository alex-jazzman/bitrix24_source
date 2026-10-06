/* eslint-disable no-param-reassign */

/**
 * @module im/messenger/model/counter/src/model
 */
jn.define('im/messenger/model/counter/src/model', (require, exports, module) => {
	const { Type } = require('type');
	const { uniqBy } = require('utils/array');
	const { RecentTab } = require('im/messenger/const');
	const { counterDefaultElement } = require('im/messenger/model/counter/src/default-element');
	const { normalize } = require('im/messenger/model/counter/src/normalizer');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('model--counter', 'CounterModel');

	/**
	 * @type {CounterMessengerModel}
	 */
	const counterModel = {
		namespaced: true,
		state: () => ({
			collection: {},
			/** @type {Map<number, Set<number>>} parentChatId → Set<chatId> */
			childrenIndex: new Map(),
		}),
		getters: {
			/**
			 * @function counterModel/getCollection
			 * @return {Record<number, CounterModelState>}
			 */
			getCollection: (state) => () => {
				return state.collection;
			},
			/**
			 * @function counterModel/getList
			 * @return {Array<CounterModelState>}
			 */
			getList: (state) => () => {
				return Object.values(state.collection);
			},
			/**
			 * @function counterModel/getByChatId
			 * @return {?CounterModelState}
			 */
			getByChatId: (state) => (chatId) => {
				return state.collection[chatId];
			},
			/**
			 * @function counterModel/getByParentChatId
			 * @return {Array<CounterModelState>}
			 */
			getByParentChatId: (state) => (chatId) => {
				const descendantIds = getDescendantChatIds(state.childrenIndex, chatId);
				const result = [];
				for (const id of descendantIds)
				{
					const counterState = state.collection[id];
					if (counterState && counterState.counter > 0)
					{
						result.push(counterState);
					}
				}

				return result;
			},

			/**
			 * @function counterModel/getCounterByChatId
			 * @return {number}
			 */
			getCounterByChatId: (state) => (chatId) => {
				return state.collection[chatId]?.counter ?? 0;
			},

			/**
			 * @function counterModel/getNumberChildCounters
			 * @return {number}
			 */
			getNumberChildCounters: (state) => (parentChatId) => {
				const descendantIds = getDescendantChatIds(state.childrenIndex, parentChatId);

				return Object.values(state.collection)
					.filter((counterState) => {
						return descendantIds.has(counterState.chatId) && !counterState.isMuted;
					})
					.reduce((counter, counterState) => {
						if (counterState.counter > 0)
						{
							return counter + counterState.counter;
						}

						if (counterState.isMarkedAsUnread)
						{
							return counter + 1;
						}

						return counter;
					}, 0)
				;
			},

			/**
			 * @function counterModel/getDescendantChatIds
			 * @return {Set<number>}
			 */
			getDescendantChatIds: (state) => (rootChatId) => {
				return getDescendantChatIds(state.childrenIndex, rootChatId);
			},

			/**
			 * @function counterModel/getActiveDescendants
			 * Returns all descendants of rootChatId that have a non-zero counter
			 * or are marked as unread.
			 * @return {Array<CounterModelState>}
			 */
			getActiveDescendants: (state) => (rootChatId) => {
				const descendantIds = getDescendantChatIds(state.childrenIndex, rootChatId);

				return Object.values(state.collection)
					.filter((counterState) => {
						return descendantIds.has(counterState.chatId)
							&& (counterState.counter > 0 || counterState.isMarkedAsUnread)
						;
					})
				;
			},

			/**
			 * @function counterModel/belongsToRecentSection
			 * Checks whether a counter belongs to a recentSection, either directly
			 * or by inheriting the section from an ancestor in the parentChatId chain.
			 * @return {boolean}
			 */
			belongsToRecentSection: (state) => (counterState, recentSection) => {
				return belongsToRecentSection(state.collection, counterState, recentSection);
			},

			/**
			 * @function counterModel/hasMutedAncestor
			 * Walks up the parentChatId chain and checks whether any ancestor
			 * counter is muted. An ancestor without a counter record is treated
			 * as not muted.
			 * @return {boolean}
			 */
			hasMutedAncestor: (state) => (chatId) => {
				const ancestorIds = getAncestorChatIds(state.collection, chatId);
				for (const ancestorId of ancestorIds)
				{
					if (state.collection[ancestorId]?.isMuted)
					{
						return true;
					}
				}

				return false;
			},

			/**
			 * @function counterModel/getCounterMarkedAsUnread
			 * @return {Array<CounterModelState>}
			 */
			getCounterMarkedAsUnread: (state) => () => {
				return Object.values(state.collection)
					.filter((counterState) => counterState.isMarkedAsUnread)
				;
			},

			/**
			 * @function counterModel/getByRecentSection
			 * @return {Array<CounterModelState>}
			 */
			getByRecentSection: (state) => (recentSection) => {
				return Object.values(state.collection)
					.filter((counterState) => {
						return counterState.recentSections.includes(recentSection)
							&& (counterState.counter > 0 || counterState.isMarkedAsUnread)
						;
					})
				;
			},
		},
		actions: {
			/** @function counterModel/setList */
			setList: async (store, payload) => {
				const {
					/** @type {Array<CounterModelState>} */
					counterList,
				} = payload;

				const preparedCounterStateList = [];
				const previousParentChatIdList = [];
				for (const counterState of counterList)
				{
					const chatId = counterState.chatId;
					if (!Type.isNumber(chatId))
					{
						continue;
					}

					const modelCounter = {
						chatId: Number(chatId),
						...counterState,
					};

					const existing = store.state.collection[chatId];
					const preparedCounterState = {
						...counterDefaultElement,
						...existing,
						...normalize(modelCounter),
					};

					// The counter is leaving a parent (e.g. a chat detached from a project): the
					// previous parent's aggregated badge must be recomputed, but after the mutation
					// it is no longer reachable through childrenIndex. Surface it to subscribers,
					// mirroring the parentChatIdList contract of the delete payload.
					if (
						existing
						&& existing.parentChatId > 0
						&& existing.parentChatId !== preparedCounterState.parentChatId
					)
					{
						previousParentChatIdList.push(existing.parentChatId);
					}

					preparedCounterStateList.push(preparedCounterState);
				}

				if (!Type.isArrayFilled(preparedCounterStateList))
				{
					return;
				}

				store.commit('set', {
					actionName: 'set',
					data: {
						counterList: preparedCounterStateList,
						previousParentChatIdList: [...new Set(previousParentChatIdList)],
					},
				});
			},

			/** @function counterModel/setMarkedAsUnread */
			setMarkedAsUnread: (store, payload) => {
				const {
					dialogId,
					recentSection,
					isMarkedAsUnread,
				} = payload;

				if (!Type.isBoolean(isMarkedAsUnread))
				{
					return;
				}

				const dialog = store.rootGetters?.['dialoguesModel/getById']?.(dialogId);
				if (!Type.isNumber(dialog?.chatId))
				{
					return;
				}

				const existingCounterState = store.state.collection[dialog.chatId];
				const counterState = {
					...counterDefaultElement,
					...existingCounterState,
					chatId: dialog.chatId,
					parentChatId: getParentChatId(existingCounterState, dialog),
					recentSections: getRecentSections(existingCounterState, dialog, recentSection),
					isMarkedAsUnread,
				};

				store.commit('set', {
					actionName: 'setMarkedAsUnread',
					data: {
						counterList: [counterState],
					},
				});
			},

			/** @function counterModel/readChildChatsCounters */
			readChildChatsCounters: (store, payload) => {
				const { parentChatId } = payload;
				const descendantIds = getDescendantChatIds(store.state.childrenIndex, parentChatId);

				/** @type {Array<CounterModelState>} */
				const counterStateList = [];
				Object.values(store.state.collection).forEach((counterState) => {
					if (descendantIds.has(counterState.chatId))
					{
						counterStateList.push({
							...counterState,
							counter: 0,
						});
					}
				});

				store.commit('set', {
					actionName: 'readChildChatsCounters',
					data: {
						counterList: counterStateList,
					},
				});
			},

			/** @function counterModel/readAllChats */
			readAllChats: (store) => {
				/** @type {Array<CounterModelState>} */
				const counterStatesToUpdate = [];
				for (const counterState of Object.values(store.state.collection))
				{
					if (counterState.recentSections.includes(RecentTab.openlines))
					{
						continue;
					}

					if (counterState.counter > 0 || counterState.isMarkedAsUnread)
					{
						counterStatesToUpdate.push({
							...counterState,
							counter: 0,
							isMarkedAsUnread: false,
						});

						const ancestorIds = getAncestorChatIds(store.state.collection, counterState.chatId);
						for (const ancestorId of ancestorIds)
						{
							const ancestorState = store.state.collection[ancestorId];
							if (ancestorState)
							{
								counterStatesToUpdate.push({
									...ancestorState,
									counter: 0,
									isMarkedAsUnread: false,
								});
							}
						}
					}
				}

				const uniqueCounterStates = uniqBy(counterStatesToUpdate, 'chatId');
				if (!Type.isArrayFilled(uniqueCounterStates))
				{
					return;
				}

				store.commit('set', {
					actionName: 'readAllChats',
					data: {
						counterList: uniqueCounterStates,
					},
				});
			},

			/** @function counterModel/readByRecentSection */
			readByRecentSection: (store, payload) => {
				const { recentSection } = payload;

				const counterStatesToUpdate = [];
				for (const counterState of Object.values(store.state.collection))
				{
					if (counterState.counter === 0 && !counterState.isMarkedAsUnread)
					{
						continue;
					}

					const recentSections = counterState.recentSections;
					if (Type.isArrayFilled(recentSections) && !recentSections.includes(recentSection))
					{
						continue;
					}

					if (counterState.recentSections.includes(recentSection))
					{
						counterStatesToUpdate.push({
							...counterState,
							counter: 0,
							isMarkedAsUnread: false,
						});

						continue;
					}

					if (!Type.isArrayFilled(counterState.recentSections))
					{
						const ancestorIds = getAncestorChatIds(store.state.collection, counterState.chatId);
						for (const ancestorId of ancestorIds)
						{
							const ancestorState = store.state.collection[ancestorId];
							if (ancestorState?.recentSections.includes(recentSection))
							{
								counterStatesToUpdate.push({
									...counterState,
									counter: 0,
									isMarkedAsUnread: false,
								});

								break;
							}
						}
					}
				}

				const uniqueCounterStates = uniqBy(counterStatesToUpdate, 'chatId');
				if (!Type.isArrayFilled(uniqueCounterStates))
				{
					return;
				}

				store.commit('set', {
					actionName: 'clearByRecentSection',
					data: {
						counterList: uniqueCounterStates,
					},
				});
			},

			/** @function counterModel/setMuted */
			setMuted: (store, payload) => {
				const { chatId, isMuted } = payload;

				const counterState = store.state.collection[chatId];

				if (!Type.isPlainObject(counterState))
				{
					return;
				}

				store.commit('set', {
					actionName: 'setMuted',
					data: {
						counterList: [{
							...counterState,
							isMuted: Boolean(isMuted),
						}],
					},
				});
			},

			/** @function counterModel/delete */
			delete: (store, payload) => {
				const { chatIdList } = payload;

				if (!Type.isArrayFilled(chatIdList))
				{
					return;
				}

				const parentChatIdList = [];
				for (const chatId of chatIdList)
				{
					const existing = store.state.collection[chatId];
					if (existing?.parentChatId > 0)
					{
						parentChatIdList.push(existing.parentChatId);
					}
				}

				store.commit('delete', {
					actionName: 'delete',
					data: {
						chatIdList,
						parentChatIdList,
					},
				});
			},
		},
		mutations: {
			/**
			 * @param state
			 * @param {MutationPayload<CounterSetData, CounterSetActions>} payload
			 */
			set: (state, payload) => {
				logger.log('set mutation', payload);

				payload.data.counterList.forEach((counter) => {
					const existing = state.collection[counter.chatId];
					let newCounter = { ...counterDefaultElement, ...counter };

					if (existing)
					{
						// If parentChatId changed, remove from old parent's children set
						if (existing.parentChatId > 0 && existing.parentChatId !== counter.parentChatId)
						{
							state.childrenIndex.get(existing.parentChatId)?.delete(counter.chatId);
						}

						newCounter = {
							...counterDefaultElement,
							...existing,
							...counter,
						};
					}

					state.collection[counter.chatId] = newCounter;

					// Add to new parent's children set
					if (newCounter.parentChatId > 0)
					{
						if (!state.childrenIndex.has(newCounter.parentChatId))
						{
							state.childrenIndex.set(newCounter.parentChatId, new Set());
						}

						state.childrenIndex.get(newCounter.parentChatId).add(counter.chatId);
					}
				});
			},

			/**
			 * @param state
			 * @param {MutationPayload<CounterDeleteData, CounterDeleteActions>} payload
			 */
			delete: (state, payload) => {
				logger.log('counterModel delete mutation', payload);
				const { chatIdList } = payload.data;

				for (const chatId of chatIdList)
				{
					const existing = state.collection[chatId];
					if (!existing)
					{
						continue;
					}

					if (existing.parentChatId > 0)
					{
						const parentSet = state.childrenIndex.get(existing.parentChatId);
						if (parentSet)
						{
							parentSet.delete(chatId);
							if (parentSet.size === 0)
							{
								state.childrenIndex.delete(existing.parentChatId);
							}
						}
					}

					const descendants = getDescendantChatIds(state.childrenIndex, chatId);
					for (const descendantId of descendants)
					{
						state.childrenIndex.delete(descendantId);
					}
					state.childrenIndex.delete(chatId);

					delete state.collection[chatId];
				}
			},
		},
	};

	/**
	 * @param {?CounterModelState} counterState
	 * @param {DialoguesModelState} dialog
	 * @return {number}
	 */
	function getParentChatId(counterState, dialog)
	{
		if (Type.isNumber(counterState?.parentChatId))
		{
			return counterState.parentChatId;
		}

		return Type.isNumber(dialog.parentChatId) ? dialog.parentChatId : 0;
	}

	/**
	 * @param {?CounterModelState} counterState
	 * @param {DialoguesModelState} dialog
	 * @param {?string} recentSection
	 * @return {Array<string>}
	 */
	function getRecentSections(counterState, dialog, recentSection)
	{
		if (Type.isArrayFilled(counterState?.recentSections))
		{
			return counterState.recentSections;
		}

		if (Type.isArrayFilled(dialog?.recentConfig?.sections))
		{
			return dialog.recentConfig.sections;
		}

		if (Type.isStringFilled(recentSection))
		{
			return [recentSection];
		}

		return [];
	}

	/**
	 * BFS: collects chatIds of all descendants of rootChatId at any depth.
	 * Uses childrenIndex for O(D) traversal where D is the number of descendants.
	 * @param {Map<number, Set<number>>} childrenIndex
	 * @param {number} rootChatId
	 * @returns {Set<number>}
	 */
	function getDescendantChatIds(childrenIndex, rootChatId)
	{
		const result = new Set();
		const queue = [rootChatId];
		let head = 0;

		while (head < queue.length)
		{
			const currentId = queue[head++];
			const children = childrenIndex.get(currentId);

			if (!children)
			{
				continue;
			}

			for (const childId of children)
			{
				if (!result.has(childId))
				{
					result.add(childId);
					queue.push(childId);
				}
			}
		}

		return result;
	}

	/**
	 * Walks up the parentChatId chain from chatId to the root.
	 * @param {Record<number, CounterModelState>} collection
	 * @param {number} chatId
	 * @returns {Set<number>}
	 */
	function getAncestorChatIds(collection, chatId)
	{
		const result = new Set();
		let current = collection[chatId];

		while (current && current.parentChatId > 0)
		{
			if (result.has(current.parentChatId))
			{
				break;
			}

			result.add(current.parentChatId);
			current = collection[current.parentChatId];
		}

		return result;
	}

	/**
	 * Checks whether a counter belongs to a recentSection, either directly
	 * or by inheriting the section from an ancestor in the parentChatId chain.
	 * @param {Record<number, CounterModelState>} collection
	 * @param {CounterModelState} counterState
	 * @param {string} recentSection
	 * @returns {boolean}
	 */
	function belongsToRecentSection(collection, counterState, recentSection)
	{
		if (counterState.recentSections.includes(recentSection))
		{
			return true;
		}

		if (counterState.recentSections.length > 0)
		{
			return false;
		}

		const ancestorIds = getAncestorChatIds(collection, counterState.chatId);
		for (const ancestorId of ancestorIds)
		{
			const ancestor = collection[ancestorId];
			if (ancestor?.recentSections.includes(recentSection))
			{
				return true;
			}

			if (ancestor?.recentSections.length > 0)
			{
				return false;
			}
		}

		return false;
	}

	module.exports = {
		counterModel,
	};
});
