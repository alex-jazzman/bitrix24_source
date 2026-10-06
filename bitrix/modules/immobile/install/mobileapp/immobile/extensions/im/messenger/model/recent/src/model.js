/* eslint-disable no-param-reassign */
/**
 * @module im/messenger/model/recent/model
 */
jn.define('im/messenger/model/recent/model', (require, exports, module) => {
	const { Type } = require('type');
	const { uniqBy } = require('utils/array');
	const { Uuid } = require('utils/uuid');

	const {
		DialogType,
		RecentTab,
		RecentTabByNavigationTab,
		NavigationTabByRecentTab,
		NavigationTabId,
		ROOT_PARENT_CHAT_ID,
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

	const FIRST_PAGE_SIZE = 50;

	/**
	 * Recent sections whose items must also be propagated to ROOT_PARENT_CHAT_ID
	 * when written with parentChatId > ROOT_PARENT_CHAT_ID.
	 * Add new RecentTab values here to enable propagation for them.
	 *
	 * Currently only tasksTask: nested task chats must appear both in the
	 * nested navigation and in the global "Tasks" tab.
	 * Other nested tabs (collabChat, calendar, collabDefault) are only
	 * shown inside their parent collab's nested navigation.
	 */
	const SectionsWithTopLevelPropagation = new Set([
		RecentTab.tasksTask,
	]);

	const RecentTabValues = new Set(Object.values(RecentTab));

	/** @type {RecentMessengerModel} */
	const recentModel = {
		namespaced: true,
		state: () => ({
			collection: {},
			nestedIdCollection: {},
		}),
		modules: {
			recentFilteredModel,
		},
		getters: {
			/**
			 * @function recentModel/getIdCollection
			 * @param {string} tabId
			 * @param {number} [parentChatId]
			 * @return {Set<string>}
			 */
			/**
			 * @return {recentModelGetByChatId}
			 */
			getIdCollection: (state, getters, rootState, rootGetters) => (tabId, parentChatId = ROOT_PARENT_CHAT_ID) => {
				const hasSelectedFilter = rootGetters['recentModel/recentFilteredModel/hasSelectedFilter'](tabId, parentChatId);
				if (!hasSelectedFilter)
				{
					const rawCollection = getSectionSet(state, RecentTabByNavigationTab[tabId], parentChatId);

					return rawCollection ? new Set(rawCollection) : new Set();
				}

				return rootGetters['recentModel/recentFilteredModel/getIdCollection'](tabId, parentChatId);
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
				return getters.getFirstPageByIdCollection(getters.getCopilotIdCollection());
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
				return getters.getFirstPageByIdCollection(getters.getCollabIdCollection());
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
				return getters.getFirstPageByIdCollection(getters.getChannelIdCollection(), sortListByMessageDate);
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
				return getters.getFirstPageByIdCollection(getters.getOpenlinesIdCollection());
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
				return [...(getSectionSet(state, RecentTab.chat) ?? [])]
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
				const topLevel = state.nestedIdCollection[ROOT_PARENT_CHAT_ID] ?? {};

				return Object.entries(topLevel)
					.filter(([, set]) => set?.has(id))
					.map(([recentTab]) => NavigationTabByRecentTab[recentTab])
					.filter(Boolean);
			},

			/**
			 * Returns the (parentChatId, recentSection) pairs in which the item is still present,
			 * scanning the given parentChatIds. Used by hide to decide whether the chat remains
			 * visible in any section (e.g. task child chats are virtually lifted to top-level,
			 * so both ROOT_PARENT_CHAT_ID and the chat's own parentChatId must be checked).
			 *
			 * @function recentModel/getSectionsContainingItem
			 * @return {Array<{ parentChatId: number, recentSection: string }>}
			 */
			getSectionsContainingItem: (state) => (id, parentChatIds = [ROOT_PARENT_CHAT_ID]) => {
				const result = [];

				parentChatIds.forEach((parentChatId) => {
					const sections = state.nestedIdCollection[parentChatId];
					if (!sections)
					{
						return;
					}

					Object.entries(sections).forEach(([recentSection, set]) => {
						if (set?.has(id))
						{
							result.push({ parentChatId, recentSection });
						}
					});
				});

				return result;
			},

			/**
			 * @function recentModel/getCollectionSizeByTabId
			 * @return {number|null}
			 */
			getCollectionSizeByTabId: (state) => (tabId) => {
				return getSectionSet(state, RecentTabByNavigationTab[tabId])?.size;
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
				const collection = getSectionSet(state, RecentTabByNavigationTab[navigationTabId]);
				if (!collection)
				{
					logger.error('recentModel/hasItemInTab invalid navigationTabId', navigationTabId);

					return false;
				}

				return collection.has(dialogId);
			},

			/**
			 * @typedef {Function} recentModelHasPinnedItemInSection
			 * @param {string} recentSection
			 * @param {number} [parentChatId]
			 * @return {boolean}
			 * @alias recentModel/hasPinnedItemInSection
			 */
			/**
			 * @return {recentModelHasPinnedItemInSection}
			 */
			hasPinnedItemInSection: (state) => (recentSection, parentChatId = ROOT_PARENT_CHAT_ID) => {
				const collection = getSectionSet(state, recentSection, parentChatId);
				if (!collection)
				{
					return false;
				}

				for (const dialogId of collection)
				{
					if (state.collection[dialogId]?.pinned)
					{
						return true;
					}
				}

				return false;
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

				const hasVacation = rootGetters['usersModel/hasVacation'](dialogId);
				if (hasVacation)
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
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/syncFilteredIdCollection']} payload
			 */
			syncFilteredIdCollection: async (store, payload) => {
				const { tabId, parentChatId = ROOT_PARENT_CHAT_ID } = payload;
				const hasTab = store.getters['recentFilteredModel/hasNavigationTabId'](tabId, parentChatId);
				const hasSelectedFilter = store.getters['recentFilteredModel/hasSelectedFilter'](tabId, parentChatId);
				if (!hasTab || !hasSelectedFilter)
				{
					return;
				}

				const baseIds = getSectionSet(store.state, RecentTabByNavigationTab[tabId], parentChatId) || new Set();
				const currentFilterId = store.getters['recentFilteredModel/getCurrentFilterId'](tabId, parentChatId);
				const rootGetters = store.rootGetters;
				const resolver = filterResolvers[currentFilterId];
				const filteredIds = resolver ? resolver(tabId, baseIds, rootGetters, parentChatId) : baseIds;

				await store.dispatch('recentFilteredModel/setIdCollection', {
					tabId,
					parentChatId,
					itemIds: [...filteredIds],
				});
			},

			/**
			 * @function recentModel/setChat
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setChat']} payload
			 */
			setChat: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));

				store.commit('setNestedIdCollection', {
					actionName: 'setChat',
					data: {
						recentSection: RecentTab.chat,
						itemIds,
						parentChatId: payload.parentChatId ?? ROOT_PARENT_CHAT_ID,
					},
				});

				await store.dispatch('set', payload);
			},

			/**
			 * @function recentModel/setCopilot
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setCopilot']} payload
			 */
			setCopilot: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));

				store.commit('setNestedIdCollection', {
					actionName: 'setCopilot',
					data: {
						recentSection: RecentTab.copilot,
						itemIds,
						parentChatId: payload.parentChatId ?? ROOT_PARENT_CHAT_ID,
					},
				});

				await store.dispatch('set', payload);
			},

			/**
			 * @function recentModel/setChannel
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setChannel']} payload
			 */
			setChannel: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));

				store.commit('setNestedIdCollection', {
					actionName: 'setChannel',
					data: {
						recentSection: RecentTab.openChannel,
						itemIds,
						parentChatId: payload.parentChatId ?? ROOT_PARENT_CHAT_ID,
					},
				});

				await store.dispatch('set', payload);
			},

			/**
			 * @function recentModel/setCollab
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setCollab']} payload
			 */
			setCollab: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));

				store.commit('setNestedIdCollection', {
					actionName: 'setCollab',
					data: {
						recentSection: RecentTab.collab,
						itemIds,
						parentChatId: payload.parentChatId ?? ROOT_PARENT_CHAT_ID,
					},
				});

				await store.dispatch('set', payload);
			},

			/**
			 * @function recentModel/setTask
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setTask']} payload
			 */
			setTask: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));
				const parentChatId = payload.parentChatId ?? ROOT_PARENT_CHAT_ID;

				store.commit('setNestedIdCollection', {
					actionName: 'setTask',
					data: {
						recentSection: RecentTab.tasksTask,
						itemIds,
						parentChatId,
					},
				});

				propagateToTopLevelIfNeeded(store, RecentTab.tasksTask, itemIds, parentChatId, 'setTask');

				await store.dispatch('set', payload);
			},

			/**
			 * @function recentModel/setOpenline
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setOpenline']} payload
			 */
			setOpenline: async (store, payload) => {
				const { itemList } = ModelUtils.normalizeItemListPayload(payload);
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));

				store.commit('setNestedIdCollection', {
					actionName: 'setOpenline',
					data: {
						recentSection: RecentTab.openlines,
						itemIds,
						parentChatId: payload.parentChatId ?? ROOT_PARENT_CHAT_ID,
					},
				});

				await store.dispatch('set', payload);
			},

			/**
			 * @function recentModel/setFirstPageByRecentSection
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setFirstPageByRecentSection']} payload
			 */
			setFirstPageByRecentSection: async (store, payload) => {
				const { recentSection, itemList, tabId } = payload;
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));
				if (!recentSection)
				{
					logger.error('RecentModel.setFirstPageByRecentSection unknown recentSection:', recentSection);

					return;
				}

				const actionName = 'setFirstPageByTab';
				const parentChatId = payload.parentChatId ?? ROOT_PARENT_CHAT_ID;
				await store.dispatch('set', { itemList, actionName });

				// Resolve the filter key by the actual navigation tab id when provided.
				// recentSection alone is ambiguous: collabCopilot reuses recentSection='copilot'
				// (shared with the root copilot tab), so reverse-mapping it would point to the
				// wrong tab and break the accumulate/replace choice when a filter is active.
				const navTab = tabId ?? NavigationTabByRecentTab[recentSection];
				const hasActiveFilter = navTab
					&& store.rootGetters['recentModel/recentFilteredModel/hasSelectedFilter'](navTab, parentChatId);
				const commitName = hasActiveFilter ? 'setNestedIdCollection' : 'storeNestedIdCollection';

				store.commit(commitName, {
					actionName,
					data: {
						recentSection,
						itemIds,
						parentChatId,
					},
				});

				propagateToTopLevelIfNeeded(store, recentSection, itemIds, parentChatId, actionName);
			},

			/**
			 * @function recentModel/setByRecentSection
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setByRecentSection']} payload
			 */
			setByRecentSection: async (store, payload) => {
				const { recentSection, itemList, parentChatId = ROOT_PARENT_CHAT_ID } = payload;
				const itemIds = itemList.map((item) => String(item.id || item.dialogId));
				if (!recentSection)
				{
					logger.error('RecentModel.setByRecentSection unknown recentSection:', recentSection);

					return;
				}

				const actionName = 'setByRecentSection';

				store.commit('setNestedIdCollection', {
					actionName,
					data: {
						recentSection,
						itemIds,
						parentChatId,
					},
				});

				propagateToTopLevelIfNeeded(store, recentSection, itemIds, parentChatId, actionName);

				await store.dispatch('set', { itemList, actionName });
			},

			/**
			 * @function recentModel/setFirstPageByTab
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setFirstPageByTab']} payload
			 */
			setFirstPageByTab: async (store, payload) => {
				const { tab } = payload;
				const navTab = getNavigationTabId(tab);
				const recentSection = RecentTabByNavigationTab[navTab];
				if (!recentSection)
				{
					logger.error('RecentModel.setFirstPageByTab unknown tab:', navTab);

					return;
				}

				await store.dispatch('setFirstPageByRecentSection', {
					...payload,
					recentSection,
				});
			},

			/**
			 * @function recentModel/setByNavigationTabs
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setByNavigationTabs']} payload
			 */
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

				const parentChatId = payload.parentChatId ?? ROOT_PARENT_CHAT_ID;

				tabs.forEach((tab) => {
					const recentSection = RecentTabByNavigationTab[tab];
					if (!recentSection)
					{
						logger.error('RecentModel.setByNavigationTabs invalid tab:', tab);

						return;
					}

					store.commit('setNestedIdCollection', {
						actionName,
						data: {
							recentSection,
							itemIds,
							parentChatId,
						},
					});

					propagateToTopLevelIfNeeded(store, recentSection, itemIds, parentChatId, actionName);
				});

				await store.dispatch('set', uniqBy(itemList, 'id'));
			},

			/**
			 * @function recentModel/setByRecentConfigTabs
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setByRecentConfigTabs']} payload
			 */
			setByRecentConfigTabs: async (store, payload) => {
				const sections = payload.sections;
				if (!Type.isArrayFilled(sections))
				{
					return;
				}

				let itemList = payload.itemList;
				if (!Type.isArray(itemList))
				{
					itemList = [itemList];
				}

				const itemIds = itemList.map((item) => String(item.id || item.dialogId));
				const parentChatId = payload.parentChatId ?? ROOT_PARENT_CHAT_ID;

				sections.forEach((recentSection) => {
					if (!RecentTabValues.has(recentSection))
					{
						logger.error('RecentModel.setByRecentConfigTabs invalid section:', recentSection);

						return;
					}

					store.commit('setNestedIdCollection', {
						actionName: 'setByRecentConfigTabs',
						data: {
							recentSection,
							itemIds,
							parentChatId,
						},
					});

					propagateToTopLevelIfNeeded(store, recentSection, itemIds, parentChatId, 'setByRecentConfigTabs');
				});

				await store.dispatch('set', [...new Set(itemList)]);
			},

			/**
			 * @function recentModel/setByRecentConfigTabsBatch
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setByRecentConfigTabsBatch']} payload
			 */
			setByRecentConfigTabsBatch: async (store, payload) => {
				const { items } = payload;
				if (!Type.isArrayFilled(items))
				{
					return;
				}

				const allItems = [];

				for (const entry of items)
				{
					const { sections, parentChatId: rawParentChatId } = entry;
					if (!Type.isArrayFilled(sections))
					{
						continue;
					}

					let itemList = entry.itemList;
					if (!Type.isArray(itemList))
					{
						itemList = [itemList];
					}

					const itemIds = itemList.map((item) => String(item.id || item.dialogId));
					const parentChatId = rawParentChatId ?? ROOT_PARENT_CHAT_ID;

					sections.forEach((recentSection) => {
						if (!RecentTabValues.has(recentSection))
						{
							logger.error('RecentModel.setByRecentConfigTabsBatch invalid section:', recentSection);

							return;
						}

						store.commit('setNestedIdCollection', {
							actionName: 'setByRecentConfigTabs',
							data: {
								recentSection,
								itemIds,
								parentChatId,
							},
						});

						propagateToTopLevelIfNeeded(store, recentSection, itemIds, parentChatId, 'setByRecentConfigTabs');
					});

					allItems.push(...itemList);
				}

				if (!Type.isArrayFilled(allItems))
				{
					return;
				}

				await store.dispatch('set', [...new Set(allItems)]);
			},

			/**
			 * @function recentModel/setGroupCollection
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/setGroupCollection']} payload
			 */
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
					const items = groups[tab];
					if (!Type.isArrayFilled(items))
					{
						logger.log('RecentModel.setGroupCollection skipped by items is empty for:', tab);

						return;
					}

					const recentSection = RecentTabByNavigationTab[navTab];
					if (!recentSection)
					{
						logger.error('RecentModel.setGroupCollection invalid tab:', tab);

						return;
					}

					itemList.push(...items);
					const itemIds = items.map((item) => String(item.id || item.dialogId));
					const parentChatId = payload.parentChatId ?? ROOT_PARENT_CHAT_ID;

					store.commit('setNestedIdCollection', {
						actionName: 'setGroupCollection',
						data: {
							recentSection,
							itemIds,
							parentChatId,
						},
					});

					propagateToTopLevelIfNeeded(store, recentSection, itemIds, parentChatId, 'setGroupCollection');
				});

				if (!Type.isArrayFilled(itemList))
				{
					return;
				}

				await store.dispatch('set', uniqBy(itemList, 'id'));
			},

			/**
			 * @function recentModel/set
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/set']} payload
			 */
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

			/**
			 * @function recentModel/setFromLocalDatabase
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {Array<RecentModelState>} payload
			 */
			setFromLocalDatabase: (store, payload) => {
				return store.dispatch('set', {
					itemList: payload,
					actionName: 'setFromLocalDatabase',
				});
			},

			/**
			 * @function recentModel/delete
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/delete']} payload
			 */
			delete: (store, payload) => {
				const existingItem = store.state.collection[payload.id];
				if (!existingItem)
				{
					return;
				}
				const actionName = payload.actionName || 'delete';

				store.commit('deleteIdFromNestedIdCollection', { data: { id: existingItem.id }, actionName });

				store.commit('delete', {
					actionName,
					data: {
						id: existingItem.id,
					},
				});
			},

			/**
			 * @function recentModel/deleteFromModel
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/deleteFromModel']} payload
			 */
			deleteFromModel: async (store, payload) => {
				const existingItem = store.state.collection[payload.id];
				if (!existingItem)
				{
					return;
				}
				const actionName = payload.actionName || 'deleteFromModel';

				await store.dispatch('delete', { id: existingItem.id, actionName });
			},

			/**
			 * @function recentModel/deleteOpenChannel
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/deleteOpenChannel']} payload
			 */
			deleteOpenChannel: (store, payload) => {
				const existingItem = store.state.collection[payload.id];
				if (!existingItem)
				{
					return;
				}
				const actionName = payload.actionName || 'deleteOpenChannel';

				store.commit('deleteFromNestedIdCollection', {
					data: {
						recentSection: RecentTab.chat,
						id: existingItem.id,
						parentChatId: payload.parentChatId ?? ROOT_PARENT_CHAT_ID,
					},
					actionName,
				});
			},

			/**
			 * @function recentModel/hideByNavigationTabs
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/hideByNavigationTabs']} payload
			 */
			hideByNavigationTabs: (store, payload) => {
				const {
					id,
					fromTabs,
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
					const recentSection = RecentTabByNavigationTab[tabId];
					if (!recentSection)
					{
						logger.log(`hide action. unknown tabId: ${tabId}. skip `, tabId);

						return;
					}

					const parentChatId = payload.parentChatId ?? ROOT_PARENT_CHAT_ID;

					store.commit('deleteFromNestedIdCollection', {
						actionName,
						data: {
							recentSection,
							id,
							parentChatId,
						},
					});

					hideFromTopLevelIfNeeded(store, recentSection, id, parentChatId, actionName);
				});
			},

			/**
			 * @function recentModel/hideByRecentConfigTabs
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/hideByRecentConfigTabs']} payload
			 */
			hideByRecentConfigTabs: (store, payload) => {
				const { id, fromSections } = payload;
				const existingItem = store.state.collection[id];
				if (!existingItem)
				{
					return;
				}

				if (!Type.isArrayFilled(fromSections))
				{
					return;
				}

				const parentChatId = payload.parentChatId ?? ROOT_PARENT_CHAT_ID;

				fromSections.forEach((recentSection) => {
					if (!RecentTabValues.has(recentSection))
					{
						logger.error('RecentModel.hideByRecentConfigTabs invalid section:', recentSection);

						return;
					}

					store.commit('deleteFromNestedIdCollection', {
						actionName: 'hideByRecentConfigTabs',
						data: {
							recentSection,
							id,
							parentChatId,
						},
					});

					hideFromTopLevelIfNeeded(store, recentSection, id, parentChatId, 'hideByRecentConfigTabs');
				});
			},

			/**
			 * @function recentModel/update
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/update']} payload
			 */
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

			/** @function recentModel/readAllChats */
			readAllChats: (store) => {
				const openlinesIdCollection = getSectionSet(store.state, RecentTab.openlines) ?? new Set();
				const recentItemList = Object.values(store.state.collection)
					.filter((recentItem) => {
						return recentItem.unread === true && !openlinesIdCollection.has(recentItem.id);
					})
					.map((recentItem) => ({
						fields: {
							id: recentItem.id,
							unread: false,
						},
					}))
				;

				if (!Type.isArrayFilled(recentItemList))
				{
					return;
				}

				store.commit('update', {
					actionName: 'readAllChats',
					data: {
						recentItemList,
					},
				});
			},

			/** @function recentModel/readByRecentSection */
			readByRecentSection: (store, payload) => {
				const { recentSection } = payload;
				const idCollection = getSectionSet(store.state, recentSection);
				if (!idCollection)
				{
					return;
				}

				const recentItemList = Object.values(store.state.collection)
					.filter((recentItem) => {
						return recentItem.unread === true && idCollection.has(recentItem.id);
					})
					.map((recentItem) => ({
						fields: {
							id: recentItem.id,
							unread: false,
						},
					}))
				;

				if (!Type.isArrayFilled(recentItemList))
				{
					return;
				}

				store.commit('update', {
					actionName: 'readByRecentSection',
					data: {
						recentItemList,
					},
				});
			},

			/**
			 * @function recentModel/like
			 * @param {MessengerStore<RecentMessengerModel>} store
			 * @param {RecentModelActionParams['recentModel/like']} payload
			 */
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
			 * Accumulates dialogIds into nestedIdCollection for the given recentSection and parentChatId.
			 * @param state
			 * @param {MutationPayload<{recentSection: string, itemIds: string[], parentChatId?: number}>} payload
			 */
			setNestedIdCollection: (state, payload) => {
				logger.warn('RecentModel.setNestedIdCollection', payload);
				const { recentSection, itemIds, parentChatId = ROOT_PARENT_CHAT_ID } = payload.data;
				const set = ensureSectionSet(state, recentSection, parentChatId);
				itemIds.forEach((id) => set.add(id));
			},

			/**
			 * Replaces the Set for the given recentSection and parentChatId entirely.
			 * @param state
			 * @param {MutationPayload<{recentSection: string, itemIds: string[], parentChatId?: number}>} payload
			 */
			storeNestedIdCollection: (state, payload) => {
				logger.warn('RecentModel.storeNestedIdCollection', payload);
				const { recentSection, itemIds, parentChatId = ROOT_PARENT_CHAT_ID } = payload.data;
				if (!state.nestedIdCollection[parentChatId])
				{
					state.nestedIdCollection[parentChatId] = {};
				}

				state.nestedIdCollection[parentChatId][recentSection] = new Set(itemIds);
			},

			/**
			 * Removes a dialogId from the Set for the given recentSection and parentChatId.
			 * @param state
			 * @param {MutationPayload<{recentSection: string, id: string, parentChatId?: number}>} payload
			 */
			deleteFromNestedIdCollection: (state, payload) => {
				logger.warn('RecentModel.deleteFromNestedIdCollection', payload);
				const { recentSection, id, parentChatId = ROOT_PARENT_CHAT_ID } = payload.data;
				getSectionSet(state, recentSection, parentChatId)?.delete(id);
			},

			/**
			 * Removes a dialogId from all tabs across all parentChatId levels.
			 * @param state
			 * @param {MutationPayload<{id: string}>} payload
			 */
			deleteIdFromNestedIdCollection: (state, payload) => {
				logger.warn('RecentModel.deleteIdFromNestedIdCollection', payload);
				const { id } = payload.data;
				for (const level of Object.values(state.nestedIdCollection))
				{
					for (const set of Object.values(level))
					{
						set.delete(id);
					}
				}
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
	 * @param {object} state
	 * @param {string} recentSection
	 * @param {number} [parentChatId]
	 * @returns {Set<string>|undefined}
	 */
	function getSectionSet(state, recentSection, parentChatId = ROOT_PARENT_CHAT_ID)
	{
		return state.nestedIdCollection[parentChatId]?.[recentSection];
	}

	/**
	 * @param {object} state
	 * @param {string} recentSection
	 * @param {number} [parentChatId]
	 * @returns {Set<string>}
	 */
	function ensureSectionSet(state, recentSection, parentChatId = ROOT_PARENT_CHAT_ID)
	{
		if (!state.nestedIdCollection[parentChatId])
		{
			state.nestedIdCollection[parentChatId] = {};
		}

		if (!state.nestedIdCollection[parentChatId][recentSection])
		{
			state.nestedIdCollection[parentChatId][recentSection] = new Set();
		}

		return state.nestedIdCollection[parentChatId][recentSection];
	}

	/**
	 * If the given section requires top-level propagation and parentChatId is nested,
	 * commits an additional setNestedIdCollection for ROOT_PARENT_CHAT_ID.
	 * @param {object} store
	 * @param {string} recentSection
	 * @param {string[]} itemIds
	 * @param {number} parentChatId
	 * @param {string} actionName
	 */
	function propagateToTopLevelIfNeeded(store, recentSection, itemIds, parentChatId, actionName)
	{
		if (parentChatId <= ROOT_PARENT_CHAT_ID || !SectionsWithTopLevelPropagation.has(recentSection))
		{
			return;
		}

		store.commit('setNestedIdCollection', {
			actionName,
			data: {
				recentSection,
				itemIds,
				parentChatId: ROOT_PARENT_CHAT_ID,
			},
		});
	}

	/**
	 * @param {object} store
	 * @param {string} recentSection
	 * @param {string} id
	 * @param {number} parentChatId
	 * @param {string} actionName
	 */
	function hideFromTopLevelIfNeeded(store, recentSection, id, parentChatId, actionName)
	{
		if (parentChatId <= ROOT_PARENT_CHAT_ID || !SectionsWithTopLevelPropagation.has(recentSection))
		{
			return;
		}

		store.commit('deleteFromNestedIdCollection', {
			actionName,
			data: {
				recentSection,
				id,
				parentChatId: ROOT_PARENT_CHAT_ID,
			},
		});
	}

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
				// if we already got chat, we should not update it
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
