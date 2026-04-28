/* eslint-disable no-param-reassign */
/**
 * @module im/messenger/model/recent/model
 */
jn.define('im/messenger/model/recent/model', (require, exports, module) => {
	const { Type } = require('type');
	const { Uuid } = require('utils/uuid');

	const {
		DialogType,
		RecentTab,
		NavigationTabId,
	} = require('im/messenger/const');
	const { DateFormatter } = require('im/messenger/lib/date-formatter');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { ModelUtils } = require('im/messenger/lib/utils');
	const { recentDefaultElement } = require('im/messenger/model/recent/default-element');
	const { recentFilteredModel } = require('im/messenger/model/recent/filter/model');
	const { filterResolvers } = require('im/messenger/model/recent/resolvers');

	const { normalize } = require('im/messenger/model/recent/normalizer');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('model--recent');

	const MutationSetCollectionIdByTab = {
		[NavigationTabId.chats]: 'setChatIdCollection',
		[NavigationTabId.copilot]: 'setCopilotIdCollection',
		[NavigationTabId.channel]: 'setChannelIdCollection',
		[NavigationTabId.collab]: 'setCollabIdCollection',
		[NavigationTabId.task]: 'setTaskIdCollection',
		[NavigationTabId.openlines]: 'setOpenlineIdCollection',
	};

	const MutationHideCollectionIdByTab = {
		[NavigationTabId.chats]: 'deleteFromChatIdCollection',
		[NavigationTabId.copilot]: 'deleteFromCopilotIdCollection',
		[NavigationTabId.channel]: 'deleteFromChannelIdCollection',
		[NavigationTabId.collab]: 'deleteFromCollabIdCollection',
		[NavigationTabId.task]: 'deleteFromTaskIdCollection',
		[NavigationTabId.openlines]: 'deleteOpenlineIdCollection',
	};

	const CollectionByTab = {
		[NavigationTabId.chats]: 'chatIdCollection',
		[NavigationTabId.copilot]: 'copilotIdCollection',
		[NavigationTabId.channel]: 'channelIdCollection',
		[NavigationTabId.collab]: 'collabIdCollection',
		[NavigationTabId.task]: 'taskIdCollection',
		[NavigationTabId.openlines]: 'openlineIdCollection',
	};

	// TODO: MessengerV2 move to helper
	const NavigationTabByRecentTab = {
		[RecentTab.chat]: NavigationTabId.chats,
		[RecentTab.copilot]: NavigationTabId.copilot,
		[RecentTab.collab]: NavigationTabId.collab,
		[RecentTab.openChannel]: NavigationTabId.channel,
		[RecentTab.tasksTask]: NavigationTabId.task,
		[RecentTab.openlines]: NavigationTabId.openlines,
	};

	const FIRST_PAGE_SIZE = 50;

	/** @type {RecentMessengerModel} */
	const recentModel = {
		namespaced: true,
		state: () => ({
			collection: {},
			chatIdCollection: new Set(),
			copilotIdCollection: new Set(),
			channelIdCollection: new Set(),
			collabIdCollection: new Set(),
			taskIdCollection: new Set(),
			openlineIdCollection: new Set(),
		}),
		modules: {
			recentFilteredModel,
		},
		getters: {
			/**
			 * @function recentModel/getIdCollection
			 * @param {string} tabId
			 * @return {Set<string>}
			 */
			getIdCollection: (state, getters, rootState, rootGetters) => (tabId) => {
				const hasSelectedFilter = rootGetters['recentModel/recentFilteredModel/hasSelectedFilter'](tabId);
				if (!hasSelectedFilter)
				{
					const rawCollection = state[CollectionByTab[tabId]];

					return rawCollection ? new Set(rawCollection) : new Set();
				}

				return rootGetters['recentModel/recentFilteredModel/getIdCollection'](tabId);
			},

			/**
			 * @function recentModel/getById
			 * @return {?RecentModelState}
			 */
			getById: (state) => (id) => {
				return state.collection[String(id)];
			},

			/**
			 * @typedef {Function} recentModelGetByChatId
			 * @param {number} chatId
			 * @return {?RecentModelState}
			 * @alias recentModel/getByChatId
			 */
			/**
			 * @return {recentModelGetByChatId}
			 */
			getByChatId: (state, getters, rootState, rootGetters) => (chatId) => {
				const dialogModel = rootGetters['dialoguesModel/getByChatId'](chatId);

				return state.collection[dialogModel?.dialogId];
			},

			/**
			 * @function recentModel/getChatIdCollection
			 * @return {Set<string>}
			 */
			getChatIdCollection: (state, getters) => () => {
				return getters.getIdCollection(NavigationTabId.chats);
			},

			/**
			 * @function recentModel/getChatFirstPage
			 * @return {Array<RecentModelState>}
			 */
			getChatFirstPage: (state, getters) => () => {
				return getters.getFirstPageByIdCollection(getters.getChatIdCollection());
			},

			/**
			 * @function recentModel/getCopilotIdCollection
			 * @return {Set<string>}
			 */
			getCopilotIdCollection: (state, getters) => () => {
				return getters.getIdCollection(NavigationTabId.copilot);
			},

			/**
			 * @function recentModel/getCopilotFirstPage
			 * @return {Array<RecentModelState>}
			 */
			getCopilotFirstPage: (state, getters) => () => {
				return getters.getFirstPageByIdCollection(state.copilotIdCollection);
			},

			/**
			 * @function recentModel/getCollabIdCollection
			 * @return {Set<string>}
			 */
			getCollabIdCollection: (state, getters) => () => {
				return getters.getIdCollection(NavigationTabId.collab);
			},

			/**
			 * @function recentModel/getCollabFirstPage
			 * @return {Array<RecentModelState>}
			 */
			getCollabFirstPage: (state, getters) => () => {
				return getters.getFirstPageByIdCollection(state.collabIdCollection);
			},

			/**
			 * @function recentModel/getChannelIdCollection
			 * @return {Set<string>}
			 */
			getChannelIdCollection: (state, getters) => () => {
				return getters.getIdCollection(NavigationTabId.channel);
			},

			/**
			 * @function recentModel/getChannelFirstPage
			 * @return {Array<RecentModelState>}
			 */
			getChannelFirstPage: (state, getters) => () => {
				return getters.getFirstPageByIdCollection(state.channelIdCollection, sortListByMessageDate);
			},

			/**
			 * @function recentModel/getOpenlinesIdCollection
			 * @return {Set<string>}
			 */
			getOpenlinesIdCollection: (state, getters) => () => {
				return getters.getIdCollection(NavigationTabId.openlines);
			},

			/**
			 * @function recentModel/getOpenlinesFirstPage
			 * @return {Array<RecentModelState>}
			 */
			getOpenlinesFirstPage: (state, getters) => () => {
				return getters.getFirstPageByIdCollection(state.openlineIdCollection);
			},

			/**
			 * @function recentModel/getTaskIdCollection
			 * @return {Set<string>}
			 */
			getTaskIdCollection: (state, getters) => () => {
				return getters.getIdCollection(NavigationTabId.task);
			},

			/**
			 * @function recentModel/getTaskFirstPage
			 * @return {Array<RecentModelState>}
			 */
			getTaskFirstPage: (state, getters) => () => {
				return getters.getFirstPageByIdCollection(getters.getTaskIdCollection());
			},

			/**
			 * @function recentModel/getFirstPageByIdCollection
			 * @return {Array<RecentModelState>}
			 */
			getFirstPageByIdCollection: (state, getters, rootState, rootGetters) => (idCollection, sortFunction) => {
				const items = [];
				for (const dialogId of idCollection)
				{
					if (Type.isStringFilled(dialogId))
					{
						const item = state.collection[dialogId];
						if (Type.isPlainObject(item))
						{
							items.push(item);
						}
					}
				}
				const sorter = sortFunction?.(rootGetters) ?? sortByAggregatedActivityDateWithPinned(rootGetters);

				return items.sort(sorter).slice(0, FIRST_PAGE_SIZE);
			},

			/**
			 * @function recentModel/getChatCollection
			 * @return {Array<RecentModelState>}
			 */
			getChatCollection: (state, getters, rootState, rootGetters) => () => {
				return [...state.chatIdCollection]
					.filter((dialogId) => {
						return Type.isStringFilled(dialogId);
					})
					.map((id) => {
						return state.collection[id];
					})
					.sort(sortByAggregatedActivityDate(rootGetters));
			},

			/**
			 * @function recentModel/getCollection
			 * @return {Array<RecentModelState>}
			 */
			getCollection: (state) => () => {
				return Object.values(state.collection).map((item) => ({ ...item }));
			},

			/**
			 * @function recentModel/getByIdList
			 * @return {Array<RecentModelState>}
			 */
			getByIdList: (state) => (idList) => {
				return Object.values(state.collection)
					.filter((recentItem) => idList.includes(recentItem.id));
			},

			/**
			 * @typedef {Function} getByChatIdList
			 * @param {Array<number>} chatIdList
			 * @return {Array<RecentModelState>}
			 * @alias recentModel/getByChatIdList
			 */
			/**
			 * @return {getByChatIdList}
			 */
			getByChatIdList: (state, getters, rootState, rootGetters) => (chatIdList) => {
				if (!Type.isArrayFilled(chatIdList))
				{
					return [];
				}

				const recentList = [];
				Object.values(state.collection).forEach((recentItem) => {
					const dialogModel = rootGetters['dialoguesModel/getById'](recentItem.id);

					if (chatIdList.includes(dialogModel?.chatId))
					{
						recentList.push(recentItem);
					}
				});

				return recentList;
			},

			/**
			 * @function recentModel/getTabsContainsItem
			 * @return {Array<string>} // value NavigationTabId properties
			 */
			getTabsContainsItem: (state) => (id) => {
				return Object.entries(CollectionByTab)
					.filter(([_, collectionKey]) => state[collectionKey]?.has(id))
					.map(([tabId]) => tabId);
			},

			/**
			 * @function recentModel/getCollectionSizeByTabId
			 * @return {number|null}
			 */
			getCollectionSizeByTabId: (state) => (tabId) => {
				return state[CollectionByTab[tabId]]?.size;
			},

			/**
			 * @function recentModel/getSortedCollection
			 * @return {Array<RecentModelState>}
			 */
			getSortedCollection: (state, getters) => () => {
				const collectionAsArray = getters.getCollection().filter(
					(item) => Boolean(item.message.id),
				);

				return [...collectionAsArray].sort((a, b) => {
					return b.message.date - a.message.date;
				});
			},

			/**
			 * @function recentModel/getUserList
			 * @return {Array<RecentModelState>}
			 */
			getUserList: (state, getters, rootState, rootGetters) => () => {
				return Object.values(state.collection).filter((item) => {
					return !item.id.startsWith('chat') && rootGetters['usersModel/getById'](item.id);
				}).sort((userItemA, userItemB) => sortByLastActivityDateOnly(userItemA, userItemB));
			},

			/**
			 * @typedef {Function} recentModelHasItemInTab
			 * @param {string} dialogId
			 * @param {string} navigationTabId
			 * @return {boolean}
			 * @alias recentModel/hasItemInTab
			 */
			/**
			 * @return {recentModelHasItemInTab}
			 */
			hasItemInTab: (state) => (dialogId, navigationTabId) => {
				const collection = state[CollectionByTab[navigationTabId]];
				if (!Type.isObject(collection))
				{
					logger.error('recentModel/hasItemInTab invalid navigationTabId', navigationTabId);

					return false;
				}

				return collection.has(dialogId);
			},

			/**
			 * @function recentModel/needsBirthdayPlaceholder
			 * @return {boolean}
			 */
			needsBirthdayPlaceholder: (state, getters, rootState, rootGetters) => (dialogId) => {
				const currentItem = getters.getById(dialogId);
				if (!currentItem)
				{
					return false;
				}

				const dialog = rootGetters['dialoguesModel/getById'](dialogId);
				if (!dialog || (dialog.type !== DialogType.user && dialog.type !== DialogType.private))
				{
					return false;
				}

				const hasBirthday = rootGetters['usersModel/hasBirthday'](dialogId);
				if (!hasBirthday)
				{
					return false;
				}

				const hasMessage = Uuid.isV4(currentItem.message.id) || currentItem.message.id > 0;
				const hasTodayMessage = hasMessage && DateFormatter.isToday(currentItem.message.date);

				return !hasTodayMessage && dialog.counter === 0;
			},

			/**
			 * @function recentModel/needsBirthdayIcon
			 * @return {boolean}
			 */
			needsBirthdayIcon: (state, getters, rootState, rootGetters) => (dialogId) => {
				const currentItem = getters.getById(dialogId);
				if (!currentItem)
				{
					return false;
				}

				const dialog = rootGetters['dialoguesModel/getById'](dialogId);
				if (!dialog || (dialog.type !== DialogType.user && dialog.type !== DialogType.private))
				{
					return false;
				}

				return rootGetters['usersModel/hasBirthday'](dialogId);
			},

			/**
			 * @function recentModel/needsVacationIcon
			 * @return {boolean}
			 */
			needsVacationIcon: (state, getters, rootState, rootGetters) => (dialogId) => {
				const currentItem = getters.getById(dialogId);
				if (!currentItem)
				{
					return false;
				}

				const dialog = rootGetters['dialoguesModel/getById'](dialogId);
				if (!dialog || (dialog.type !== DialogType.user && dialog.type !== DialogType.private))
				{
					return false;
				}

				return rootGetters['usersModel/hasVacation'](dialogId);
			},
		},
		actions: {
			/**
			 * @function recentModel/syncFilteredIdCollection
			 * @param {string} payload.tabId
			 */
			syncFilteredIdCollection: async (store, payload) => {
				const { tabId } = payload;
				const hasTab = store.getters['recentFilteredModel/hasNavigationTabId'](tabId);
				const hasSelectedFilter = store.getters['recentFilteredModel/hasSelectedFilter'](tabId);
				if (!hasTab || !hasSelectedFilter)
				{
					return;
				}

				const baseIds = store.state[CollectionByTab[tabId]] || new Set();
				const currentFilterId = store.getters['recentFilteredModel/getCurrentFilterId'](tabId);
				const rootGetters = store.rootGetters;
				const resolver = filterResolvers[currentFilterId];
				const filteredIds = resolver ? resolver(tabId, baseIds, rootGetters) : baseIds;

				await store.dispatch('recentFilteredModel/setIdCollection', {
					tabId,
					itemIds: [...filteredIds],
				});
			},

			/** @function recentModel/setChat */
			setChat: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));

				store.commit('setChatIdCollection', {
					actionName: 'setChat',
					data: {
						itemIds,
					},
				});

				await store.dispatch('set', payload);
			},

			/** @function recentModel/setCopilot */
			setCopilot: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));
				store.commit('setCopilotIdCollection', {
					actionName: 'setCopilot',
					data: {
						itemIds,
					},
				});

				await store.dispatch('set', payload);
			},

			/** @function recentModel/setChannel */
			setChannel: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));
				store.commit('setChannelIdCollection', {
					actionName: 'setChannel',
					data: {
						itemIds,
					},
				});

				await store.dispatch('set', payload);
			},

			/** @function recentModel/setCollab */
			setCollab: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));
				store.commit('setCollabIdCollection', {
					actionName: 'setCollab',
					data: {
						itemIds,
					},
				});

				await store.dispatch('set', payload);
			},

			/** @function recentModel/setTask */
			setTask: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));

				store.commit('setTaskIdCollection', {
					actionName: 'setTask',
					data: {
						itemIds,
					},
				});

				await store.dispatch('set', payload);
			},

			/** @function recentModel/setOpenline */
			setOpenline: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));
				store.commit('setOpenlineIdCollection', {
					actionName: 'setOpenline',
					data: {
						itemIds,
					},
				});

				await store.dispatch('set', payload);
			},

			/** @function recentModel/setFirstPageByTab */
			setFirstPageByTab: async (store, payload) => {
				const { tab, itemList } = payload;
				const navTab = getNavigationTabId(tab);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));
				if (!CollectionByTab[navTab])
				{
					logger.error('RecentModel.setFirstPageByTab unknown tab:', navTab);

					return;
				}

				const actionName = 'setFirstPageByTab';
				await store.dispatch('set', { itemList, actionName });

				store.commit('storeIdCollection', {
					actionName,
					data: {
						tab: navTab,
						itemIds,
					},
				});
			},

			/** @function recentModel/setByNavigationTabs */
			setByNavigationTabs: async (store, payload) => {
				const {
					tabs,
					actionName = 'setByNavigationTabs',
				} = payload;
				let { itemList } = payload;

				if (!Type.isArrayFilled(tabs))
				{
					return;
				}

				if (!Type.isArray(itemList))
				{
					itemList = [itemList];
				}
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));

				tabs.forEach((tab) => {
					const mutation = MutationSetCollectionIdByTab[tab];
					if (!mutation)
					{
						logger.error('RecentModel.setByRecentConfigTabs invalid tab:', tab);

						return;
					}

					store.commit(mutation, {
						actionName,
						data: {
							itemIds,
						},
					});
				});

				await store.dispatch('set', [...new Set(itemList)]);
			},

			/** @function recentModel/setByRecentConfigTabs */
			setByRecentConfigTabs: async (store, payload) => {
				const tabs = payload.tabs;
				if (!Type.isArrayFilled(tabs))
				{
					return;
				}

				let itemList = payload.itemList;
				if (!Type.isArray(itemList))
				{
					itemList = [itemList];
				}

				await store.dispatch('setByNavigationTabs', {
					tabs: tabs.map((tab) => getNavigationTabId(tab)),
					itemList,
					actionName: 'setByRecentConfigTabs',
				});
			},

			/** @function recentModel/setGroupCollection */
			setGroupCollection: async (store, payload) => {
				const groups = payload.groups;
				const tabs = Object.keys(groups);
				if (tabs.length === 0)
				{
					return;
				}

				const itemList = [];
				tabs.forEach((tab) => {
					const navTab = getNavigationTabId(tab);
					const mutation = MutationSetCollectionIdByTab[navTab];
					const items = groups[tab];
					if (!Type.isArrayFilled(items))
					{
						logger.log('RecentModel.setGroupCollection skipped by items is empty for:', tab);

						return;
					}

					if (!mutation)
					{
						logger.error('RecentModel.setGroupCollection invalid tab:', tab);

						return;
					}

					itemList.push(...items);
					const itemIds = items.map((item) => String(item.id || item.dialogId));

					store.commit(mutation, {
						actionName: 'setGroupCollection',
						data: {
							itemIds,
						},
					});
				});

				if (!Type.isArrayFilled(itemList))
				{
					return;
				}

				await store.dispatch('set', [...new Set(itemList)]);
			},

			/** @function recentModel/set */
			set: (store, payload) => {
				/**
				 * @type {Array<RecentModelState>}
				 */
				const result = [];
				const { itemList, actionName = 'set' } = ModelUtils.normalizeItemListPayload(payload);

				if (Type.isArray(itemList))
				{
					itemList.forEach((recentItem) => {
						if (Type.isPlainObject(recentItem))
						{
							checkUploadingState(store, recentItem);

							result.push(normalize(recentItem));
						}
					});
				}

				const { newItems, existingItems } = splitItemsByExistence(store, result);
				if (newItems.length > 0)
				{
					store.commit('add', {
						actionName,
						data: {
							recentItemList: newItems,
						},
					});
				}

				if (existingItems.length > 0)
				{
					store.commit('update', {
						actionName,
						data: {
							recentItemList: existingItems,
						},
					});
				}
			},

			/** @function recentModel/delete */
			delete: (store, payload) => {
				const existingItem = store.state.collection[payload.id];
				if (!existingItem)
				{
					return;
				}
				const actionName = payload.actionName || 'delete';

				store.commit('deleteFromChatIdCollection', { data: { id: existingItem.id }, actionName });
				store.commit('deleteFromCopilotIdCollection', { data: { id: existingItem.id }, actionName });
				store.commit('deleteFromChannelIdCollection', { data: { id: existingItem.id }, actionName });
				store.commit('deleteFromCollabIdCollection', { data: { id: existingItem.id }, actionName });
				store.commit('deleteFromTaskIdCollection', { data: { id: existingItem.id }, actionName });
				store.commit('deleteOpenlineIdCollection', { data: { id: existingItem.id }, actionName });

				store.commit('delete', {
					actionName,
					data: {
						id: existingItem.id,
					},
				});
			},

			/** @function recentModel/deleteFromModel */
			deleteFromModel: async (store, payload) => {
				const existingItem = store.state.collection[payload.id];
				if (!existingItem)
				{
					return;
				}
				const actionName = payload.actionName || 'deleteFromModel';

				await store.dispatch('delete', { id: existingItem.id, actionName });
			},

			/** @function recentModel/deleteOpenChannel */
			deleteOpenChannel: (store, payload) => {
				const existingItem = store.state.collection[payload.id];
				if (!existingItem)
				{
					return;
				}
				const actionName = payload.actionName || 'deleteOpenChannel';

				store.commit('deleteFromChatIdCollection', { data: { id: existingItem.id }, actionName });
			},

			/** @function recentModel/hideByNavigationTabs */
			hideByNavigationTabs: (store, payload) => {
				const {
					id,
					fromTabs, // TODO fromTabs
					actionName = 'hideByNavigationTabs',
				} = payload;
				const existingItem = store.state.collection[id];
				if (!existingItem)
				{
					return;
				}

				if (!Type.isArrayFilled(fromTabs))
				{
					return;
				}

				fromTabs.forEach((tabId) => {
					const mutation = MutationHideCollectionIdByTab[tabId];
					if (!Type.isStringFilled(mutation))
					{
						logger.log(`hide action. unknown tabId: ${tabId}. skip `, tabId);

						return;
					}

					store.commit(mutation, {
						actionName,
						data: {
							id,
						},
					});
				});
			},

			/** @function recentModel/hideByRecentConfigTabs */
			hideByRecentConfigTabs: async (store, payload) => {
				const { id, fromTabs } = payload;
				const existingItem = store.state.collection[id];
				if (!existingItem)
				{
					return;
				}

				if (!Type.isArrayFilled(fromTabs))
				{
					return;
				}

				await store.dispatch('hideByNavigationTabs', {
					id,
					actionName: 'hideByRecentConfigTabs',
					fromCollections: fromTabs.map((tabId) => getNavigationTabId(tabId)),
				});
			},

			/** @function recentModel/update */
			update: (store, payload) => {
				/** @type {Array<Partial<RecentModelState>>} */
				const result = [];

				if (Type.isArray(payload))
				{
					payload.forEach((recentItem) => {
						if (Type.isPlainObject(recentItem))
						{
							result.push(normalize(recentItem));
						}
					});
				}

				if (result.length === 0)
				{
					return;
				}

				const existingItems = [];
				result.forEach((item) => {
					const existingItem = store.state.collection[item.id];

					if (!existingItem)
					{
						return;
					}

					existingItems.push({
						fields: item,
					});
				});

				if (existingItems.length === 0)
				{
					return;
				}

				store.commit('update', {
					actionName: 'update',
					data: {
						recentItemList: existingItems,
					},
				});
			},

			/** @function recentModel/like */
			like: (store, payload) => {
				const { id, messageId, liked } = payload;

				const existingItem = store.state.collection[id];
				if (!existingItem)
				{
					return;
				}

				if (
					!(Type.isUndefined(messageId) && liked === false)
					&& existingItem.message.id !== Number(messageId)
				)
				{
					return;
				}

				store.commit('update', {
					actionName: 'like',
					data: {
						recentItemList: [{ fields: { id, liked } }],
					},
				});
			},
		},
		mutations: {
			/**
			 * @param state
			 * @param {MutationPayload<RecentSetIdCollectionData, RecentSetIdCollectionActions>} payload
			 */
			setChatIdCollection: (state, payload) => {
				logger.warn('RecentModel.setChatIdCollection', payload);
				const { data } = payload;
				data.itemIds.forEach((dialogId) => {
					state.chatIdCollection.add(dialogId);
				});
			},
			/**
			 * @param state
			 * @param {MutationPayload<RecentSetIdCollectionData, RecentSetIdCollectionActions>} payload
			 */
			setCopilotIdCollection: (state, payload) => {
				logger.warn('RecentModel.setCopilotIdCollection', payload);
				const { data } = payload;
				data.itemIds.forEach((dialogId) => {
					state.copilotIdCollection.add(dialogId);
				});
			},
			/**
			 * @param state
			 * @param {MutationPayload<RecentStoreIdCollectionData, RecentStoreIdCollectionActions>} payload
			 */
			storeIdCollection: (state, payload) => {
				logger.warn('RecentModel.storeIdCollection', payload);

				const { data } = payload;

				state[CollectionByTab[data.tab]] = new Set(data.itemIds);
			},

			/**
			 * @param state
			 * @param {MutationPayload<RecentSetIdCollectionData, RecentSetIdCollectionActions>} payload
			 */
			setChannelIdCollection: (state, payload) => {
				logger.warn('RecentModel.setChannelIdCollection', payload);
				const { data } = payload;
				data.itemIds.forEach((dialogId) => {
					state.channelIdCollection.add(dialogId);
				});
			},
			/**
			 * @param state
			 * @param {MutationPayload<RecentSetIdCollectionData, RecentSetIdCollectionActions>} payload
			 */
			setCollabIdCollection: (state, payload) => {
				logger.warn('RecentModel.setCollabIdCollection', payload);
				const { data } = payload;
				data.itemIds.forEach((dialogId) => {
					state.collabIdCollection.add(dialogId);
				});
			},
			/**
			 * @param state
			 * @param {MutationPayload<RecentSetIdCollectionData, RecentSetIdCollectionActions>} payload
			 */
			setTaskIdCollection: (state, payload) => {
				logger.warn('RecentModel.setTaskIdCollection', payload);
				const { data } = payload;
				data.itemIds.forEach((dialogId) => {
					state.taskIdCollection.add(dialogId);
				});
			},
			/**
			 * @param state
			 * @param {MutationPayload<RecentSetIdCollectionData, RecentSetIdCollectionActions>} payload
			 */
			setOpenlineIdCollection: (state, payload) => {
				logger.warn('RecentModel.setOpenlineIdCollection', payload);
				const { data } = payload;
				data.itemIds.forEach((dialogId) => {
					state.openlineIdCollection.add(dialogId);
				});
			},
			/**
			 * @param state
			 * @param {MutationPayload<RecentDeleteData, RecentDeleteActions>} payload
			 */
			deleteFromChatIdCollection: (state, payload) => {
				logger.warn('RecentModel.deleteFromChatIdCollection', payload);
				state.chatIdCollection.delete(payload.data.id);
			},
			/**
			 * @param state
			 * @param {MutationPayload<RecentDeleteData, RecentDeleteActions>} payload
			 */
			deleteFromCopilotIdCollection: (state, payload) => {
				logger.warn('RecentModel.deleteFromCopilotIdCollection', payload);
				state.copilotIdCollection.delete(payload.data.id);
			},
			/**
			 * @param state
			 * @param {MutationPayload<RecentDeleteData, RecentDeleteActions>} payload
			 */
			deleteFromChannelIdCollection: (state, payload) => {
				logger.warn('RecentModel.deleteFromChannelIdCollection', payload);
				state.channelIdCollection.delete(payload.data.id);
			},
			/**
			 * @param state
			 * @param {MutationPayload<RecentDeleteData, RecentDeleteActions>} payload
			 */
			deleteFromCollabIdCollection: (state, payload) => {
				logger.warn('RecentModel.deleteFromCollabIdCollection', payload);
				state.collabIdCollection.delete(payload.data.id);
			},
			/**
			 * @param state
			 * @param {MutationPayload<RecentDeleteData, RecentDeleteActions>} payload
			 */
			deleteFromTaskIdCollection: (state, payload) => {
				logger.warn('RecentModel.deleteFromTaskIdCollection', payload);
				state.taskIdCollection.delete(payload.data.id);
			},
			/**
			 * @param state
			 * @param {MutationPayload<RecentDeleteData, RecentDeleteActions>} payload
			 */
			deleteOpenlineIdCollection: (state, payload) => {
				logger.warn('RecentModel.deleteOpenlineIdCollection', payload);
				state.openlineIdCollection.delete(payload.data.id);
			},

			/**
			 * @param state
			 * @param {MutationPayload<RecentAddData, RecentAddActions>} payload
			 */
			add: (state, payload) => {
				logger.warn('RecentModel.add', payload);

				const {
					recentItemList,
				} = payload.data;

				recentItemList.forEach((item) => {
					state.collection[item.fields.id] = {
						...recentDefaultElement,
						...item.fields,
					};
				});
			},

			/**
			 * @param state
			 * @param {MutationPayload<RecentUpdateData, RecentUpdateActions>} payload
			 */
			update: (state, payload) => {
				logger.warn('RecentModel.update', payload);
				const {
					recentItemList,
				} = payload.data;

				recentItemList.forEach((item) => {
					const currentElement = state.collection[item.fields.id];

					item.fields.message = { ...currentElement?.message, ...item.fields.message };
					item.fields.options = { ...currentElement?.options, ...item.fields.options };

					state.collection[item.fields.id] = {
						...state.collection[item.fields.id],
						...item.fields,
					};
				});
			},

			/**
			 * @param state
			 * @param {MutationPayload<RecentDeleteData, RecentDeleteActions>} payload
			 */
			delete: (state, payload) => {
				const { id } = payload.data;
				logger.warn('RecentModel.delete', id);
				delete state.collection[id];
			},
		},
	};

	/**
	 * @param {string} tab
	 * @returns {string}
	 */
	function getNavigationTabId(tab)
	{
		if (NavigationTabByRecentTab[tab])
		{
			return NavigationTabByRecentTab[tab];
		}

		return tab;
	}

	function checkUploadingState(store, recentItem)
	{
		const existingItem = store.state.collection[recentItem.id];
		if (!existingItem)
		{
			return;
		}

		if (recentItem.message?.uuid && recentItem.message?.uuid === existingItem.element?.uploadingState?.message?.id)
		{
			recentItem.uploadingState = null;
		}
	}

	function splitItemsByExistence(store, items)
	{
		const newItems = [];
		const existingItems = [];

		items.forEach((recentItem) => {
			const existingItem = store.state.collection[recentItem.id];
			if (existingItem)
			{
				// if we already got chat, we should not upd ate it
				// with default user chat (unless it's an accepted invitation)
				const defaultUserElement = (
					recentItem.options
					&& recentItem.options.defaultUserRecord
					&& !recentItem.invitation
				);

				if (defaultUserElement)
				{
					return;
				}

				existingItems.push({
					fields: recentItem,
				});
			}
			else
			{
				newItems.push({
					fields: recentItem,
				});
			}
		});

		return { newItems, existingItems };
	}

	/**
	 * @param {MessengerStore<RecentMessengerModel>['rootGetters']} rootGetters
	 * @returns {(a: RecentModelState, b: RecentModelState) => number}
	 */
	const sortByAggregatedActivityDateWithPinned = (rootGetters) => (a, b) => {
		if (!a.pinned && b.pinned)
		{
			return 1;
		}

		if (a.pinned && !b.pinned)
		{
			return -1;
		}

		const aLastActivityDate = getLastActivityDate(a, rootGetters);
		const bLastActivityDate = getLastActivityDate(b, rootGetters);

		return bLastActivityDate - aLastActivityDate;
	};

	/**
	 * @param {MessengerStore<RecentMessengerModel>['rootGetters']} rootGetters
	 * @returns {(a: RecentModelState, b: RecentModelState) => number}
	 */
	const sortByAggregatedActivityDate = (rootGetters) => (a, b) => {
		const aLastActivityDate = getLastActivityDate(a, rootGetters);
		const bLastActivityDate = getLastActivityDate(b, rootGetters);

		return bLastActivityDate - aLastActivityDate;
	};

	/**
	 * @returns {(a: RecentModelState, b: RecentModelState) => number}
	 */
	const sortListByMessageDate = () => (a, b) => {
		if (a.message?.date && b.message?.date)
		{
			const timestampA = new Date(a.message.date).getTime();
			const timestampB = new Date(b.message.date).getTime();

			return timestampB - timestampA;
		}

		return 0;
	};

	/**
	 * @returns {number}
	 */
	const sortByLastActivityDateOnly = (a, b) => {
		if (a.lastActivityDate && b.lastActivityDate)
		{
			const timestampA = new Date(a.lastActivityDate).getTime();
			const timestampB = new Date(b.lastActivityDate).getTime();

			return timestampB - timestampA;
		}

		return 0;
	};

	/**
	 * @param {RecentModelState} item
	 * @param {MessengerStore<RecentMessengerModel>['rootGetters']} [rootGetters]
	 * @returns {Date}
	 */
	const getLastActivityDate = (item, rootGetters = null) => {
		const getTime = (date) => date?.getTime() || new Date(0).getTime();

		const recentLastActivityDate = item.lastActivityDate;
		const recentMessageDate = item.message?.date;

		let recent = recentMessageDate;
		const isChannel = DialogHelper.createByDialogId(item.id)?.isChannel;
		const shouldUseActivityDate = Type.isDate(recentLastActivityDate) && recentLastActivityDate > recentMessageDate;

		if (isChannel && shouldUseActivityDate)
		{
			recent = recentLastActivityDate;
		}

		const draftDate = rootGetters?.['draftModel/getById'](item.id)?.lastActivityDate;
		const uploadingDate = item.uploadingState?.lastActivityDate;

		return new Date(Math.max(
			getTime(draftDate),
			getTime(uploadingDate),
			getTime(recent),
		));
	};

	module.exports = { recentModel };
});
