/* eslint-disable no-param-reassign */
/**
 * @module im/messenger/model/recent/filter/model
 */
jn.define('im/messenger/model/recent/filter/model', (require, exports, module) => {
	const { Type } = require('type');
	const { NavigationTabId, RecentFilterId } = require('im/messenger/const');

	const { normalize } = require('im/messenger/model/recent/filter/normalizer');
	const { recentFilterDefaultElement } = require('im/messenger/model/recent/filter/default-element');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('model--recent-filter', 'recentFilteredModel');

	/** @type {RecentFilteredMessengerModel} */
	const recentFilteredModel = {
		namespaced: true,
		state: () => ({
			collection: {
				[NavigationTabId.chats]: createDefaultTabElement(),
				[NavigationTabId.task]: createDefaultTabElement(),
			},
		}),
		getters: {
			/**
			 * @function recentModel/recentFilteredModel/hasNavigationTabId
			 * @return {boolean}
			 */
			hasNavigationTabId: (state) => (tabId) => {
				return tabId in state.collection;
			},

			/**
			 * @function recentModel/recentFilteredModel/getCurrentFilterId
			 * @return {FilterId}
			 */
			getCurrentFilterId: (state) => (tabId) => {
				if (!(tabId in state.collection))
				{
					return null;
				}

				return state.collection[tabId].currentFilterId;
			},

			/**
			 * @function recentModel/recentFilteredModel/hasSelectedFilter
			 * @return {boolean}
			 */
			hasSelectedFilter: (state) => (tabId) => {
				if (!(tabId in state.collection))
				{
					return false;
				}

				return state.collection[tabId].currentFilterId !== RecentFilterId.all;
			},

			/**
			 * @function recentModel/recentFilteredModel/getIdCollection
			 * @return {Set<string>}
			 */
			getIdCollection: (state) => (tabId) => {
				if (!(tabId in state.collection))
				{
					return new Set();
				}

				return state.collection[tabId].idCollection;
			},

			/**
			 * @function recentModel/recentFilteredModel/hasItem
			 * @return {boolean}
			 */
			hasItem: (state) => (itemId, tabId) => {
				if (!(tabId in state.collection))
				{
					return false;
				}

				return state.collection[tabId].idCollection.has(itemId);
			},
		},
		actions: {
			/**
			 * @function recentModel/recentFilteredModel/setCurrentFilter
			 * @param {RecentFilteredModelActionParams['recentModel/recentFilteredModel/setCurrentFilter']} payload
			 */
			setCurrentFilter: (store, payload) => {
				const { tabId, filterId } = payload;

				if (!Type.isStringFilled(tabId) || !Type.isStringFilled(filterId))
				{
					logger.warn('setCurrentFilter: invalid payload', payload);

					return;
				}

				store.commit('setCurrentFilter', {
					actionName: 'setCurrentFilter',
					data: {
						tabId,
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

				store.commit('setIdCollection', {
					actionName: 'setIdCollection',
					data: {
						tabId: normalized.tabId,
						itemIds: normalized.itemIds,
					},
				});
			},

			/**
			 * @function recentModel/recentFilteredModel/clearIdCollection
			 * @param {RecentFilteredModelActionParams['recentModel/recentFilteredModel/clearIdCollection']} payload
			 */
			clearIdCollection: (store, payload) => {
				const { tabId } = payload;

				if (!Type.isStringFilled(tabId))
				{
					logger.warn('clearIdCollection: invalid payload', payload);

					return;
				}

				store.commit('clearIdCollection', {
					actionName: 'clearIdCollection',
					data: {
						tabId,
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
				const { tabId, filterId } = payload.data;

				if (!Type.isStringFilled(tabId) || !Type.isStringFilled(filterId))
				{
					return;
				}

				ensureTabElement(state.collection, tabId).currentFilterId = filterId;
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
				const { tabId, itemIds } = payload.data;

				if (!Type.isStringFilled(tabId) || !Type.isArray(itemIds))
				{
					return;
				}

				ensureTabElement(state.collection, tabId).idCollection = new Set(itemIds);
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
				const { tabId } = payload.data;

				if (!Type.isStringFilled(tabId))
				{
					return;
				}

				ensureTabElement(state.collection, tabId).idCollection = new Set();
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
	 * @param {Record<string, RecentFilterElement>} collection
	 * @param {string} tabId
	 * @returns {RecentFilterElement}
	 */
	function ensureTabElement(collection, tabId)
	{
		if (!(tabId in collection))
		{
			collection[tabId] = createDefaultTabElement();
		}

		return collection[tabId];
	}

	module.exports = { recentFilteredModel };
});
