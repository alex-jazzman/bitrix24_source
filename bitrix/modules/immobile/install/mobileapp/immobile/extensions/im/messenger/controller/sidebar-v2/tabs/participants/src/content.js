/**
 * @module im/messenger/controller/sidebar-v2/tabs/participants/src/content
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/participants/src/content', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Type } = require('type');
	const { isEmpty, isEqual } = require('utils/object');
	const { Color, Corner, Component, Indent } = require('tokens');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { DialogType } = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { SearchInput } = require('im/messenger/lib/ui/search/input');
	const { makeLibraryImagePath } = require('im/messenger/assets');
	const { Align } = require('utils/enums/style');
	const logger = LoggerManager.getInstance().getLogger('sidebar--participants-service');
	const { ParticipantType } = require('im/messenger/controller/sidebar-v2/tabs/participants/src/const');
	const {
		SidebarBaseTabListContent,
		SidebarTabListItemModel,
	} = require('im/messenger/controller/sidebar-v2/tabs/base');

	const { menuFactory } = require('im/messenger/controller/sidebar-v2/tabs/participants/src/factories/menu-factory');
	const { itemFactory } = require('im/messenger/controller/sidebar-v2/tabs/participants/src/factories/item-factory');
	const { modelFactory } = require('im/messenger/controller/sidebar-v2/tabs/participants/src/factories/model-factory');

	const ROWS_ANIMATION_NONE = 'none';
	const EMPTY_SEARCH_IMAGE_SIZE = 160;
	const EMPTY_SEARCH_TOP_PADDING = 32;

	/**
	 * @class SidebarParticipantsTabContent
	 */
	class SidebarParticipantsTabContent extends SidebarBaseTabListContent
	{
		/**
		 * @param {ParticipantsMenuProps} params
		 * @returns {ParticipantsBaseMenu}
		 */
		createMenu(params)
		{
			if (!params.userId)
			{
				return null;
			}

			return menuFactory(params);
		}

		bindMethods()
		{
			this.onStoreSetSidebarParticipants = this.onStoreSetSidebarParticipants.bind(this);
			this.onInitialLoadError = this.onInitialLoadError.bind(this);
			this.onRetryLoad = this.onRetryLoad.bind(this);
			this.onSearchTextChange = this.onSearchTextChange.bind(this);
			this.onSearchShow = this.onSearchShow.bind(this);
			this.onSearchHide = this.onSearchHide.bind(this);

			// The controller commits the initial load error in a batch, so the
			// tab subscribes to it through the service callback.
			// The page fetch-more error is caught by the tab itself in onLoadMore.
			this.state.hasLoadError = false;

			// Search by participant name: filtering is client-side, applied over the
			// source participants array while preserving order.
			this.state.searchText = '';

			// Guard against launching the all-pages fetch in parallel on a repeated
			// search focus while the previous loadPage chain is still in flight.
			this.isLoadingAllPages = false;

			// Serialization of reconciles: while a pass is in flight (async
			// deleteRowsByKeys callback), a repeated request only sets reconcilePending -
			// guard against a race of overlapping reconciles (see reconcileDisplay).
			this.isReconciling = false;
			this.reconcilePending = false;

			// Guard onRetryLoad against repeated taps: while the retry request is in flight,
			// the "Retry" button is hidden (renderErrorScreen/renderPaginationLoader), and the
			// flag cuts off a possible tap bounce before the re-render.
			this.isRetrying = false;

			this.dataProvider.setOnLoadError(this.onInitialLoadError);
		}

		/**
		 * @desc Initial participants load failure: hide the spinner and show
		 * the error screen with a "Retry" button, without recreating the tab.
		 */
		onInitialLoadError()
		{
			logger.error(`${this.constructor.name}.onInitialLoadError`);
			this.setState({ hasLoadError: true, pending: false });
		}

		/**
		 * @desc Reload after an error. Re-requests the failed page through the
		 * service: on an initial failure the cursor in the model is empty, so the
		 * first page is requested; on a fetch-more failure - the page from the current
		 * cursor. Already loaded participants are preserved.
		 */
		onRetryLoad()
		{
			logger.log(`${this.constructor.name}.onRetryLoad`);

			// A double tap on "Retry" must not launch two parallel loadPage calls.
			// hasLoadError already hides the button on the re-render, but the flag cuts off
			// a repeat before it; reset in finally on request completion/error.
			if (this.isRetrying)
			{
				return;
			}
			this.isRetrying = true;

			const shouldShowPending = this.getItems().length === 0;
			this.setState({
				hasLoadError: false,
				pending: shouldShowPending,
			});

			this.dataProvider.loadPage(this.getItems().length)
				.then(() => {
					// A retry while search is active resumes the full fetch-more, so the
					// filter again runs over the complete set rather than the partial list
					// where the preroll failure stopped.
					if (this.isSearchActive())
					{
						void this.loadAllPages();
					}
				})
				.catch((error) => {
					logger.error(`${this.constructor.name}.onRetryLoad.error`, error);
					this.onInitialLoadError();
				})
				.finally(() => {
					this.isRetrying = false;
				});
		}

		/**
		 * @desc Failure fetching the next page: keep what was loaded and
		 * show the error screen with retry.
		 */
		onLoadMore()
		{
			if (this.isLastPage() || this.state.hasLoadError)
			{
				return;
			}

			this.enablePaginationLoader();

			this.dataProvider.loadPage(this.getItems().length)
				.then((data) => {
					this.logger.info('onLoadMore', data);
				})
				.catch((error) => {
					this.logger.error('onLoadMore', error);
					this.setState({ hasLoadError: true });
				})
				.finally(() => {
					this.disablePaginationLoader();
				});
		}

		subscribeStoreEvents()
		{
			logger.log(`${this.constructor.name}.subscribeStoreEvents`);
			this.storeManager.on('dialoguesModel/update', this.onStoreSetSidebarParticipants);
			this.storeManager.on('dialoguesModel/copilotModel/update', this.onStoreSetSidebarParticipants);
		}

		unsubscribeStoreEvents()
		{
			logger.log(`${this.constructor.name}.unsubscribeStoreEvents`);
			this.storeManager.off('dialoguesModel/update', this.onStoreSetSidebarParticipants);
			this.storeManager.off('dialoguesModel/copilotModel/update', this.onStoreSetSidebarParticipants);

			// Defensive reset of the error callback: symmetric to the subscription in bindMethods,
			// so the service does not hold a reference to the tab method if the service is ever
			// reused across tab instances.
			this.dataProvider.setOnLoadError(null);
		}

		onStoreManagersUpdate(managerList)
		{
			// An empty list is a valid input: it is the crown removal for former moderators.
			// An early return on isEmpty suppressed both the crown removal and a managerList
			// that arrived empty before being populated (collab chat load race).
			if (!Array.isArray(managerList))
			{
				return;
			}

			const currentItems = this.getItems();
			const currentManagerIds = new Set(
				currentItems
					.filter((item) => item.getData().isManager)
					.map((item) => item.getId()),
			);

			const managerListSet = new Set(managerList);

			const newManagerItems = managerList
				.filter((userId) => !currentManagerIds.has(userId))
				.map((userId) => this.createListItemModel(userId));

			const removedManagerItems = currentItems
				.filter((item) => item.getData().isManager && !managerListSet.has(item.getId()))
				.map((item) => this.createListItemModel(item.getId()));

			const updateItems = [...newManagerItems, ...removedManagerItems];

			void this.updateRows(updateItems);
			this.updateMenu(updateItems);
		}

		updateMenu(items)
		{
			if (!Array.isArray(items) || isEmpty(items))
			{
				return;
			}

			items.forEach((item) => {
				const menu = this.createMenu({
					dialogId: this.getDialogId(),
					...item.getData(),
				});
				const menuRef = this.getMenuRefByItemId(item.getId());
				menuRef?.setProvider(menu.getActions);
			});
		}

		onStoreSetSidebarParticipants({ payload } = {})
		{
			if (String(payload.data?.dialogId) !== String(this.getDialogId()))
			{
				return;
			}

			// Moderator crowns are frozen into rows at the moment they are built (model/user.js reads
			// managerList once). If managerList arrives after the initial row build
			// (collab chat load race: chat data comes later than the first sidebar
			// render), any model update carrying managerList must refresh the crowns - not only
			// the special actionName updateManagerList, but also the initial set from Chat.load. The update
			// is incremental (updateRows by keys), so the active search and scroll position
			// are not reset.
			const managerList = payload.data?.fields?.managerList;
			if (Array.isArray(managerList))
			{
				this.onStoreManagersUpdate(managerList);
			}

			if (payload.actionName === 'updateManagerList')
			{
				return;
			}

			this.onStoreItemsUpdated();
		}

		/**
		 * @desc Update the participants set from the store. The full participants list
		 * is kept in state.items (source of truth + pagination), while the native ListView
		 * is brought to the displayed set (button + filtered) via a custom
		 * non-destructive diff reconcileDisplay - the base syncRows is not
		 * used here because it mutates state.items and ignores the filter.
		 */
		onStoreItemsUpdated()
		{
			const { items, hasNextPage } = this.getItemsFromStore();

			if (this.isPending())
			{
				// First emission from the store: hide the loader. The list is built from
				// getListViewData (which also synchronizes displayedItems).
				if (items !== null)
				{
					this.setState({ items, hasNextPage, pending: false });
				}

				return;
			}

			// The full list is empty or the ListView is not mounted yet - re-render
			// entirely via setState (the native list rebuilds from getListViewData).
			if (this.getItems().length === 0 || !this.listViewRef)
			{
				this.setState({ items, hasNextPage });

				return;
			}

			this.state.items = Array.isArray(items) ? items : [];
			this.state.hasNextPage = hasNextPage;

			this.reconcileDisplay();
		}

		getEmptyScreenProps()
		{
			return {
				testId: 'participants',
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_EMPTY_SCREEN_TITLE'),
			};
		}

		renderContent()
		{
			// Initial load error (no rows at all) - instead of the empty
			// screen, show the error screen with a "Retry" button.
			if (this.state.hasLoadError && this.getItems().length === 0)
			{
				return this.renderErrorScreen();
			}

			// No participants and search is not active - the standard base empty screen
			// ("No participants"). With active search and no matches we show
			// a custom search empty state inside renderList.
			if (!this.isSearchActive() && this.getItems().length === 0)
			{
				return this.renderEmptyScreen();
			}

			return View(
				{
					testId: 'participants-content',
					style: {
						flex: 1,
					},
					// A tap on the free area (outside the field and outside list rows) hides
					// the keyboard and removes focus - like in the forward selector. Taps on
					// the field itself (TextInput) and on list rows (their onClick) do not
					// bubble here, so swipes/popovers/navigation to profile are intact.
					onClick: () => this.dismissSearch(),
				},
				this.renderSearchInput(),
				this.renderList(),
			);
		}

		/**
		 * @desc Participants list accounting for active search: when there are no
		 * matches we show the search empty state.
		 */
		renderList()
		{
			if (this.isSearchActive() && this.getVisibleItems().length === 0)
			{
				return this.renderEmptySearch();
			}

			return this.renderItemsContainer();
		}

		/**
		 * @desc List container that dismisses the keyboard on scroll start: ListView
		 * has no auto-dismiss prop, so we use onScrollBeginDrag (the ListView type
		 * declares it). Other controller scroll handlers (onScroll etc.) are passed
		 * to ListView as is; the parent onScrollBeginDrag, if provided, is called
		 * right after the dismiss.
		 */
		renderItemsContainer()
		{
			const {
				onScrollCalculated,
				onScroll,
				onOverscrollTop,
				onOverscrollBottom,
				onScrollBeginDrag,
				onScrollEndDrag,
				testId,
			} = this.props;

			return View(
				{
					testId: `${testId}-items-container`,
					style: {
						flex: 1,
						// Pull the list up by the search field's bottom margin (Indent.XS) so the
						// first "Add" row sits right under the field, trimming the residual gap.
						// The negative margin only consumes that empty buffer below the field - it
						// does not reach the input box, so the field stays intact (unlike a negative
						// margin on the search field itself, which clipped the input). Scoped to this
						// tab; the shared ListItem and its per-row padding are untouched.
						marginTop: -Indent.XS.toNumber(),
					},
				},
				ListView({
					onScroll,
					onScrollCalculated,
					onOverscrollTop,
					onOverscrollBottom,
					onScrollBeginDrag: (...args) => {
						this.dismissSearch();
						if (Type.isFunction(onScrollBeginDrag))
						{
							onScrollBeginDrag(...args);
						}
					},
					onScrollEndDrag,
					testId: `${testId}-items-container-grid`,
					ref: (ref) => {
						this.listViewRef = ref;
					},
					style: {
						flexDirection: 'column',
						flex: 1,
					},
					data: this.getListViewData(),
					renderItem: (item) => this.renderItem(item),
					onLoadMore: () => this.onLoadMore(),
					renderLoadMore: () => this.renderPaginationLoader(),
				}),
			);
		}

		/**
		 * @desc Hides the keyboard and removes focus from the search field (via the
		 * component's public dismissKeyboard). Does not expand the header: with a non-empty query
		 * we stay in search mode (blur -> onSearchHide decides by isSearchActive).
		 */
		dismissSearch()
		{
			this.searchInputRef?.dismissKeyboard();
		}

		renderSearchInput()
		{
			return View(
				{
					testId: 'participants-search',
					style: {
						// The horizontal edges of search are aligned with the list rows content:
						// ListItem uses Component.paddingLr (=18) on the left and right -
						// search start at the avatars level, end at the "three dots" level.
						paddingHorizontal: Component.paddingLr.toNumber(),
						// Vertical gaps around the search field, kept tight to save list space
						// (all Indent.XS). paddingBottom keeps a small visible gap under the field so
						// rows do not touch the input at zero when the list scrolls beneath it. The
						// marginBottom buffer is offset by a negative marginTop on renderItemsContainer,
						// bringing the first "Add" row close without a negative margin on the field
						// itself (which would clip the input). The shared ListItem and its per-row
						// padding are untouched.
						paddingTop: Indent.XS.toNumber(),
						paddingBottom: Indent.XS.toNumber(),
						marginBottom: Indent.XS.toNumber(),
					},
				},
				new SearchInput({
					placeholder: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_SEARCH_PLACEHOLDER'),
					borderRadius: Corner.L.toNumber(),
					onChangeText: this.onSearchTextChange,
					onSearchShow: this.onSearchShow,
					onSearchHide: this.onSearchHide,
					ref: (ref) => {
						this.searchInputRef = ref;
					},
				}),
			);
		}

		renderEmptySearch()
		{
			return View(
				{
					testId: 'participants-search-empty',
					// A custom no-op onClick absorbs the tap on the empty state so it does NOT
					// bubble to the onClick of the root participants-content (dismissSearch).
					// The same technique that already suppresses bubbling for list rows and TextInput:
					// the empty state had no handler of its own, so a tap on it expanded
					// the header and removed focus. Now the tap is inert - focus/text are preserved.
					clickable: true,
					onClick: () => {},
					style: {
						// Pin the empty state to the top (right below the search field) with a small
						// padding - this keeps the illustration and text guaranteed above the keyboard
						// regardless of its state, without coupling to its logic.
						flex: 1,
						justifyContent: 'flex-start',
						alignItems: 'center',
						paddingTop: EMPTY_SEARCH_TOP_PADDING,
					},
				},
				StatusBlock({
					testId: 'participants-search-empty-block',
					// StatusBlock stretches across the whole area (flexGrow:1) and by default
					// centers the content; Align.TOP aligns it to the top so the
					// empty state sits below the search field, not at the center of the tab.
					verticalAlign: Align.TOP,
					image: this.renderEmptySearchImage(),
					title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_SEARCH_EMPTY'),
					description: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_SEARCH_EMPTY_DESC'),
					titleColor: Color.base3,
					descriptionColor: Color.base4,
				}),
			);
		}

		/**
		 * @desc Search empty-state illustration. The path is resolved depending on the theme
		 * via makeLibraryImagePath - sidebar/empty-state/{theme}/search-people.png, the same
		 * standard resolver of theme-dependent images used by the other sidebar empty-states.
		 * The 300x300 source is scaled into the EMPTY_SEARCH_IMAGE_SIZE = 160 box via
		 * resizeMode: 'contain', so the visual size of the illustration is unchanged.
		 * @return {object}
		 */
		renderEmptySearchImage()
		{
			return Image({
				style: {
					width: EMPTY_SEARCH_IMAGE_SIZE,
					height: EMPTY_SEARCH_IMAGE_SIZE,
				},
				resizeMode: 'contain',
				uri: makeLibraryImagePath('search-people.png', 'sidebar/empty-state'),
			});
		}

		/**
		 * @desc Focus in the search field: collapse the sidebar header and fetch
		 * the rest of the list so the filter runs over the complete set. The header state
		 * is tied to focus/blur, not to the text.
		 */
		onSearchShow()
		{
			this.requestCollapseHeader();
			void this.loadAllPages();
		}

		/**
		 * @desc Blur of the search field. Expand the header only when leaving search with
		 * an empty query (cross/clear or leaving without input). On blur with an active
		 * query (e.g. keyboard dismiss on scroll) the header stays collapsed -
		 * more room for results, we are still in search mode.
		 */
		onSearchHide()
		{
			if (!this.isSearchActive())
			{
				this.requestExpandHeader();
			}
		}

		/**
		 * @desc Search query change. Debounce is already done in SearchInput.
		 * Clearing the query returns the full list. The header state does NOT
		 * depend on the text - only the filter and the empty state do.
		 * @param {string} text
		 */
		onSearchTextChange(text)
		{
			const searchText = Type.isString(text) ? text : '';
			if (searchText === this.state.searchText)
			{
				return;
			}

			this.state.searchText = searchText;

			// A transition between "has rows" and "search empty state" requires a full
			// re-render (the renderList subtree changes); otherwise - a non-destructive
			// diff of the visible rows without rebuilding the entire list.
			const nextIsEmptyState = this.isSearchActive() && this.getVisibleItems().length === 0;
			const currentIsEmptyState = !this.listViewRef;

			if (nextIsEmptyState || currentIsEmptyState)
			{
				this.setState({ searchText });

				return;
			}

			this.setState({ searchText }, () => {
				this.reconcileDisplay();
			});
		}

		/**
		 * @desc Sequentially fetches participant pages until the end of the list,
		 * so client-side filtering works over the complete set (no threshold).
		 * Fetch-more progress is visible via the base standard pagination loader
		 * (enablePaginationLoader), the UI is not blocked - the filter works as
		 * pages arrive. On a fetch-more failure we behave like
		 * a standard pagination failure (see onLoadMore/renderPaginationLoader):
		 * set hasLoadError and stop the loop so the user sees the
		 * error/retry rather than silently filtering an incomplete list.
		 * @return {Promise<void>}
		 */
		async loadAllPages()
		{
			if (this.isLoadingAllPages || this.state.hasLoadError)
			{
				return;
			}

			this.isLoadingAllPages = true;
			this.enablePaginationLoader();

			try
			{
				while (this.hasNextPage() && !this.state.hasLoadError)
				{
					// Pages are fetched strictly one after another: each request needs the
					// cursor returned by the previous page, so parallelizing is impossible.
					// eslint-disable-next-line no-await-in-loop
					await this.dataProvider.loadPage(this.getItems().length);
				}
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.loadAllPages.error`, error);
				this.setState({ hasLoadError: true });
			}
			finally
			{
				this.isLoadingAllPages = false;
				this.disablePaginationLoader();
			}
		}

		/**
		 * @desc Brings an already mounted ListView to the target set of displayed
		 * rows (getDisplayItems) via a non-destructive diff. The full participants list in
		 * state.items is not touched - it is the source of truth and the pagination base.
		 *
		 * The sidebar-v2 ListView ref has NO setItems/replaceItems - only
		 * row-level methods are available (insertRows/appendRows/prependRows/deleteRowsByKeys/
		 * updateRows), so the diff is built on them. Order is guaranteed by inserting
		 * each new row at its exact index in the target set (insertRows with
		 * elementIndex), while this.displayedItems reflects the actual list composition.
		 *
		 * Reconciles are serialized: deletion is async (deleteRowsByKeys with a callback),
		 * and between scheduling the deletion and its callback a second request may arrive
		 * (store updates during loadAllPages while search is active + onSearchTextChange).
		 * Without a guard the second pass would read a partially updated displayedItems, and
		 * the deferred callback of the first pass would insert rows at stale indices -
		 * a double insertion/broken order. Therefore, during an active pass a repeated
		 * request only sets reconcilePending, and the target set is recomputed at
		 * execution time (including in the deletion callback) rather than taken from a snapshot made in advance.
		 */
		reconcileDisplay()
		{
			if (!this.listViewRef)
			{
				return;
			}

			if (this.isReconciling)
			{
				this.reconcilePending = true;

				return;
			}

			this.isReconciling = true;
			this.runReconcilePass();
		}

		/**
		 * @desc A single reconcile pass over the current state. The target and current
		 * composition are captured here; insertion is either immediate (no deletions) or in the
		 * deletion callback via recomputation at execution time. On completion it clears the
		 * flag and, if a new request arrived during the pass, starts another one.
		 */
		runReconcilePass()
		{
			if (!this.listViewRef)
			{
				this.finishReconcilePass();

				return;
			}

			const targetItems = this.getDisplayItems();
			const currentItems = this.getDisplayedItems();

			const targetKeys = new Set(targetItems.map((item) => item.getKey()));

			const removedKeys = currentItems
				.filter((item) => !targetKeys.has(item.getKey()))
				.map((item) => item.getKey());

			// Deletion is async (deleteRowsByKeys with a callback), so insertion of
			// the missing rows is performed strictly after the deletion completes - the same
			// as the proven diff in im/messenger/lib/ui/base/list. Otherwise the insertion
			// indices could be computed before the rows are actually deleted. The target
			// set in the callback is recomputed anew - in case of state updates
			// between scheduling the deletion and its execution.
			if (removedKeys.length > 0)
			{
				this.displayedItems = this.displayedItems.filter(
					(item) => targetKeys.has(item.getKey()),
				);

				this.listViewRef.deleteRowsByKeys(removedKeys, ROWS_ANIMATION_NONE, () => {
					this.applyInsertions();
					this.finishReconcilePass();
				});

				return;
			}

			this.applyInsertions();
			this.finishReconcilePass();
		}

		/**
		 * @desc Finishes the reconcile pass: clears the flag and, if during the pass
		 * a repeated request arrived, starts another pass over the fresh state.
		 */
		finishReconcilePass()
		{
			if (this.reconcilePending)
			{
				this.reconcilePending = false;
				this.runReconcilePass();

				return;
			}

			this.isReconciling = false;
		}

		/**
		 * @desc Inserts missing rows/updates changed ones according to the current
		 * target set. The target and currentByKey are computed at call time so that
		 * insertion goes by the actual displayedItems indices rather than stale ones.
		 */
		applyInsertions()
		{
			if (!this.listViewRef)
			{
				return;
			}

			const targetItems = this.getDisplayItems();
			const currentByKey = new Map(
				this.getDisplayedItems().map((item) => [item.getKey(), item]),
			);

			this.insertMissingRows(targetItems, currentByKey);
		}

		/**
		 * @desc Inserts missing rows at their exact indices in the target set and
		 * updates changed ones. this.displayedItems on entry is a subsequence of
		 * targetItems, so left-to-right insertion preserves the original order.
		 * @param {SidebarTabListItemModel[]} targetItems
		 * @param {Map<string, SidebarTabListItemModel>} currentByKey
		 */
		insertMissingRows(targetItems, currentByKey)
		{
			if (!this.listViewRef)
			{
				return;
			}

			targetItems.forEach((targetItem, index) => {
				const displayedAtIndex = this.displayedItems[index];
				if (displayedAtIndex && displayedAtIndex.getKey() === targetItem.getKey())
				{
					const previous = currentByKey.get(targetItem.getKey());
					if (previous && !isEqual(previous.getData(), targetItem.getData()))
					{
						this.listViewRef.updateRows([targetItem.toListView()], ROWS_ANIMATION_NONE);
						this.displayedItems[index] = targetItem;
					}

					return;
				}

				this.listViewRef.insertRows([targetItem.toListView()], 0, index, ROWS_ANIMATION_NONE);
				this.displayedItems.splice(index, 0, targetItem);
			});
		}

		/**
		 * @desc Target set of displayed rows: the "Add" button (outside search) +
		 * visible participants accounting for the filter.
		 * @return {SidebarTabListItemModel[]}
		 */
		getDisplayItems()
		{
			const items = [];

			if (!this.isSearchActive() && this.permissionManager.canAddParticipants())
			{
				items.push(new SidebarTabListItemModel(this.getButton()));
			}

			items.push(...this.getVisibleItems());

			return items;
		}

		/**
		 * @desc The rows actually rendered on the native list. Synchronized
		 * on a full re-render (getListViewData) and incrementally in reconcileDisplay.
		 * @return {SidebarTabListItemModel[]}
		 */
		getDisplayedItems()
		{
			return Array.isArray(this.displayedItems) ? this.displayedItems : [];
		}

		renderErrorScreen()
		{
			return View(
				{
					testId: 'participants-error-screen',
					style: {
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				StatusBlock({
					testId: 'participants-error',
					title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_LOAD_ERROR_TITLE'),
					description: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_LOAD_ERROR_DESCRIPTION'),
					titleColor: Color.base1,
					descriptionColor: Color.base3,
					buttons: [this.renderRetryButton()],
				}),
			);
		}

		renderRetryButton()
		{
			return Button({
				testId: 'participants-error-retry',
				text: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_LOAD_ERROR_RETRY'),
				size: ButtonSize.L,
				design: ButtonDesign.OUTLINE,
				onClick: this.onRetryLoad,
			});
		}

		renderPaginationLoader()
		{
			// Fetch-more error: instead of an infinite spinner we show the retry
			// button in the loading position, keeping the already loaded rows.
			if (this.state.hasLoadError && this.getItems().length > 0)
			{
				return View(
					{
						testId: 'participants-pagination-error',
						style: {
							paddingVertical: 12,
							alignItems: 'center',
						},
					},
					this.renderRetryButton(),
				);
			}

			return super.renderPaginationLoader();
		}

		renderItem(item)
		{
			const itemContentParams = {
				...item.data,
				dialogId: this.getDialogId(),
			};

			const menu = this.createMenu(itemContentParams);

			if (menu?.shouldShowMenu())
			{
				itemContentParams.onShowMenu = this.handleOnShowMenu({ menu, item });
			}

			return itemFactory(itemContentParams);
		}

		getListViewData()
		{
			// getListViewData is called on a full (re)build of the native list
			// (mount and setState), so here we also record the actually rendered
			// row composition for the subsequent incremental diff reconcileDisplay.
			const items = this.getDisplayItems();
			this.displayedItems = [...items];

			return [{ items: items.map((item) => item.toListView()) }];
		}

		/**
		 * @desc Visible participants: when search is active - filtered by name and
		 * position case-insensitively, preserving the original order
		 * (parity with web search).
		 * @return {SidebarTabListItemModel[]}
		 */
		getVisibleItems()
		{
			if (!this.isSearchActive())
			{
				return this.getItems();
			}

			return SidebarParticipantsTabContent.filterParticipants(
				this.getItems(),
				this.state.searchText,
				(userId) => this.getUserName(userId),
				(userId) => this.getUserPosition(userId),
			);
		}

		/**
		 * @return {boolean}
		 */
		isSearchActive()
		{
			return Type.isStringFilled(this.state.searchText);
		}

		/**
		 * @param {number} userId
		 * @return {string}
		 */
		getUserName(userId)
		{
			const user = this.store.getters['usersModel/getById'](userId);

			return Type.isStringFilled(user?.name) ? user.name : '';
		}

		/**
		 * @param {number} userId
		 * @return {string}
		 */
		getUserPosition(userId)
		{
			const user = this.store.getters['usersModel/getById'](userId);

			return Type.isStringFilled(user?.workPosition) ? user.workPosition : '';
		}

		requestCollapseHeader()
		{
			if (Type.isFunction(this.props.onRequestCollapseHeader))
			{
				this.props.onRequestCollapseHeader();
			}
		}

		requestExpandHeader()
		{
			if (Type.isFunction(this.props.onRequestExpandHeader))
			{
				this.props.onRequestExpandHeader();
			}
		}

		getButton()
		{
			return {
				id: ParticipantType.button,
				type: ParticipantType.button,
			};
		}

		getItemsFromStore()
		{
			const {
				type,
				dialogId,
				participants,
				hasNextPage = true,
			} = this.getDialogModel();

			const result = {
				items: null,
				hasNextPage,
			};

			if (!Type.isArray(participants) || isEmpty(participants))
			{
				return result;
			}

			if (this.isGroupDialog())
			{
				const visibleParticipants = type === DialogType.copilot
					? participants
					: SidebarParticipantsTabContent.filterHiddenBots(
						participants,
						(userId) => this.store.getters['usersModel/getById'](userId),
					);

				result.items = this.convertToSortedList(visibleParticipants);
			}
			else if (type === DialogType.user)
			{
				result.items = this.convertToSortedList([
					Number(dialogId),
					this.getCurrentUserId(),
				]);
			}

			return result;
		}

		/**
		 * @desc Filters hidden bots out of the participants list.
		 * Pure function: the user getter is injected as a parameter.
		 * @param {Array<number>} participantIds
		 * @param {function(number): (object|undefined)} getUser
		 * @return {Array<number>}
		 */
		static filterHiddenBots(participantIds, getUser)
		{
			if (!Array.isArray(participantIds))
			{
				return [];
			}

			return participantIds.filter((userId) => {
				const user = getUser(userId);

				return user?.botData?.isHidden !== true;
			});
		}

		/**
		 * @desc Filters participants by name and position case-insensitively, preserving
		 * the original order. Pure function: name and position are injected via resolvers.
		 * @param {SidebarTabListItemModel[]} items
		 * @param {string} searchText
		 * @param {function(number): string} getUserName
		 * @param {function(number): string} [getUserPosition]
		 * @return {SidebarTabListItemModel[]}
		 */
		static filterParticipants(items, searchText, getUserName, getUserPosition)
		{
			if (!Array.isArray(items))
			{
				return [];
			}

			const query = String(searchText ?? '').trim().toLowerCase();
			if (query === '')
			{
				return items;
			}

			return items.filter((item) => {
				const name = String(getUserName(item.getId()) ?? '').toLowerCase();
				const position = String(getUserPosition?.(item.getId()) ?? '').toLowerCase();

				return name.includes(query) || position.includes(query);
			});
		}

		getDialogId()
		{
			const { dialogId } = this.getDialog();

			return dialogId;
		}

		getDialog()
		{
			const { dialog } = this.props;

			return dialog;
		}

		getCurrentUserId()
		{
			return MessengerParams.getUserId();
		}

		isGroupDialog()
		{
			return DialogHelper.isDialogId(this.getDialogId());
		}

		convertToSortedList(participants)
		{
			return SidebarParticipantsTabContent.convertToSortedList(
				participants,
				(userId) => this.createListItemModel(userId),
			);
		}

		/**
		 * @desc Maps participant ids to a list of row models, preserving order.
		 * Pure function: the model constructor is injected as a parameter.
		 * @param {Array<number>} participants
		 * @param {function(number): SidebarTabListItemModel} createModel
		 * @return {SidebarTabListItemModel[]}
		 */
		static convertToSortedList(participants, createModel)
		{
			if (!Array.isArray(participants))
			{
				return [];
			}

			return participants.map((userId) => createModel(userId));
		}

		createListItemModel(userId)
		{
			const model = modelFactory({
				userId,
				dialogId: this.getDialogId(),
			});

			return new SidebarTabListItemModel(model.getData());
		}

		handleOnShowMenu = ({ menu, item }) => ({ ref }) => {
			this.showItemContextMenu(ref, item.id, menu?.getActions);
		};

		getDialogModel()
		{
			return this.store.getters['dialoguesModel/getById'](this.getDialogId());
		}
	}

	module.exports = { SidebarParticipantsTabContent };
});
