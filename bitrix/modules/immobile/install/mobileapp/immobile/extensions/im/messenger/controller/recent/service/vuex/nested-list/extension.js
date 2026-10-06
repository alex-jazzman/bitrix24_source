/**
 * @module im/messenger/controller/recent/service/vuex/nested-list
 */
jn.define('im/messenger/controller/recent/service/vuex/nested-list', (require, exports, module) => {
	const { Type } = require('type');
	const { debounce } = require('utils/function');
	const { EventType, NavigationTabId, RecentTab, ROOT_PARENT_CHAT_ID } = require('im/messenger/const');
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');
	const { RecentFilteredSync } = require('im/messenger/controller/recent/service/vuex/lib/sync/filter');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const REFRESH_DEBOUNCE_MS = 50;

	/**
	 * @implements {IVuexService}
	 * @class NestedListVuexService
	 */
	class NestedListVuexService extends BaseRecentService
	{
		#hadPinnedChildren = false;
		#isSubscribed = false;
		#filterDirty = false;
		#scheduleRefreshFirstPage = null;

		onInit()
		{
			this.logger.log('onInit');
			this.recentFilteredSync = new RecentFilteredSync(this.recentLocator, this.logger);

			this.#scheduleRefreshFirstPage = debounce(() => this.#refreshFirstPage(), REFRESH_DEBOUNCE_MS);
			this.#hadPinnedChildren = this.#computeHasPinnedChildren();
			this.#subscribeStoreMutation();
		}

		/**
		 * @return {MessengerCoreStoreManager}
		 */
		get storeManager()
		{
			return serviceLocator.get('core').getStoreManager();
		}

		get #emitter()
		{
			return serviceLocator.get('emitter');
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
			if (this.#isSubscribed)
			{
				return;
			}
			this.#isSubscribed = true;

			this.recentFilteredSync.subscribeStoreMutation();
			this.#emitter.on(EventType.recentManager.resumeController, this.#resumeControllerHandler);
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
				.on('counterModel/set', this.#counterSetHandler)
				.on('counterModel/delete', this.#counterDeleteHandler)
				.on('anchorModel/add', this.#anchorAddHandler)
				.on('anchorModel/delete', this.#anchorDeleteHandler)
				.on('anchorModel/deleteMany', this.#anchorDeleteManyHandler)
			;
		}

		#unsubscribeStoreMutation()
		{
			if (!this.#isSubscribed)
			{
				return;
			}
			this.#isSubscribed = false;

			this.recentFilteredSync.unsubscribeStoreMutation();
			this.#emitter.off(EventType.recentManager.resumeController, this.#resumeControllerHandler);
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

			const render = this.recentLocator.get('render');
			if (!this.#shouldRenderParentFakeItem())
			{
				if (render.hasItemRendered(String(item.id)))
				{
					render.deleteItems([{ id: String(item.id) }]);
				}

				return;
			}

			this.logger.log('#upsertParentChatFakeItem: upsert');

			render.upsertItems([item]);
		}

		/**
		 * @returns {boolean}
		 */
		#shouldRenderParentFakeItem()
		{
			return NestedListVuexService.shouldRenderParentFakeItem(
				this.storeManager.store.getters,
				this.recentLocator.get('id'),
				this.recentLocator.get('parentChatId'),
			);
		}

		/**
		 * Pure decision: must the synthetic parent chat item be rendered in the nested list.
		 * Parent chat is always pinned to the top of the project's default nested list,
		 * regardless of filter state and counters — matches the web im messenger behavior.
		 *
		 * @param {object} _rootGetters
		 * @param {string} tabId
		 * @param {number} _parentChatId
		 * @returns {boolean}
		 */
		static shouldRenderParentFakeItem(_rootGetters, tabId, _parentChatId)
		{
			return tabId === NavigationTabId.collabDefault;
		}

		#computeHasPinnedChildren()
		{
			const recentSection = this.recentLocator.get('recentSection');
			if (recentSection !== RecentTab.collabDefault)
			{
				return false;
			}

			const parentChatId = this.recentLocator.get('parentChatId');

			return this.storeManager.store.getters['recentModel/hasPinnedItemInSection'](recentSection, parentChatId);
		}

		#refreshParentFakeIfPinnedToggled()
		{
			const has = this.#computeHasPinnedChildren();
			if (has === this.#hadPinnedChildren)
			{
				return;
			}

			this.logger.log('#refreshParentFakeIfPinnedToggled: pinned state changed', { has });
			this.#hadPinnedChildren = has;
			this.#upsertParentChatFakeItem();
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

			this.#refreshParentFakeIfPayloadContainsParentChat(payload);

			const recentItems = this.#validateAndGetRecentItems(payload);
			if (!recentItems)
			{
				return;
			}

			this.#updateItems(recentItems);
			this.#refreshParentFakeIfPinnedToggled();
		};

		/**
		 * @param {MutationPayload<RecentUpdateData>} payload
		 */
		recentUpdateHandler = ({ payload }) => {
			this.logger.log('recentUpdateHandler', payload);

			this.#refreshParentFakeIfPayloadContainsParentChat(payload);

			const recentItems = this.#validateAndGetRecentItems(payload);
			if (!recentItems)
			{
				return;
			}

			this.#updateItems(recentItems);
			this.#refreshParentFakeIfPinnedToggled();
		};

		/**
		 * recentModel/set of the parent expands into add/update, but #filterByNestedCollection drops it
		 * (the parent is intentionally outside nestedIdCollection) — so refresh the fixed row here.
		 *
		 * @param {MutationPayload<RecentAddData|RecentUpdateData>} payload
		 */
		#refreshParentFakeIfPayloadContainsParentChat(payload)
		{
			if (this.#isFirstPageByTabAction(payload))
			{
				return;
			}

			if (!this.#payloadContainsParentChat(payload))
			{
				return;
			}

			this.logger.log('#refreshParentFakeIfPayloadContainsParentChat: parent chat record in payload, upsert fake item');
			this.#upsertParentChatFakeItem();
		}

		/**
		 * @param {MutationPayload<RecentAddData|RecentUpdateData>} payload
		 * @return {boolean}
		 */
		#payloadContainsParentChat(payload)
		{
			if (this.recentLocator.get('id') !== NavigationTabId.collabDefault)
			{
				return false;
			}

			const recentItemList = payload?.data?.recentItemList;
			if (!Type.isArrayFilled(recentItemList))
			{
				return false;
			}

			const parentChatId = this.recentLocator.get('parentChatId');
			if (!parentChatId)
			{
				return false;
			}

			const parentRecentId = `chat${parentChatId}`;

			return recentItemList.some((item) => String(item.fields?.id) === parentRecentId);
		}

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

			this.#hadPinnedChildren = this.#computeHasPinnedChildren();

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

			const parentFakeItem = this.#shouldRenderParentFakeItem() ? this.#parentRecentItem : null;
			const allItems = parentFakeItem ? [parentFakeItem, ...firstPageItems] : firstPageItems;

			this.recentLocator.get('render').setItems(allItems);
			void this.recentLocator.get('render').renderInstant();
		};

		/**
		 * @param {MutationPayload<{tabId: string, filterId: FilterId}, 'setCurrentFilter'>} payload
		 */
		filterChangeHandler = ({ payload }) => {
			this.logger.log('filterChangeHandler', payload);

			const tabId = this.recentLocator.get('id');
			const parentChatId = this.recentLocator.get('parentChatId');
			if (payload?.data?.tabId !== tabId || (payload?.data?.parentChatId ?? ROOT_PARENT_CHAT_ID) !== parentChatId)
			{
				return;
			}

			if (!this.#isInActiveProject())
			{
				this.logger.log('filterChangeHandler: not in active project, marking dirty');
				this.#filterDirty = true;

				return;
			}

			serviceLocator.get('messenger-header-manager').redrawNestedRightButtonsIfNeeded(this.recentLocator.get('id'));
		};

		/**
		 * @param {MutationPayload<RecentFilteredSetIdCollectionData>} payload
		 */
		filteredIdCollectionChangeHandler = ({ payload }) => {
			this.logger.log('filteredIdCollectionChangeHandler', payload);

			const tabId = this.recentLocator.get('id');
			const parentChatId = this.recentLocator.get('parentChatId');
			if (payload?.data?.tabId !== tabId || (payload?.data?.parentChatId ?? ROOT_PARENT_CHAT_ID) !== parentChatId)
			{
				return;
			}

			if (!this.#isInActiveProject())
			{
				this.logger.log('filteredIdCollectionChangeHandler: not in active project, marking dirty');
				this.#filterDirty = true;

				return;
			}

			this.#scheduleRefreshFirstPage();
		};

		/**
		 * @returns {boolean} true when this nested service belongs to the project currently
		 * visible to the user. Paused projects skip UI work and set #filterDirty instead;
		 * #compensateFilterIfNeeded catches up when the project becomes active again.
		 */
		#isInActiveProject()
		{
			const active = serviceLocator.get('recent-manager').getActiveNestedRecent();
			if (!active)
			{
				return false;
			}

			return active.getParentChatId() === this.recentLocator.get('parentChatId');
		}

		/**
		 * @returns {boolean} true if compensation was triggered
		 */
		#compensateFilterIfNeeded()
		{
			if (!this.#filterDirty || !this.#isInActiveProject())
			{
				return false;
			}

			this.logger.log('#compensateFilterIfNeeded: refreshing after project resume');
			this.#filterDirty = false;
			this.#scheduleRefreshFirstPage();
			serviceLocator.get('messenger-header-manager').redrawNestedRightButtonsIfNeeded(this.recentLocator.get('id'));

			return true;
		}

		/**
		 * @param {string} recentId
		 * @param {RecentController} controller
		 * @param {number} parentChatId
		 */
		#resumeControllerHandler = (recentId, controller, parentChatId) => {
			if (parentChatId !== this.recentLocator.get('parentChatId'))
			{
				return;
			}

			this.#compensateFilterIfNeeded();
		};

		/**
		 * @returns {boolean}
		 */
		#isFilterActive()
		{
			const tabId = this.recentLocator.get('id');
			const parentChatId = this.recentLocator.get('parentChatId');

			return this.storeManager.store.getters['recentModel/recentFilteredModel/hasSelectedFilter'](tabId, parentChatId);
		}

		#refreshFirstPage()
		{
			if (!this.recentLocator.has('render'))
			{
				this.logger.log('#refreshFirstPage: render is not ready, skipping');

				return;
			}

			const parentChatId = this.recentLocator.get('parentChatId');
			const tabId = this.recentLocator.get('id');

			const collection = this.storeManager.store.getters['recentModel/getIdCollection'](tabId, parentChatId);
			const firstPageItems = this.storeManager.store.getters['recentModel/getFirstPageByIdCollection'](collection);

			const parentFakeItem = this.#shouldRenderParentFakeItem() ? this.#parentRecentItem : null;
			const allItems = parentFakeItem ? [parentFakeItem, ...firstPageItems] : firstPageItems;

			this.recentLocator.get('render').setItems(allItems);
			void this.recentLocator.get('render').renderInstant();
		}

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

			this.#refreshParentFakeIfPinnedToggled();

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

			this.#refreshParentFakeIfPinnedToggled();

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

			if (this.#isFilterActive())
			{
				this.logger.log('#counterSetHandler: filter active, full refresh handled by filteredIdCollectionChangeHandler');

				return;
			}

			const { counterList, previousParentChatIdList = [] } = payload.data;
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

			// previousParentChatIdList covers a child detached from this project: its parent
			// fake item badge must be recomputed even though the child now points elsewhere.
			const parentAffected = previousParentChatIdList.includes(parentChatId)
				|| counterList.some((c) => c.chatId === parentChatId && !c.parentChatId);
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

			if (this.#isFilterActive())
			{
				this.logger.log('#counterDeleteHandler: filter active, full refresh handled by filteredIdCollectionChangeHandler');

				return;
			}

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
			if (this.#compensateFilterIfNeeded())
			{
				return;
			}

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
