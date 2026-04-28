/* eslint-disable no-param-reassign */
/**
 * @module im/messenger/model/dialogues/openlines/model
 */
jn.define('im/messenger/model/dialogues/openlines/model', (require, exports, module) => {
	const { Type } = require('type');
	const { mergeImmutable } = require('utils/object');
	const { validate } = require('im/messenger/model/dialogues/openlines/validator');
	const { openLineDefaultElement } = require('im/messenger/model/dialogues/openlines/default-element');

	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('model--dialogues-openLines');

	/** @type {OpenlinesModel} */
	const openlinesModel = {
		namespaced: true,
		state: () => ({
			collection: {},
		}),
		getters: {
			/**
			 * @function dialoguesModel/openlinesModel/getSession
			 * @return {OpenlinesSessionModelState | null}
			 */
			getSession: (state) => (chatId) => {
				return state.collection[chatId] ?? null;
			},

			/**
			 * @function dialoguesModel/openlinesModel/getSessionStatus
			 * @return {OpenlinesSessionStatus | null}
			 */
			getSessionStatus: (state) => (chatId) => {
				return state.collection[chatId]?.status ?? null;
			},
		},
		actions: {
			/** @function dialoguesModel/openlinesModel/set */
			set: (store, payload) => {
				if (!Type.isArrayFilled(payload))
				{
					return;
				}

				const updateItems = [];
				const addItems = [];

				payload
					.map((element) => validate(element))
					.forEach((element) => {
					/** @type {OpenlinesSessionModelState} */
						const existingItem = store.state.collection[element.chatId];
						if (existingItem)
						{
							updateItems.push({
								chatId: element.chatId,
								fields: mergeImmutable(existingItem, element),
							});
						}
						else
						{
							addItems.push({
								chatId: element.chatId,
								fields: mergeImmutable(openLineDefaultElement, element),
							});
						}
					});

				if (updateItems.length > 0)
				{
					store.commit('update', {
						actionName: 'set',
						data: updateItems,
					});
				}

				if (addItems.length > 0)
				{
					store.commit('add', {
						actionName: 'set',
						data: addItems,
					});
				}
			},
			/** @function dialoguesModel/openlinesModel/update */
			update: (store, payload) => {
				const { chatId, fields } = payload;
				const existingItem = store.state.collection[chatId];
				if (!existingItem)
				{
					return;
				}

				store.commit('update', {
					actionName: 'update',
					data: [{
						chatId,
						fields: mergeImmutable(existingItem, validate(fields)),
					}],
				});
			},
		},
		mutations: {
			/**
			 * @param state
			 * @param {MutationPayload<OpenlinesUpdateData, OpenlinesUpdateAction>} payload
			 */
			update: (state, payload) => {
				logger.log('OpenlinesModel: update mutation', payload);

				payload.data.forEach(({ chatId, fields }) => {
					state.collection[chatId] = fields;
				});
			},
			/**
			 * @param state
			 * @param {MutationPayload<OpenlinesSetData, OpenlinesSetAction>} payload
			 */
			add: (state, payload) => {
				logger.log('OpenlinesModel: add mutation', payload);

				payload.data.forEach(({ chatId, fields }) => {
					state.collection[chatId] = fields;
				});
			},
		},
	};

	module.exports = { openlinesModel };
});
