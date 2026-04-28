/**
 * @module im/messenger/controller/recent/service/vuex/openlines
 */
jn.define('im/messenger/controller/recent/service/vuex/openlines', (require, exports, module) => {
	const { Type } = require('type');

	const { NavigationTabId } = require('im/messenger/const');
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { CounterMutationHandler } = require('im/messenger/controller/recent/service/vuex/lib/handlers/counter');

	/**
	 * @implements {IVuexService}
	 * @class OpenlinesVuexService
	 */
	class OpenlinesVuexService extends BaseRecentService
	{
		onInit()
		{
			this.logger.log('onInit');

			this.counter = new CounterMutationHandler(this.recentLocator, this.logger);
			this.#subscribeStoreMutation();
		}

		/**
		 * @return {MessengerCoreStoreManager}
		 */
		get storeManager()
		{
			return serviceLocator.get('core').getStoreManager();
		}

		/**
		 * @returns {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		#subscribeStoreMutation()
		{
			this.storeManager
				.on('recentModel/add', this.recentAddHandler)
				.on('recentModel/update', this.recentUpdateHandler)
				.on('dialoguesModel/openlinesModel/update', this.sessionUpdateHandler)
				.on('recentModel/delete', this.recentDeleteHandler)
				.on('recentModel/storeIdCollection', this.recentFirstPageHandler)
				.on('dialoguesModel/add', this.dialogUpdateHandler)
				.on('dialoguesModel/update', this.dialogUpdateHandler)
				.on('counterModel/set', this.counter.setHandler)
				.on('counterModel/delete', this.counter.deleteHandler)
			;
		}

		/**
		 * @param {MutationPayload<RecentV2StoreIdCollectionData>} payload
		 * @void
		 */
		recentFirstPageHandler = ({ payload }) => {
			this.logger.log('recentFirstPageHandler', payload);

			if (payload.data?.tab !== NavigationTabId.openlines)
			{
				this.logger.log('recentFirstPageHandler: tab is not openlines, skipping');

				return;
			}

			const firstPageItems = this.storeManager.store.getters['recentModel/getOpenlinesFirstPage']();
			if (firstPageItems.length === 0)
			{
				this.logger.log('recentFirstPageHandler: firstPageItems is empty');
			}

			this.recentLocator.get('render').setItems(firstPageItems);
			void this.recentLocator.get('render').renderInstant();
		};

		/**
		 * @param {MutationPayload<RecentAddData>} payload
		 * @void
		 */
		recentAddHandler = ({ payload }) => {
			this.logger.log('recentAddHandler', payload);

			const recentItems = this.#validateAndGetRecentItems(payload);
			if (!recentItems)
			{
				return;
			}

			this.#updateItems(recentItems);
		};

		/**
		 * @param {MutationPayload<RecentV2UpdateData>} payload
		 * @void
		 */
		recentUpdateHandler = ({ payload }) => {
			this.logger.log('recentUpdateHandler', payload);

			const recentItems = this.#validateAndGetRecentItems(payload);
			if (!recentItems)
			{
				return;
			}

			this.#updateItems(recentItems);
		};

		/**
		 * @param {MutationPayload<OpenlinesUpdateData>} payload
		 * @void
		 */
		sessionUpdateHandler = ({ payload }) => {
			this.logger.log('sessionUpdateHandler', payload);

			const recentItems = this.#getFilteredRecentItems(payload.data);
			if (!Type.isArrayFilled(recentItems))
			{
				this.logger.log('validateAndGetRecentItems: no openlines items found after filtering');

				return;
			}

			this.#updateItems(recentItems);
		};

		/**
		 * @param {MutationPayload<RecentV2DeleteData>} payload
		 * @void
		 */
		recentDeleteHandler = ({ payload }) => {
			this.logger.log('recentDeleteHandler', payload);
			const itemId = payload.data?.id;
			if (!itemId)
			{
				this.logger.log('recentDeleteHandler: recent id is invalid:', payload);

				return;
			}

			if (!this.recentLocator.has('render'))
			{
				this.logger.log('recentDeleteHandler: render service is not defined, skipping', itemId);

				return;
			}

			this.recentLocator.get('render').deleteItems([{ id: itemId }]);
		};

		/**
		 * @param {MutationPayload<DialoguesUpdateData|DialoguesAddData>} payload
		 */
		dialogUpdateHandler = ({ payload }) => {
			this.logger.log('dialogUpdateHandler', payload);
			const dialogId = payload.data.dialogId;

			const isOpenlinesItems = this.#filterByIdCollection([{ id: dialogId }], (item) => item.id).length > 0;
			if (!isOpenlinesItems)
			{
				this.logger.warn('dialogUpdateHandler: dialog updating an item not from the Openlines tab, skipping');

				return;
			}

			const recentItem = this.storeManager.store.getters['recentModel/getById'](String(dialogId));
			if (recentItem)
			{
				this.#updateItems([recentItem]);
			}
		};

		/**
		 * @param {Array<RecentModelState>} items
		 */
		#updateItems(items)
		{
			this.recentLocator.get('render').upsertItems(items);
		}

		/**
		 * @param {MutationPayload<RecentAddData|RecentV2UpdateData>} payload
		 * @return {Array<RecentModelState>|null}
		 */
		#validateAndGetRecentItems(payload)
		{
			if (this.#isFirstPageByTabAction(payload))
			{
				this.logger.log('validateAndGetRecentItems: skip by setFirstPageByTab action');

				return null;
			}

			const recentItemList = payload.data?.recentItemList;
			if (!Type.isArrayFilled(recentItemList))
			{
				this.logger.warn('validateAndGetRecentItems:recentItemList is empty or invalid', recentItemList);

				return null;
			}

			const recentItems = this.#getFilteredRecentItems(recentItemList);
			if (!Type.isArrayFilled(recentItems))
			{
				this.logger.log('validateAndGetRecentItems: no openlines items found after filtering');

				return null;
			}

			return recentItems;
		}

		/**
		 * @param {MutationPayload<RecentAddData|RecentV2UpdateData>} payload
		 * @return {boolean}
		 */
		#isFirstPageByTabAction(payload)
		{
			return payload.actionName === 'setFirstPageByTab';
		}

		/**
		 * @param {Array<{fields: OpenlinesSessionModelState}>} items
		 * @return {Array<RecentModelState>}
		 */
		#getFilteredRecentItems(items)
		{
			const openlinesCollection = this.storeManager.store.getters['recentModel/getOpenlinesIdCollection']();
			const filteredFieldsItem = Type.isArrayFilled(items)
				? items.filter((item) => openlinesCollection.has(String(item.fields.id)))
				: [];

			return filteredFieldsItem
				.map((fieldItem) => this.storeManager.store.getters['recentModel/getById'](fieldItem.fields.id))
				.filter(Boolean);
		}

		/**
		 * @param {Array<object>} items
		 * @param {function(any): string|number} [idExtractor]
		 * @return {Array<object>}
		 */
		#filterByIdCollection(items, idExtractor = (item) => item.fields?.id)
		{
			if (!Type.isArrayFilled(items))
			{
				return [];
			}

			const openlinesCollection = this.store.getters['recentModel/getOpenlinesIdCollection']();

			return items.filter((item) => {
				const id = idExtractor(item);

				return id && openlinesCollection.has(id);
			});
		}
	}

	module.exports = OpenlinesVuexService;
});
