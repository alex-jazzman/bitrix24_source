/**
 * @module im/messenger/controller/recent/service/vuex/all
 */
jn.define('im/messenger/controller/recent/service/vuex/all', (require, exports, module) => {
	const { Type } = require('type');
	const { unique } = require('utils/array');
	const { debounce } = require('utils/function');
	const { RecentFilterId, ROOT_PARENT_CHAT_ID } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const {
		sortByAggregatedActivityDateWithPinned,
		getLastActivityDate,
	} = require('im/messenger/model/recent');
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');
	const { AnchorMutationHandler } = require('im/messenger/controller/recent/service/vuex/lib/handlers/anchor');
	const { RecentFilteredSync } = require('im/messenger/controller/recent/service/vuex/lib/sync/filter');
	const { FolderComposition } = require('im/messenger/controller/recent/service/lib/folder-composition');

	const REFRESH_DEBOUNCE_MS = 50;

	/**
	 * List service of the "All" folder. The folder has no section of its own: its content is the
	 * union of the root buckets of the member sections, read from the store on every recalculation.
	 * The service owns only the loaded window of that union, one per mode of the list; the model
	 * returns the whole union.
	 * A mutation of the store is answered per item, never by a rebuild of the list: the tab keeps
	 * its subscriptions for the whole session, including the time spent on the other tabs.
	 *
	 * @implements {IVuexService}
	 * @class AllVuexService
	 */
	class AllVuexService extends BaseRecentService
	{
		#refreshDebounce = null;
		#isRefreshCancelled = false;
		#windowByMode = new Map();
		#windowSections = null;
		#sectionsCache = null;

		onInit()
		{
			this.logger.log('onInit');

			this.anchor = new AnchorMutationHandler(this.recentLocator, this.logger, { hasCompositionRule: true });
			this.recentFilteredSync = new RecentFilteredSync(this.recentLocator, this.logger);
			this.#refreshDebounce = debounce(() => this.#runScheduledRefresh(), REFRESH_DEBOUNCE_MS);
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
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		subscribeEvents()
		{
			this.recentFilteredSync.subscribeStoreMutation();
			this.storeManager
				.on('recentModel/add', this.recentItemsChangedHandler)
				.on('recentModel/update', this.recentItemsChangedHandler)
				.on('recentModel/delete', this.recentItemRemovedHandler)
				.on('recentModel/setNestedIdCollection', this.sectionItemsAddedHandler)
				.on('recentModel/storeNestedIdCollection', this.sectionCollectionReplacedHandler)
				.on('recentModel/deleteFromNestedIdCollection', this.sectionItemDeletedHandler)
				.on('recentModel/deleteIdFromNestedIdCollection', this.recentItemRemovedHandler)
				.on('dialoguesModel/add', this.dialogUpdateHandler)
				.on('dialoguesModel/update', this.dialogUpdateHandler)
				.on('dialoguesModel/addCollection', this.dialogCollectionUpdateHandler)
				.on('dialoguesModel/updateCollection', this.dialogCollectionUpdateHandler)
				.on('dialoguesModel/clearAllCounters', this.dialogReadAllCountersHandler)
				.on('counterModel/set', this.counterSetHandler)
				.on('counterModel/delete', this.counterDeleteHandler)
				.on('anchorModel/add', this.anchor.addHandler)
				.on('anchorModel/delete', this.anchor.deleteHandler)
				.on('anchorModel/deleteMany', this.anchor.deleteManyHandler)
				.on('folderModel/add', this.folderCollectionChangedHandler)
				.on('folderModel/delete', this.folderCollectionChangedHandler)
				.on('folderModel/update', this.folderUpdateHandler)
				.on('folderModel/setState', this.folderSetStateHandler)
				.on('recentModel/recentFilteredModel/setCurrentFilter', this.filterModeChangedHandler)
				.on('recentModel/recentFilteredModel/setIdCollection', this.filterChangedHandler)
				.on('recentModel/recentFilteredModel/clearIdCollection', this.filterChangedHandler)
			;
		}

		unsubscribeEvents()
		{
			this.#cancelScheduledRefresh();
			this.recentFilteredSync.unsubscribeStoreMutation();
			this.storeManager
				.off('recentModel/add', this.recentItemsChangedHandler)
				.off('recentModel/update', this.recentItemsChangedHandler)
				.off('recentModel/delete', this.recentItemRemovedHandler)
				.off('recentModel/setNestedIdCollection', this.sectionItemsAddedHandler)
				.off('recentModel/storeNestedIdCollection', this.sectionCollectionReplacedHandler)
				.off('recentModel/deleteFromNestedIdCollection', this.sectionItemDeletedHandler)
				.off('recentModel/deleteIdFromNestedIdCollection', this.recentItemRemovedHandler)
				.off('dialoguesModel/add', this.dialogUpdateHandler)
				.off('dialoguesModel/update', this.dialogUpdateHandler)
				.off('dialoguesModel/addCollection', this.dialogCollectionUpdateHandler)
				.off('dialoguesModel/updateCollection', this.dialogCollectionUpdateHandler)
				.off('dialoguesModel/clearAllCounters', this.dialogReadAllCountersHandler)
				.off('counterModel/set', this.counterSetHandler)
				.off('counterModel/delete', this.counterDeleteHandler)
				.off('anchorModel/add', this.anchor.addHandler)
				.off('anchorModel/delete', this.anchor.deleteHandler)
				.off('anchorModel/deleteMany', this.anchor.deleteManyHandler)
				.off('folderModel/add', this.folderCollectionChangedHandler)
				.off('folderModel/delete', this.folderCollectionChangedHandler)
				.off('folderModel/update', this.folderUpdateHandler)
				.off('folderModel/setState', this.folderSetStateHandler)
				.off('recentModel/recentFilteredModel/setCurrentFilter', this.filterModeChangedHandler)
				.off('recentModel/recentFilteredModel/setIdCollection', this.filterChangedHandler)
				.off('recentModel/recentFilteredModel/clearIdCollection', this.filterChangedHandler)
			;
		}

		/**
		 * Recent sections the list is built from. Resolving them walks the whole folder collection,
		 * while a mutation of the list happens far more often than a change of the composition, so
		 * the set is kept until a folder mutation able to change it (a folder added, removed or
		 * updated, the whole model restored) drops the cache.
		 *
		 * @return {Set<string>}
		 */
		get sections()
		{
			this.#sectionsCache ??= FolderComposition.getSectionsByTabId(this.recentLocator.get('id'));

			return this.#sectionsCache;
		}

		/**
		 * Rows of the folder in the mode the tab is in. Without a filter it is the union of the
		 * member sections; with a filter on it is the intersection of that union with the set the
		 * filter holds, so a row reaches the list only when both rules keep it: the one the server
		 * applied to the page and the one the client keeps on the counters. Neither side may stand
		 * for the other - the union is the only side that knows the composition of the folder, the
		 * set is the only side that answers a chat being read between two pages.
		 *
		 * @return {Set<string>}
		 */
		getIdCollection()
		{
			const union = this.store.getters['recentModel/getRootUnionIdCollection'](this.sections);
			if (!this.#hasSelectedFilter())
			{
				return union;
			}

			const result = new Set();
			for (const dialogId of this.#getFilteredIdCollection())
			{
				if (union.has(dialogId))
				{
					result.add(dialogId);
				}
			}

			return result;
		}

		/**
		 * Items of the union that belong to the window this tab has loaded in the mode it is in:
		 * items another tab has paged in deeper stay out of the list. The layout of the list and
		 * every mutation answered afterwards ask one and the same rule, #isInsideWindow.
		 *
		 * @return {Array<RecentModelState>}
		 */
		getVisibleItems()
		{
			const mode = this.#getCurrentMode();
			const idCollection = this.getIdCollection();
			this.#measureWindowByFirstPage(idCollection, mode);

			const items = [];
			for (const dialogId of idCollection)
			{
				const item = this.store.getters['recentModel/getById'](dialogId);
				if (item && this.#isInsideWindow(item, mode))
				{
					items.push(item);
				}
			}

			return this.#sortItems(items);
		}

		/**
		 * A page the loaders of this tab have just written to the store. The window has to cover
		 * the page before its items may be shown, so it is measured by the deepest of them and only
		 * then the items reach the list.
		 *
		 * The page belongs to the mode it was requested in, and the loader that requested it is the
		 * only side knowing that mode: the user may switch the funnel while the request is in
		 * flight, and a page of the previous mode may not move the border of the new one. A page
		 * read from the local base passes no mode: the read takes milliseconds and the mode of the
		 * moment is the mode it was requested in.
		 *
		 * @param {Array<string|number>} dialogIds
		 * @param {?FilterId} [mode] the mode the page was requested in, the current one by default
		 */
		addLoadedPage(dialogIds, mode = null)
		{
			const ids = this.#normalizeIds(dialogIds ?? []);
			if (!Type.isArrayFilled(ids))
			{
				return;
			}

			const pageMode = mode ?? this.#getCurrentMode();
			this.logger.log('addLoadedPage', pageMode, ids);

			const wasWindowBottomProvisional = !this.#getWindowOf(pageMode).isFromLoadedPage;
			this.#measureWindowByLoadedPage(ids, pageMode);

			// The window of the page belongs to its own mode and is moved above in any case. The
			// rendered collection belongs to the mode the list is in right now, and the two part
			// ways when the funnel is switched while the request is in flight: the items of the
			// page are not the rows of the current list, and the border of the page mode is not
			// the border the current list is cut by. Touching the render from here would then show
			// rows of the previous mode and drop rows of the current one by a foreign depth.
			// The list of the page mode is laid out by its own window when the user returns to it.
			if (pageMode !== this.#getCurrentMode())
			{
				this.logger.log('addLoadedPage: the page belongs to another mode, render untouched', pageMode);

				return;
			}

			this.#updateItemsByIds(ids);

			if (wasWindowBottomProvisional && this.#getWindowOf(pageMode).isFromLoadedPage)
			{
				this.#dropRenderedItemsOutsideWindow(pageMode);
			}
		}

		/**
		 * Rebuilds the whole list. Used when the union may have changed as a whole: a bucket
		 * replaced by another tab or a new composition of the folder.
		 *
		 * A full rebuild replaces the list, so it has to carry the rows of the active calls: they
		 * belong to the external service, not to the union, and it writes them only when a call
		 * begins or ends. Answering a mutation item by item replaces nothing and leaves them alone.
		 */
		refreshList()
		{
			if (!this.recentLocator.has('render'))
			{
				this.logger.log('refreshList: render is not ready, skipping');

				return;
			}

			const render = this.recentLocator.get('render');
			render.setItems([...this.#getCallList(), ...this.getVisibleItems()]);
			void render.renderInstant();
		}

		/**
		 * An item added to the collection and an item updated in it reach the list the same way:
		 * the current window decides whether it is shown.
		 *
		 * @param {MutationPayload<RecentAddData|RecentUpdateData>} payload
		 */
		recentItemsChangedHandler = ({ payload }) => {
			this.logger.log('recentItemsChangedHandler', payload);

			this.#updateItemsByIds(this.#getIdsFromRecentPayload(payload));
		};

		/**
		 * The item is gone: either dropped from the collection or removed from every section.
		 *
		 * @param {MutationPayload<RecentDeleteData|{id: string}>} payload
		 */
		recentItemRemovedHandler = ({ payload }) => {
			this.logger.log('recentItemRemovedHandler', payload);

			this.#deleteRenderedItem(payload?.data?.id);
		};

		/**
		 * @param {MutationPayload<{recentSection: string, itemIds: Array<string>, parentChatId?: number}>} payload
		 */
		sectionItemsAddedHandler = ({ payload }) => {
			if (!this.#isCompositionMutation(payload))
			{
				return;
			}

			this.logger.log('sectionItemsAddedHandler', payload);

			this.#updateItemsByIds(payload.data.itemIds ?? []);
		};

		/**
		 * A whole bucket has been replaced (the first page of a member tab), so items may have left
		 * the union: the list is rebuilt instead of being updated item by item.
		 *
		 * @param {MutationPayload<RecentStoreNestedIdCollectionData>} payload
		 */
		sectionCollectionReplacedHandler = ({ payload }) => {
			if (!this.#isCompositionMutation(payload))
			{
				return;
			}

			this.logger.log('sectionCollectionReplacedHandler', payload);

			this.#scheduleRefreshList();
		};

		/**
		 * @param {MutationPayload<RecentDeleteFromNestedIdCollectionData>} payload
		 */
		sectionItemDeletedHandler = ({ payload }) => {
			if (!this.#isCompositionMutation(payload))
			{
				return;
			}

			this.logger.log('sectionItemDeletedHandler', payload);

			this.#updateItemsByIds([payload.data.id]);
		};

		/**
		 * The root filter of the union reads parentChatId from dialoguesModel, so a dialog record
		 * arriving late may both add a chat to the list and remove a nested one from it.
		 *
		 * @param {MutationPayload<DialoguesAddData|DialoguesUpdateData>} payload
		 */
		dialogUpdateHandler = ({ payload }) => {
			this.logger.log('dialogUpdateHandler', payload);

			this.#updateItemsByIds([payload?.data?.dialogId]);
		};

		/**
		 * A whole page of dialogues seeded at once. It is answered exactly like a single record,
		 * only the union is read once for the page instead of once per record.
		 *
		 * The restore from the local database commits the same mutations and is left alone: the list
		 * is laid out by the loader of that path, not by the records it writes on the way.
		 *
		 * @param {MutationPayload<DialoguesAddCollectionData|DialoguesUpdateCollectionData>} payload
		 */
		dialogCollectionUpdateHandler = ({ payload }) => {
			if (payload?.actionName !== 'setCollection')
			{
				return;
			}

			this.logger.log('dialogCollectionUpdateHandler', payload);

			const items = payload?.data?.addItems ?? payload?.data?.updateItems ?? [];

			this.#updateItemsByIds(items.map((item) => item.dialogId));
		};

		/**
		 * @param {MutationPayload<DialoguesClearAllCountersData>} payload
		 */
		dialogReadAllCountersHandler = ({ payload }) => {
			this.logger.log('dialogReadAllCountersHandler', payload);

			this.#updateItemsByIds(payload?.data?.affectedDialogs ?? []);
		};

		/**
		 * @param {MutationPayload<CounterSetData>} payload
		 */
		counterSetHandler = ({ payload }) => {
			const counterList = payload?.data?.counterList;
			if (!Type.isArrayFilled(counterList))
			{
				return;
			}

			this.logger.log('counterSetHandler', payload);

			this.#updateItemsByChatIds([
				...counterList.map((counter) => counter.parentChatId || counter.chatId),
				...(payload.data.previousParentChatIdList ?? []),
			]);
		};

		/**
		 * @param {MutationPayload<CounterDeleteData, CounterDeleteActions>} payload
		 */
		counterDeleteHandler = ({ payload }) => {
			if (!['clear', 'clearByType', 'delete'].includes(payload?.actionName))
			{
				return;
			}

			this.logger.log('counterDeleteHandler', payload);

			const { chatIdList = [], parentChatIdList = [] } = payload?.data ?? {};
			this.#updateItemsByChatIds([...chatIdList, ...parentChatIdList]);
		};

		/**
		 * The composition is a function of the folders present in the model: the folder of the tab
		 * carries the codes, the member folders carry the sections. A folder arriving or leaving
		 * changes the union, and the folder list of the very first launch arrives folder by folder,
		 * so the rebuilds are collapsed by the debounce.
		 */
		folderCollectionChangedHandler = () => {
			this.logger.log('folderCollectionChangedHandler');

			this.#resetSectionsCache();
			this.#scheduleRefreshList();
		};

		/**
		 * A new composition of the folder means a new set of sections to union. The cache is dropped
		 * on any folder update: a member folder renaming its own section changes the union too, even
		 * though it does not by itself call for a rebuild of the list.
		 *
		 * @param {MutationPayload<FolderUpdateData>} payload
		 */
		folderUpdateHandler = ({ payload }) => {
			this.#resetSectionsCache();

			const folder = FolderComposition.getFolderByTabId(this.recentLocator.get('id'));
			if (payload?.data?.id !== folder?.id || !Type.isArray(payload?.data?.fields?.sourceFolders))
			{
				return;
			}

			this.logger.log('folderUpdateHandler', payload);

			this.#scheduleRefreshList();
		};

		folderSetStateHandler = () => {
			this.logger.log('folderSetStateHandler');

			this.#resetSectionsCache();
			this.#scheduleRefreshList();
		};

		/**
		 * The set of the filter has been recomputed or dropped: the rows of the list change as a
		 * whole, so it is rebuilt instead of being updated item by item. The burst a switch of the
		 * mode produces - the mutation of the mode and the mutation of the set that follows it - is
		 * collapsed into a single rebuild by the debounce.
		 *
		 * @param {MutationPayload<{tabId: string, parentChatId?: number}>} payload
		 */
		filterChangedHandler = ({ payload }) => {
			if (!this.#isOwnFilterMutation(payload))
			{
				return;
			}

			this.logger.log('filterChangedHandler', payload);

			this.#scheduleRefreshList();
		};

		/**
		 * The mode has been switched: besides the rebuild of the rows, the header shows the mode by
		 * the accent of its funnel, and the accent is read only while the right buttons are redrawn.
		 * The tab is taken from the locator: the folder is opened by its own id as well, and then the
		 * header of the tab is the one resolved for that id.
		 *
		 * @param {MutationPayload<{tabId: string, filterId: FilterId, parentChatId?: number}, 'setCurrentFilter'>} payload
		 */
		filterModeChangedHandler = ({ payload }) => {
			if (!this.#isOwnFilterMutation(payload))
			{
				return;
			}

			this.logger.log('filterModeChangedHandler', payload);

			serviceLocator.get('messenger-header-manager').redrawRightButtonsIfNeeded(this.recentLocator.get('id'));
			this.#scheduleRefreshList();
		};

		/**
		 * Collapses a burst of mutations into a single rebuild. The debounce of the standard library
		 * has no cancel of its own, so a rebuild left pending is dropped by the flag instead.
		 */
		#scheduleRefreshList()
		{
			this.#isRefreshCancelled = false;
			this.#refreshDebounce();
		}

		#runScheduledRefresh()
		{
			if (this.#isRefreshCancelled)
			{
				this.logger.log('#runScheduledRefresh: the scheduled refresh is cancelled, skipping');

				return;
			}

			const compositionChanged = this.#resetWindowsIfSectionsChanged();

			// The set of the filter was built over the previous sections, and the union is only one
			// of the two sides deciding a row: a source added to the folder brings chats the union
			// takes in at once and the set knows nothing about, so with a filter on they would stay
			// hidden until some unrelated mutation of the counters happened to rebuild the set. The
			// recalculation lands after this rebuild and its own mutation brings the second one.
			if (compositionChanged && this.#hasSelectedFilter())
			{
				void this.recentFilteredSync?.resync();
			}

			this.refreshList();
		}

		#cancelScheduledRefresh()
		{
			this.#isRefreshCancelled = true;
		}

		#resetSectionsCache()
		{
			this.#sectionsCache = null;
		}

		/**
		 * The windows belong to a composition: the depth the pages of the previous set of sections
		 * reached says nothing about the union of a new one. The change is recognized by the set
		 * itself and not by the mutation that scheduled the rebuild, because two of the four handlers
		 * scheduling it carry no reason at all, while a bucket replaced by another tab leaves the set
		 * as it was - so one rule covers every source of a rebuild.
		 *
		 * The very first comparison has nothing to compare with: the set is remembered and the windows,
		 * provisional anyway, are left alone. That is also the first composition arriving folder by
		 * folder: the set changes several times while no page has been loaded yet.
		 *
		 * The state of the pagination is left alone: a cursor dropped without the first page requested
		 * anew breaks the loading of the next page, and the request belongs to the controller.
		 *
		 * @return {boolean} whether the composition turned out to be a different one
		 */
		#resetWindowsIfSectionsChanged()
		{
			const sections = this.sections;
			if (Type.isNull(this.#windowSections))
			{
				this.#windowSections = new Set(sections);

				return false;
			}

			if (this.#isWindowMeasuredBy(sections))
			{
				return false;
			}

			this.logger.log('#resetWindowsIfSectionsChanged: the composition has changed', [...sections]);

			this.#windowSections = new Set(sections);
			this.#resetWindows();

			return true;
		}

		/**
		 * @param {Set<string>} sections
		 * @return {boolean}
		 */
		#isWindowMeasuredBy(sections)
		{
			if (sections.size !== this.#windowSections.size)
			{
				return false;
			}

			return [...sections].every((section) => this.#windowSections.has(section));
		}

		/**
		 * Drops the border of every mode and not only of the one the list is in: a border kept from
		 * the previous composition would cut the union of the new one the moment the user returns to
		 * that mode. The layout of the rebuilt list takes the border anew, provisionally, by the first
		 * page of the union of the new composition.
		 *
		 * A mode carrying no window of its own carries no border either, so dropping the entry is the
		 * reset.
		 */
		#resetWindows()
		{
			this.#windowByMode.clear();
		}

		/**
		 * The window of a mode, created on the first read of it. A mode nothing has been loaded in
		 * has no bottom, that is its window covers the whole union until the first measure.
		 *
		 * @param {FilterId} mode
		 * @return {{bottom: ?number, isFromLoadedPage: boolean}}
		 */
		#getWindowOf(mode)
		{
			let modeWindow = this.#windowByMode.get(mode);
			if (!modeWindow)
			{
				modeWindow = { bottom: null, isFromLoadedPage: false };
				this.#windowByMode.set(mode, modeWindow);
			}

			return modeWindow;
		}

		/**
		 * The mode the list is in. A tab declaring no filter service of its own, or one whose service
		 * names no mode, knows a single mode - the one every list is in until a filter is applied - and
		 * behaves as it did before the modes.
		 *
		 * @return {FilterId}
		 */
		#getCurrentMode()
		{
			const mode = this.recentLocator.get('filter')?.getCurrentFilterId();

			return Type.isStringFilled(mode) ? mode : RecentFilterId.all;
		}

		/**
		 * Rows of the calls the external service of this tab holds. The service is asked instead of
		 * the global state because every tab keeps calls of its own, and a tab that shows no calls
		 * declares no such service at all.
		 *
		 * @return {Array<CallItemData>}
		 */
		#getCallList()
		{
			return this.recentLocator.has('external') ? this.recentLocator.get('external').getCallList() : [];
		}

		/**
		 * @param {MutationPayload<{recentSection: string, parentChatId?: number}>} payload
		 * @return {boolean}
		 */
		#isCompositionMutation(payload)
		{
			const data = payload?.data;
			if (!data || (data.parentChatId ?? ROOT_PARENT_CHAT_ID) !== ROOT_PARENT_CHAT_ID)
			{
				return false;
			}

			return this.sections.has(data.recentSection);
		}

		/**
		 * The model of the filter keeps a set per tab and per level of nesting, so a mutation of
		 * another tab or of a nested list of this one is none of this service's business.
		 *
		 * @param {MutationPayload<{tabId: string, parentChatId?: number}>} payload
		 * @return {boolean}
		 */
		#isOwnFilterMutation(payload)
		{
			const data = payload?.data;

			return Boolean(data)
				&& data.tabId === this.recentLocator.get('id')
				&& (data.parentChatId ?? ROOT_PARENT_CHAT_ID) === this.recentLocator.get('parentChatId')
			;
		}

		/**
		 * @return {boolean}
		 */
		#hasSelectedFilter()
		{
			return this.store.getters['recentModel/recentFilteredModel/hasSelectedFilter'](
				this.recentLocator.get('id'),
				this.recentLocator.get('parentChatId'),
			);
		}

		/**
		 * @return {Set<string>}
		 */
		#getFilteredIdCollection()
		{
			return this.store.getters['recentModel/recentFilteredModel/getIdCollection'](
				this.recentLocator.get('id'),
				this.recentLocator.get('parentChatId'),
			);
		}

		/**
		 * @param {MutationPayload<RecentAddData|RecentUpdateData>} payload
		 * @return {Array<string>}
		 */
		#getIdsFromRecentPayload(payload)
		{
			const recentItemList = payload?.data?.recentItemList;
			if (!Type.isArrayFilled(recentItemList))
			{
				return [];
			}

			return recentItemList.map((item) => item.fields?.id ?? item.id);
		}

		/**
		 * @param {Array<number>} chatIds
		 */
		#updateItemsByChatIds(chatIds)
		{
			const dialogIds = unique(chatIds.filter(Boolean))
				.map((chatId) => this.store.getters['dialoguesModel/getByChatId'](chatId)?.dialogId)
				.filter(Boolean)
			;

			this.#updateItemsByIds(dialogIds);
		}

		/**
		 * Renders the given items as the current window decides: an item inside it is upserted, an
		 * item outside it is dropped from the list if it is rendered. The decision is taken per item
		 * against the union, which tells whether the item belongs to the folder at all, and against
		 * the window, which tells whether the tab has loaded that deep: a mutation of the store
		 * costs one lookup per item and never a rebuild of the whole list.
		 *
		 * @param {Array<string|number>} ids
		 */
		#updateItemsByIds(ids)
		{
			const dialogIds = this.#normalizeIds(ids);
			if (!Type.isArrayFilled(dialogIds) || !this.recentLocator.has('render'))
			{
				return;
			}

			const render = this.recentLocator.get('render');
			const mode = this.#getCurrentMode();
			if (render.getItemCollectionSize() === 0 || Type.isNull(this.#getWindowOf(mode).bottom))
			{
				this.logger.log('#updateItemsByIds: the window is not laid out yet, rendering it as a whole');
				this.#scheduleRefreshList();

				return;
			}

			const idCollection = this.getIdCollection();
			const toUpsert = [];
			const toDelete = [];

			for (const dialogId of dialogIds)
			{
				const item = idCollection.has(dialogId) ? this.store.getters['recentModel/getById'](dialogId) : null;
				if (item && this.#isInsideWindow(item, mode))
				{
					toUpsert.push(item);
				}
				else if (render.hasItemRendered(dialogId))
				{
					toDelete.push({ id: dialogId });
				}
			}

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
		 * The single rule of visibility: an item of the union is shown when the window of this tab
		 * reaches down to it. A pinned item is inside the window whatever its date is, because it
		 * heads the list. A window with no bottom covers the union: nothing the tab has laid out or
		 * loaded in this mode carries a depth of its own, so there is nothing to cut by.
		 *
		 * The mode is taken by the caller and passed here, never read per item: this rule answers
		 * every item of every mutation of the store.
		 *
		 * @param {RecentModelState} item
		 * @param {FilterId} mode
		 * @return {boolean}
		 */
		#isInsideWindow(item, mode)
		{
			const { bottom } = this.#getWindowOf(mode);
			if (Type.isNull(bottom) || item.pinned)
			{
				return true;
			}

			return this.#getItemActivityTimestamp(item) >= bottom;
		}

		/**
		 * The one moment an item may leave the window: the first report of a page replaces the
		 * provisional bottom taken from the union, and what the list showed until then (an item with
		 * no activity date of its own, an item deeper than the page just reported) is no longer part
		 * of it. Every later report only lowers the bottom, that is only lets items in, so the list
		 * keeps up with the model without this pass.
		 *
		 * @param {FilterId} mode the mode the page that replaced the provisional bottom belongs to
		 */
		#dropRenderedItemsOutsideWindow(mode)
		{
			if (!this.recentLocator.has('render'))
			{
				return;
			}

			const render = this.recentLocator.get('render');
			const toDelete = [];

			for (const dialogId of this.getIdCollection())
			{
				if (!render.hasItemRendered(dialogId))
				{
					continue;
				}

				const item = this.store.getters['recentModel/getById'](dialogId);
				if (!item || !this.#isInsideWindow(item, mode))
				{
					toDelete.push({ id: dialogId });
				}
			}

			if (Type.isArrayFilled(toDelete))
			{
				this.logger.log('#dropRenderedItemsOutsideWindow', toDelete);

				render.deleteItems(toDelete);
			}
		}

		/**
		 * @param {string} [dialogId]
		 */
		#deleteRenderedItem(dialogId)
		{
			const id = String(dialogId ?? '');
			if (!Type.isStringFilled(id) || !this.recentLocator.has('render'))
			{
				return;
			}

			const render = this.recentLocator.get('render');
			if (!render.hasItemRendered(id))
			{
				return;
			}

			render.deleteItems([{ id }]);
		}

		/**
		 * @param {Array<string|number>} ids
		 * @return {Array<string>}
		 */
		#normalizeIds(ids)
		{
			return unique(ids.map((id) => String(id ?? ''))).filter((id) => Type.isStringFilled(id));
		}

		/**
		 * The bottom of the window before this tab has reported a page of its own in this mode: the
		 * deepest item of the first page of the union, the very page every other tab lays out.
		 * Re-taken at every layout while the mode has loaded no page, so that the list and the
		 * mutations answered after it are cut by one border.
		 *
		 * A page covering the whole union gives the deepest item of the union, that is a bottom
		 * letting all of it in - a union shorter than a page needs no case of its own.
		 *
		 * @param {Set<string>} idCollection
		 * @param {FilterId} mode
		 */
		#measureWindowByFirstPage(idCollection, mode)
		{
			const modeWindow = this.#getWindowOf(mode);
			if (modeWindow.isFromLoadedPage)
			{
				return;
			}

			const firstPage = this.store.getters['recentModel/getFirstPageByIdCollection'](idCollection);
			modeWindow.bottom = this.#getWindowBottomOf(firstPage);
		}

		/**
		 * The bottom of the window of the mode a page has been loaded in: the deepest item of that
		 * page. The first page reported in a mode replaces the provisional bottom instead of lowering
		 * it, because the union may reach deeper than the tab itself has loaded. Afterwards the bottom
		 * of that mode never moves back up, so a page once loaded stays inside its window.
		 *
		 * An item with no activity date of its own is left out of the measurement: it carries no
		 * depth, and a bottom at the very beginning of time would open the window to the whole union.
		 *
		 * @param {Array<string>} dialogIds
		 * @param {FilterId} mode
		 */
		#measureWindowByLoadedPage(dialogIds, mode)
		{
			const datedItems = dialogIds
				.map((dialogId) => this.store.getters['recentModel/getById'](dialogId))
				.filter((item) => item && this.#getItemActivityTimestamp(item) > 0)
			;

			const bottom = this.#getWindowBottomOf(datedItems);
			if (Type.isNull(bottom))
			{
				return;
			}

			const modeWindow = this.#getWindowOf(mode);
			if (!modeWindow.isFromLoadedPage || bottom < modeWindow.bottom)
			{
				modeWindow.bottom = bottom;
				modeWindow.isFromLoadedPage = true;
			}
		}

		/**
		 * The deepest of the given items, measured the way the list itself compares them - by the
		 * aggregated activity date - so that the border and the items it cuts by live on one scale.
		 *
		 * A pinned chat is left out: it heads the list whatever its date is, so an old pin would
		 * drag the bottom down and let in items no page of this tab has reached.
		 *
		 * @param {Array<RecentModelState>} items
		 * @return {?number}
		 */
		#getWindowBottomOf(items)
		{
			const timestamps = items
				.filter((item) => !item.pinned)
				.map((item) => this.#getItemActivityTimestamp(item))
			;

			return Type.isArrayFilled(timestamps) ? Math.min(...timestamps) : null;
		}

		/**
		 * Pinned first, then by activity date: the very comparator the page queries of the model
		 * use, so the order of the list does not change once a page has been loaded.
		 *
		 * @param {Array<RecentModelState>} items
		 * @return {Array<RecentModelState>}
		 */
		#sortItems(items)
		{
			return items.sort(sortByAggregatedActivityDateWithPinned(this.store.getters));
		}

		/**
		 * Activity date of a list item as the model aggregates it: the newest of the draft, the
		 * file being uploaded and the message.
		 *
		 * @param {RecentModelState} item
		 * @return {number}
		 */
		#getItemActivityTimestamp(item)
		{
			return getLastActivityDate(item, this.store.getters).getTime();
		}
	}

	module.exports = AllVuexService;
});
