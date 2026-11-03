import { Type } from 'main.core';
import { BuilderModel } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { SidebarFileGroups } from 'im.v2.const';

import { formatFieldsWithConfig } from '../../../utils/validate';
import { sidebarFilesFieldsConfig } from './format/field-config';

import type { JsonObject } from 'main.core';
import type { ImModelSidebarFileItem } from '../../../registry';
import type { GetterTree, ActionTree, MutationTree } from 'ui.vue3.vuex';

type FilesState = {
	collection: {
		[chatId: number]: {
			[string]: ChatState
		}
	},
};

type ChatState = {
	items: Map<number, ImModelSidebarFileItem>,
	hasNextPage: boolean,
	lastId: number,
	lastDate: string,
};

type FilesPayload = {
	chatId?: number,
	files?: Object[],
	group?: string,
	hasNextPage?: boolean,
}

const LATEST_FILES_LIMIT = 3;

/**
 * The date is compared as a time value, not as a string: a comparison of date formats gives a wrong
 * order. The number resolves the tie: without it records of one date follow the order of insertion
 * into the collection and change places between redraws.
 */
const compareByDateDesc = (first: ImModelSidebarFileItem, second: ImModelSidebarFileItem): number => {
	const dateDiff = second.date.getTime() - first.date.getTime();

	return dateDiff === 0 ? second.id - first.id : dateDiff;
};

const compareByIdDesc = (first: ImModelSidebarFileItem, second: ImModelSidebarFileItem): number => {
	return second.id - first.id;
};

/**
 * The order of a collection must match the order the server read that group in (API-01): pages of
 * the voice tab arrive by the date of the record, the other groups arrive by its number, and sorting
 * a page by the other key would shuffle already ordered pages between each other.
 */
const getComparator = (group: string): Function => {
	return group === SidebarFileGroups.audio ? compareByDateDesc : compareByIdDesc;
};

/* eslint-disable no-param-reassign */
export class FilesModel extends BuilderModel
{
	getState(): FilesState
	{
		return {
			collection: {},
			collectionSearch: {},
			historyLimitExceededCollection: {},
		};
	}

	getElementState(): ImModelSidebarFileItem
	{
		return {
			id: 0,
			messageId: 0,
			chatId: 0,
			authorId: 0,
			date: new Date(),
			fileId: 0,
		};
	}

	getChatState(): ChatState
	{
		return {
			items: new Map(),
			hasNextPage: true,
			lastId: 0,
			lastDate: '',
		};
	}

