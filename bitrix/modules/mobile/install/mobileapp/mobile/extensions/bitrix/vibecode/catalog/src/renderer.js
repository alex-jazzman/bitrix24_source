/**
 * @module vibecode/catalog/src/renderer
 */
jn.define('vibecode/catalog/src/renderer', (require, exports, module) => {
	const { Loc } = require('loc');
	const { dispatch } = require('statemanager/redux/store');
	const { fetchUsersIfNotLoaded } = require('statemanager/redux/slices/users/thunk');
	const { isEqual } = require('utils/object');
	const { createTestIdGenerator } = require('utils/test');
	const { Color } = require('tokens');
	const { LoadingScreen } = require('layout/ui/loading-screen');
	const { StatefulList } = require('layout/ui/stateful-list');
	const { Area } = require('ui-system/layout/area');
	const { Box } = require('ui-system/layout/box');
	const {
		VibeCodeCatalogEmptyAppsState,
	} = require('vibecode/catalog/src/empty-states/empty-apps-state');
	const {
		VibeCodeCatalogHiddenEmptyState,
	} = require('vibecode/catalog/src/empty-states/hidden-empty-state');
	const {
		VibeCodeCatalogSearchEmptyState,
	} = require('vibecode/catalog/src/empty-states/search-empty-state');
	const { renderVibeCodeCatalogState } = require('vibecode/catalog/src/empty-states/state');
	const {
		DEFAULT_ITEMS_LOAD_LIMIT,
		STATEFUL_LIST_CACHE_TTL,
		VibeCodeCatalogProvider,
	} = require('vibecode/catalog/src/provider');
	const {
		CATALOG_STATE,
		CONTENT_BOTTOM_PADDING,
		VIBECODE_ITEM_TYPE,
		VIBECODE_PULL_CONFIG,
	} = require('vibecode/catalog/src/const');
	const { VibeCodeCatalogHeaderController } = require('vibecode/catalog/src/header-controller');
	const { VibeCodeCatalogItemActionsController } = require('vibecode/catalog/src/item-actions-controller');
	const { VibeCodeCatalogItemsFactory } = require('vibecode/catalog/src/items-factory');
	const { VibeCodeCatalogSearchController } = require('vibecode/catalog/src/search-controller');
	const { normalizePositiveInteger } = require('vibecode/catalog/src/utils');

	const STATEFUL_LIST_AJAX_RENDER_TYPE = 'ajax';

	class VibeCodeCatalogRenderer extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.provider = new VibeCodeCatalogProvider(props);
			this.getTestId = createTestIdGenerator({
				prefix: props.testId || 'vibecode-catalog',
			});
			this.searchController = new VibeCodeCatalogSearchController(this);
			this.headerController = new VibeCodeCatalogHeaderController(this);
			this.itemActionsController = new VibeCodeCatalogItemActionsController(this);
			this.statefulListRef = null;
			this.statefulListCacheName = this.provider.getCacheName();
			this.statefulListReloadToken = 0;
			this.newAppsCount = 0;
			this.newAppsCountRequest = null;
			const initialSearchQuery = this.searchController.getInitialSearchQuery(props);
			// a catalog opened with a search is not a fresh open: the switch has nothing to offer
			// here, and clearing that query must not hand the attempt back
			this.autoSwitchDone = initialSearchQuery !== '';
			this.userPickedState = false;
			this.newAppsViewSession = null;
			this.state = {
				listData: this.prepareInitialData(props.initialData),
				isLoading: false,
				loadError: false,
				searchQuery: initialSearchQuery,
				catalogState: this.provider.getState(),
				listItemsCount: null,
			};
		}

		componentDidMount()
		{
			this.headerController.syncHeaderState();
			this.headerController.syncCreateButtonState();
			BX.addCustomEvent('onAppActive', this.handleAppActive);
		}

		componentWillReceiveProps(props)
		{
			this.provider.setParams(this.getProviderParams(props));
		}

		componentDidUpdate(prevProps, prevState)
		{
			if (
				!isEqual(prevState.listData, this.state.listData)
				|| prevState.isLoading !== this.state.isLoading
				|| prevState.loadError !== this.state.loadError
				|| prevState.listItemsCount !== this.state.listItemsCount
				|| prevState.catalogState !== this.state.catalogState
				|| prevProps.hideHeader !== this.props.hideHeader
			)
			{
				this.headerController.syncHeaderState();
				this.headerController.syncCreateButtonState();
			}
		}

		componentWillUnmount()
		{
			BX.removeCustomEvent('onAppActive', this.handleAppActive);
			this.headerController.dispose();
			this.searchController.unbindSearchBar();
			this.itemActionsController.dispose();
		}

		handleAppActive = () => {
			this.refreshNewAppsCount();
		};

		getNewAppsCount()
		{
			return this.newAppsCount;
		}

		refreshNewAppsCount()
		{
			this.syncProviderParams();
			const request = this.getProvider().getNewAppsCount();
			this.newAppsCountRequest = request;

			void request
				.then((count) => {
					if (this.newAppsCountRequest === request)
					{
						this.newAppsCount = count;
						this.newAppsCountRequest = null;
					}
				})
				.catch((error) => {
					console.error('[vibecode/catalog] failed to load new apps count', error);

					if (this.newAppsCountRequest === request)
					{
						this.newAppsCountRequest = null;
					}
				})
			;
		}

		autoSwitchToNewApps(responseData = {}, config = {})
		{
			if (this.autoSwitchDone || this.userPickedState)
			{
				return;
			}

			// the attempt is spent by the first actual list response, a search one included:
			// clearing the query is when the user waits for the full list back, not for the
			// screen to switch. A partial response by ids, how pull updates arrive, carries
			// no navigation and must not spend the attempt
			if (!config?.navigation || Number(config.navigation.page ?? 1) !== 1)
			{
				return;
			}

			this.autoSwitchDone = true;

			// the switch itself is still decided by the counter, and the server sends none
			// for a search query
			if (this.getSearchQuery() !== ''
				|| !Number.isInteger(Number(responseData?.newAppsCount ?? NaN))
				|| this.newAppsCount <= 0
				|| this.getCatalogState() !== CATALOG_STATE.ACTIVE)
			{
				return;
			}

			// the view session of this response was taken before the shown page was marked as viewed
			this.setNewAppsViewSession(responseData?.viewSession);
			// this very response is drawn right after the callback returns, so the switch steps
			// out of the callback — otherwise the Active slice flashes before New. The state is
			// re-checked inside: the user may pick a selection while the timer is pending, and
			// the switch must not override that choice
			setTimeout(() => {
				if (this.userPickedState || this.getCatalogState() !== CATALOG_STATE.ACTIVE)
				{
					return;
				}

				this.changeCatalogState(CATALOG_STATE.NEW);
			}, 0);
		}

		// the search response may never reach the callback: clearing the query starts another
		// request, and the list drops the answer of the previous one. So the attempt is spent by
		// the search itself, not by waiting for what the search returns
		spendAutoSwitchOnSearch()
		{
			if (this.getSearchQuery() !== '')
			{
				this.autoSwitchDone = true;
			}
		}

		prepareInitialData(data = null)
		{
			if (data && typeof data === 'object' && !Array.isArray(data))
			{
				return data;
			}

			return null;
		}

		getProvider()
		{
			return this.provider;
		}

		getParentWidget()
		{
			return this.props.layout ?? PageManager;
		}

		getHeaderWidget()
		{
			return this.props.headerLayout ?? this.getParentWidget();
		}

		getListData()
		{
			return this.state.listData ?? this.getProvider().getDefaultListData();
		}

		getHeaderTitle()
		{
			return Loc.getMessage('MOBILE_VIBECODE_CATALOG_TITLE_TEXT');
		}

		isHeaderHidden()
		{
			return this.props.hideHeader === true;
		}

		isNested()
		{
			return this.props.isNested === true;
		}

		getSearchQuery()
		{
			return this.searchController.getSearchQuery();
		}

		getCatalogState()
		{
			return this.provider.normalizeState(this.state.catalogState);
		}

		getProviderParams(props = this.props)
		{
			return {
				...props,
				q: this.getSearchQuery(),
				state: this.getCatalogState(),
				viewSession: this.newAppsViewSession,
			};
		}

		syncProviderParams()
		{
			this.getProvider().setParams(this.getProviderParams());
		}

		getStatefulListCacheName()
		{
			this.syncProviderParams();

			return this.getProvider().getCacheName();
		}

		getStatefulListActionName()
		{
			return this.getProvider().getActionName();
		}

		getStatefulListActionParams()
		{
			this.syncProviderParams();

			return this.getProvider().getActionParams();
		}

		reloadStatefulList()
		{
			const statefulList = this.statefulListRef;
			if (!statefulList)
			{
				return;
			}

			const cacheName = this.getStatefulListCacheName();
			const shouldUseCache = this.statefulListCacheName !== cacheName;
			const loadItemsActionParams = this.getStatefulListActionParams();
			this.statefulListReloadToken += 1;
			const actionParams = {
				loadItems: {
					...loadItemsActionParams,
					extra: {
						...(loadItemsActionParams.extra ?? {}),
						vibecodeReloadToken: this.statefulListReloadToken,
					},
				},
			};

			statefulList.state.actionParams = actionParams;
			if (statefulList.props)
			{
				statefulList.props.cacheName = cacheName;
			}

			statefulList.reload(
				{
					actionParams,
				},
				{
					useCache: shouldUseCache,
				},
			);
			this.statefulListCacheName = cacheName;
		}

		bindStatefulListRef = (ref) => {
			this.statefulListRef = ref;
		};

		handleRefresh = () => {
			this.reloadStatefulList();
		};

		handleCatalogStateChange = (catalogState) => {
			this.userPickedState = true;
			this.changeCatalogState(catalogState);
		};

		changeCatalogState(catalogState)
		{
			const nextCatalogState = this.provider.normalizeState(catalogState);
			if (nextCatalogState === this.getCatalogState())
			{
				return;
			}

			// the view session belongs to the whole catalog session: dropping it here would
			// restart the session on the way back to New and pull the apps just shown in
			// another slice into it
			this.setState({
				catalogState: nextCatalogState,
				listItemsCount: null,
			}, () => {
				this.reloadStatefulList();
			});
		}

		handleStatefulListItemsLoaded = (responseData = null, renderType = null, config = {}) => {
			if (!responseData)
			{
				return;
			}

			this.handleNewAppsResponseMeta(responseData, renderType, config);
			this.onStatefulListItemsLoaded(responseData, config);

			const currentListData = this.getListData();
			const nextListData = this.getProvider().mergeLoadedListData(currentListData, responseData);
			if (!this.getProvider().isListMetadataChanged(currentListData, nextListData))
			{
				return;
			}

			this.setState({
				listData: nextListData,
			});
		};

		handleNewAppsResponseMeta(responseData = {}, renderType = null, config = {})
		{
			// a cached response carries the new apps state of the previous catalog session,
			// it must not be reused
			if (renderType !== STATEFUL_LIST_AJAX_RENDER_TYPE)
			{
				return;
			}

			this.updateNewAppsCount(responseData);
			this.updateNewAppsViewSession(responseData);
			this.autoSwitchToNewApps(responseData, config);
		}

		// the counter comes with the first page only, a page without it says nothing about the count
		updateNewAppsCount(responseData = {})
		{
			const count = Number(responseData?.newAppsCount ?? NaN);
			if (!Number.isInteger(count))
			{
				return;
			}

			this.newAppsCount = Math.max(count, 0);
			// the listing is the fresher of the two sources, so a count request still in flight
			// must not land on top of it
			this.newAppsCountRequest = null;
		}

		updateNewAppsViewSession(responseData = {})
		{
			const viewSession = normalizePositiveInteger(responseData?.viewSession);
			if (viewSession === null)
			{
				return;
			}

			// A stamp we sent has been judged by the server, and it only travels in the New
			// slice: answering with another one there means ours is no longer accepted, so its
			// value wins. Outside New nothing was sent, so an arriving stamp only fills an
			// empty slot instead of restarting the session under the user.
			const canReplaceSession = this.newAppsViewSession === null
				|| this.getCatalogState() === CATALOG_STATE.NEW;
			if (!canReplaceSession)
			{
				return;
			}

			this.setNewAppsViewSession(viewSession);

			const loadItemsActionParams = this.statefulListRef?.state?.actionParams?.loadItems;
			if (loadItemsActionParams)
			{
				loadItemsActionParams.viewSession = this.newAppsViewSession;
			}
		}

		setNewAppsViewSession(viewSession = null)
		{
			this.newAppsViewSession = normalizePositiveInteger(viewSession);
			this.syncProviderParams();
		}

		onStatefulListItemsLoaded(responseData = {}, config = {})
		{
			this.preloadOwners(responseData?.items);
			this.updateListItemsCount(responseData, config);
		}

		updateListItemsCount(responseData = {}, config = {})
		{
			const responseItems = Array.isArray(responseData?.items) ? responseData.items : [];
			const currentItems = Array.isArray(this.statefulListRef?.state?.items)
				? this.statefulListRef.state.items
				: []
			;
			const isFirstPage = Number(config?.navigation?.page ?? 1) === 1;
			const listItemsCount = isFirstPage
				? responseItems.length
				: Math.max(currentItems.length, responseItems.length)
			;

			if (listItemsCount !== this.state.listItemsCount)
			{
				this.setState({ listItemsCount });
			}
		}

		setListItemsCount(listItemsCount)
		{
			if (listItemsCount !== this.state.listItemsCount)
			{
				this.setState({ listItemsCount });
			}
		}

		preloadOwners(items = [])
		{
			const ownerIds = [...new Set(
				(Array.isArray(items) ? items : [])
					.map((item) => normalizePositiveInteger(item?.owner?.id))
					.filter((ownerId) => ownerId !== null),
			)];

			if (ownerIds.length === 0)
			{
				return;
			}

			void dispatch(fetchUsersIfNotLoaded({ userIds: ownerIds })).catch(console.error);
		}

		prepareStatefulListItems = (items = []) => {
			return items.map((item, index) => ({
				...item,
				isLast: index === items.length - 1,
				isNextPinned: items[index + 1]?.isPinned === true,
			}));
		};

		isAllStatefulListItemsLoaded = ({ response, items = [], itemsLoadLimit = DEFAULT_ITEMS_LOAD_LIMIT }) => {
			return this.getProvider().isAllItemsLoaded({
				response,
				items,
				itemsLoadLimit,
			});
		};

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					safeArea: {
						top: false,
						bottom: true,
					},
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				this.renderContent(),
			);
		}

		renderContent()
		{
			const { loadError, isLoading } = this.state;
			const listData = this.getListData();

			if (loadError)
			{
				return renderVibeCodeCatalogState({
					testId: this.getTestId('error'),
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_LOAD_ERROR_TITLE'),
					description: Loc.getMessage('MOBILE_VIBECODE_CATALOG_LOAD_ERROR_DESCRIPTION'),
					actionText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_RETRY'),
					onActionClick: this.handleRefresh,
				});
			}

			if (isLoading)
			{
				return this.renderItemsSection(
					LoadingScreen({
						testId: this.getTestId('loading-inline'),
					}),
				);
			}

			if (!listData.isAvailable)
			{
				return renderVibeCodeCatalogState({
					testId: this.getTestId('unavailable'),
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_UNAVAILABLE_TITLE'),
					actionText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_RETRY'),
					onActionClick: this.handleRefresh,
				});
			}

			return this.renderItemsSection(this.renderItems());
		}

		resetTitleLoader = () => {};

		renderItems()
		{
			return new StatefulList({
				testId: this.getTestId('stateful-list'),
				layout: this.getParentWidget(),
				ref: this.bindStatefulListRef,
				jsonEnabled: false,
				needInitMenu: false,
				isShowFloatingButton: false,
				pull: VIBECODE_PULL_CONFIG,
				cacheName: this.getStatefulListCacheName(),
				ajaxCacheTtl: STATEFUL_LIST_CACHE_TTL,
				showTitleLoader: this.resetTitleLoader,
				hideTitleLoader: this.resetTitleLoader,
				actions: {
					loadItems: this.getStatefulListActionName(),
				},
				actionParams: {
					loadItems: this.getStatefulListActionParams(),
				},
				actionCallbacks: {
					loadItems: this.handleStatefulListItemsLoaded,
				},
				itemType: VIBECODE_ITEM_TYPE,
				itemFactory: VibeCodeCatalogItemsFactory,
				itemsLoadLimit: DEFAULT_ITEMS_LOAD_LIMIT,
				itemParams: {
					contentBottomPadding: CONTENT_BOTTOM_PADDING,
					actionButtonClickHandler: this.itemActionsController.handleItemActionClick,
					itemLongClickHandler: this.itemActionsController.handleItemLongClick,
				},
				itemDetailOpenHandler: this.itemActionsController.handleItemClick,
				onBeforeItemsRender: this.prepareStatefulListItems,
				getEmptyListComponent: this.renderStatefulListEmptyComponent,
				isAllItemsLoaded: this.isAllStatefulListItemsLoaded,
			});
		}

		renderItemsSection(content)
		{
			return Area(
				{
					testId: this.getTestId('items-area'),
					excludePaddingSide: {
						horizontal: true,
						bottom: true,
					},
					style: {
						flex: 1,
					},
				},
				View(
					{
						style: {
							flex: 1,
						},
					},
					content,
				),
			);
		}

		renderStatefulListEmptyComponent = () => {
			if (!this.getListData().isAvailable)
			{
				return renderVibeCodeCatalogState({
					testId: this.getTestId('unavailable'),
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_UNAVAILABLE_TITLE'),
					actionText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_RETRY'),
					onActionClick: this.handleRefresh,
				});
			}

			if (this.getSearchQuery())
			{
				return VibeCodeCatalogSearchEmptyState({
					testId: this.getTestId('empty'),
				});
			}

			if (this.getCatalogState() === CATALOG_STATE.HIDDEN)
			{
				return VibeCodeCatalogHiddenEmptyState({
					testId: this.getTestId('empty'),
				});
			}

			if (this.getCatalogState() === CATALOG_STATE.NEW)
			{
				return renderVibeCodeCatalogState({
					testId: this.getTestId('empty'),
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_NEW_EMPTY_TITLE'),
				});
			}

			return VibeCodeCatalogEmptyAppsState({
				testId: this.getTestId('empty'),
				onActionClick: this.headerController.handleCreateButtonClick,
			});
		};
	}

	module.exports = {
		VibeCodeCatalogRenderer,
	};
});
