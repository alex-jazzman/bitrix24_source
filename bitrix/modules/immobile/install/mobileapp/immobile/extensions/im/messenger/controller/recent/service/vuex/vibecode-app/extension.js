/**
 * @module im/messenger/controller/recent/service/vuex/vibecode-app
 */
jn.define('im/messenger/controller/recent/service/vuex/vibecode-app', (require, exports, module) => {
	const { Type } = require('type');
	const { RecentTab, ROOT_PARENT_CHAT_ID } = require('im/messenger/const');
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnchorMutationHandler } = require('im/messenger/controller/recent/service/vuex/lib/handlers/anchor');
	const { CounterMutationHandler } = require('im/messenger/controller/recent/service/vuex/lib/handlers/counter');
	const { RecentFilteredSync } = require('im/messenger/controller/recent/service/vuex/lib/sync/filter');

	const RECENT_SECTION = RecentTab.vibecodeApp;

	/**
	 * @implements {IVuexService}
	 * @class VibecodeAppVuexService
	 */
	class VibecodeAppVuexService extends BaseRecentService
	{
		onInit()
		{
			this.logger.log('onInit');

			this.anchor = new AnchorMutationHandler(this.recentLocator, this.logger);
			this.counter = new CounterMutationHandler(this.recentLocator, this.logger, {
				recentSection: RECENT_SECTION,
			});
			this.recentFilteredSync = new RecentFilteredSync(this.recentLocator, this.logger, RECENT_SECTION);
			this.subscribeEvents();
		}

		/**
		 * @return {MessengerCoreStoreManager}
		 */
		get storeManager()
		{
			return serviceLocator.get('core').getStoreManager();
		}

		/**
		 * @return {string}
		 */
		get tabId()
		{
			return this.recentLocator.get('id');
		}

		/**
		 * @return {Set<string>}
		 */
		get sections()
		{
			return new Set([RECENT_SECTION]);
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
			this.recentFilteredSync.subscribeStoreMutation();
			this.storeManager
				.on('recentModel/add', this.recentAddHandler)
				.on('recentModel/update', this.recentUpdateHandler)
				.on('recentModel/delete', this.recentDeleteHandler)
				.on('recentModel/storeNestedIdCollection', this.recentFirstPageHandler)
				.on('recentModel/deleteFromNestedIdCollection', this.recentDeleteFromIdCollectionHandler)
				.on('recentModel/recentFilteredModel/setCurrentFilter', this.filterChangeHandler)
				.on('recentModel/recentFilteredModel/setIdCollection', this.filteredIdCollectionChangeHandler)
				.on('recentModel/recentFilteredModel/clearIdCollection', this.filteredIdCollectionChangeHandler)
				.on('dialoguesModel/add', this.dialogUpdateHandler)
				.on('dialoguesModel/update', this.dialogUpdateHandler)
				.on('dialoguesModel/clearAllCounters', this.dialogReadAllCountersHandler)
				.on('counterModel/set', this.counter.setHandler)
				.on('counterModel/delete', this.counter.deleteHandler)
				.on('anchorModel/add', this.anchor.addHandler)
				.on('anchorModel/delete', this.anchor.deleteHandler)
				.on('anchorModel/deleteMany', this.anchor.deleteManyHandler)
			;
		}

		#unsubscribeStoreMutation()
		{
			this.recentFilteredSync.unsubscribeStoreMutation();
			this.storeManager
				.off('recentModel/add', this.recentAddHandler)
				.off('recentModel/update', this.recentUpdateHandler)
				.off('recentModel/delete', this.recentDeleteHandler)
				.off('recentModel/storeNestedIdCollection', this.recentFirstPageHandler)
				.off('recentModel/deleteFromNestedIdCollection', this.recentDeleteFromIdCollectionHandler)
				.off('recentModel/recentFilteredModel/setCurrentFilter', this.filterChangeHandler)
				.off('recentModel/recentFilteredModel/setIdCollection', this.filteredIdCollectionChangeHandler)
				.off('recentModel/recentFilteredModel/clearIdCollection', this.filteredIdCollectionChangeHandler)
				.off('dialoguesModel/add', this.dialogUpdateHandler)
				.off('dialoguesModel/update', this.dialogUpdateHandler)
				.off('dialoguesModel/clearAllCounters', this.dialogReadAllCountersHandler)
				.off('counterModel/set', this.counter.setHandler)
				.off('counterModel/delete', this.counter.deleteHandler)
				.off('anchorModel/add', this.anchor.addHandler)
				.off('anchorModel/delete', this.anchor.deleteHandler)
				.off('anchorModel/deleteMany', this.anchor.deleteManyHandler)
			;
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
		 * @param {MutationPayload<RecentStoreNestedIdCollectionData|RecentDeleteFromNestedIdCollectionData>} payload
		 * @return {boolean}
		 */
		#isOwnSectionPayload(payload)
		{
			return (payload?.data?.parentChatId ?? ROOT_PARENT_CHAT_ID) === ROOT_PARENT_CHAT_ID
				&& payload?.data?.recentSection === RECENT_SECTION;
		}

		/**
		 * @return {Set<string>}
		 */
		#getIdCollection()
		{
			return this.storeManager.store.getters['recentModel/getIdCollection'](
				this.tabId,
				ROOT_PARENT_CHAT_ID,
				RECENT_SECTION,
			);
		}

		/**
		 * @return {Array<RecentModelState>}
		 */
		#getFirstPage()
		{
			return this.storeManager.store.getters['recentModel/getFirstPageByIdCollection'](this.#getIdCollection());
		}

		/**
		 * @param {Array<{fields: Partial<RecentModelState>}>} items
		 * @return {Array<RecentModelState>}
		 */
		#getFilteredRecentItems(items)
		{
			const filteredFieldsItem = this.#filterBySectionCollection(items, (item) => item.fields?.id);

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
				this.logger.log('validateAndGetRecentItems: no vibecodeApp items found after filtering');

				return null;
			}

			return recentItems;
		}

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
			this.recentLocator.get('render')?.markCompositionChanged();
		};

		/**
		 * @param {MutationPayload<RecentUpdateData>} payload
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
		 * @param {MutationPayload<RecentStoreNestedIdCollectionData>} payload
		 * @void
		 */
		recentFirstPageHandler = ({ payload }) => {
			this.logger.log('recentFirstPageHandler', payload);

			if (!this.#isOwnSectionPayload(payload))
			{
				this.logger.log('recentFirstPageHandler: payload is not the vibecodeApp root section, skipping');

				return;
			}

			const firstPageItems = this.#getFirstPage();
			if (firstPageItems.length === 0)
			{
				this.logger.log('recentFirstPageHandler: firstPageItems is empty');
			}

			this.recentLocator.get('render').setItems(firstPageItems);
			void this.recentLocator.get('render').renderInstant();
		};

		/**
		 * @param {MutationPayload<RecentFilteredSetIdCollectionData>} payload
		 * @void
		 */
		filteredIdCollectionChangeHandler = ({ payload }) => {
			this.logger.log('filteredIdCollectionChangeHandler', payload);

			if (payload?.data?.tabId !== this.tabId)
			{
				this.logger.log('filteredIdCollectionChangeHandler: tab is not vibecodeApp, skipping');

				return;
			}

			this.#setFirstPageToRender();
		};

		#setFirstPageToRender()
		{
			this.recentLocator.get('render').setItems(this.#getFirstPage());
		}

		/**
		 * @return {boolean}
		 */
		#isFilterChangedBySelf()
		{
			if (!this.recentLocator.has('filter'))
			{
				return false;
			}

			return this.recentLocator.get('filter').consumeChangedBySelf();
		}

		/**
		 * @param {MutationPayload<RecentDeleteData>} payload
		 * @void
		 */
		recentDeleteHandler = ({ payload }) => {
			this.logger.log('recentDeleteHandler', payload);

			const itemId = payload?.data?.id;
			if (!itemId)
			{
				this.logger.log('recentDeleteHandler: recent id is invalid:', payload);

				return;
			}

			this.recentLocator.get('render').deleteItems([{ id: itemId }]);
		};

		/**
		 * @param {MutationPayload<RecentDeleteFromNestedIdCollectionData>} payload
		 */
		recentDeleteFromIdCollectionHandler = ({ payload }) => {
			this.logger.log('recentDeleteFromIdCollectionHandler', payload);

			const hideActions = ['hideByRecentConfigTabs'];
			if (!hideActions.includes(payload.actionName))
			{
				return;
			}

			if (!this.#isOwnSectionPayload(payload))
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

			if (!this.recentLocator.get('render').hasItemPending(itemId))
			{
				this.logger.log('recentDeleteFromIdCollectionHandler: deleting an item not from the vibecodeApp tab, skipping', itemId);

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
			const recentItem = this.storeManager.store.getters['recentModel/getById'](String(dialogId));

			this.#updateItems(recentItem ? [recentItem] : [{ id: String(dialogId) }]);
		};

		/**
		 * @param {MutationPayload<DialoguesClearAllCountersData, DialoguesClearAllCountersActions>} payload
		 */
		dialogReadAllCountersHandler = ({ payload }) => {
			this.logger.log('dialogReadAllCountersHandler', payload);

			const dialogIdList = payload.data.affectedDialogs;
			if (!Type.isArrayFilled(dialogIdList))
			{
				this.logger.warn('dialogReadAllCountersHandler: affectedDialogs is empty, skipping');

				return;
			}

			const items = dialogIdList.map((id) => {
				const recentItem = this.storeManager.store.getters['recentModel/getById'](String(id));

				return recentItem ?? { id: String(id) };
			});

			this.#updateItems(items);
		};

		/**
		 * @param {MutationPayload<{tabId: string, filterId: FilterId}, 'setCurrentFilter'>} payload
		 */
		filterChangeHandler = ({ payload }) => {
			this.logger.log('filterChangeHandler', payload);

			if (payload?.data?.tabId !== this.tabId)
			{
				this.logger.log('filterChangeHandler: tab is not vibecodeApp, skipping');

				return;
			}

			serviceLocator.get('messenger-header-manager').redrawRightButtonsIfNeeded(this.tabId);

			if (this.#isFilterChangedBySelf())
			{
				this.#setFirstPageToRender();
				void this.recentLocator.get('render').renderInstant({ force: true });
			}
		};

		/**
		 * @param {Array<RecentModelState>} items
		 */
		#updateItems(items)
		{
			if (!this.recentLocator.has('render'))
			{
				this.logger.error('#updateItems', 'render is not ready, skipping');

				return;
			}

			const collection = this.#getIdCollection();
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
				else if (render.hasItemPending(id))
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
		#filterBySectionCollection(items, idExtractor = (item) => item.fields?.id)
		{
			if (!Type.isArrayFilled(items))
			{
				return [];
			}

			const collection = this.#getIdCollection();

			return items.filter((item) => {
				const id = idExtractor(item);

				return id && collection.has(id);
			});
		}
	}

	module.exports = VibecodeAppVuexService;
});
