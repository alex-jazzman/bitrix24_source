/**
 * @module im/messenger-v2/controller/recent/service/vuex/lib/handlers/counter
 */
jn.define('im/messenger-v2/controller/recent/service/vuex/lib/handlers/counter', (require, exports, module) => {
	const { Type } = require('type');
	const { unique } = require('utils/array');
	const { CounterType } = require('im/messenger/const');
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
			const { counterList } = payload.data;
			const chatIdList = this.#extractChatIdFromCounterStates(counterList);

			this.#updateRecentItems(chatIdList);
		};

		/**
		 * @param {MutationPayload<CounterDeleteData, CounterDeleteActions>} payload
		 */
		deleteHandler = ({ payload }) => {
			if (!['clear', 'clearByType'].includes(payload.actionName))
			{
				return;
			}

			this.logger.log('counterDeleteHandler', payload);
			const { chatIdList } = payload.data;

			this.#updateRecentItems(chatIdList);
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
					if (counterState.type === CounterType.comment)
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

			const itemsToUpdate = [];
			recentItems.forEach((recentItem) => {
				if (this.#hasItemInCurrentTab(recentItem?.id))
				{
					itemsToUpdate.push(recentItem);
				}
			});

			if (!Type.isArrayFilled(itemsToUpdate))
			{
				return;
			}

			this.recentLocator.get('render').upsertItems(itemsToUpdate);
		}

		/**
		 * @param {?string} dialogId
		 * @return {boolean}
		 */
		#hasItemInCurrentTab(dialogId)
		{
			return this.store.getters['recentModel/hasItemInTab'](dialogId, this.recentLocator.get('id'));
		}
	}

	module.exports = { CounterMutationHandler };
});
