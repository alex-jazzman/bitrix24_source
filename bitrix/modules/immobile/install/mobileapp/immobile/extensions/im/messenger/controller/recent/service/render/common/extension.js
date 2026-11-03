/**
 * @module im/messenger/controller/recent/service/render/common
 */
jn.define('im/messenger/controller/recent/service/render/common', (require, exports, module) => {
	const { Type } = require('type');
	const { uniqBy } = require('utils/array');
	const { isEqual } = require('utils/object');
	const { PerfPoint } = require('debug/prism');
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { Worker } = require('im/messenger/lib/helper');
	const { RecentItem } = require('im/messenger/lib/element/recent');
	const { createPromiseWithResolvers } = require('im/messenger/lib/utils');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');
	const { RenderQueue, QueueOperation, optimizeQueue } = require('im/messenger/controller/recent/service/render/lib/queue');
	const { RecentEventType } = require('im/messenger/controller/recent/const');
	const { RecentSection } = require('im/messenger/controller/recent/service/render/lib/section');
	const { RecentItemType } = require('im/messenger/controller/recent/service/render/lib/convertor/const');

	/**
	 * Upper bound of idling under an active coalescing scope: even without composition changes the
	 * accumulated batch reaches the screen at least this often. Must stay well above the worker
	 * period, otherwise coalescing degenerates into the current behavior.
	 */
	const COALESCING_IDLE_LIMIT_MS = 2000;

	/**
	 * @desc Types of the rows the list injects into the collection itself and which never arrive in
	 * a content set: the pagination loader and the invite banner. Both must leave both sides of the
	 * ALG-05 comparison, otherwise the collection differs from an incoming set by their number alone
	 * and the full replace is performed on every pass.
	 * The active call row and the parent pseudo row are deliberately not here: both do arrive in the
	 * incoming set (`vuex/chat` prepends the call list, `vuex/nested-list` the parent row), so
	 * dropping them would hide changes of their own content.
	 * The invite type is spelled out here the same way `cache/shared-storage/recent` spells it, and
	 * for the same reason: neither file may take a dependency on a sibling service of the recent
	 * controller. Keep the two lists in step.
	 * @type {Set<string>}
	 */
	const SELF_INJECTED_ROW_TYPES = new Set([RecentItemType.loader, 'invite']);

	/**
	 * @desc Ids of the items of one queue operation, in the form both the queue index and the
	 * collection of the rendered rows are keyed by.
	 * @param {Array<{id: string|number}>} itemList
	 * @return {Array<string>}
	 */
	const getItemIds = (itemList) => itemList.map((item) => String(item.id));

	/**
	 * @param {object} target
	 * @return {Array<string>}
	 */
	const getDefinedKeys = (target) => Object.keys(target).filter((key) => target[key] !== undefined);

	/**
	 * @desc Deep equality that reads a missing key and a key holding undefined as the same state.
	 * The two differ only after a pass through JSON: the cache snapshot drops such keys on write
	 * while a freshly built widget item keeps them, and `isEqual` of `utils/object` compares objects
	 * by their key count. Rows that describe the same state must not be sent to the native list
	 * again. `null` is a value, not an absence, so it stays unequal to a missing key.
	 * @param {*} value
	 * @param {*} other
	 * @return {boolean}
	 */
	const isEqualIgnoringUndefined = (value, other) => {
		// the strict comparison is the fast path: it can only be stricter than this one
		if (isEqual(value, other))
		{
			return true;
		}

		if (Type.isArray(value) || Type.isArray(other))
		{
			return Type.isArray(value)
				&& Type.isArray(other)
				&& value.length === other.length
				&& value.every((item, index) => isEqualIgnoringUndefined(item, other[index]));
		}

		if (Type.isPlainObject(value) && Type.isPlainObject(other))
		{
			const keys = new Set([...getDefinedKeys(value), ...getDefinedKeys(other)]);

			return [...keys].every((key) => isEqualIgnoringUndefined(value[key], other[key]));
		}

		// dates, maps, sets and leaves are already answered by the strict comparison above
		return false;
	};

	/**
	 * @implements {IRenderService}
	 * @extends {BaseUiRecentService<CommonRenderServiceProps>}
	 * @class CommonRenderService
	 */
	class CommonRenderService extends BaseUiRecentService
	{
		#convertToRecentItems;

		/** @type {Set<string>} */
		#activeScopes = new Set();
		/**
		 * @desc Ids of the pagination loaders, built by the service from its own section list, so no
		 * content row can end up in the set. Kept next to the type check of #isServiceRow: a
		 * convertor that loses the type of the loader must not turn it back into a content row.
		 * @type {Set<string>}
		 */
		#serviceRowIds = new Set();
		/**
		 * @desc Ids the queue holds right now: the methods that put an operation there add them,
		 * #takeQueue drops them together with the queue itself. Exists so that hasItemPending never
		 * walks the operations - see the method for the cost of the walk.
		 * @type {Set<string>}
		 */
		#queuedItemIds = new Set();
		#idleGuardTimerId = null;
		#coalescingIdleLimitMs = COALESCING_IDLE_LIMIT_MS;
		/** @type {Promise<void>} */
		#passChain = Promise.resolve();

		/** @type {RenderStats} */
		#renderStats = {
			setItemsToNative: 0,
			addItemsToNative: 0,
			updateItemsToNative: 0,
			removeFromNative: 0,
			queuePasses: 0,
			forcedPasses: 0,
			compositionForcedPasses: 0,
			scopeFinalPasses: 0,
			markedPasses: 0,
			skippedIdenticalSetItems: 0,
			compositionSignals: 0,
		};

		onInit()
		{
			this.sections = this.props.sections ?? [];
			this.defaultSection = this.props.defaultSection ?? '';
			this.itemOptions = this.props.itemOptions ?? {};
			this.#coalescingIdleLimitMs = this.props.coalescingIdleLimitMs ?? COALESCING_IDLE_LIMIT_MS;
			this.#convertToRecentItems = require(this.props.convertorExtension);
			this.#serviceRowIds = new Set(
				[this.defaultSection, ...this.sections].map((section) => this.#getLoaderId(section)),
			);

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
			if (!ui)
			{
				// widget.nestedWidgets() may return null if the native nested widget
				// for recentId isn't registered yet (race on dynamic tab addition).
				// Nothing to subscribe to — bail out without crashing.
				this.logger.warn('onUiReady received null ui, skipping subscribe');

				return;
			}

			this.ui = ui;
			this.worker = new Worker({
				frequency: 1000,
				callback: this.#onWorkerTick,
				context: `CommonRenderService.${this.recentLocator.get('id')}`,
			});

			await this.#setSections();
			void this.renderInstant();
		}

		subscribeEvents()
		{
			this.logger.log('subscribeEvents');
		}

		unsubscribeEvents()
		{
			this.logger.log('unsubscribeEvents');
			this.worker.stop();
			this.#disarmIdleGuard();
			this.#activeScopes.clear();
		}

		// region public interface

		/**
		 * @param {RenderInstantOptions} [options]
		 * @return {Promise<void>}
		 */
		async renderInstant({ force = false } = {})
		{
			await this.uiReadyPromise;

			if (force)
			{
				this.#renderStats.markedPasses += 1;
			}

			return this.#enqueuePass(force).catch((error) => this.logger.error(`renderInstant error: ${error}`));
		}

		/**
		 * @desc Opens a coalescing scope. While at least one scope is active the queue pass is not
		 * performed at all: both the worker tick and the immediate call only prolong accumulation.
		 * @param {string} scopeId
		 */
		beginCoalescingScope(scopeId)
		{
			this.logger.log('beginCoalescingScope', scopeId);
			this.#activeScopes.add(scopeId);
		}

		/**
		 * @desc Idempotent. The final pass happens when the last scope is closed.
		 * @param {string} scopeId
		 */
		endCoalescingScope(scopeId)
		{
			if (!this.#activeScopes.has(scopeId))
			{
				return;
			}

			this.logger.log('endCoalescingScope', scopeId);
			this.#activeScopes.delete(scopeId);
			if (this.#activeScopes.size > 0)
			{
				return;
			}

			this.#disarmIdleGuard();
			this.#renderStats.scopeFinalPasses += 1;
			void this.#runForcedPass();
		}

		/**
		 * @return {boolean}
		 */
		isCoalescing()
		{
			return this.#activeScopes.size > 0;
		}

		/**
		 * @desc Reports that the tab composition changed: a chat appeared in the tab set or left it.
		 * Under an active scope the accumulated batch goes to the screen without waiting for the exit.
		 */
		markCompositionChanged()
		{
			this.#renderStats.compositionSignals += 1;

			if (!this.isCoalescing())
			{
				return;
			}

			this.#renderStats.compositionForcedPasses += 1;
			void this.#runForcedPass();
		}

		hasItemRendered(id)
		{
			return this.itemCollection.has(id);
		}

		/**
		 * @desc The row belongs to this tab: it is rendered OR waits in the queue in any operation,
		 * a queued removal included. Under an active scope the collection is not filled, so the queue
		 * is part of the answer. The delete gates ask exactly this question, and a removal enqueued
		 * twice is collapsed by optimizeQueue, so a row on its way out still answers true.
		 * Both sides answer by a single lookup: the gates ask once per incoming row, and the queue
		 * is exactly what grows under a scope, so a walk over the operations would cost the square
		 * of what the scope accumulated.
		 * @param {string} id
		 * @return {boolean}
		 */
		hasItemPending(id)
		{
			return this.itemCollection.has(id) || this.#queuedItemIds.has(id);
		}

		getItemCollectionSize()
		{
			return this.itemCollection.size;
		}

		/**
		 * @param {Array<RecentModelState|CallItemData|{id: string}>} itemList
		 * @param {DeleteItemsOptions} [options]
		 */
		deleteItems(itemList, options = {})
		{
			const ids = getItemIds(itemList);
			if (Feature.isAsyncRecentOperationsAvailable)
			{
				this.queue.removeItemsByIds(ids, options);
			}
			else
			{
				this.queue.removeItems(itemList, options);
			}

			// the index is fed from the single place the ids are computed: both forms enqueue the same
			// ones, one as items and the other as bare ids
			this.#rememberQueuedIds(ids);

			if (options.isServiceRow === true)
			{
				return;
			}

			this.markCompositionChanged();
		}

		setItems(itemList, options)
		{
			this.queue.setItems(itemList, options);
			this.#resetQueuedIds(getItemIds(itemList));
		}

		setPreparedItems(itemList, options)
		{
			this.queue.setPreparedItems(itemList, options);
			this.#resetQueuedIds(getItemIds(itemList));
		}

		upsertItems(itemList, options)
		{
			this.queue.upsertItems(itemList, options);
			this.#rememberQueuedIds(getItemIds(itemList));
		}

		upsertPreparedItems(itemList, options)
		{
			this.queue.upsertPreparedItems(itemList, options);
			this.#rememberQueuedIds(getItemIds(itemList));
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
				type: RecentItemType.loader,
				unselectable: true,
				params: {
					disableTap: true,
				},
				sectionCode: section,
			};

			this.upsertItems([loader]);
		}

		/**
		 * @desc Asks about the queue too, unlike showLoader: under an active scope the collection is not
		 * filled, so a loader put there by the first server page waits in the queue alone. Reading only
		 * the rendered side would skip the removal, and the final pass of the scope would then bring the
		 * loader to the screen with pagination already over. The removal drops the id from the operations
		 * standing in the queue, so a loader that never reached the screen leaves with them.
		 * showLoader keeps asking about the rendered side: an id stays in the queue index while its own
		 * removal waits there, and a pending-based gate would refuse to show the loader again.
		 * @param {string} [section]
		 */
		hideLoader(section = this.defaultSection)
		{
			this.logger.log(`hideLoader: section = ${section}`);
			const loaderId = this.#getLoaderId(section);
			if (!this.hasItemPending(loaderId))
			{
				return;
			}

			this.deleteItems([{ id: loaderId }], { isServiceRow: true });
		}

		/**
		 * @return {RenderStats}
		 */
		getRenderStats()
		{
			return { ...this.#renderStats };
		}

		resetRenderStats()
		{
			Object.keys(this.#renderStats).forEach((counter) => {
				this.#renderStats[counter] = 0;
			});
		}

		// endregion public interface

		// region coalescing scope

		#onWorkerTick = () => {
			void this.#enqueuePass(false).catch((error) => this.logger.error(`worker tick error: ${error}`));
		};

		/**
		 * @desc The single gate of both reset channels - the worker tick and the immediate call.
		 * A suppressed pass only arms the idle guard and never joins the chain: otherwise the final
		 * pass of a scope would wait for empty links. Passes that do run are chained, so the next
		 * one reaches the native list only after the previous one awaited its own native calls;
		 * an error inside a pass must not break the chain.
		 * @param {boolean} isForcedPass
		 * @return {Promise<void>}
		 */
		#enqueuePass(isForcedPass)
		{
			if (this.isCoalescing() && !isForcedPass)
			{
				this.#armIdleGuard();

				return Promise.resolve();
			}

			this.#passChain = this.#passChain
				.catch(() => {})
				.then(() => this.#measurePass(isForcedPass))
			;

			return this.#passChain;
		}

		/**
		 * @desc Latency of one delivery to the native list. The coalescing scope batches updates into
		 * a pass, so the pass is the only place where the cost of the batching shows up as time.
		 * A pass over an empty queue is not measured: it carries no operations and would only
		 * flood the panel on every worker tick.
		 * @param {boolean} isForcedPass
		 * @return {Promise<void>}
		 */
		async #measurePass(isForcedPass)
		{
			if (!Type.isArrayFilled(this.queue.getValues()))
			{
				await this.#renderItemsFromQueue(isForcedPass);

				return;
			}

			const point = new PerfPoint('recent-render-pass', this.recentLocator?.get('id')).start();
			try
			{
				await this.#renderItemsFromQueue(isForcedPass);
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * @desc Performs a pass despite the active scopes; the scopes themselves stay open.
		 * @return {Promise<void>}
		 */
		#runForcedPass()
		{
			return this.#enqueuePass(true).catch((error) => this.logger.error(`runForcedPass error: ${error}`));
		}

		#armIdleGuard()
		{
			if (this.#idleGuardTimerId)
			{
				return;
			}

			this.#idleGuardTimerId = setTimeout(this.#onIdleGuardFired, this.#coalescingIdleLimitMs);
		}

		#disarmIdleGuard()
		{
			if (!this.#idleGuardTimerId)
			{
				return;
			}

			clearTimeout(this.#idleGuardTimerId);
			this.#idleGuardTimerId = null;
		}

		#onIdleGuardFired = () => {
			this.#idleGuardTimerId = null;
			void this.#runForcedPass();
		};

		/**
		 * @desc The operation joined the queue, so its ids join the index. A removal is no exception:
		 * the queue drops the removed ids from the operations already standing in it, but carries
		 * them in the removal operation itself, so such a row keeps answering hasItemPending.
		 * @param {Array<string>} ids
		 */
		#rememberQueuedIds(ids)
		{
			ids.forEach((id) => this.#queuedItemIds.add(id));
		}

		/**
		 * @desc The operation replaced the queue instead of joining it: setItems and setPreparedItems
		 * drop everything standing there, so the ids of the dropped operations leave the index too.
		 * @param {Array<string>} ids
		 */
		#resetQueuedIds(ids)
		{
			this.#queuedItemIds = new Set(ids);
		}

		/**
		 * @desc Takes the queue for the pass: the compressed operations, the queue itself and the
		 * index of the queued ids leave in one synchronous step. An operation enqueued while the
		 * pass awaits its native calls belongs to the next pass and must survive on both sides.
		 * @return {Array<RecentQueueItem>}
		 */
		#takeQueue()
		{
			const queue = optimizeQueue(this.queue.getValues());
			this.queue.reset();
			this.#queuedItemIds.clear();

			return queue;
		}

		// endregion coalescing scope

		/**
		 * @param {boolean} [isForcedPass]
		 * @return {Promise<void>}
		 */
		#renderItemsFromQueue = async (isForcedPass = false) => {
			this.#disarmIdleGuard();
			// every pass that was not suppressed counts, including a pass over an empty queue
			this.#renderStats.queuePasses += 1;
			if (isForcedPass)
			{
				this.#renderStats.forcedPasses += 1;
			}

			this.worker.stop();
			const queue = this.#takeQueue();

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
			return this.#isWidgetItemEqualToRendered(this.#prepareElementToRecentWidgetItem(item));
		}

		/**
		 * @param {RecentWidgetItem|RecentItem} widgetItem
		 * @returns {boolean}
		 */
		#isWidgetItemEqualToRendered(widgetItem)
		{
			const renderedItem = this.itemCollection.get(String(widgetItem.id));
			if (!renderedItem)
			{
				return false;
			}

			return isEqualIgnoringUndefined(this.#prepareElementToRecentWidgetItem(renderedItem), widgetItem);
		}

		/**
		 * @returns {Array<string>}
		 */
		#collectionKeysSnapshot()
		{
			return [...this.itemCollection.keys()];
		}

		/**
		 * @desc A row the list injects into the collection itself and never receives in a content
		 * set: the pagination loader and the invite banner. Such a row leaves both sides of the
		 * ALG-05 comparison; every other row, the active call one included, stays in it.
		 * Not the same question as the `isServiceRow` option of deleteItems (ALG-03): the parent
		 * pseudo row of a nested tab is a service row for the composition safety valve and a content
		 * row here, because it does arrive in the incoming set.
		 * @param {RecentWidgetItem|RecentItem} [item]
		 * @returns {boolean}
		 */
		#isServiceRow(item)
		{
			if (!item)
			{
				return false;
			}

			return SELF_INJECTED_ROW_TYPES.has(item.type) || this.#serviceRowIds.has(String(item.id));
		}

		/**
		 * @desc Keys of the rendered content rows. The service rows are dropped, otherwise the
		 * comparison against an incoming set would differ by their number alone and the full replace
		 * would always be performed.
		 * @returns {Array<string>}
		 */
		#renderedContentKeys()
		{
			return this.#collectionKeysSnapshot()
				.filter((key) => !this.#isServiceRow(this.itemCollection.get(key)))
			;
		}

		/**
		 * @desc The same exclusion the rendered side gets: a one-sided filter would give the same
		 * error with the opposite sign.
		 * @param {Array<RecentItem>} itemList
		 * @returns {Array<RecentItem>}
		 */
		#excludeServiceRows(itemList)
		{
			return itemList.filter((item) => !this.#isServiceRow(item));
		}

		/**
		 * @returns {Array<RecentItem>}
		 */
		#getRenderedServiceRows()
		{
			return this.getItemList().filter((item) => this.#isServiceRow(item));
		}

		/**
		 * @param {Array<string>} renderedKeys
		 * @param {Array<RecentWidgetItem|RecentItem>} widgetItems
		 * @returns {boolean} true when the rendered collection has the same items in the same order
		 */
		#isRenderedEqualTo(renderedKeys, widgetItems)
		{
			return renderedKeys.length === widgetItems.length
				&& renderedKeys.every((key, index) => {
					const widgetItem = widgetItems[index];

					return key === String(widgetItem.id) && this.#isWidgetItemEqualToRendered(widgetItem);
				})
			;
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

			await this.#handleFullReplace(this.#convertToRecentItems(items));
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

			await this.#handleFullReplace(preparedItems);
		};

		/**
		 * @desc ALG-05: picks one of two branches - skip the native call or replace the whole native
		 * set.
		 * @param {Array<RecentItem>} preparedItems
		 * @return {Promise<void>}
		 */
		async #handleFullReplace(preparedItems)
		{
			const contentItems = this.#excludeServiceRows(preparedItems);
			const widgetItems = this.#buildWidgetItems(contentItems);
			const renderedKeys = this.#renderedContentKeys();

			const isSameAsRendered = this.#isRenderedEqualTo(renderedKeys, widgetItems);

			// the mirror is filled before the native call and not after it: the queue is already taken by
			// this pass, so between the two the collection is the only answer the delete and update gates
			// of the vuex services have, and they ask it from outside the pass at any moment
			const previousCollection = new Map(this.itemCollection);
			this.#applyCollection(contentItems, isSameAsRendered);

			if (isSameAsRendered)
			{
				this.#renderStats.skippedIdenticalSetItems += 1;
				this.logger.log('handleFullReplace: item list is equal to the rendered one, native call skipped');

				return;
			}

			try
			{
				await this.#callSetItemsNative(widgetItems);
			}
			catch (error)
			{
				// the screen kept the previous rows, so the mirror goes back to them: describing rows
				// nobody sees, it would read the next attempt with the same set as identical, skip the
				// native call and leave the screen stale until the set differs
				this.itemCollection = previousCollection;
				this.logger.error('handleFullReplace: the native call failed, the collection is rolled back', error);

				throw error;
			}
		}

		/**
		 * @desc The collection mirrors the native list: it takes the whole incoming set in both
		 * branches and keeps the service rows exactly while the branch leaves them on the screen. A
		 * full replace wipes them natively, so it wipes them here too; the skipped branch keeps them,
		 * otherwise `hideLoader()` would never find its own row again.
		 * @param {Array<RecentItem>} contentItems
		 * @param {boolean} keepServiceRows
		 */
		#applyCollection(contentItems, keepServiceRows)
		{
			const serviceRows = keepServiceRows ? this.#getRenderedServiceRows() : [];

			this.#resetCollection();
			this.#setItemsInCollection(contentItems);
			this.#setItemsInCollection(serviceRows);
		}

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
					await this.#removeItemNative(item);
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

			await this.#removeItemsByIdsNative(ids);

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
		 * @param {Array<RecentWidgetItem|RecentItem>} widgetItemList
		 * @returns {Promise<void>}
		 */
		async #callSetItemsNative(widgetItemList)
		{
			this.logger.log('setItems to native', widgetItemList);
			this.#renderStats.setItemsToNative += 1;

			if (Type.isArrayFilled(widgetItemList))
			{
				// the only closer of the startup sub-point: the cache snapshot goes through this call
				// too, and a repeated endPoint of an already closed key does nothing
				serviceLocator.get('messenger-init-perf-point')?.endPoint('first-items');
			}

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

			return this.#callAddItemsNative(
				itemAddItemList.map((item) => this.#prepareElementToRecentWidgetItem(item)),
			);
		}

		/**
		 * @param {Array<RecentWidgetItem|RecentItem>} widgetItemList
		 * @returns {Promise<void>}
		 */
		async #callAddItemsNative(widgetItemList)
		{
			this.logger.log('addItems to native', widgetItemList);
			this.#renderStats.addItemsToNative += 1;

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
			this.#renderStats.updateItemsToNative += 1;

			return this.ui.updateItems(preparedItems);
		}

		/**
		 * @param {RecentItem|{id: string}} item
		 * @returns {Promise<void>}
		 */
		async #removeItemNative(item)
		{
			this.logger.log('removeItem to native', item);
			this.#renderStats.removeFromNative += 1;

			return this.ui.removeItem({ id: item.id });
		}

		/**
		 * @param {Array<string>} ids
		 * @returns {Promise<void>}
		 */
		async #removeItemsByIdsNative(ids)
		{
			this.logger.log('removeItemsByIds to native', ids);
			this.#renderStats.removeFromNative += 1;

			return this.ui.removeItemsByIds(ids);
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

		/**
		 * @param {Array<RecentItem>} preparedItemList
		 * @returns {Array<RecentWidgetItem|RecentItem>}
		 */
		#buildWidgetItems(preparedItemList)
		{
			return preparedItemList.map((item) => this.#prepareElementToRecentWidgetItem(item));
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
