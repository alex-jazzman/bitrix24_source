/**
 * @module im/messenger-v2/controller/recent/service/render/common
 */
jn.define('im/messenger-v2/controller/recent/service/render/common', (require, exports, module) => {
	const { Type } = require('type');
	const { uniqBy } = require('utils/array');
	const { isEqual } = require('utils/object');
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { Worker } = require('im/messenger/lib/helper');
	const { RecentUiConverter } = require('im/messenger/lib/converter/ui/recent');
	const { RecentItem } = require('im/messenger/lib/element/recent');
	const { createPromiseWithResolvers } = require('im/messenger/lib/utils');
	const { BaseUiRecentService } = require('im/messenger-v2/controller/recent/service/base');
	const { RenderQueue, QueueOperation, optimizeQueue } = require('im/messenger-v2/controller/recent/service/render/lib/queue');
	const { RecentEventType } = require('im/messenger-v2/controller/recent/const');
	const { RecentSection } = require('im/messenger-v2/controller/recent/service/render/lib/section');

	const LOADER_ITEM_TYPE = 'loading';
	const CALL_ITEM_TYPE = 'call';

	/**
	 * @implements {IRenderService}
	 * @extends {BaseUiRecentService<CommonRenderServiceProps>}
	 * @class CommonRenderService
	 */
	class CommonRenderService extends BaseUiRecentService
	{
		onInit()
		{
			this.sections = this.props.sections ?? [];
			this.defaultSection = this.props.defaultSection ?? '';
			this.itemOptions = this.props.itemOptions ?? {};

			this.queue = new RenderQueue();
			this.handlerCollection = {
				[QueueOperation.setItems]: this.#setItemsHandler,
				[QueueOperation.upsertItems]: this.#upsertItemsHandler,
				[QueueOperation.upsertPreparedItems]: this.#upsertPreparedItemsHandler,
				[QueueOperation.setPreparedItems]: this.#setPreparedItemsHandler,
				[QueueOperation.removeItems]: this.#removeItemsHandler,
				[QueueOperation.removeItemsByIds]: this.#removeItemsByIdsHandler,
			};

			this.findItemMethods = {
				findInCollection: this.hasItemRendered.bind(this),
				findInNative: this.#findItemInNative.bind(this),
			};
			/** @type {Map<string, RecentItem>} */
			this.itemCollection = new Map();
			/** @type {Array<Function>} */
			this.afterRenderCallbackList = [];
			this.lastEmittedItemCollectionSize = null;
		}

		async onUiReady(ui)
		{
			this.ui = ui;
			this.worker = new Worker({
				frequency: 1000,
				callback: this.#renderItemsFromQueue,
				context: `CommonRenderService.${this.recentLocator.get('id')}`,
			});

			await this.#setSections();
			void this.renderInstant();
		}
		// region public interface

		async renderInstant()
		{
			await this.uiReadyPromise;

			return this.#renderItemsFromQueue().catch((error) => this.logger.error(`renderInstant error: ${error}`));
		}

		hasItemRendered(id)
		{
			return this.itemCollection.has(id);
		}

		getItemCollectionSize()
		{
			return this.itemCollection.size;
		}

		deleteItems(itemList, options)
		{
			if (Feature.isAsyncRecentOperationsAvailable)
			{
				const ids = itemList.map((item) => String(item.id));
				this.queue.removeItemsByIds(ids, options);

				return;
			}

			this.queue.removeItems(itemList, options);
		}

		setItems(itemList, options)
		{
			this.queue.setItems(itemList, options);
		}

		setPreparedItems(itemList, options)
		{
			this.queue.setPreparedItems(itemList, options);
		}

		upsertItems(itemList, options)
		{
			this.queue.upsertItems(itemList, options);
		}

		upsertPreparedItems(itemList, options)
		{
			this.queue.upsertPreparedItems(itemList, options);
		}

		getSections()
		{
			this.logger.log('getSections');

			return this.sections;
		}

		/**
		 * @returns {Array<JNListWidgetSectionItem>}
		 */
		getSectionsData()
		{
			return this.getSections()
				.map((sectionId) => RecentSection[sectionId])
				.filter(Boolean)
			;
		}

		/**
		 * @returns {Array<RecentItem>}
		 */
		getItemList()
		{
			return [...this.itemCollection.values()];
		}

		showLoader(section = this.defaultSection)
		{
			this.logger.log(`showLoader: section = ${section}`);

			const loaderId = this.#getLoaderId(section);
			if (this.hasItemRendered(loaderId))
			{
				this.logger.info(`showLoader: loader for section ${section} is already rendered`);

				return;
			}

			const loader = {
				id: loaderId,
				title: Loc.getMessage('IMMOBILE_RECENT_RENDER_ITEM_LOADING'),
				type: LOADER_ITEM_TYPE,
				unselectable: true,
				params: {
					disableTap: true,
				},
				sectionCode: 'general',
			};

			this.upsertItems([loader]);
		}

		hideLoader(section = this.defaultSection)
		{
			this.logger.log(`hideLoader: section = ${section}`);
			const loaderId = this.#getLoaderId(section);
			if (!this.hasItemRendered(loaderId))
			{
				return;
			}

			this.deleteItems([{ id: loaderId }]);
		}

		// endregion public interface

		#renderItemsFromQueue = async () => {
			this.worker.stop();
			const queue = optimizeQueue(this.queue.getValues());
			this.queue.reset();

			const afterRenderCallbackList = this.afterRenderCallbackList;
			this.afterRenderCallbackList = [];

			if (!Type.isArrayFilled(queue))
			{
				this.#executeCallbackList(afterRenderCallbackList);
				this.#emitItemCollectionSizeIfChanged();

				this.startWorker();

				return;
			}

			this.logger.log('renderItemsFromQueue: current queue', [...queue]);

			for (const queueItem of queue)
			{
				const handler = this.handlerCollection[queueItem.operation];
				if (!Type.isFunction(handler))
				{
					this.logger.error(`renderItemsFromQueue error: unexpected queue operation: ${queueItem.operation}`, queueItem);

					continue;
				}

				try
				{
					// eslint-disable-next-line no-await-in-loop
					await handler(queueItem);
				}
				catch (error)
				{
					this.logger.error('renderItemsFromQueue error', error);
				}
			}

			this.#executeCallbackList(afterRenderCallbackList);
			this.#emitItemCollectionSizeIfChanged();

			this.#updateQuickRecent();
			this.startWorker();
		};

		startWorker()
		{
			if (!this.worker.isHasOnce())
			{
				this.worker.startOnce();
			}
		}

		executeAfterRender(callback)
		{
			if (!Type.isFunction(callback))
			{
				return;
			}

			this.afterRenderCallbackList.push(callback);
		}

		// region methods of interaction with itemCollection
		#resetCollection()
		{
			this.itemCollection.clear();
		}

		#emitItemCollectionSizeIfChanged()
		{
			const size = this.itemCollection.size;
			if (size !== this.lastEmittedItemCollectionSize)
			{
				this.logger.log('#emitItemCollectionSizeIfChanged emit: ', size);

				this.recentLocator.get('emitter').emit(RecentEventType.render.itemCollectionSizeChanged, [size]);

				this.lastEmittedItemCollectionSize = size;
			}
		}

		/**
		 * @param {Array<RecentItem>} itemList
		 */
		#setItemsInCollection(itemList)
		{
			for (const item of itemList)
			{
				this.itemCollection.set(String(item.id), item);
			}
		}

		/**
		 * @param {Array<string>} itemIdList
		 */
		#removeItemsFromCollection(itemIdList)
		{
			for (const id of itemIdList)
			{
				this.itemCollection.delete(id);
			}
		}

		/**
		 * @param {RecentItem} item
		 * @returns {boolean}
		 */
		#isElementEqualToRendered(item)
		{
			const id = String(item.id);
			if (!this.hasItemRendered(id))
			{
				return false;
			}

			const renderedItem = this.itemCollection.get(id);

			return isEqual(renderedItem, item);
		}

		// endregion methods of interaction with itemCollection

		// region queue handlers
		/**
		 * @param {RecentQueueItem} queueItem
		 * @return {Promise<void>}
		 */
		#setItemsHandler = async (queueItem) => {
			const {
				items,
			} = queueItem;
			this.logger.log('setItemsHandler', queueItem);

			this.#resetCollection();

			const preparedItems = this.#convertToRecentItems(items);
			await this.#setItems(preparedItems);
			this.#setItemsInCollection(preparedItems);
		};

		/**
		 * @param {RecentQueueItem} queueItem
		 * @return {Promise<void>}
		 */
		#setPreparedItemsHandler = async (queueItem) => {
			const {
				preparedItems,
			} = queueItem;
			this.logger.log('setPreparedItemsHandler', queueItem);

			this.#resetCollection();

			await this.#setItems(preparedItems);
			this.#setItemsInCollection(preparedItems);
		};

		/**
		 * @param {RecentQueueItem} queueItem
		 * @return {Promise<void>}
		 */
		#upsertItemsHandler = async (queueItem) => {
			const {
				items,
				options = {},
			} = queueItem;
			this.logger.log('upsertItemsHandler', queueItem);

			const convertedItems = this.#convertToRecentItems(items);

			return this.#upsert(convertedItems, {
				findItemMethod: this.findItemMethods[options.findItemMethod] ?? this.findItemMethods.findInCollection,
				skipCheckEquality: options.skipCheckEquality ?? false,
			});
		};

		/**
		 * @param {RecentQueueItem} queueItem
		 * @return {Promise<void>}
		 */
		#upsertPreparedItemsHandler = async (queueItem) => {
			const {
				preparedItems,
				options = {},
			} = queueItem;
			this.logger.log('upsertPreparedItemsHandler', queueItem);

			return this.#upsert(preparedItems, {
				findItemMethod: this.findItemMethods[options.findItemMethod] ?? this.findItemMethods.findInCollection,
				skipCheckEquality: options.skipCheckEquality ?? false,
			});
		};

		/**
		 * @param {Array<RecentItem>} preparedItems
		 * @param {} options
		 * @returns {Promise<void>}
		 */
		async #upsert(preparedItems, options)
		{
			this.logger.log('upsertItems', preparedItems);
			const { skipCheckEquality, findItemMethod } = options;

			const itemsToAdd = [];
			const itemsToUpdate = [];
			try
			{
				for (const recentItem of preparedItems)
				{
					// eslint-disable-next-line no-await-in-loop
					const hasItem = await findItemMethod(recentItem.id);
					if (hasItem)
					{
						itemsToUpdate.push(recentItem);
					}
					else
					{
						itemsToAdd.push(recentItem);
					}
				}

				if (Type.isArrayFilled(itemsToUpdate))
				{
					const filteredItemList = this.#filterItemsToUpdate(itemsToUpdate, skipCheckEquality);

					if (Type.isArrayFilled(filteredItemList))
					{
						await this.#updateItems(this.#formatItemListToUpdate(filteredItemList));
						this.#setItemsInCollection(filteredItemList);
					}
					else
					{
						this.logger.log('upsert filteredItemList is empty - skipping update', filteredItemList.length);
					}
				}

				if (Type.isArrayFilled(itemsToAdd))
				{
					await this.#addItems(itemsToAdd);
					this.#setItemsInCollection(itemsToAdd);
				}
			}
			catch (error)
			{
				this.logger.error('upsertItems error', error);
			}
		}

		/**
		 * @param {RecentQueueItem} queueItem
		 * @return {Promise<void>}
		 */
		#removeItemsHandler = async (queueItem) => {
			const {
				items,
			} = queueItem;
			this.logger.log('removeItemsHandler', queueItem);

			for (const item of items)
			{
				try
				{
					// eslint-disable-next-line no-await-in-loop
					await this.ui.removeItem({ id: item.id });
				}
				catch (error)
				{
					this.logger.error('removeItem error', item, error);
				}
			}

			this.#removeItemsFromCollection(items.map((item) => String(item.id)));
		};

		/**
		 * @param {RecentQueueItem} queueItem
		 * @return {Promise<void>}
		 */
		#removeItemsByIdsHandler = async (queueItem) => {
			const {
				ids,
			} = queueItem;
			this.logger.log('removeItemsByIdsHandler', queueItem);

			await this.ui.removeItemsByIds(ids);

			this.#removeItemsFromCollection(ids);
		};

		// endregion queue handlers

		// region methods of interaction with the UI

		async #setSections()
		{
			const sections = this.sections
				.map((sectionId) => RecentSection[sectionId])
				.filter(Boolean)
			;
			this.logger.log('setSections', sections);

			await this.ui.setSections(sections);
		}

		/**
		 * @param {Array<RecentItem>} preparedItemList
		 * @returns {Promise<void>}
		 */
		async #setItems(preparedItemList)
		{
			const widgetItemList = preparedItemList.map((item) => this.#prepareElementToRecentWidgetItem(item));
			this.logger.log('setItems to native', preparedItemList);

			return this.ui.setItems(widgetItemList);
		}

		/**
		 * @param {Array<RecentItem>} preparedItemList
		 * @returns {Promise<void>}
		 */
		async #addItems(preparedItemList)
		{
			const addItemList = preparedItemList.filter((item) => {
				return Type.isStringFilled(item.id) || item.id > 0;
			});

			const itemAddItemList = uniqBy(addItemList, (item) => String(item.id));
			const widgetItemList = itemAddItemList.map((item) => this.#prepareElementToRecentWidgetItem(item));
			this.logger.log('addItems to native', widgetItemList);

			return this.ui.addItems(widgetItemList);
		}

		/**
		 * @param {Array<UpdatingRecentData>} preparedItemList
		 * @returns {Promise<void>}
		 */
		async #updateItems(preparedItemList)
		{
			const preparedItems = preparedItemList.map((item) => {
				return {
					element: this.#prepareElementToRecentWidgetItem(item.element),
					filter: item.filter,
				};
			});
			this.logger.log('updateItems to native', preparedItems);

			return this.ui.updateItems(preparedItems);
		}

		/**
		 * @param id
		 * @returns {Promise<boolean>}
		 */
		async #findItemInNative(id)
		{
			const { promise, resolve } = createPromiseWithResolvers();

			this.ui.findItem({ id }, (item) => {
				resolve(Boolean(item));
			});

			return promise;
		}

		// endregion methods of interaction with the UI

		// region system methods
		/**
		 * @param {Array<RecentItem>} preparedItemList
		 * @param {boolean} skipCheckEquality
		 * @returns {Array<RecentItem>}
		 */
		#filterItemsToUpdate(preparedItemList, skipCheckEquality = false)
		{
			if (skipCheckEquality)
			{
				return preparedItemList;
			}

			return preparedItemList
				.filter((item) => !this.#isElementEqualToRendered(item))
			;
		}

		/**
		 * @param {Array<RecentItem>} preparedItemList
		 * @returns {Array<UpdatingRecentData>}
		 */
		#formatItemListToUpdate(preparedItemList)
		{
			return preparedItemList
				.map((item) => ({
					filter: { id: String(item.id) },
					element: item,
				}))
			;
		}

		/**
		 * @param {Array<RecentItem | object>} items
		 * @returns {Array<RecentWidgetItem | object>}
		 */
		#convertToRecentItems(items)
		{
			const loaders = [];
			const itemsToConvert = [];
			const callItems = [];

			for (const item of items)
			{
				switch (item?.type)
				{
					case LOADER_ITEM_TYPE: {
						loaders.push(item);
						break;
					}

					case CALL_ITEM_TYPE: {
						const { call, callStatus } = item;
						callItems.push(RecentUiConverter.toCallItem(callStatus, call));
						break;
					}

					default: {
						itemsToConvert.push(item);
					}
				}
			}

			const converted = RecentUiConverter.toList(itemsToConvert, this.itemOptions);

			return [
				...callItems,
				...converted,
				...loaders,
			];
		}

		/**
		 * @param {RecentItem} item
		 * @returns {RecentWidgetItem | RecentItem}
		 */
		#prepareElementToRecentWidgetItem(item)
		{
			if (item instanceof RecentItem)
			{
				return item.toRecentWidgetItem();
			}

			return item;
		}

		#getLoaderId(section = this.defaultSection)
		{
			return `loadNextPage-${section}`;
		}

		#updateQuickRecent()
		{
			if (!this.recentLocator.has('quick-recent'))
			{
				return;
			}

			try
			{
				const recentWidgetItems = this.getItemList().map((item) => this.#prepareElementToRecentWidgetItem(item));
				this.recentLocator.get('quick-recent').save(this.getSectionsData(), recentWidgetItems);
			}
			catch (error)
			{
				this.logger.error('updateQuickRecent catch:', error);
			}
		}

		/**
		 * @param {Array<Function>} callbackList
		 */
		#executeCallbackList(callbackList)
		{
			if (!Type.isArrayFilled(callbackList))
			{
				return;
			}

			this.logger.log('#executeCallbackList start: ', callbackList);

			callbackList.forEach((callback) => {
				try
				{
					callback();
				}
				catch (error)
				{
					this.logger.error(`#executeCallbackList error: ${error}`);
				}
			});

			this.logger.log('#executeCallbackList complete');
		}
		// endregion system methods
	}

	module.exports = CommonRenderService;
});
