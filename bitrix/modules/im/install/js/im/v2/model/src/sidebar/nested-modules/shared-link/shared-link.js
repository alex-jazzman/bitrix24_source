import { ActionTree, BuilderModel, GetterTree, MutationTree } from 'ui.vue3.vuex';
import { Type } from 'main.core';

import { formatFieldsWithConfig } from 'im.v2.model';
import { Core } from 'im.v2.application.core';

import { sidebarSharedLinkFieldsConfig } from './format/field-config';

import type { JsonObject } from 'main.core';
import type { ImModelSidebarSharedLinkItem } from 'im.v2.model';

type SharedLinkState = {
	collection: { [id: number]: ImModelSidebarSharedLinkItem },
}

const EntityType = {
	chat: 'chat',
};

export class SharedLinkModel extends BuilderModel
{
	getState(): SharedLinkState
	{
		return {
			collection: {},
		};
	}

	getElementState(): ImModelSidebarSharedLinkItem
	{
		return {
			id: 0,
			code: '',
			dateCreate: new Date(),
			dateExpire: null,
			entityId: '',
			entityType: '',
			requireApproval: false,
			type: '',
			url: '',
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function sidebar/sharedLink/getChatInviteLink */
			getChatInviteLink: (state: SharedLinkState) => (chatId: number): ImModelSidebarSharedLinkItem => {
				const entityId = chatId.toString();

				return Object.values(state.collection).find((link) => {
					return link.entityId === entityId && link.entityType === EntityType.chat;
				});
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function sidebar/sharedLink/set */
			set: (store, rawPayload) => {
				let payload = rawPayload;
				if (!Array.isArray(payload) && Type.isPlainObject(payload))
				{
					payload = [payload];
				}

				const preparedLink = payload.map((link) => {
					return this.formatFields(link);
				});

				preparedLink.forEach((link) => {
					const existingLink = store.state.collection[link.id];
					if (existingLink)
					{
						store.commit('update', {
							id: link.id,
							fields: link,
						});

						return;
					}

					store.commit('add', {
						id: link.id,
						fields: { ...this.getElementState(), ...link },
					});
				});
			},
			/** @function sidebar/sharedLink/regenerate */
			regenerate: (store, payload: { newLink: ImModelSidebarSharedLinkItem }) => {
				const { newLink } = payload;

				const chatId = Number(newLink.entityId);
				const currentLink = Core.getStore().getters['sidebar/sharedLink/getChatInviteLink'](chatId);

				void Core.getStore().dispatch('sidebar/sharedLink/set', newLink);

				store.commit('delete', { id: currentLink.id });
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			add: (state: SharedLinkState, payload: { id: number, fields: ImModelSidebarSharedLinkItem }) => {
				// eslint-disable-next-line no-param-reassign
				state.collection[payload.id] = payload.fields;
			},
			update: (state: SharedLinkState, payload: { id: number, fields: ImModelSidebarSharedLinkItem }) => {
				// eslint-disable-next-line no-param-reassign
				state.collection[payload.id] = { ...state.collection[payload.id], ...payload.fields };
			},
			delete: (state: SharedLinkState, payload: { id: number }) => {
				// eslint-disable-next-line no-param-reassign
				delete state.collection[payload.id];
			},
		};
	}

	formatFields(fields: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(fields, sidebarSharedLinkFieldsConfig);
	}
}
