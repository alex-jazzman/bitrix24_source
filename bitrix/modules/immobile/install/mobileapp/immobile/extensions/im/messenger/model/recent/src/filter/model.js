/* eslint-disable no-param-reassign */
/**
 * @module im/messenger/model/recent/filter/model
 */
jn.define('im/messenger/model/recent/filter/model', (require, exports, module) => {
	const { Type } = require('type');
	const { NavigationTabId, RecentFilterId, ROOT_PARENT_CHAT_ID } = require('im/messenger/const');

	const { normalize } = require('im/messenger/model/recent/filter/normalizer');
	const { recentFilterDefaultElement } = require('im/messenger/model/recent/filter/default-element');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('model--recent-filter', 'recentFilteredModel');

	/** @type {RecentFilteredMessengerModel} */
	const recentFilteredModel = {
		namespaced: true,
		state: () => ({
			collection: {
				[ROOT_PARENT_CHAT_ID]: {
					[NavigationTabId.chats]: createDefaultTabElement(),
					[NavigationTabId.task]: createDefaultTabElement(),
				},
			},
		}),
		getters: {
			/**
			 * @function recentModel/recentFilteredModel/hasNavigationTabId
			 * @return {boolean}
			 */
			hasNavigationTabId: (state) => (tabId, parentChatId = ROOT_PARENT_CHAT_ID) => {
				return Boolean(state.collection[parentChatId]?.[tabId]);
			},

			/**
			 * @function recentModel/recentFilteredModel/getCurrentFilterId
			 * @return {FilterId}
			 */
			getCurrentFilterId: (state) => (tabId, parentChatId = ROOT_PARENT_CHAT_ID) => {
				const element = state.collection[parentChatId]?.[tabId];
				if (!element)
				{
					return null;
				}

				return element.currentFilterId;
			},

			/**
			 * @function recentModel/recentFilteredModel/hasSelectedFilter
			 * @return {boolean}
			 */
			hasSelectedFilter: (state) => (tabId, parentChatId = ROOT_PARENT_CHAT_ID) => {
				const element = state.collection[parentChatId]?.[tabId];
				if (!element)
				{
					return false;
				}

				return element.currentFilterId !== RecentFilterId.all;
			},

			/**
			 * @function recentModel/recentFilteredModel/getIdCollection
			 * @return {Set<string>}
			 */
			getIdCollection: (state) => (tabId, parentChatId = ROOT_PARENT_CHAT_ID) => {
				const element = state.collection[parentChatId]?.[tabId];
				if (!element)
				{
					return new Set();
				}

				return element.idCollection;
			},

			/**
			 * @function recentModel/recentFilteredModel/hasItem
			 * @return {boolean}
			 */
			hasItem: (state) => (itemId, tabId, parentChatId = ROOT_PARENT_CHAT_ID) => {
				const element = state.collection[parentChatId]?.[tabId];
				if (!element)
				{
					return false;
				}

				return element.idCollection.has(itemId);
			},
		},
		actions: {
			/**
			 * @function recentModel/recentFilteredModel/setCurrentFilter
			 * @param {RecentFilteredModelActionParams['recentModel/recentFilteredModel/setCurrentFilter']} payload
			 */
			setCurrentFilter: (store, payload) => {
				const { tabId, parentChatId = ROOT_PARENT_CHAT_ID, filterId } = payload;

				if (!Type.isStringFilled(tabId) || !Type.isStringFilled(filterId))
				{
					logger.warn('setCurrentFilter: invalid payload', payload);

					return;
				}

				store.commit('setCurrentFilter', {
					actionName: 'setCurrentFilter',
					data: {
						tabId,
						parentChatId,
						filterId,
					},
				});
			},

			/**
			 * @function recentModel/recentFilteredModel/setIdCollection
			 * @param {RecentFilteredModelActionParams['recentModel/recentFilteredModel/setIdCollection']} payload
			 */
			setIdCollection: (store, payload) => {
				const normalized = normalize(payload);

				if (!Type.isStringFilled(normalized.tabId) || !Type.isArray(normalized.itemIds))
				{
					logger.warn('setIdCollection: invalid payload', payload);

					return;
				}

				const parentChatId = normalized.parentChatId ?? ROOT_PARENT_CHAT_ID;
				store.commit('setIdCollection', {
					actionName: 'setIdCollection',
					data: {
						tabId: normalized.tabId,
						parentChatId,
						itemIds: normalized.itemIds,
					},
				});
			},

			/**
			 * @function recentModel/recentFilteredModel/clearIdCollection
			 * @param {RecentFilteredModelActionParams['recentModel/recentFilteredModel/clearIdCollection']} payload
			 */
			clearIdCollection: (store, payload) => {
				const { tabId, parentChatId = ROOT_PARENT_CHAT_ID } = payload;

				if (!Type.isStringFilled(tabId))
				{
					logger.warn('clearIdCollection: invalid payload', payload);

					return;
				}

				store.commit('clearIdCollection', {
					actionName: 'clearIdCollection',
					data: {
						tabId,
						parentChatId,
					},
				});
			},
		},
		mutations: {
			/**
			 * @param {RecentFilteredModelCollection} state
			 * @param {MutationPayload<
			 * 		RecentFilteredSetCurrentFilterData,
			 * 		RecentFilteredModelSetCurrentFilterActions
			 * >} payload
			 */
			setCurrentFilter: (state, payload) => {
				logger.log('setCurrentFilter mutation', payload);
				const { tabId, parentChatId = ROOT_PARENT_CHAT_ID, filterId } = payload.data;

				if (!Type.isStringFilled(tabId) || !Type.isStringFilled(filterId))
				{
					return;
				}

				ensureTabElement(state.collection, tabId, parentChatId).currentFilterId = filterId;
			},

			/**
			 * @param {RecentFilteredModelCollection} state
			 * @param {MutationPayload<
			 * 		RecentFilteredSetIdCollectionData,
			 * 		RecentFilteredModelSetIdCollectionActions
			 * >} payload
			 */
			setIdCollection: (state, payload) => {
				logger.log('setIdCollection mutation', payload);
				const { tabId, parentChatId = ROOT_PARENT_CHAT_ID, itemIds } = payload.data;

				if (!Type.isStringFilled(tabId) || !Type.isArray(itemIds))
				{
					return;
				}

				ensureTabElement(state.collection, tabId, parentChatId).idCollection = new Set(itemIds);
			},

			/**
			 * @param {RecentFilteredModelCollection} state
			 * @param {MutationPayload<
			 * 		RecentFilteredClearIdCollectionData,
			 * 		RecentFilteredModelClearIdCollectionActions
			 * >} payload
			 */
			clearIdCollection: (state, payload) => {
				logger.log('clearIdCollection mutation', payload);
				const { tabId, parentChatId = ROOT_PARENT_CHAT_ID } = payload.data;

				if (!Type.isStringFilled(tabId))
				{
					return;
				}

				ensureTabElement(state.collection, tabId, parentChatId).idCollection = new Set();
			},
		},
	};

	/**
	 * @returns {RecentFilterElement}
	 */
	function createDefaultTabElement()
	{
		return {
			...recentFilterDefaultElement,
			idCollection: new Set(),
		};
	}

	/**
	 * @param {object} collection
	 * @param {string} tabId
	 * @param {number} [parentChatId]
	 * @returns {RecentFilterElement}
	 */
	function ensureTabElement(collection, tabId, parentChatId = ROOT_PARENT_CHAT_ID)
	{
		if (!collection[parentChatId])
		{
			collection[parentChatId] = {};
		}

		if (!collection[parentChatId][tabId])
		{
			collection[parentChatId][tabId] = createDefaultTabElement();
		}

		return collection[parentChatId][tabId];
	}

	module.exports = { recentFilteredModel };
});
