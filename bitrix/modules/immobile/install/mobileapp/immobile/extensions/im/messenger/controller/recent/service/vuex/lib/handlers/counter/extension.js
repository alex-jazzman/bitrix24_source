/**
 * @module im/messenger/controller/recent/service/vuex/lib/handlers/counter
 */
jn.define('im/messenger/controller/recent/service/vuex/lib/handlers/counter', (require, exports, module) => {
	const { Type } = require('type');
	const { unique } = require('utils/array');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	class CounterMutationHandler
	{
		/**
		 * @param {RecentLocator} recentLocator
		 * @param {Logger} logger
		 */
		constructor(recentLocator, logger)
		{
			/**
			 * @private
			 * @type {RecentLocator}
			 */
			this.recentLocator = recentLocator;
			/**
			 * @private
			 * @type {Logger}
			 */
			this.logger = logger;
			/**
			 * @private
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {MutationPayload<CounterSetData, CounterSetActions>} payload
		 */
		setHandler = ({ payload }) => {
			this.logger.log('counterSetHandler', payload);
			const { counterList, previousParentChatIdList = [] } = payload.data;
			const chatIdList = this.#extractChatIdFromCounterStates(counterList);

			// previousParentChatIdList covers parents a counter just detached from: their
			// aggregated badge is computed via childrenIndex, which no longer links them.
			this.#updateRecentItems(unique([...chatIdList, ...previousParentChatIdList]));
		};

		/**
		 * @param {MutationPayload<CounterDeleteData, CounterDeleteActions>} payload
		 */
		deleteHandler = ({ payload }) => {
			if (!['clear', 'clearByType', 'delete'].includes(payload.actionName))
			{
				return;
			}

			this.logger.log('counterDeleteHandler', payload);
			const { chatIdList, parentChatIdList = [] } = payload.data;

			this.#updateRecentItems(unique([...chatIdList, ...parentChatIdList]));
		};

		/**
		 * @param {Array<number>} chatIdList
		 * @return {Array<RecentModelState>}
		 */
		#getRecentItemsByChatIdList(chatIdList)
		{
			return this.store.getters['recentModel/getByChatIdList'](chatIdList);
		}

		/**
		 * @param {Array<CounterModelState>} counterStateList
		 * @return {Array<number>}
		 */
		#extractChatIdFromCounterStates(counterStateList)
		{
			if (!Type.isArrayFilled(counterStateList))
			{
				return [];
			}

			const rawChatIdList = counterStateList
				.map((counterState) => {
					if (counterState.parentChatId > 0)
					{
						return counterState.parentChatId;
					}

					return counterState.chatId;
				})
				.filter(Boolean)
			;

			return unique(rawChatIdList);
		}

		/**
		 * @param {Array<number>} chatIdList
		 */
		#updateRecentItems(chatIdList)
		{
			const recentItems = this.#getRecentItemsByChatIdList(chatIdList);
			if (!Type.isArrayFilled(recentItems))
			{
				return;
			}

			if (!this.recentLocator.has('render'))
			{
				return;
			}

			const tabId = this.recentLocator.get('id');
			const collection = this.store.getters['recentModel/getIdCollection'](tabId);
			const render = this.recentLocator.get('render');
			const { toUpsert, toDelete } = this.#partitionItemsForUpdate(recentItems, collection, render);

			if (Type.isArrayFilled(toUpsert))
			{
				render.upsertItems(toUpsert);
			}

			if (Type.isArrayFilled(toDelete))
			{
				render.deleteItems(toDelete);
			}
		}

		/**
		 * @param {Array<RecentModelState>} items
		 * @param {Set<string>} collection
		 * @param {object} render
		 * @returns {{ toUpsert: Array<RecentModelState>, toDelete: Array<RecentModelState> }}
		 */
		#partitionItemsForUpdate(items, collection, render)
		{
			const toUpsert = [];
			const toDelete = [];

			items.forEach((item) => {
				const id = String(item.id ?? item.dialogId ?? '');
				if (!Type.isStringFilled(id))
				{
					return;
				}

				if (collection.has(id))
				{
					toUpsert.push(item);
				}
				else if (render.hasItemRendered(id))
				{
					toDelete.push({ id });
				}
			});

			return { toUpsert, toDelete };
		}
	}

	module.exports = { CounterMutationHandler };
});
