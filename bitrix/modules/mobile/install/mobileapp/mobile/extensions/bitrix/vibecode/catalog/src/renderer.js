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
			this.state = {
				listData: this.prepareInitialData(props.initialData),
				isLoading: false,
				loadError: false,
				searchQuery: this.searchController.getInitialSearchQuery(props),
				catalogState: this.provider.getState(),
				listItemsCount: null,
			};
		}

		componentDidMount()
		{
			this.headerController.syncHeaderState();
			this.headerController.syncCreateButtonState();
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
			this.headerController.dispose();
			this.searchController.unbindSearchBar();
			this.itemActionsController.dispose();
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
			const nextCatalogState = this.provider.normalizeState(catalogState);
			if (nextCatalogState === this.getCatalogState())
			{
				return;
			}

			this.setState({
				catalogState: nextCatalogState,
				listItemsCount: null,
			}, () => {
				this.reloadStatefulList();
			});
		};

		handleStatefulListItemsLoaded = (responseData = null, renderType = null, config = {}) => {
			if (!responseData)
			{
				return;
			}

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
