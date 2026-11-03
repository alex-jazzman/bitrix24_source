/* eslint-disable no-param-reassign */

/**
 * @module im/messenger/model/folder/src/model
 */
jn.define('im/messenger/model/folder/src/model', (require, exports, module) => {
	const { Type } = require('type');
	const { isEqual } = require('utils/object');
	const { folderDefaultElement } = require('im/messenger/model/folder/src/default-element');
	const { normalize } = require('im/messenger/model/folder/src/normalizer');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('model--folder', 'FolderModel');

	/**
	 * @type {FolderModel}
	 */
	const folderModel = {
		namespaced: true,

		state: () => ({
			collection: {},
			sortedIds: [],
		}),

		getters: {
			/**
			 * @function folderModel/getById
			 * @return {FolderModelState | null}
			 */
			getById: (state) => (id) => {
				return state.collection[id] || null;
			},

			/**
			 * @function folderModel/getList
			 * @return {Array<FolderModelState>}
			 */
			getList: (state) => () => {
				return state.sortedIds
					.map((id) => state.collection[id])
					.filter(Boolean);
			},

			/**
			 * @function folderModel/getChatIds
			 * @return {Array<number>}
			 */
			getChatIds: (state) => (folderId) => {
				return state.collection[folderId]?.chatIds || [];
			},

			/**
			 * Resolves the composite folder's `sourceFolders` codes into the set of
			 * recent sections to union. The section is taken strictly from each member
			 * folder's own `recentSection` (no static code-to-section aliasing): e.g. member
			 * `tasksTaskRoot` carries `recentSection: 'tasksTask'`. Missing/unknown codes
			 * are skipped. Single source of the section set for both list and counter.
			 *
			 * @function folderModel/getSourceSections
			 * @return {Set<string>}
			 */
			getSourceSections: (state) => (folderId) => {
				const sections = new Set();
				const folder = state.collection[folderId];
				if (!folder || !Type.isArrayFilled(folder.sourceFolders))
				{
					return sections;
				}

				const folderByCode = new Map();
				for (const member of Object.values(state.collection))
				{
					if (member && Type.isStringFilled(member.code))
					{
						folderByCode.set(member.code, member);
					}
				}

				for (const code of folder.sourceFolders)
				{
					const member = folderByCode.get(code);
					if (member && Type.isStringFilled(member.recentSection))
					{
						sections.add(member.recentSection);
					}
				}

				return sections;
			},

			/**
			 * @function folderModel/getPersonalFolders
			 * @return {Array<FolderModelState>}
			 */
			getPersonalFolders: (state) => () => {
				return state.sortedIds
					.map((id) => state.collection[id])
					.filter((folder) => folder && folder.type === 'personal');
			},

			/**
			 * @function folderModel/getFoldersForChat
			 * @return {Array<FolderModelState>}
			 */
			getFoldersForChat: (state) => (chatId) => {
				return Object.values(state.collection)
					.filter((folder) => folder && folder.type === 'personal' && folder.chatIds.includes(chatId));
			},

			/**
			 * @function folderModel/getSortedIds
			 * @return {Array<number>}
			 */
			getSortedIds: (state) => () => {
				return state.sortedIds.slice();
			},
		},

		actions: {
			/**
			 * @function folderModel/set
			 */
			set: (store, payload) => {
				const folderList = Type.isArray(payload?.folderList) ? payload.folderList : [];

				const incomingMap = new Map();
				const incomingSortedIds = [];
				for (const rawFolder of folderList)
				{
					const normalized = normalize(rawFolder);
					if (!Type.isNumber(normalized.id) || normalized.id <= 0)
					{
						continue;
					}

					// Backend (toRestFormat) does not return the `sort` field. Contract: the
					// array is pre-sorted on the server (FolderProvider::getByUser ORDER BY
					// SORT, ID). Client uses array position as the final `sort` value. If
					// the contract changes (backend starts sending `sort`) — switch to
					// honoring the server-provided value.
					const folder = {
						...folderDefaultElement,
						...normalized,
						sort: incomingSortedIds.length,
					};
					incomingMap.set(folder.id, folder);
					incomingSortedIds.push(folder.id);
				}

				const currentMap = store.state.collection;
				const currentSortedIds = store.state.sortedIds;

				// Adds and updates
				for (const [id, folder] of incomingMap.entries())
				{
					const existing = currentMap[id];
					if (!existing)
					{
						store.commit('add', {
							actionName: 'set',
							data: { folder },
						});
						continue;
					}

					if (!isEqualFolder(existing, folder))
					{
						store.commit('update', {
							actionName: 'set',
							data: {
								id,
								fields: diffFields(existing, folder),
							},
						});
					}
				}

				// Deletes
				for (const id of currentSortedIds)
				{
					if (!incomingMap.has(id))
					{
						store.commit('delete', {
							actionName: 'set',
							data: { id },
						});
					}
				}

				// Sort: commit only when sequence diverges
				if (!isEqualOrder(currentSortedIds, incomingSortedIds))
				{
					store.commit('sort', {
						actionName: 'set',
						data: { sortedIds: incomingSortedIds },
					});
				}
			},

			/**
			 * @function folderModel/setFromLocalDatabase
			 */
			setFromLocalDatabase: (store, payload) => {
				const folderList = Type.isArray(payload?.folderList) ? payload.folderList : [];
				const collection = {};
				const sortedIds = [];

				folderList
					.map((rawFolder) => normalize(rawFolder, { fromLocalDatabase: true }))
					.filter((normalized) => Type.isNumber(normalized.id) && normalized.id > 0)
					.sort((a, b) => (a.sort !== b.sort ? a.sort - b.sort : a.id - b.id))
					.forEach((normalized) => {
						const folder = { ...folderDefaultElement, ...normalized };
						collection[folder.id] = folder;
						sortedIds.push(folder.id);
					});

				store.commit('setState', {
					actionName: 'setFromLocalDatabase',
					data: { collection, sortedIds },
				});
			},

			/**
			 * @function folderModel/add
			 * @param {MessengerStore<FolderModel>} store
			 * @param {FolderAddPayload} payload
			 */
			add: (store, payload) => {
				upsertFolder(store, payload, 'add');
			},

			/**
			 * @function folderModel/addFromPull
			 * @param {MessengerStore<FolderModel>} store
			 * @param {FolderAddPayload} payload
			 */
			addFromPull: (store, payload) => {
				upsertFolder(store, payload, 'addFromPullEvent');
			},

			/** @function folderModel/update */
			update: (store, payload) => {
				const id = payload?.id;
				const fields = payload?.fields;
				if (!Type.isNumber(id) || id <= 0 || !Type.isPlainObject(fields))
				{
					return;
				}

				if (!store.state.collection[id])
				{
					return;
				}

				store.commit('update', {
					actionName: 'update',
					data: { id, fields },
				});
			},

			/** @function folderModel/delete */
			delete: (store, payload) => {
				const id = payload?.id;
				if (!Type.isNumber(id) || id <= 0)
				{
					return;
				}

				if (!store.state.collection[id])
				{
					return;
				}

				store.commit('delete', {
					actionName: 'delete',
					data: { id },
				});
			},

			/** @function folderModel/sort */
			sort: (store, payload) => {
				const sortedIds = Type.isArray(payload?.sortedIds) ? payload.sortedIds : null;
				if (!sortedIds)
				{
					return;
				}

				store.commit('sort', {
					actionName: 'sort',
					data: { sortedIds: sortedIds.filter((id) => Type.isNumber(id)) },
				});
			},

			/**
			 * @function folderModel/setChats
			 * @param {MessengerStore<FolderModel>} store
			 * @param {FolderChatsPayload} payload
			 */
			setChats: (store, payload) => {
				const folderId = payload?.folderId;
				const chatIds = Type.isArray(payload?.chatIds) ? payload.chatIds : null;
				if (!Type.isNumber(folderId) || folderId <= 0 || !chatIds)
				{
					return;
				}

				if (!store.state.collection[folderId])
				{
					return;
				}

				store.commit('setChats', {
					actionName: 'setChats',
					data: { folderId, chatIds },
				});
			},
		},

		mutations: {
			/**
			 * @param state
			 * @param {MutationPayload<FolderAddData>} payload
			 */
			add: (state, payload) => {
				logger.log('folderModel add mutation', payload);
				const { folder } = payload.data;

				if (state.sortedIds.includes(folder.id))
				{
					state.collection[folder.id] = { ...folderDefaultElement, ...folder };

					return;
				}

				state.collection[folder.id] = {
					...folderDefaultElement,
					...folder,
					sort: state.sortedIds.length,
				};
				state.sortedIds.push(folder.id);
			},

			/**
			 * @param state
			 * @param {MutationPayload<FolderUpdateData>} payload
			 */
			update: (state, payload) => {
				logger.log('folderModel update mutation', payload);
				const { id, fields } = payload.data;

				const existing = state.collection[id];
				if (!existing)
				{
					return;
				}

				state.collection[id] = { ...existing, ...fields };
			},

			/**
			 * @param state
			 * @param {MutationPayload<FolderDeleteData>} payload
			 */
			delete: (state, payload) => {
				logger.log('folderModel delete mutation', payload);
				const { id } = payload.data;

				delete state.collection[id];
				const index = state.sortedIds.indexOf(id);
				if (index !== -1)
				{
					state.sortedIds.splice(index, 1);
				}
			},

			/**
			 * @param state
			 * @param {MutationPayload<FolderSortData>} payload
			 */
			sort: (state, payload) => {
				logger.log('folderModel sort mutation', payload);
				const { sortedIds } = payload.data;

				state.sortedIds = sortedIds.filter((id) => state.collection[id]);
			},

			/**
			 * @param state
			 * @param {MutationPayload<FolderChatsData>} payload
			 */
			setChats: (state, payload) => {
				logger.log('folderModel setChats mutation', payload);
				const { folderId, chatIds } = payload.data;

				const folder = state.collection[folderId];
				if (!folder)
				{
					return;
				}

				const normalized = chatIds.filter((chatId) => Type.isNumber(chatId));
				state.collection[folderId] = { ...folder, chatIds: normalized };
			},

			/**
			 * @param state
			 * @param {MutationPayload<{ collection: Record<number, FolderModelState>, sortedIds: Array<number> }>} payload
			 */
			setState: (state, payload) => {
				logger.log('folderModel setState mutation', payload);
				const { collection, sortedIds } = payload.data;

				state.collection = collection;
				state.sortedIds = sortedIds;
			},
		},
	};

	/**
	 * Shared upsert routine for `add` / `addFromPull` actions. Normalizes the
	 * payload, decides between `add` and `update` mutation, and tags both with
	 * the provided `actionName` so consumers can distinguish the source.
	 *
	 * @param {MessengerStore<FolderModel>} store
	 * @param {FolderAddPayload} payload
	 * @param {string} actionName
	 * @return {void}
	 */
	function upsertFolder(store, payload, actionName)
	{
		const rawFolder = payload?.folder;
		if (!Type.isPlainObject(rawFolder))
		{
			return;
		}

		const normalized = normalize(rawFolder);
		if (!Type.isNumber(normalized.id) || normalized.id <= 0)
		{
			return;
		}

		const folder = { ...folderDefaultElement, ...normalized };
		const existing = store.state.collection[folder.id];
		if (existing)
		{
			store.commit('update', {
				actionName,
				data: {
					id: folder.id,
					fields: diffFields(existing, folder),
				},
			});

			return;
		}

		store.commit('add', {
			actionName,
			data: { folder },
		});
	}

	/**
	 * Shallow folder equality, comparing all top-level fields including the order and
	 * content of the chatIds and sourceFolders arrays.
	 *
	 * @param {FolderModelState} a
	 * @param {FolderModelState} b
	 * @return {boolean}
	 */
	function isEqualFolder(a, b)
	{
		if (a.id !== b.id
			|| a.parentChatId !== b.parentChatId
			|| a.type !== b.type
			|| a.code !== b.code
			|| a.title !== b.title
			|| a.description !== b.description
			|| a.sort !== b.sort
			|| a.visible !== b.visible
			|| a.recentSection !== b.recentSection)
		{
			return false;
		}

		const aChatIds = Type.isArray(a.chatIds) ? a.chatIds : [];
		const bChatIds = Type.isArray(b.chatIds) ? b.chatIds : [];
		if (!isEqual(aChatIds, bChatIds))
		{
			return false;
		}

		const aSourceFolders = Type.isArray(a.sourceFolders) ? a.sourceFolders : [];
		const bSourceFolders = Type.isArray(b.sourceFolders) ? b.sourceFolders : [];

		return isEqual(aSourceFolders, bSourceFolders);
	}

	/**
	 * Returns the subset of fields that differ between existing and incoming.
	 *
	 * @param {FolderModelState} existing
	 * @param {FolderModelState} incoming
	 * @return {Partial<FolderModelState>}
	 */
	function diffFields(existing, incoming)
	{
		const fields = {};
		const keys = ['parentChatId', 'type', 'code', 'title', 'description', 'sort', 'visible', 'recentSection'];
		for (const key of keys)
		{
			if (existing[key] !== incoming[key])
			{
				fields[key] = incoming[key];
			}
		}

		const aChatIds = Type.isArray(existing.chatIds) ? existing.chatIds : [];
		const bChatIds = Type.isArray(incoming.chatIds) ? incoming.chatIds : [];
		if (!isEqual(aChatIds, bChatIds))
		{
			fields.chatIds = bChatIds.slice();
		}

		const aSourceFolders = Type.isArray(existing.sourceFolders) ? existing.sourceFolders : [];
		const bSourceFolders = Type.isArray(incoming.sourceFolders) ? incoming.sourceFolders : [];
		if (!isEqual(aSourceFolders, bSourceFolders))
		{
			fields.sourceFolders = bSourceFolders.slice();
		}

		return fields;
	}

	/**
	 * @param {Array<number>} a
	 * @param {Array<number>} b
	 * @return {boolean}
	 */
	function isEqualOrder(a, b)
	{
		return isEqual(a, b);
	}

	module.exports = { folderModel };
});
