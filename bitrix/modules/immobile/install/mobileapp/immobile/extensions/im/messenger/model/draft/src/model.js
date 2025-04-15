// eslint-disable-next-line no-param-reassign

/**
 * @module im/messenger/model/draft/model
 */
jn.define('im/messenger/model/draft/model', (require, exports, module) => {
	const { Type } = require('type');

	const { DraftCache } = require('im/messenger/cache');
	const { draftDefaultElement } = require('im/messenger/model/draft/default-element');
	const { validate } = require('im/messenger/model/draft/validator');

	/** @type {DraftModel} */
	const draftModel = {
		namespaced: true,
		state: () => ({
			collection: {},
		}),

		getters: {
			/**
			 * @function draftModel/getById
			 * @return {DraftModelState}
			 */
			getById: (state) => (id) => {
				return state.collection[id];
			},
		},

		actions: {
			/** @function draftModel/setState */
			setState: (store, payload) => {
				store.commit('setState', {
					actionName: 'setState',
					data: {
						collection: payload.collection,
					},
				});
			},
			/**
			 * @function draftModel/set
			 * @param store
			 * @param {DraftModelState} payload
			 */
			set: (store, payload) => {
				if (!Type.isPlainObject(payload))
				{
					return;
				}

				const validPayload = validate(payload);

				const existingItem = store.state.collection[validPayload.dialogId];

				if (existingItem)
				{
					store.commit('update', {
						actionName: 'set',
						data: {
							dialogId: validPayload.dialogId,
							fields: validPayload,
						},
					});

					return;
				}

				store.commit('add', {
					actionName: 'set',
					data: {
						dialogId: validPayload.dialogId,
						fields: { ...draftDefaultElement, ...validPayload },
					},
				});
			},

			/**
			 * @function draftModel/delete
			 * @param store
			 * @param {{dialogId: string|number}} payload
			 */
			delete: (store, payload) => {
				const existingItem = store.state.collection[payload.dialogId];
				if (!existingItem)
				{
					return false;
				}

				store.commit('delete', {
					actionName: 'delete',
					data: {
						dialogId: payload.dialogId,
					},
				});

				return true;
			},
		},

		mutations: {
			/**
			 * @param state
			 * @param {MutationPayload<DraftSetStateData, DraftSetStateActions>} payload
			 */
			setState: (state, payload) => {
				const {
					collection,
				} = payload.data;

				// eslint-disable-next-line no-param-reassign
				state.collection = collection;
			},

			/**
			 * @param state
			 * @param {MutationPayload<DraftAddData, DraftAddActions>} payload
			 */
			add: (state, payload) => {
				const {
					dialogId,
					fields,
				} = payload.data;

				// eslint-disable-next-line no-param-reassign
				state.collection[dialogId] = fields;

				DraftCache.save(state);
			},

			/**
			 * @param state
			 * @param {MutationPayload<DraftUpdateData, DraftUpdateActions>} payload
			 */
			update: (state, payload) => {
				const {
					dialogId,
					fields,
				} = payload.data;

				// eslint-disable-next-line no-param-reassign
				state.collection[dialogId] = { ...state.collection[dialogId], ...fields };

				DraftCache.save(state);
			},

			/**
			 * @param state
			 * @param {MutationPayload<DraftDeleteData, DraftDeleteActions>} payload
			 */
			delete: (state, payload) => {
				const {
					dialogId,
				} = payload.data;

				// eslint-disable-next-line no-param-reassign
				delete state.collection[dialogId];

				DraftCache.save(state);
			},
		},
	};

	module.exports = { draftModel, draftDefaultElement };
});
