/**
 * @module market/search
 */

jn.define('market/search', (require, exports, module) => {
	const { Loc } = require('loc');
	const { requireLazy } = require('require-lazy');
	const { transparent } = require('utils/color');
	const { debounce } = require('utils/function');
	const { createTestIdGenerator } = require('utils/test');
	const { getActionErrors } = require('market/utils');
	const { Color, Component, Corner, Indent } = require('tokens');
	const { LoadingScreen } = require('layout/ui/loading-screen');
	const { UIScrollView } = require('layout/ui/scroll-view');
	const { StatefulList } = require('layout/ui/stateful-list');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { H4 } = require('ui-system/typography/heading');
	const { TextField } = require('ui-system/typography/text-field');
	const { Text5 } = require('ui-system/typography/text');
	const { MarketSearchCatalogItem } = require('market/search-catalog-item');
	const { MarketEmptyState } = require('market/empty-state');
	const { ListItemsFactory: MarketListItemsFactory, ListItemType: MarketListItemType } = require('market/app-list-item/factory');

	const CONTENT_SIDE_PADDING = Component.paddingLr.toNumber();
	const SEARCH_BAR_PADDING_HORIZONTAL = Indent.XL2.toNumber();
	const SEARCH_BAR_PADDING_VERTICAL = Indent.XS.toNumber();
	const SEARCH_BAR_HEIGHT = 36;
	const SEARCH_BAR_BORDER_RADIUS = Corner.M.toNumber();
	const SEARCH_BAR_INNER_PADDING_VERTICAL = Indent.M.toNumber();
	const SEARCH_BAR_INNER_PADDING_HORIZONTAL = Indent.L.toNumber();
	const SEARCH_BAR_ICON_SIZE = 22;
	const SEARCH_BAR_ICON_MARGIN_RIGHT = Indent.S.toNumber();
	const CONTENT_BOTTOM_PADDING = Indent.XL4.toNumber();
	const MIN_SEARCH_QUERY_LENGTH = 3;
	const SEARCH_DEBOUNCE_DELAY = 500;

	class MarketSearch extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId || 'market-search',
			});
			this.categoryClickHandlers = new Map();
			this.handleNoop = () => {};
			this.isUnmounted = false;

			this.state = {
				query: '',
				activeQuery: '',
				searchResponse: null,
			};

			this.debouncedSearch = debounce(this.applySearchQuery, SEARCH_DEBOUNCE_DELAY, this);
		}

		componentDidMount()
		{
			this.setBackdropLeftButtons();
		}

		componentWillUnmount()
		{
			this.isUnmounted = true;
			this.categoryClickHandlers.clear();
		}

		getParentWidget()
		{
			return this.props.layout ?? PageManager;
		}

		setBackdropLeftButtons()
		{
			this.getParentWidget().setLeftButtons?.([
				{
					type: 'back',
					callback: () => widget.close(),
				},
			]);
		}

		getCategories()
		{
			return Array.isArray(this.props.initialCategories) ? this.props.initialCategories : [];
		}

		getNormalizedQuery()
		{
			return String(this.state.query ?? '').trim();
		}

		isSearchQueryReady(query = '')
		{
			return String(query ?? '').trim().length >= MIN_SEARCH_QUERY_LENGTH;
		}

		applySearchQuery(query = '')
		{
			if (this.isUnmounted)
			{
				return;
			}

			const normalizedQuery = String(query ?? '').trim();
			if (!this.isSearchQueryReady(normalizedQuery))
			{
				return;
			}

			if (normalizedQuery !== this.getNormalizedQuery())
			{
				return;
			}

			if (normalizedQuery === this.state.activeQuery)
			{
				return;
			}

			this.setState({
				query: normalizedQuery,
				activeQuery: normalizedQuery,
				searchResponse: null,
			});
		}

		handleSearchChange = (value = '') => {
			if (this.isUnmounted)
			{
				return;
			}

			const normalizedQuery = String(value ?? '').trim();

			if (!this.isSearchQueryReady(normalizedQuery))
			{
				this.setState({
					query: normalizedQuery,
					activeQuery: '',
					searchResponse: null,
				});

				return;
			}

			this.setState((prevState) => ({
				query: normalizedQuery,
				activeQuery: prevState.activeQuery,
				searchResponse: normalizedQuery === prevState.activeQuery
					? prevState.searchResponse
					: null,
			}));

			this.debouncedSearch(normalizedQuery);
		};

		handleSearchSubmit = (value = '') => {
			if (this.isUnmounted)
			{
				return;
			}

			const normalizedQuery = String(value ?? '').trim();
			if (!this.isSearchQueryReady(normalizedQuery))
			{
				return;
			}

			this.setState({
				query: normalizedQuery,
			}, () => {
				this.applySearchQuery(normalizedQuery);
				Keyboard.dismiss();
			});
		};

		handleSearchErase = () => {
			if (this.isUnmounted)
			{
				return;
			}

			this.setState({
				query: '',
				activeQuery: '',
				searchResponse: null,
			});
		};

		handleRetrySearch = () => {
			const normalizedQuery = this.getNormalizedQuery();

			if (!this.isSearchQueryReady(normalizedQuery))
			{
				return;
			}

			this.setState({
				activeQuery: '',
				searchResponse: null,
			}, () => {
				setTimeout(() => {
					this.setState({
						activeQuery: normalizedQuery,
						searchResponse: null,
					});
				}, 0);
			});
		};

		handleCategoryClick = (category) => {
			const normalizedCategoryCode = String(category?.code ?? category?.id ?? '').trim();

			if (!normalizedCategoryCode)
			{
				return;
			}

			void requireLazy('market/app-list/opener').then((extension) => {
				extension?.MarketListOpener?.open({
					categoryCode: normalizedCategoryCode,
					title: String(category?.title ?? '').trim(),
					parentWidget: this.getParentWidget(),
				});
			});
		};

		getCategoryClickHandler(category)
		{
			const categoryCode = String(category?.code ?? category?.id ?? '').trim();
			if (!categoryCode)
			{
				return this.handleNoop;
			}

			const categoryTitle = String(category?.title ?? '').trim();
			const cacheKey = `${categoryCode}:${categoryTitle}`;

			if (!this.categoryClickHandlers.has(cacheKey))
			{
				this.categoryClickHandlers.set(
					cacheKey,
					this.handleCategoryClick.bind(this, category),
				);
			}

			return this.categoryClickHandlers.get(cacheKey);
		}

		handleItemClick = (itemId, itemData = null) => {
			const resolvedItem = (itemData && typeof itemData === 'object')
				? itemData
				: ((itemId && typeof itemId === 'object') ? itemId : null)
			;
			const appCode = String(resolvedItem?.code ?? '').trim();
			if (!appCode)
			{
				return;
			}

			void requireLazy('market/detail/opener').then(({ MarketDetailOpener }) => {
				MarketDetailOpener?.open({
					code: appCode,
					url: resolvedItem?.detailUrl ?? '',
					title: resolvedItem?.title ?? Loc.getMessage('MOBILE_MARKET_SEARCH_TITLE'),
					from: 'mobile_market_search',
					parentWidget: this.getParentWidget(),
					onInstallCompleted: this.handleRetrySearch,
				});
			}).catch(console.error);
		};

		handleItemActionClick = (itemId, itemData = null) => {
			const resolvedItem = (itemData && typeof itemData === 'object')
				? itemData
				: ((itemId && typeof itemId === 'object') ? itemId : null)
			;
			const appCode = String(resolvedItem?.code ?? '').trim();
			if (!appCode)
			{
				return;
			}

			const actionType = String(resolvedItem?.actionType ?? '').trim();
			if (actionType === 'install')
			{
				void requireLazy('market/install/opener').then((extension) => {
					extension?.MarketInstallOpener?.open({
						code: appCode,
						source: 'search',
						parentWidget: this.getParentWidget(),
						onCompleted: this.handleRetrySearch,
					});
				}).catch(console.error);

				return;
			}

			if (actionType === 'subscription')
			{
				return;
			}

			this.handleItemClick(itemId, resolvedItem);
		};

		handleSearchResultsLoaded = (responseData = null) => {
			this.setState({
				searchResponse: responseData,
			});
		};

		adaptSearchResultsResponse = (response) => {
			const errors = getActionErrors(response);
			if (errors.length > 0)
			{
				console.error(errors);

				return {
					data: {
						hasError: true,
						isAvailable: true,
						items: [],
						pagination: {
							currentPage: 1,
							pages: 1,
						},
						emptyState: null,
					},
					errors,
				};
			}

			return response;
		};

		prepareStatefulListItems = (items = []) => {
			return items.map((item, index) => ({
				...item,
				isLast: index === items.length - 1,
			}));
		};

		isAllSearchItemsLoaded = ({ response }) => {
			const currentPage = Number(response?.pagination?.currentPage ?? 1);
			const totalPages = Number(response?.pagination?.pages ?? 1);

			return currentPage >= totalPages;
		};

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					resizableByKeyboard: true,
					safeArea: {
						top: false,
						bottom: true,
					},
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				this.renderSearchInput(),
				this.renderContent(),
			);
		}

		renderSearchInput()
		{
			const isClearButtonVisible = this.getNormalizedQuery() !== '';

			return View(
				{
					testId: this.getTestId('search-input-container'),
					style: {
						width: '100%',
						paddingHorizontal: SEARCH_BAR_PADDING_HORIZONTAL,
						paddingVertical: SEARCH_BAR_PADDING_VERTICAL,
					},
				},
				View(
					{
						testId: this.getTestId('search-input-box'),
						style: {
							width: '100%',
							height: SEARCH_BAR_HEIGHT,
							flexDirection: 'row',
							alignItems: 'center',
							borderRadius: SEARCH_BAR_BORDER_RADIUS,
							paddingVertical: SEARCH_BAR_INNER_PADDING_VERTICAL,
							paddingHorizontal: SEARCH_BAR_INNER_PADDING_HORIZONTAL,
							backgroundColor: transparent(Color.base5.toHex(), 0.25),
						},
					},
					IconView({
						size: SEARCH_BAR_ICON_SIZE,
						color: Color.base4,
						icon: Icon.SEARCH,
						style: {
							marginRight: SEARCH_BAR_ICON_MARGIN_RIGHT,
						},
					}),
					TextField({
						testId: this.getTestId('search-input'),
						placeholder: Loc.getMessage('MOBILE_MARKET_SEARCH_PLACEHOLDER'),
						placeholderTextColor: Color.base4.toHex(),
						size: 4,
						color: Color.base1,
						style: {
							flex: 1,
						},
						value: this.state.query,
						onChangeText: this.handleSearchChange,
						onSubmitEditing: this.handleSearchSubmit,
					}),
					isClearButtonVisible && IconView({
						testId: this.getTestId('search-clear-button'),
						size: SEARCH_BAR_ICON_SIZE,
						color: Color.base4,
						icon: Icon.CROSS,
						onClick: this.handleSearchErase,
					}),
				),
			);
		}

		renderContent()
		{
			const normalizedQuery = this.getNormalizedQuery();

			if (!this.isSearchQueryReady(normalizedQuery))
			{
				return this.renderCatalog();
			}

			return this.renderResultsSection(normalizedQuery);
		}

		renderCatalog()
		{
			const categories = this.getCategories();
			if (categories.length === 0)
			{
				return MarketEmptyState({
					testId: this.getTestId('catalog-empty'),
					title: Loc.getMessage('MOBILE_MARKET_SEARCH_CATALOG_EMPTY_TITLE'),
					description: Loc.getMessage('MOBILE_MARKET_SEARCH_CATALOG_EMPTY_DESCRIPTION'),
				});
			}

			return UIScrollView(
				{
					testId: this.getTestId('catalog'),
					style: {
						flex: 1,
						width: '100%',
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
					showsVerticalScrollIndicator: false,
				},
				Area(
					{
						testId: this.getTestId('catalog-area'),
						title: Loc.getMessage('MOBILE_MARKET_SEARCH_CATALOG_TITLE'),
						excludePaddingSide: {
							horizontal: true,
							bottom: true,
						},
					},
					...categories.map((category, index) => MarketSearchCatalogItem({
						testId: this.getTestId(`catalog-item-${category?.code ?? index}`),
						category,
						isLast: index === categories.length - 1,
						contentBottomPadding: CONTENT_BOTTOM_PADDING,
						onClick: this.getCategoryClickHandler(category),
					})),
				),
			);
		}

		renderResultsSection(normalizedQuery)
		{
			if (this.shouldRenderSearchResultsEmptyState(normalizedQuery))
			{
				return this.renderSearchResultsEmptyState();
			}

			return Area(
				{
					testId: this.getTestId('results-area'),
					title: Loc.getMessage('MOBILE_MARKET_SEARCH_RESULTS_TITLE'),
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
					normalizedQuery === this.state.activeQuery
						? this.renderSearchResults()
						: this.renderLoading('results-loading'),
				),
			);
		}

		shouldRenderSearchResultsEmptyState(normalizedQuery)
		{
			const searchResponse = this.state.searchResponse ?? null;
			if (
				!searchResponse
				|| normalizedQuery !== this.state.activeQuery
				|| searchResponse.hasError === true
				|| searchResponse.isAvailable === false
			)
			{
				return false;
			}

			const items = Array.isArray(searchResponse.items) ? searchResponse.items : [];

			return items.length === 0;
		}

		renderSearchResultsEmptyState()
		{
			const emptyState = this.getSearchResultsEmptyState();

			return View(
				{
					testId: this.getTestId('empty-container'),
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				MarketEmptyState({
					testId: this.getTestId('empty'),
					title: emptyState.title,
					description: emptyState.description,
				}),
			);
		}

		renderSearchResults()
		{
			return new StatefulList({
				testId: this.getTestId('results-list'),
				layout: this.getParentWidget(),
				jsonEnabled: true,
				needInitMenu: false,
				isShowFloatingButton: false,
				useCache: false,
				actions: {
					loadItems: 'mobile.Market.getSearchData',
				},
				actionParams: {
					loadItems: {
						query: this.state.activeQuery,
					},
				},
				actionCallbacks: {
					loadItems: this.handleSearchResultsLoaded,
				},
				actionResponseAdapter: this.adaptSearchResultsResponse,
				itemType: MarketListItemType.MARKET,
				itemFactory: MarketListItemsFactory,
				itemParams: {
					contentBottomPadding: CONTENT_BOTTOM_PADDING,
					actionButtonClickHandler: this.handleItemActionClick,
				},
				itemDetailOpenHandler: this.handleItemClick,
				onBeforeItemsRender: this.prepareStatefulListItems,
				getEmptyListComponent: this.renderSearchResultsEmptyComponent,
				isAllItemsLoaded: this.isAllSearchItemsLoaded,
			});
		}

		renderSearchResultsEmptyComponent = () => {
			const searchResponse = this.state.searchResponse ?? null;

			if (searchResponse?.hasError === true)
			{
				return this.renderState({
					title: Loc.getMessage('MOBILE_MARKET_SEARCH_ERROR_TITLE'),
					description: Loc.getMessage('MOBILE_MARKET_SEARCH_ERROR_DESCRIPTION'),
					testIdSuffix: 'error',
					actionText: Loc.getMessage('MOBILE_MARKET_SEARCH_RETRY'),
					onAction: this.handleRetrySearch,
				});
			}

			if (searchResponse?.isAvailable === false)
			{
				return this.renderState({
					title: Loc.getMessage('MOBILE_MARKET_SEARCH_UNAVAILABLE_FALLBACK_TITLE'),
					description: Loc.getMessage('MOBILE_MARKET_SEARCH_UNAVAILABLE_FALLBACK_DESCRIPTION'),
					testIdSuffix: 'unavailable',
					actionText: Loc.getMessage('MOBILE_MARKET_SEARCH_RETRY'),
					onAction: this.handleRetrySearch,
				});
			}

			const emptyState = this.getSearchResultsEmptyState();

			return MarketEmptyState({
				testId: this.getTestId('empty'),
				title: emptyState.title,
				description: emptyState.description,
			});
		};

		getSearchResultsEmptyState()
		{
			return this.state.searchResponse?.emptyState ?? {
				title: Loc.getMessage('MOBILE_MARKET_SEARCH_EMPTY_TITLE'),
				description: Loc.getMessage('MOBILE_MARKET_SEARCH_EMPTY_DESCRIPTION'),
			};
		}

		renderLoading(testIdSuffix = 'loading')
		{
			return View(
				{
					testId: this.getTestId(testIdSuffix),
					style: {
						flex: 1,
					},
				},
				LoadingScreen({
					testId: this.getTestId(`${testIdSuffix}-screen`),
					backgroundColor: Color.bgContentPrimary.toHex(),
				}),
			);
		}

		renderState({
			title,
			description,
			testIdSuffix,
			actionText = '',
			onAction = null,
		})
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
						onClick: onAction ?? this.handleRetrySearch,
					})
					: null,
			);
		}
	}

	module.exports = {
		MarketSearch: (props) => new MarketSearch(props),
	};
});
