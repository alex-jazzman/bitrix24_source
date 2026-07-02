/**
 * @module im/messenger/controller/recent/service/vuex/nested-list
 */
jn.define('im/messenger/controller/recent/service/vuex/nested-list', (require, exports, module) => {
	const { Type } = require('type');
	const { NavigationTabId, ROOT_PARENT_CHAT_ID } = require('im/messenger/const');
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @implements {IVuexService}
	 * @class NestedListVuexService
	 */
	class NestedListVuexService extends BaseRecentService
	{
		onInit()
		{
			this.logger.log('onInit');

			this.#subscribeStoreMutation();
		}

		/**
		 * @return {MessengerCoreStoreManager}
		 */
		get storeManager()
		{
			return serviceLocator.get('core').getStoreManager();
		}

		subscribeEvents()
		{
			this.#subscribeStoreMutation();
		}

		unsubscribeEvents()
		{
			this.#unsubscribeStoreMutation();
		}

		#subscribeStoreMutation()
		{
			this.storeManager
				.on('recentModel/add', this.recentAddHandler)
				.on('recentModel/update', this.recentUpdateHandler)
				.on('recentModel/delete', this.recentDeleteHandler)
				.on('recentModel/storeNestedIdCollection', this.recentFirstPageHandler)
				.on('recentModel/deleteFromNestedIdCollection', this.recentDeleteFromIdCollectionHandler)
				.on('dialoguesModel/add', this.dialogUpdateHandler)
				.on('dialoguesModel/update', this.dialogUpdateHandler)
				.on('counterModel/set', this.#counterSetHandler)
				.on('counterModel/delete', this.#counterDeleteHandler)
				.on('anchorModel/add', this.#anchorAddHandler)
				.on('anchorModel/delete', this.#anchorDeleteHandler)
				.on('anchorModel/deleteMany', this.#anchorDeleteManyHandler)
			;
		}

		#unsubscribeStoreMutation()
		{
			this.storeManager
				.off('recentModel/add', this.recentAddHandler)
				.off('recentModel/update', this.recentUpdateHandler)
				.off('recentModel/delete', this.recentDeleteHandler)
				.off('recentModel/storeNestedIdCollection', this.recentFirstPageHandler)
				.off('recentModel/deleteFromNestedIdCollection', this.recentDeleteFromIdCollectionHandler)
				.off('dialoguesModel/add', this.dialogUpdateHandler)
				.off('dialoguesModel/update', this.dialogUpdateHandler)
				.off('counterModel/set', this.#counterSetHandler)
				.off('counterModel/delete', this.#counterDeleteHandler)
				.off('anchorModel/add', this.#anchorAddHandler)
				.off('anchorModel/delete', this.#anchorDeleteHandler)
				.off('anchorModel/deleteMany', this.#anchorDeleteManyHandler)
			;
		}

		/**
		 * @return {?RecentModelState}
		 */
		get #parentRecentItem()
		{
			const parentChatId = this.recentLocator.get('parentChatId');
			const dialog = this.storeManager.store.getters['dialoguesModel/getByChatId'](parentChatId);
			if (!dialog)
			{
				return null;
			}

			return this.storeManager.store.getters['recentModel/getById'](String(dialog.dialogId)) ?? null;
		}

		#upsertParentChatFakeItem()
		{
			if (this.recentLocator.get('id') !== NavigationTabId.collabDefault)
			{
				return;
			}

			if (!this.recentLocator.has('render'))
			{
				this.logger.log('#upsertParentChatFakeItem: render is not ready, skipping');

				return;
			}

			const item = this.#parentRecentItem;
			if (!item)
			{
				this.logger.log('#upsertParentChatFakeItem: parentRecentItem not found, skipping');

				return;
			}

			this.recentLocator.get('render').upsertItems([item]);
		}

		/**
		 * @param {MutationPayload<RecentAddData|RecentUpdateData>} payload
		 * @return {boolean}
		 */
		#isFirstPageByTabAction(payload)
		{
			return payload?.actionName === 'setFirstPageByTab';
		}

		/**
		 * @param {Array<{fields: Partial<RecentModelState>}>} items
		 * @return {Array<RecentModelState>}
		 */
		#getFilteredRecentItems(items)
		{
			const filteredFieldsItem = this.#filterByNestedCollection(items, (item) => item.fields?.id);

			return filteredFieldsItem
				.map((fieldItem) => this.storeManager.store.getters['recentModel/getById'](fieldItem.fields.id))
				.filter(Boolean);
		}

		/**
		 * @param {MutationPayload<RecentAddData|RecentUpdateData>} payload
		 * @return {Array<RecentModelState>|null}
		 */
		#validateAndGetRecentItems(payload)
		{
			if (this.#isFirstPageByTabAction(payload))
			{
				this.logger.log('validateAndGetRecentItems: skip by setFirstPageByTab action');

				return null;
			}

			const recentItemList = payload?.data?.recentItemList;
			if (!Type.isArray(recentItemList) || recentItemList.length === 0)
			{
				this.logger.warn('validateAndGetRecentItems: recentItemList is empty or invalid', recentItemList);

				return null;
			}

			const recentItems = this.#getFilteredRecentItems(recentItemList);
			if (recentItems.length === 0)
			{
				this.logger.log('validateAndGetRecentItems: no nested items found after filtering');

				return null;
			}

			return recentItems;
		}

		/**
		 * @param {MutationPayload<RecentAddData>} payload
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
		 * @param {MutationPayload<RecentUpdateData>} payload
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
		 * @param {MutationPayload<RecentStoreNestedIdCollectionData>} payload
		 */
		recentFirstPageHandler = ({ payload }) => {
			this.logger.log('recentFirstPageHandler', payload);

			const parentChatId = this.recentLocator.get('parentChatId');
			const tabId = this.recentLocator.get('id');
			const recentSection = this.recentLocator.get('recentSection');

			if ((payload?.data.parentChatId ?? ROOT_PARENT_CHAT_ID) !== parentChatId)
			{
				this.logger.log('recentFirstPageHandler: parentChatId does not match, skipping');

				return;
			}

			if (payload?.data.recentSection !== recentSection)
			{
				this.logger.log('recentFirstPageHandler: recentSection does not match, skipping');

				return;
			}

			const collection = this.storeManager.store.getters['recentModel/getIdCollection'](tabId, parentChatId);
			const firstPageItems = this.storeManager.store.getters['recentModel/getFirstPageByIdCollection'](collection);

			if (firstPageItems.length === 0)
			{
				this.logger.log('recentFirstPageHandler: firstPageItems is empty');
			}

			if (!this.recentLocator.has('render'))
			{
				this.logger.log('recentFirstPageHandler: render is not ready, skipping');

				return;
			}

			const parentFakeItem = tabId === NavigationTabId.collabDefault ? this.#parentRecentItem : null;
			const allItems = parentFakeItem ? [parentFakeItem, ...firstPageItems] : firstPageItems;

			this.recentLocator.get('render').setItems(allItems);
			void this.recentLocator.get('render').renderInstant();
		};

		/**
		 * @param {MutationPayload<RecentDeleteData>} payload
		 */
		recentDeleteHandler = ({ payload }) => {
			this.logger.log('recentDeleteHandler', payload);

			const itemId = payload?.data?.id;
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

			if (!this.recentLocator.get('render').hasItemRendered(itemId))
			{
				this.logger.log('recentDeleteHandler: item not rendered in this nested tab, skipping', itemId);

				return;
			}

			this.recentLocator.get('render').deleteItems([{ id: itemId }]);
		};

		/**
		 * @param {MutationPayload<RecentDeleteFromNestedIdCollectionData>} payload
		 */
		recentDeleteFromIdCollectionHandler = ({ payload }) => {
			this.logger.log('recentDeleteFromIdCollectionHandler', payload);

			const parentChatId = this.recentLocator.get('parentChatId');
			const recentSection = this.recentLocator.get('recentSection');

			if (
				(payload.data?.parentChatId ?? ROOT_PARENT_CHAT_ID) !== parentChatId
				|| payload.data?.recentSection !== recentSection
			)
			{
				return;
			}

			const itemId = payload?.data?.id;
			if (!itemId)
			{
				this.logger.log('recentDeleteFromIdCollectionHandler: recent id is invalid:', payload);

				return;
			}

			if (!this.recentLocator.has('render'))
			{
				this.logger.log('recentDeleteFromIdCollectionHandler: render service is not defined, skipping', itemId);

				return;
			}

			if (!this.recentLocator.get('render').hasItemRendered(itemId))
			{
				this.logger.log('recentDeleteFromIdCollectionHandler: item not rendered in this nested tab, skipping', itemId);

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

			const parentItem = this.#parentRecentItem;
			if (parentItem && String(parentItem.id) === String(dialogId))
			{
				this.logger.log('dialogUpdateHandler: parent chat updated, upsert fake item');
				this.#upsertParentChatFakeItem();

				return;
			}

			const isNestedItem = this.#filterByNestedCollection(
				[{ id: dialogId }],
				(item) => item.id,
			).length > 0;

			if (!isNestedItem)
			{
				this.logger.log('dialogUpdateHandler: dialog is not in nested collection, skipping');

				return;
			}

			const recentItem = this.storeManager.store.getters['recentModel/getById'](String(dialogId));
			if (recentItem)
			{
				this.#updateItems([recentItem]);
			}
		};

		/**
		 * @param {MutationPayload<AnchorAddData>} payload
		 */
		#anchorAddHandler = ({ payload }) => {
			this.logger.log('#anchorAddHandler', payload);
			const { anchor } = payload.data;

			this.#updateRecentItemByAnchor(anchor);
		};

		/**
		 * @param {MutationPayload<AnchorDeleteData>} payload
		 */
		#anchorDeleteHandler = ({ payload }) => {
			this.logger.log('#anchorDeleteHandler', payload);
			const { anchor } = payload.data;

			this.#updateRecentItemByAnchor(anchor);
		};

		/**
		 * @param {MutationPayload<AnchorDeleteManyData>} payload
		 */
		#anchorDeleteManyHandler = ({ payload }) => {
			this.logger.log('#anchorDeleteManyHandler', payload);
			const { anchorList } = payload.data;

			if (!Type.isArrayFilled(anchorList))
			{
				return;
			}

			for (const anchor of anchorList)
			{
				this.#updateRecentItemByAnchor(anchor);
			}
		};

		/**
		 * @param {AnchorModelState} anchor
		 */
		#updateRecentItemByAnchor(anchor)
		{
			if (!anchor.chatId)
			{
				return;
			}

			const parentChatId = this.recentLocator.get('parentChatId');
			if (anchor.chatId === parentChatId)
			{
				this.logger.log('#updateRecentItemByAnchor: parent chat anchor changed, upsert fake item');
				this.#upsertParentChatFakeItem();

				return;
			}

			const recentItem = this.storeManager.store.getters['recentModel/getByChatId'](anchor.chatId);
			if (!recentItem)
			{
				return;
			}

			this.#updateItems([recentItem]);
		}

		/**
		 * @param {MutationPayload<CounterSetData, CounterSetActions>} payload
		 */
		#counterSetHandler = ({ payload }) => {
			this.logger.log('#counterSetHandler', payload);

			const { counterList } = payload.data;
			if (!Type.isArrayFilled(counterList))
			{
				return;
			}

			const parentChatId = this.recentLocator.get('parentChatId');

			const nestedChatIds = counterList
				.filter((c) => c.parentChatId === parentChatId)
				.map((c) => c.chatId)
			;

			if (nestedChatIds.length > 0)
			{
				const items = this.storeManager.store.getters['recentModel/getByChatIdList'](nestedChatIds);
				this.#updateItems(items);
			}

			const parentAffected = counterList.some((c) => c.chatId === parentChatId && !c.parentChatId);
			if (parentAffected)
			{
				this.logger.log('#counterSetHandler: parent chat counter changed, upsert fake item');
				this.#upsertParentChatFakeItem();
			}
		};

		/**
		 * @param {MutationPayload<CounterDeleteData, CounterDeleteActions>} payload
		 */
		#counterDeleteHandler = ({ payload }) => {
			this.logger.log('#counterDeleteHandler', payload);

			if (!['clear', 'clearByType', 'delete'].includes(payload.actionName))
			{
				return;
			}

			const { chatIdList, parentChatIdList = [] } = payload.data;
			if (!Type.isArrayFilled(chatIdList))
			{
				return;
			}

			const items = this.storeManager.store.getters['recentModel/getByChatIdList'](chatIdList);
			this.#updateItems(items);

			if (this.#isParentChatAffected(chatIdList, parentChatIdList))
			{
				this.logger.log('#counterDeleteHandler: parent chat counter changed, upsert fake item');
				this.#upsertParentChatFakeItem();
			}
		};

		/**
		 * Checks whether the parent chat of this nested widget
		 * is among the deleted or affected counters.
		 *
		 * @param {number[]} chatIdList
		 * @param {number[]} parentChatIdList
		 * @return {boolean}
		 */
		#isParentChatAffected(chatIdList, parentChatIdList)
		{
			const parentChatId = this.recentLocator.get('parentChatId');

			return chatIdList.includes(parentChatId) || parentChatIdList.includes(parentChatId);
		}

		/**
		 * @param {Array<RecentModelState>} items
		 */
		#updateItems(items)
		{
			if (!this.recentLocator.has('render'))
			{
				this.logger.error('#updateItems: render is not ready, skipping');

				return;
			}

			const tabId = this.recentLocator.get('id');
			const parentChatId = this.recentLocator.get('parentChatId');
			const collection = this.storeManager.store.getters['recentModel/getIdCollection'](tabId, parentChatId);
			const render = this.recentLocator.get('render');
			const { toUpsert, toDelete } = this.#partitionItemsForUpdate(items, collection, render);

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
		 * @param {IRenderService} render
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

		/**
		 * @param {Array<object>} items
		 * @param {function(any): string|number} [idExtractor]
		 * @return {Array<object>}
		 */
		#filterByNestedCollection(items, idExtractor = (item) => item.fields?.id)
		{
			if (!Type.isArrayFilled(items))
			{
				return [];
			}

			const tabId = this.recentLocator.get('id');
			const parentChatId = this.recentLocator.get('parentChatId');
			const collection = this.storeManager.store.getters['recentModel/getIdCollection'](tabId, parentChatId);

			return items.filter((item) => {
				const id = idExtractor(item);

				return id && collection.has(String(id));
			});
		}
	}

	module.exports = NestedListVuexService;
});
