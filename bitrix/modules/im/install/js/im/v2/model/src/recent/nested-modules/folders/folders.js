import { BuilderModel, type ActionTree, type MutationTree, type GetterTree } from 'ui.vue3.vuex';
import { Type, type JsonObject } from 'main.core';

import { FolderType } from 'im.v2.const';
import { formatFieldsWithConfig, type ImModelFolder, type ImModelFolderChat } from 'im.v2.model';

import { folderFieldsConfig } from './format/field-config';

type FoldersState = {
	collection: {
		[folderId: string]: ImModelFolder
	},
};

export class FoldersModel extends BuilderModel
{
	getState(): FoldersState
	{
		return {
			collection: {},
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function recent/folders/getList */
			getList: (state: FoldersState): ImModelFolder[] => {
				return Object.values(state.collection)
					.sort((a, b) => (a.sort - b.sort) || (a.id - b.id));
			},
			/** @function recent/folders/getById */
			getById: (state: FoldersState) => (folderId: number): ImModelFolder => {
				return state.collection[folderId];
			},
			/** @function recent/folders/getPersonalCount */
			getPersonalCount: (state: FoldersState) => {
				return Object.values(state.collection)
					.filter((folder) => folder.type === FolderType.personal)
					.length;
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function recent/folders/set */
			set: (store, payload: ImModelFolder[]) => {
				if (!Type.isArray(payload))
				{
					return;
				}

				const preparedList = payload.map((folder) => this.#formatFields(folder));
				store.commit('set', preparedList);
			},
			/** @function recent/folders/add */
			add: (store, payload: ImModelFolder) => {
				store.commit('add', this.#formatFields(payload));
			},
			/** @function recent/folders/update */
			update: (store, payload: ImModelFolder) => {
				const existingItem = store.state.collection[payload.id];
				if (!existingItem)
				{
					return;
				}

				store.commit('update', this.#formatFields(payload));
			},
			/** @function recent/folders/delete */
			delete: (store, payload: { id: number }) => {
				const existingItem = store.state.collection[payload.id];
				if (!existingItem)
				{
					return;
				}

				store.commit('delete', payload);
			},
			/** @function recent/folders/sort */
			sort: (store, payload: number[]) => {
				if (!Type.isArray(payload))
				{
					return;
				}

				const orderedIds = payload.filter((folderId) => store.state.collection[folderId]);

				store.commit('sort', orderedIds);
			},
			/** @function recent/folders/addChats */
			addChats: (store, payload: { folderId: number, chats: ImModelFolderChat[] }) => {
				const folder = store.state.collection[payload.folderId];
				if (!folder || folder.type !== FolderType.personal || !Type.isArray(payload.chats))
				{
					return;
				}

				store.commit('addChats', payload);
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree
	{
		return {
			set: (state: FoldersState, payload: ImModelFolder[]) => {
				payload.forEach((folder) => {
					state.collection[folder.id] = folder;
				});
			},
			add: (state: FoldersState, payload: ImModelFolder) => {
				state.collection[payload.id] = payload;
			},
			update: (state: FoldersState, payload: ImModelFolder) => {
				state.collection[payload.id] = { ...state.collection[payload.id], ...payload };
			},
			delete: (state: FoldersState, payload: { id: number }) => {
				delete state.collection[payload.id];
			},
			sort: (state: FoldersState, payload: number[]) => {
				payload.forEach((folderId, index) => {
					state.collection[folderId].sort = index;
				});
			},
			addChats: (state: FoldersState, payload: { folderId: number, chats: ImModelFolderChat[] }) => {
				const folder = state.collection[payload.folderId];
				const existingChatIds = new Set(folder.definition.chats.map((chat) => chat.chatId));
				const newChats = payload.chats.filter((chat) => !existingChatIds.has(chat.chatId));

				folder.definition = {
					...folder.definition,
					chats: [...folder.definition.chats, ...newChats],
				};
			},
		};
	}

	#formatFields(fields: JsonObject): ImModelFolder
	{
		return formatFieldsWithConfig(fields, folderFieldsConfig);
	}
}