	// eslint-disable-next-line max-lines-per-function
	getGetters(): GetterTree
	{
		return {
			/** @function sidebar/files/get */
			get: (state) => (chatId: number, group: string): ImModelSidebarFileItem[] => {
				if (!state.collection[chatId] || !state.collection[chatId][group])
				{
					return [];
				}

				return [...state.collection[chatId][group].items.values()].sort(getComparator(group));
			},
			/** @function sidebar/files/getSearchResultCollection */
			getSearchResultCollection: (state) => (chatId: number, group: string): ImModelSidebarFileItem[] => {
				if (!state.collectionSearch[chatId] || !state.collectionSearch[chatId][group])
				{
					return [];
				}

				return [...state.collectionSearch[chatId][group].items.values()].sort(getComparator(group));
			},
			/** @function sidebar/files/getLatest */
			getLatest: (state, getters, rootState, rootGetters) => (chatId: number): ImModelSidebarFileItem[] => {
				if (!state.collection[chatId])
				{
					return [];
				}

				let media = [];
				let audio = [];
				let files = [];
				let briefs = [];

				if (state.collection[chatId][SidebarFileGroups.media])
				{
					media = [...state.collection[chatId][SidebarFileGroups.media].items.values()];
				}

				if (state.collection[chatId][SidebarFileGroups.audio])
				{
					audio = [...state.collection[chatId][SidebarFileGroups.audio].items.values()];
				}

				if (state.collection[chatId][SidebarFileGroups.file])
				{
					files = [...state.collection[chatId][SidebarFileGroups.file].items.values()];
				}

				if (state.collection[chatId][SidebarFileGroups.brief])
				{
					briefs = [...state.collection[chatId][SidebarFileGroups.brief].items.values()];
				}

				const sortedFlatCollection = [media, audio, files, briefs]
					.flat()
					.sort((a, b) => b.id - a.id)
				;

				return this.getTopThreeCompletedFiles(sortedFlatCollection, rootGetters);
			},
			/** @function sidebar/files/getLatestUnsorted */
			getLatestUnsorted: (state, getters, rootState, rootGetters) => (chatId: number): ImModelSidebarFileItem[] => {
				if (!state.collection[chatId])
				{
					return [];
				}

				let unsorted = [];

				if (state.collection[chatId][SidebarFileGroups.fileUnsorted])
				{
					unsorted = [...state.collection[chatId][SidebarFileGroups.fileUnsorted].items.values()];
				}

				const sortedCollection = unsorted.sort((a, b) => b.id - a.id);

				return this.getTopThreeCompletedFiles(sortedCollection, rootGetters);
			},
			/** @function sidebar/files/getSize */
			getSize: (state) => (chatId: number, group: string): number => {
				if (!state.collection[chatId] || !state.collection[chatId][group])
				{
					return 0;
				}

				return state.collection[chatId][group].items.size;
			},
			// Whether the chat holds any file at all, whatever its group and whatever the preview block
			// of the sidebar is willing to show: a chat of nothing but video notes has files, and
			// `getLatest` leaves them out of its selection by design.
			/** @function sidebar/files/hasAnyFiles */
			hasAnyFiles: (state) => (chatId: number): boolean => {
				const groups = state.collection[chatId];
				if (!groups)
				{
					return false;
				}

				return Object.values(groups).some((group: ChatState) => group.items.size > 0);
			},
			/** @function sidebar/files/hasNextPage */
			hasNextPage: (state) => (chatId: number, group: string): boolean => {
				if (!state.collection[chatId] || !state.collection[chatId][group])
				{
					return false;
				}

				return state.collection[chatId][group].hasNextPage;
			},
			/** @function sidebar/files/hasNextPageSearch */
			hasNextPageSearch: (state) => (chatId: number, group: string): boolean => {
				if (!state.collectionSearch[chatId] || !state.collectionSearch[chatId][group])
				{
					return false;
				}

				return state.collectionSearch[chatId][group].hasNextPage;
			},
			/** @function sidebar/files/getLastId */
			getLastId: (state) => (chatId: number, group: string): boolean => {
				if (!state.collection[chatId] || !state.collection[chatId][group])
				{
					return false;
				}

				return state.collection[chatId][group].lastId;
			},
			/** @function sidebar/files/getSearchResultCollectionLastId */
			getSearchResultCollectionLastId: (state) => (chatId: number, group: string): boolean => {
				if (!state.collectionSearch[chatId] || !state.collectionSearch[chatId][group])
				{
					return false;
				}

				return state.collectionSearch[chatId][group].lastId;
			},
			/** @function sidebar/files/getLastDate */
			getLastDate: (state) => (chatId: number, group: string): string => {
				if (!state.collection[chatId] || !state.collection[chatId][group])
				{
					return '';
				}

				return state.collection[chatId][group].lastDate;
			},
			/** @function sidebar/files/getSearchResultCollectionLastDate */
			getSearchResultCollectionLastDate: (state) => (chatId: number, group: string): string => {
				if (!state.collectionSearch[chatId] || !state.collectionSearch[chatId][group])
				{
					return '';
				}

				return state.collectionSearch[chatId][group].lastDate;
			},
			/** @function sidebar/files/isHistoryLimitExceeded */
			isHistoryLimitExceeded: (state) => (chatId: number): boolean => {
				const isAvailable = Core.getStore().getters['application/tariffRestrictions/isHistoryAvailable'];
				if (isAvailable)
				{
					return false;
				}

				return state.historyLimitExceededCollection[chatId] ?? false;
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function sidebar/files/set */
			set: (store, payload) => {
				const { chatId, files, group } = payload;
				if (!Type.isArrayFilled(files) || !Type.isNumber(chatId))
				{
					return;
				}

				files.forEach((file) => {
					const preparedFile = { ...this.getElementState(), ...this.formatFields(file) };
					store.commit('add', { chatId, group, file: preparedFile });
				});
			},
			/** @function sidebar/files/setSearch */
			setSearch: (store, payload: FilesPayload) => {
				const { chatId, files, group } = payload;
				if (!Type.isArrayFilled(files) || !Type.isNumber(chatId))
				{
					return;
				}

				files.forEach((file) => {
					const preparedFile = { ...this.getElementState(), ...this.formatFields(file) };
					store.commit('addSearch', { chatId, group, file: preparedFile });
				});
			},
			/** @function sidebar/files/delete */
			delete: (store, payload) => {
				const { chatId, id } = payload;
				if (!Type.isNumber(id) || !Type.isNumber(chatId))
				{
					return;
				}

				if (!store.state.collection[chatId])
				{
					return;
				}

				store.commit('delete', { chatId, id });
			},
			/** @function sidebar/files/setHasNextPage */
			setHasNextPage: (store, payload) => {
				const { chatId, group, hasNextPage } = payload;
				if (!Type.isNumber(chatId))
				{
					return;
				}

				if (!store.state.collection[chatId])
				{
					return;
				}

				store.commit('setHasNextPage', { chatId, group, hasNextPage });
			},
			/** @function sidebar/files/setHasNextPageSearch */
			setHasNextPageSearch: (store, payload: FilesPayload) => {
				const { chatId, group, hasNextPage } = payload;
				if (!Type.isNumber(chatId))
				{
					return;
				}

				if (!store.state.collectionSearch[chatId])
				{
					return;
				}

				store.commit('setHasNextPageSearch', { chatId, group, hasNextPage });
			},
			/** @function sidebar/files/setLastId */
			setLastId: (store, payload) => {
				const { chatId, group, lastId, lastDate = '' } = payload;
				if (!Type.isNumber(chatId))
				{
					return;
				}

				if (!store.state.collection[chatId])
				{
					return;
				}

				store.commit('setLastId', { chatId, group, lastId, lastDate });
			},
			/** @function sidebar/files/setLastIdSearch */
			setLastIdSearch: (store, payload) => {
				const { chatId, group, lastId, lastDate = '' } = payload;
				if (!Type.isNumber(chatId))
				{
					return;
				}

				if (!store.state.collectionSearch[chatId])
				{
					return;
				}

				store.commit('setLastIdSearch', { chatId, group, lastId, lastDate });
			},
			/** @function sidebar/files/clearGroup */
			clearGroup: (store, payload) => {
				const { chatId, group } = payload;
				if (!Type.isNumber(chatId))
				{
					return;
				}

				if (!store.state.collection[chatId])
				{
					return;
				}

				store.commit('clearGroup', { chatId, group });
			},
			/** @function sidebar/files/clearSearch */
			clearSearch: (store) => {
				store.commit('clearSearch', {});
			},
			/** @function sidebar/files/setHistoryLimitExceeded */
			setHistoryLimitExceeded: (store, payload) => {
				const { chatId, isHistoryLimitExceeded = false } = payload;
				store.commit('setHistoryLimitExceeded', { chatId, isHistoryLimitExceeded });
			},
		};
	}

	// eslint-disable-next-line max-lines-per-function
	getMutations(): MutationTree
	{
		return {
			add: (state, payload: {chatId: number, group: string, file: ImModelSidebarFileItem}) => {
				const { chatId, file, group } = payload;

				if (!state.collection[chatId])
				{
					state.collection[chatId] = {};
				}

				if (!state.collection[chatId][group])
				{
					state.collection[chatId][group] = this.getChatState();
				}
				state.collection[chatId][group].items.set(file.id, file);
			},
			addSearch: (state, payload: {chatId: number, group: string, file: ImModelSidebarFileItem}) => {
				const { chatId, file, group } = payload;

				if (!state.collectionSearch[chatId])
				{
					state.collectionSearch[chatId] = {};
				}

				if (!state.collectionSearch[chatId][group])
				{
					state.collectionSearch[chatId][group] = this.getChatState();
				}
				state.collectionSearch[chatId][group].items.set(file.id, file);
			},
			delete: (state, payload: {chatId: number, id: number}) => {
				const { chatId, id } = payload;
				const hasCollectionSearch = !Type.isNil(state.collectionSearch[chatId]);
				Object.values(SidebarFileGroups).forEach((group) => {
					if (state.collection[chatId][group] && state.collection[chatId][group].items.has(id))
					{
						state.collection[chatId][group].items.delete(id);
						if (hasCollectionSearch)
						{
							state.collectionSearch[chatId][group].items.delete(id);
						}
					}
				});
			},
			setHasNextPage: (state, payload) => {
				const { chatId, group, hasNextPage } = payload;

				if (!state.collection[chatId])
				{
					state.collection[chatId] = {};
				}

				const hasCollection = !Type.isNil(state.collection[chatId][group]);
				if (!hasCollection)
				{
					state.collection[chatId][group] = this.getChatState();
				}

				state.collection[chatId][group].hasNextPage = hasNextPage;
			},
			setHasNextPageSearch: (state, payload) => {
				const { chatId, group, hasNextPage } = payload;

				if (!state.collectionSearch[chatId])
				{
					state.collectionSearch[chatId] = {};
				}

				const hasCollection = !Type.isNil(state.collectionSearch[chatId][group]);
				if (!hasCollection)
				{
					state.collectionSearch[chatId][group] = this.getChatState();
				}

				state.collectionSearch[chatId][group].hasNextPage = hasNextPage;
			},
			// the boundary of the page is written as a whole: a number without a date is the cursor of
			// another order, and leaving the previous date next to it would pass off a mixed pair as its own
			setLastId: (state, payload) => {
				const { chatId, group, lastId, lastDate = '' } = payload;

				if (!state.collection[chatId])
				{
					state.collection[chatId] = {};
				}

				const hasCollection = !Type.isNil(state.collection[chatId][group]);
				if (!hasCollection)
				{
					state.collection[chatId][group] = this.getChatState();
				}

				state.collection[chatId][group].lastId = lastId;
				state.collection[chatId][group].lastDate = lastDate;
			},
			setLastIdSearch: (state, payload) => {
				const { chatId, group, lastId, lastDate = '' } = payload;

				if (!state.collectionSearch[chatId])
				{
					state.collectionSearch[chatId] = {};
				}

				const hasCollection = !Type.isNil(state.collectionSearch[chatId][group]);
				if (!hasCollection)
				{
					state.collectionSearch[chatId][group] = this.getChatState();
				}

				state.collectionSearch[chatId][group].lastId = lastId;
				state.collectionSearch[chatId][group].lastDate = lastDate;
			},
			clearGroup: (state, payload) => {
				const { chatId, group } = payload;

				if (!state.collection[chatId] || !state.collection[chatId][group])
				{
					return;
				}

				state.collection[chatId][group] = this.getChatState();
			},
			clearSearch: (state) => {
				state.collectionSearch = {};
			},
			setHistoryLimitExceeded: (state, payload) => {
				const { chatId, isHistoryLimitExceeded } = payload;
				if (state.historyLimitExceededCollection[chatId] && !isHistoryLimitExceeded)
				{
					return;
				}

				state.historyLimitExceededCollection[chatId] = isHistoryLimitExceeded;
			},
		};
	}

	formatFields(fields: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(fields, sidebarFilesFieldsConfig);
	}

	getTopThreeCompletedFiles(collection: ImModelSidebarFileItem[], rootGetters): ImModelSidebarFileItem[]
	{
		const selected = [];

		for (const sidebarFile of collection)
		{
			// The record of the panel outlives the Disk object it points at, so a record whose file is
			// gone stays in the collection. Everything the selection is made by is read from the file.
			if (!rootGetters['files/isInCollection']({ fileId: sidebarFile.fileId }))
			{
				continue;
			}

			const file = rootGetters['files/get'](sidebarFile.fileId, true);

			// A video note is not a media file of this block: the block draws every record with a
			// rectangular preview and opens it in the viewer, and neither fits a round record. The sign
			// is taken from the file, the same one the row of the tab is chosen by (DTO-01).
			if (file.progress === 100 && !file.isVideoNote)
			{
				selected.push(sidebarFile);
			}

			if (selected.length === LATEST_FILES_LIMIT)
			{
				break;
			}
		}

		return selected;
	}
}
