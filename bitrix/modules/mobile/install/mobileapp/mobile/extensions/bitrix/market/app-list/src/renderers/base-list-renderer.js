/**
 * @module market/app-list/src/renderers/base-list-renderer
 */
jn.define('market/app-list/src/renderers/base-list-renderer', (require, exports, module) => {
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const { Color, Component, Indent } = require('tokens');
	const { LoadingScreen } = require('layout/ui/loading-screen');
	const { StatefulList } = require('layout/ui/stateful-list');
	const { Area } = require('ui-system/layout/area');
	const { Box } = require('ui-system/layout/box');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { H4 } = require('ui-system/typography/heading');
	const { Text5 } = require('ui-system/typography/text');
	const { MarketEmptyState } = require('market/empty-state');
	const {
		ListItemsFactory: MarketListItemsFactory,
		ListItemType: MarketListItemType,
	} = require('market/app-list-item/factory');
	const {
		DEFAULT_ITEMS_LOAD_LIMIT,
		STATEFUL_LIST_CACHE_TTL,
	} = require('market/app-list/src/providers/base-list-provider');

	const CONTENT_SIDE_PADDING = Component.paddingLr.toNumber();
	const CONTENT_BOTTOM_PADDING = Indent.XL4.toNumber();
	const DEFAULT_PULL_CONFIG = Object.freeze({});
	const DEFAULT_SORTING_CONFIG = Object.freeze({});

	class BaseListRenderer extends LayoutComponent
	{
		constructor(props, provider)
		{
			super(props);

			this.provider = provider;
			this.getTestId = createTestIdGenerator({
				prefix: props.testId || 'market-list',
			});
			this.statefulListRef = null;
			const initialData = this.prepareInitialData(props.initialData);

			this.state = {
				isLoading: false,
				loadError: false,
				listData: initialData,
				currentSortOrder: this.provider.normalizeSortOrder(initialData?.sortInfo?.current?.value),
			};

			this.statefulListItemsLoadLimit = DEFAULT_ITEMS_LOAD_LIMIT;
		}

		componentWillReceiveProps(props)
		{
			this.provider.setParams(props);
		}

		prepareInitialData(data = null)
		{
			if (data && typeof data === 'object' && !Array.isArray(data))
			{
				return data;
			}

			return null;
		}

		componentDidMount()
		{
			this.syncHeaderState();
		}

		componentDidUpdate(prevProps, prevState)
		{
			if (
				prevState.listData !== this.state.listData
				|| prevState.isLoading !== this.state.isLoading
				|| prevState.loadError !== this.state.loadError
				|| prevState.currentSortOrder !== this.state.currentSortOrder
				|| prevProps.hideHeader !== this.props.hideHeader
			)
			{
				this.syncHeaderState();
			}
		}

		getProvider()
		{
			return this.provider;
		}

		getParentWidget()
		{
			return this.props.layout ?? PageManager;
		}

		syncHeaderState()
		{
			this.updateWidgetHeader();
			this.notifyHeaderUpdate();
		}

		notifyHeaderUpdate()
		{
			if (typeof this.props.onHeaderUpdate === 'function')
			{
				this.props.onHeaderUpdate(this.getHeaderConfig());
			}
		}

		getHeaderConfig()
		{
			return {
				title: this.getHeaderTitle(),
				showSortMenu: this.shouldShowSortMenu(),
			};
		}

		updateWidgetHeader()
		{
			if (this.isHeaderHidden())
			{
				return;
			}

			const widget = this.props.layout;
			if (!widget)
			{
				return;
			}

			if (typeof widget?.setTitle === 'function')
			{
				widget.setTitle({
					text: this.getHeaderTitle(),
				}, true);
			}

			this.setBackdropLeftButtons(widget);

			if (typeof widget?.setRightButtons === 'function')
			{
				widget.setRightButtons(this.getHeaderRightButtons());
			}
		}

		setBackdropLeftButtons(widget)
		{
			widget.setLeftButtons?.([
				{
					type: 'back',
					callback: () => {
						if (this.isNested() && typeof widget.back === 'function')
						{
							widget.back();

							return;
						}

						widget.close();
					},
				},
			]);
		}

		getHeaderRightButtons()
		{
			return [];
		}

		getListType()
		{
			return this.getProvider().getListType();
		}

		getDefaultData()
		{
			return this.getProvider().getDefaultListData();
		}

		getListData()
		{
			return this.state.listData ?? this.getDefaultData();
		}

		getHeaderTitle()
		{
			return this.getListData().title || Loc.getMessage('MOBILE_MARKET_LIST_DEFAULT_TITLE');
		}

		getSortInfo()
		{
			return this.getListData().sortInfo ?? null;
		}

		getCurrentSortOrder()
		{
			return this.getProvider().normalizeSortOrder(
				this.state.currentSortOrder ?? this.getSortInfo()?.current?.value,
			);
		}

		shouldShowSortMenu()
		{
			return false;
		}

		isHeaderHidden()
		{
			return this.props.hideHeader === true;
		}

		isTabsBarHidden()
		{
			return this.props.hideTabsBar === true;
		}

		isNested()
		{
			return this.props.isNested === true;
		}

		renderTabsBar()
		{
			return null;
		}

		getStatefulListCacheName(sortOrder = this.getCurrentSortOrder())
		{
			return this.getProvider().getCacheName({ sortOrder });
		}

		getStatefulListActionName()
		{
			return this.getProvider().getActionName();
		}

		getStatefulListActionParams()
		{
			return this.getProvider().getActionParams({
				order: this.getCurrentSortOrder(),
			});
		}

		bindStatefulListRef = (ref) => {
			this.statefulListRef = ref;
		};

		reloadStatefulList()
		{
			this.statefulListRef?.reload();
		}

		getEmptyState()
		{
			const listEmptyState = this.getListData().emptyState ?? null;
			const title = String(listEmptyState?.title ?? '').trim();
			if (title)
			{
				return {
					title,
					description: String(listEmptyState?.description ?? '').trim(),
				};
			}

			return {
				title: Loc.getMessage('MOBILE_MARKET_LIST_EMPTY_TITLE'),
				description: '',
			};
		}

		getUnavailableState()
		{
			const listUnavailableState = this.getListData().unavailableState ?? null;
			const title = String(listUnavailableState?.title ?? '').trim();
			if (title)
			{
				return {
					title,
					description: String(listUnavailableState?.description ?? '').trim(),
				};
			}

			return {
				title: Loc.getMessage('MOBILE_MARKET_LIST_UNAVAILABLE_FALLBACK_TITLE'),
				description: Loc.getMessage('MOBILE_MARKET_LIST_UNAVAILABLE_FALLBACK_DESCRIPTION'),
			};
		}

		handleRefresh = () => {
			this.reloadStatefulList();
		};

		handleItemClick = () => {};

		handleItemActionClick = (itemId, itemData = null) => {
			this.handleItemClick(itemId, itemData);
		};

		handleStatefulListItemsLoaded = (responseData = null) => {
			if (!responseData)
			{
				return;
			}

			const currentListData = this.getListData();
			const nextListData = this.getProvider().mergeLoadedListData(currentListData, responseData);
			if (!this.getProvider().isListMetadataChanged(currentListData, nextListData))
			{
				return;
			}

			this.setState({
				listData: nextListData,
				currentSortOrder: this.getProvider().normalizeSortOrder(nextListData?.sortInfo?.current?.value),
			});
		};

		prepareStatefulListItems = (items = []) => {
			return items.map((item, index) => ({
				...item,
				isLast: index === items.length - 1,
			}));
		};

		renderStatefulListEmptyComponent = () => {
			if (!this.getListData().isAvailable)
			{
				const unavailableState = this.getUnavailableState();

				return this.renderState({
					title: unavailableState.title,
					description: unavailableState.description,
					testIdSuffix: 'unavailable',
					actionText: Loc.getMessage('MOBILE_MARKET_LIST_RETRY'),
				});
			}

			const emptyState = this.getEmptyState();

			return MarketEmptyState({
				testId: this.getTestId('empty'),
				title: emptyState.title,
				description: emptyState.description,
			});
		};

		isAllStatefulListItemsLoaded = ({ response, items = [], itemsLoadLimit = DEFAULT_ITEMS_LOAD_LIMIT }) => {
			return this.getProvider().isAllItemsLoaded({
				response,
				items,
				itemsLoadLimit,
			});
		};

		getListItemType()
		{
			return MarketListItemType.MARKET;
		}

		getStatefulListPullConfig()
		{
			return DEFAULT_PULL_CONFIG;
		}

		getStatefulListSortingConfig()
		{
			return DEFAULT_SORTING_CONFIG;
		}

		render()
		{
			const { isLoading, listData } = this.state;

			if (isLoading && !listData)
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
					LoadingScreen({
						testId: this.getTestId('loading'),
					}),
				);
			}

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
				return this.renderState({
					title: Loc.getMessage('MOBILE_MARKET_LIST_LOAD_ERROR_TITLE'),
					description: Loc.getMessage('MOBILE_MARKET_LIST_LOAD_ERROR_DESCRIPTION'),
					testIdSuffix: 'error',
					actionText: Loc.getMessage('MOBILE_MARKET_LIST_RETRY'),
				});
			}

			if (isLoading)
			{
				return View(
					{
						style: {
							flex: 1,
						},
					},
					this.renderTabsBar(),
					this.renderItemsSection(
						LoadingScreen({
							testId: this.getTestId('loading-inline'),
						}),
					),
				);
			}

			if (!listData.isAvailable)
			{
				const unavailableState = this.getUnavailableState();

				return this.renderState({
					title: unavailableState.title,
					description: unavailableState.description,
					testIdSuffix: 'unavailable',
					actionText: Loc.getMessage('MOBILE_MARKET_LIST_RETRY'),
				});
			}

			return View(
				{
					style: {
						flex: 1,
					},
				},
				this.renderTabsBar(),
				this.renderItemsSection(this.renderItems()),
			);
		}

		resetTitleLoader = () => {};

		renderItems()
		{
			return new StatefulList({
				testId: this.getTestId('stateful-list'),
				layout: this.getParentWidget(),
				ref: this.bindStatefulListRef,
				jsonEnabled: true,
				needInitMenu: false,
				isShowFloatingButton: false,
				pull: this.getStatefulListPullConfig(),
				sortingConfig: this.getStatefulListSortingConfig(),
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
				itemType: this.getListItemType(),
				itemFactory: MarketListItemsFactory,
				itemsLoadLimit: this.statefulListItemsLoadLimit,
				itemParams: {
					contentBottomPadding: CONTENT_BOTTOM_PADDING,
					actionButtonClickHandler: this.handleItemActionClick,
				},
				itemDetailOpenHandler: this.handleItemClick,
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

		renderState({ title, description, testIdSuffix, actionText = '' })
		{
			const hasAction = Boolean(actionText);

			return View(
				{
					testId: this.getTestId(testIdSuffix),
					style: {
						flex: 1,
						paddingHorizontal: CONTENT_SIDE_PADDING,
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				H4({
					testId: this.getTestId(`${testIdSuffix}-title`),
					text: title,
					style: {
						textAlign: 'center',
					},
				}),
				Text5({
					testId: this.getTestId(`${testIdSuffix}-description`),
					text: description,
					color: Color.base3,
					style: {
						marginTop: Indent.M.toNumber(),
						textAlign: 'center',
					},
				}),
				hasAction
					? Button({
						testId: this.getTestId(`${testIdSuffix}-action`),
						text: actionText,
						design: ButtonDesign.OUTLINE_ACCENT_2,
						size: ButtonSize.M,
						style: {
							marginTop: Indent.XL.toNumber(),
						},
						onClick: this.handleRefresh,
					})
					: null,
			);
		}
	}

	module.exports = {
		BaseListRenderer,
	};
});
