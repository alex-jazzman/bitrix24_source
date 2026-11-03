/* eslint-disable no-param-reassign */

/**
 * @module im/messenger/model/sidebar/src/project-info/model
 */
jn.define('im/messenger/model/sidebar/src/project-info/model', (require, exports, module) => {
	const { Type } = require('type');

	const { validate } = require('im/messenger/model/sidebar/src/project-info/validator');
	const { projectInfoDefaultElement } = require('im/messenger/model/sidebar/src/project-info/default-element');

	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('model--sidebar-project-info');

	/** @type {SidebarProjectInfoModel} */
	const sidebarProjectInfoModel = {
		namespaced: true,
		state: () => ({
			collection: {},
		}),
		getters: {
			/**
			 * Never returns undefined: a chat without loaded data gets the empty element,
			 * so the sidebar keeps working when the request fails.
			 *
			 * @param state
			 * @return {function(DialogId): SidebarProjectInfoItem}
			 */
			getByDialogId: (state) => (dialogId) => {
				return state.collection[dialogId] ?? projectInfoDefaultElement();
			},

			/**
			 * Tells a chat still waiting for its answer from a project whose fields are empty:
			 * getByDialogId answers with the same empty element for both.
			 *
			 * @param state
			 * @return {function(DialogId): boolean}
			 */
			hasByDialogId: (state) => (dialogId) => {
				return Boolean(state.collection[dialogId]);
			},
		},
		actions: {
			/**
			 * @param store
			 * @param {{dialogId: DialogId, fields: SidebarProjectInfoPayload}} payload
			 */
			set: (store, payload) => {
				const { dialogId, fields } = payload;

				if (Type.isNil(dialogId))
				{
					return;
				}

				store.commit('set', {
					actionName: 'set',
					data: {
						dialogId,
						fields: validate(fields),
					},
				});
			},

			/**
			 * @param store
			 * @param {{dialogId: DialogId}} payload
			 */
			delete: (store, payload) => {
				const { dialogId } = payload;

				if (!store.state.collection[dialogId])
				{
					return;
				}

				store.commit('delete', {
					actionName: 'delete',
					data: {
						dialogId,
					},
				});
			},
		},
		mutations: {
			/**
			 * @param state
			 * @param {MutationPayload<SidebarProjectInfoSetData, SidebarProjectInfoSetActions>} payload
			 */
			set: (state, payload) => {
				logger.log('sidebarProjectInfoModel: set mutation', payload);

				const { dialogId, fields } = payload.data;

				state.collection[dialogId] = fields;
			},

			/**
			 * @param state
			 * @param {MutationPayload<SidebarProjectInfoDeleteData, SidebarProjectInfoDeleteActions>} payload
			 */
			delete: (state, payload) => {
				logger.log('sidebarProjectInfoModel: delete mutation', payload);

				const { dialogId } = payload.data;

				delete state.collection[dialogId];
			},
		},
	};

	module.exports = { sidebarProjectInfoModel };
});
