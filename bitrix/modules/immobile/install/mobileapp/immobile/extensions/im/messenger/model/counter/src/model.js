/* eslint-disable no-param-reassign */

/**
 * @module im/messenger/model/counter/model
 */
jn.define('im/messenger/model/counter/model', (require, exports, module) => {
	const { counterDefaultElement } = require('im/messenger/model/counter/default-element');
	const { validate } = require('im/messenger/model/comment/validator');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('model--counter');

	/**
	 *
	 * @type {CounterModel}
	 */
	const counterModel = {
		namespaced: true,
		state: () => ({
			collection: {},
		}),
		getters: {
			/**
			 * @function counterModel/getCollection
			 */
			getCollection: (state) => () => {
				return state.collection;
			},
			/**
			 * @function counterModel/getList
			 */
			getList: (state) => () => {
				return Object.values(state.collection);
			},
			/**
			 * @function counterModel/getByChatId
			 */
			getByChatId: (state) => (chatId) => {
				return state.collection[chatId];
			},
			/**
			 * @function counterModel/getByParentChatId
			 */
			getByParentChatId: (state) => (chatId) => {
				return Object.values(state.collection).filter((counter) => {
					return counter.parentChatId === chatId;
				});
			},
		},
		actions: {
			/** @function counterModel/set */
			set: (store, counterCollection) => {
				const counterList = [];
				Object.entries(counterCollection).forEach(([chatId, counter]) => {
					const modelCounter = {
						chatId: Number(chatId),
						...counter,
					};

					counterList.push({
						...counterDefaultElement,
						...validate(modelCounter),
					});
				});

				store.commit('set', {
					actionName: 'set',
					data: {
						counterList,
					},
				});
			},

			/** @function counterModel/clear */
			clear: (store) => {
				store.commit('clear', {
					actionName: 'clear',
					data: {},
				});
			},
		},
		mutations: {
			/**
			 * @param state
			 * @param {MutationPayload<CounterSetData, CounterSetActions>} payload
			 */
			set: (state, payload) => {
				logger.log('counterModel set mutation', payload);

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
			 * @param {MutationPayload<CounterClearData, CounterClearActions>} payload
			 */
			clear: (state, payload) => {
				logger.log('counterModel clear mutation', payload);

				state.collection = {};
			},
		},
	};

	module.exports = {
		counterModel,
	};
});
