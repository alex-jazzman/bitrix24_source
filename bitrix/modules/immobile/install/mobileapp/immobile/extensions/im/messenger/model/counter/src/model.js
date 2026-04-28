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
				return Object.values(state.collection)
					.filter((counterState) => {
						return counterState.parentChatId === chatId && counterState.counter > 0;
					})
				;
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
				return Object.values(state.collection)
					.filter((counterState) => {
						return counterState.parentChatId === parentChatId;
					})
					.reduce((counter, counterState) => {
						return counter + (counterState.counter || 0);
					}, 0)
				;
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

					preparedCounterStateList.push({
						...counterDefaultElement,
						...store.state.collection[chatId],
						...normalize(modelCounter),
					});
				}

				if (!Type.isArrayFilled(preparedCounterStateList))
				{
					return;
				}

				store.commit('set', {
					actionName: 'set',
					data: {
						counterList: preparedCounterStateList,
					},
				});
			},

			/** @function counterModel/readChildChatsCounters */
			readChildChatsCounters: (store, payload) => {
				const { parentChatId } = payload;

				/** @type {Array<CounterModelState>} */
				const counterStateList = [];
				Object.values(store.state.collection).forEach((counterState) => {
					if (counterState.parentChatId === parentChatId)
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

						if (counterState.parentChatId > 0) // need to update parent chat in recent
						{
							counterStatesToUpdate.push({
								...store.state.collection[counterState.parentChatId],
								counter: 0,
								isMarkedAsUnread: false,
							});
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
					if (counterState.counter === 0 || !counterState.isMarkedAsUnread)
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
						const parentState = store.state.collection[counterState.parentChatId];

						if (Type.isPlainObject(parentState) && parentState.recentSections.includes(recentSection))
						{
							counterStatesToUpdate.push({
								...counterState,
								counter: 0,
								isMarkedAsUnread: false,
							});
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

				const counterState = store.state.collection[chatId]

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

				store.commit('delete', {
					actionName: 'delete',
					data: {
						chatIdList,
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
					let newCounter = counterDefaultElement;
					if (state.collection[counter.chatId])
					{
						newCounter = {
							...newCounter,
							...state.collection[counter.chatId],
							...counter,
						};
					}
					else
					{
						newCounter = {
							...newCounter,
							...counter,
						};
					}

					state.collection[counter.chatId] = newCounter;
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
					if (state.collection[chatId])
					{
						delete state.collection[chatId];
					}
				}
			},
		},
	};

	module.exports = {
		counterModel,
	};
});
