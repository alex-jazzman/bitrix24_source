import { BuilderModel, type ActionTree, type MutationTree, type GetterTree } from 'ui.vue3.vuex';
import { Type, type JsonObject } from 'main.core';

import { FolderType, type RecentTypeItem, type SystemFolderCodeItem } from 'im.v2.const';
import {
	formatFieldsWithConfig,
	type ImModelFolder,
	type ImModelFolderChat,
	type ImModelFolderDefinition,
} from 'im.v2.model';

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
			// The whole registry in the order of the server. Outside the model the list is asked about
			// something in particular - the getters below answer those questions.
			/** @function recent/folders/getList */
			getList: (state: FoldersState): ImModelFolder[] => {
				return Object.values(state.collection)
					.sort((a, b) => (a.sort - b.sort) || (a.id - b.id));
			},
			// Service member folders of the composite "all" folder stay in the collection for the
			// composition resolver, but the server marks them invisible: they must not reach the rail, the
			// folder list or the initial layout. Folders without the flag (personal and pre-existing system
			// ones) stay visible.
			/** @function recent/folders/getVisibleList */
			getVisibleList: (state: FoldersState, getters): ImModelFolder[] => {
				return getters.getList.filter((folder: ImModelFolder) => folder.visible !== false);
			},
			// Visibility is no part of this question: a hidden personal folder would still hold its place
			// against the creation limit.
			/** @function recent/folders/getPersonalList */
			getPersonalList: (state: FoldersState, getters): ImModelFolder[] => {
				return getters.getList.filter((folder: ImModelFolder) => folder.type === FolderType.personal);
			},
			/** @function recent/folders/getById */
			getById: (state: FoldersState) => (folderId: number): ImModelFolder => {
				return state.collection[folderId];
			},
			/** @function recent/folders/getByCode */
			getByCode: (state: FoldersState) => (code: string): ImModelFolder | null => {
				if (!Type.isStringFilled(code))
				{
					return null;
				}

				return Object.values(state.collection).find((folder) => folder.code === code) ?? null;
			},
			// A composite folder is recognized by the shape of its definition, not by its code:
			// its content is a union of the sections of the folders it unites.
			/** @function recent/folders/isComposite */
			isComposite: (state: FoldersState) => (folderId: number): boolean => {
				return Type.isArrayFilled(state.collection[folderId]?.definition?.sourceFolders);
			},
			/** @function recent/folders/getSourceDefinitions */
			getSourceDefinitions: (state: FoldersState, getters) => (
				folderId: number,
			): ImModelFolderDefinition[] => {
				if (!getters.isComposite(folderId))
				{
					return [];
				}

				// the source is known by its code alone, and there is no code -> section table: what the
				// source contributes lives in the definition of the source folder itself
				return [...new Set(state.collection[folderId].definition.sourceFolders)]
					.map((sourceCode: SystemFolderCodeItem) => getters.getByCode(sourceCode))
					// the composition comes already resolved for the owner, but a source becoming
					// available is not pushed at all, so its code can outrun the folder itself
					.filter((sourceFolder: ?ImModelFolder) => sourceFolder !== null)
					.map((sourceFolder: ImModelFolder) => sourceFolder.definition);
			},
			// the list body needs the sections alone: it shows root chats only, the frames say nothing there
			/** @function recent/folders/getSourceSections */
			getSourceSections: (state: FoldersState, getters) => (folderId: number): RecentTypeItem[] => {
				const definitions: ImModelFolderDefinition[] = getters.getSourceDefinitions(folderId);

				return [...new Set(definitions.map((definition) => definition.recentSection))];
			},
			/** @function recent/folders/getPersonalCount */
			getPersonalCount: (state: FoldersState, getters): number => {
				return getters.getPersonalList.length;
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
