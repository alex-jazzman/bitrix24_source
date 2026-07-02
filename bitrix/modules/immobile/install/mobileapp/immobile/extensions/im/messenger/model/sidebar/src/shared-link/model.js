/* eslint-disable no-param-reassign */

/**
 * @module im/messenger/model/sidebar/src/shared-link/model
 */
jn.define('im/messenger/model/sidebar/src/shared-link/model', (require, exports, module) => {
	const { Type } = require('type');

	const { normalize } = require('im/messenger/model/sidebar/src/shared-link/normalizer');
	const { sharedLinkItem } = require('im/messenger/model/sidebar/src/shared-link/default-element');

	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('model--sidebar-shared-link');

	const EntityType = {
		chat: 'chat',
	};

	/** @type {SidebarSharedLinkModel} */
	const sidebarSharedLinkModel = {
		namespaced: true,
		state: () => ({
			collection: {},
		}),
		getters: {
			/**
			 * @function sidebarModel/sidebarSharedLinkModel/getChatInviteLink
			 * @param state
			 * @return {Object|undefined}
			 */
			getChatInviteLink: (state) => (chatId) => {
				const entityId = String(chatId);

				return Object.values(state.collection).find((link) => {
					return link.entityId === entityId && link.entityType === EntityType.chat;
				});
			},
		},
		actions: {
			/**
			 * @function sidebarModel/sidebarSharedLinkModel/set
			 */
			set: (store, rawPayload) => {
				let payload = rawPayload;
				if (!Array.isArray(payload) && Type.isPlainObject(payload))
				{
					payload = [payload];
				}

				if (!Type.isArrayFilled(payload))
				{
					return;
				}

				payload.forEach((rawLink) => {
					const link = { ...sharedLinkItem, ...normalize(rawLink) };

					if (!link.id)
					{
						return;
					}

					const existingLink = store.state.collection[link.id];
					if (existingLink)
					{
						store.commit('update', {
							actionName: 'set',
							data: {
								id: link.id,
								fields: link,
							},
						});
					}
					else
					{
						store.commit('add', {
							actionName: 'set',
							data: {
								id: link.id,
								fields: link,
							},
						});
					}
				});
			},

			/**
			 * @function sidebarModel/sidebarSharedLinkModel/regenerate
			 */
			regenerate: (store, payload) => {
				const { newLink } = payload;
				if (!Type.isPlainObject(newLink))
				{
					return;
				}

				const chatId = String(newLink.entityId ?? '');

				if (!Type.isStringFilled(chatId))
				{
					return;
				}

				const currentLink = store.getters.getChatInviteLink(chatId);

				const validatedLink = { ...sharedLinkItem, ...normalize(newLink) };

				if (validatedLink.id)
				{
					store.commit('add', {
						actionName: 'regenerate',
						data: {
							id: validatedLink.id,
							fields: validatedLink,
						},
					});
				}

				if (currentLink && currentLink.id !== validatedLink.id)
				{
					store.commit('delete', {
						actionName: 'regenerate',
						data: {
							id: currentLink.id,
						},
					});
				}
			},

			/**
			 * @function sidebarModel/sidebarSharedLinkModel/deleteByChatId
			 */
			deleteByChatId: (store, payload) => {
				const { chatId } = payload;

				const linkToDelete = store.getters.getChatInviteLink(chatId);

				if (linkToDelete)
				{
					store.commit('delete', {
						actionName: 'deleteByChatId',
						data: {
							id: linkToDelete.id,
						},
					});
				}
			},
		},
		mutations: {
			/**
			 * @param state
			 * @param {MutationPayload} payload
			 */
			add: (state, payload) => {
				logger.log('SidebarSharedLinkModel: add mutation', payload);
				const { id, fields } = payload.data;

				state.collection[id] = fields;
			},

			/**
			 * @param state
			 * @param {MutationPayload} payload
			 */
			update: (state, payload) => {
				logger.log('SidebarSharedLinkModel: update mutation', payload);
				const { id, fields } = payload.data;

				state.collection[id] = { ...state.collection[id], ...fields };
			},

			/**
			 * @param state
			 * @param {MutationPayload} payload
			 */
			delete: (state, payload) => {
				logger.log('SidebarSharedLinkModel: delete mutation', payload);
				const { id } = payload.data;

				if (state.collection[id])
				{
					delete state.collection[id];
				}
			},
		},
	};

	module.exports = { sidebarSharedLinkModel };
});
