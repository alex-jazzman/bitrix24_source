/**
 * @module market/home
 */
jn.define('market/home', (require, exports, module) => {
	const { Loc } = require('loc');
	const { inAppUrl } = require('in-app-url');
	const { requireLazy } = require('require-lazy');
	const { createTestIdGenerator } = require('utils/test');
	const { showErrorToast } = require('toast/error');
	const { hasActionErrors, resolveActionErrorMessage } = require('market/utils');
	const { Color, Component, Indent } = require('tokens');
	const { LoadingScreen } = require('layout/ui/loading-screen');
	const { MarketEmptyState } = require('market/empty-state');
	const { MarketHomePromoBanner } = require('market/home/src/promo-banner');
	const { Box } = require('ui-system/layout/box');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { PopupMenu, PopupMenuPosition } = require('ui-system/popups/popup-menu');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Text2, Text4, Text5, Text6 } = require('ui-system/typography/text');

	const HEADER_ICON_SIZE = 24;
	const HEADER_SIDE_PADDING = Component.paddingLr.toNumber();
	const LIST_SIDE_PADDING = Component.paddingLr.toNumber();
	const LIST_ROW_VERTICAL_PADDING = Indent.XL.toNumber();
	const CATEGORY_COLUMNS_GAP = Indent.XL2.toNumber();
	const CATEGORY_META_GAP = Indent.S.toNumber();
	const CATEGORY_DIVIDER_WIDTH = Component.separatorStroke.toNumber();
	const CONTENT_BOTTOM_PADDING = Indent.XL3.toNumber();
	const ACTIVATE_DEMO_SUBSCRIPTION_ACTION = 'mobile.Market.activateDemoSubscription';

	class MarketHome extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId || 'market-home',
			});
			this.searchPreloadPromise = null;
			this.morePopupMenu = null;
			this.categoryClickHandlers = new Map();
			this.handleNoop = () => {};

			this.state = {
				isLoading: true,
				loadError: false,
				homeData: null,
				isPromoActivationInProgress: false,
			};
		}

		componentWillUnmount()
		{
			this.morePopupMenu?.hide?.();
			this.morePopupMenu = null;
			this.categoryClickHandlers.clear();
		}

		componentDidMount()
		{
			void this.preloadSearchExtensions();
			void this.preloadAppListExtensions();
			this.updateWidgetHeader();
			void this.loadData();
		}

		componentDidUpdate(prevProps, prevState)
		{
			if (
				prevState.homeData !== this.state.homeData
				|| prevState.isLoading !== this.state.isLoading
				|| prevState.loadError !== this.state.loadError
			)
			{
				this.updateWidgetHeader();
			}
		}

		getHomeData()
		{
			return this.state.homeData ?? {
				isAvailable: false,
				title: Loc.getMessage('MOBILE_MARKET_HOME_DEFAULT_TITLE'),
				categories: [],
				promo: null,
				canViewInstalledList: false,
			};
		}

		getHeaderTitle()
		{
			return this.getHomeData().title || Loc.getMessage('MOBILE_MARKET_HOME_DEFAULT_TITLE');
		}

		getParentWidget()
		{
			return this.props.layout ?? PageManager;
		}

		preloadSearchExtensions()
		{
			if (!this.searchPreloadPromise)
			{
				this.searchPreloadPromise = requireLazy('market/search/opener', false);
			}

			return this.searchPreloadPromise;
		}

		preloadAppListExtensions()
		{
			if (!this.appListPreloadPromise)
			{
				this.appListPreloadPromise = requireLazy('market/app-list/opener', false);
			}

			return this.appListPreloadPromise;
		}

		updateWidgetHeader()
		{
			const widget = this.props.layout;
			if (!widget)
			{
				return;
			}

			if (typeof widget?.setTitle === 'function')
			{
				widget.setTitle({
					text: this.getHeaderTitle(),
					type: 'dialog',
				}, true);
			}

			if (typeof widget?.setRightButtons !== 'function')
			{
				return;
			}

			const buttons = [];
			if (this.getHomeData().isAvailable)
			{
				buttons.push({
					id: 'market_home_search',
					type: 'search',
					callback: this.handleSearchClick,
				});

				if (this.getMoreMenuItems().length > 0)
				{
					buttons.push({
						id: 'market_home_more',
						type: 'more',
						callback: this.handleMoreClick,
					});
				}
			}

			widget.setRightButtons(buttons);
		}

		async loadData()
		{
			this.setState({
				isLoading: true,
				loadError: false,
			});

			const response = await BX.ajax.runAction('mobile.Market.getHomeData', {
				json: {},
			}).catch((errorResponse) => errorResponse);

			if (hasActionErrors(response))
			{
				console.error(response.errors);

				this.setState({
					isLoading: false,
					loadError: true,
				});

				return;
			}

			this.categoryClickHandlers.clear();

			this.setState({
				isLoading: false,
				loadError: false,
				homeData: response?.data ?? this.getHomeData(),
			});
		}

		handleRefresh = () => {
			void this.loadData();
		};

		handlePromoButtonClick = async () => {
			if (this.state.isPromoActivationInProgress)
			{
				return;
			}

			this.setPromoActivationInProgress(true);

			try
			{
				const response = await this.activateDemoSubscription();

				if (hasActionErrors(response))
				{
					console.error(response.errors);
					showErrorToast({
						message: resolveActionErrorMessage(
							response,
							Loc.getMessage('MOBILE_MARKET_HOME_PROMO_ACTIVATE_ERROR'),
						),
					}, this.getParentWidget());

					return;
				}

				this.hidePromoBanner();
			}
			catch (error)
			{
				console.error(error);
				showErrorToast({
					message: Loc.getMessage('MOBILE_MARKET_HOME_PROMO_ACTIVATE_ERROR'),
				}, this.getParentWidget());
			}
			finally
			{
				this.setPromoActivationInProgress(false);
			}
		};

		activateDemoSubscription()
		{
			return BX.ajax.runAction(ACTIVATE_DEMO_SUBSCRIPTION_ACTION, {
				json: {},
			}).catch((errorResponse) => errorResponse);
		}

		hidePromoBanner()
		{
			this.setState({
				homeData: {
					...this.getHomeData(),
					promo: null,
				},
			});
		}

		setPromoActivationInProgress(isPromoActivationInProgress)
		{
			this.setState({
				isPromoActivationInProgress,
			});
		}

		handleSearchClick = () => {
			void this.preloadSearchExtensions().then((extension) => {
				const opener = extension?.MarketSearchOpener;
				if (!opener)
				{
					console.error('market/search/opener: failed to preload extension');

					return;
				}

				opener.open({
					initialCategories: this.getHomeData().categories ?? [],
					parentWidget: this.getParentWidget(),
				});
			});
		};

		handleMoreClick = () => {
			const menuItems = this.getMoreMenuItems();
			if (menuItems.length === 0)
			{
				return;
			}

			this.morePopupMenu?.hide?.();
			this.morePopupMenu = new PopupMenu(menuItems);

			this.morePopupMenu.show({
				position: PopupMenuPosition.TOP_RIGHT,
			});
		};

		getMoreMenuItems()
		{
			if (this.getHomeData().canViewInstalledList !== true)
			{
				return [];
			}

			return [
				{
					id: 'installed-apps',
					testId: this.getTestId('more-menu-installed-apps'),
					title: Loc.getMessage('MOBILE_MARKET_HOME_MENU_INSTALLED_APPS'),
					icon: Icon.TASK_LIST,
					onItemSelected: this.handleInstalledAppsMenuItemSelected,
				},
			];
		}

		handleInstalledAppsMenuItemSelected = () => {
			void this.preloadAppListExtensions()
				.then(({ MarketListOpener }) => {
					MarketListOpener?.open({
						listType: 'installed',
						parentWidget: this.getParentWidget(),
					});
				})
				.catch(console.error)
			;
		};

		handleCategoryClick = (category) => {
			const categoryCode = String(category?.code ?? category?.id ?? '').trim();
			const title = String(category?.title ?? '').trim();
			const url = category?.url ?? '';

			if (categoryCode)
			{
				void this.preloadAppListExtensions()
					.then(({ MarketListOpener }) => {
						MarketListOpener.open({
							categoryCode,
							title,
							parentWidget: this.getParentWidget(),
						});
					})
					.catch(console.error)
				;

				return;
			}

			if (!url)
			{
				return;
			}

			inAppUrl.open(url, {
				title: category?.title ?? this.getHeaderTitle(),
			});
		};

		getCategoryClickHandler(category)
		{
			const categoryId = String(category?.code ?? category?.id ?? category?.url ?? '').trim();
			if (!categoryId)
			{
				return this.handleNoop;
			}

			const categoryTitle = String(category?.title ?? '').trim();
			const cacheKey = `${categoryId}:${categoryTitle}`;

			if (!this.categoryClickHandlers.has(cacheKey))
			{
				this.categoryClickHandlers.set(
					cacheKey,
					this.handleCategoryClick.bind(this, category),
				);
			}

			return this.categoryClickHandlers.get(cacheKey);
		}

		render()
		{
			const { isLoading, homeData } = this.state;

			if (isLoading && !homeData)
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
						backgroundColor: Color.bgContentPrimary.toHex(),
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
				RefreshView(
					{
						style: {
							flex: 1,
						},
						refreshing: isLoading,
						onRefresh: this.handleRefresh,
					},
					View(
						{
							style: {
								backgroundColor: Color.bgContentPrimary.toHex(),
								paddingBottom: CONTENT_BOTTOM_PADDING,
							},
						},
						this.renderBody(),
					),
				),
			);
		}

		renderBody()
		{
			const { loadError } = this.state;
			const homeData = this.getHomeData();
			const categories = Array.isArray(homeData.categories) ? homeData.categories : [];

			if (loadError)
			{
				return this.renderState({
					title: Loc.getMessage('MOBILE_MARKET_HOME_LOAD_ERROR_TITLE'),
					description: Loc.getMessage('MOBILE_MARKET_HOME_LOAD_ERROR_DESCRIPTION'),
					testIdSuffix: 'error',
					actionText: Loc.getMessage('MOBILE_MARKET_HOME_RETRY'),
				});
			}

			if (!homeData.isAvailable)
			{
				return this.renderState({
					title: Loc.getMessage('MOBILE_MARKET_HOME_UNAVAILABLE_TITLE'),
					description: Loc.getMessage('MOBILE_MARKET_HOME_UNAVAILABLE_DESCRIPTION'),
					testIdSuffix: 'unavailable',
					actionText: Loc.getMessage('MOBILE_MARKET_HOME_RETRY'),
				});
			}

			if (categories.length === 0)
			{
				return MarketEmptyState({
					testId: this.getTestId('empty'),
					title: Loc.getMessage('MOBILE_MARKET_HOME_EMPTY_TITLE'),
				});
			}

			return View(
				{
					style: {
						paddingTop: Indent.XS.toNumber(),
					},
				},
				MarketHomePromoBanner({
					getTestId: this.getTestId,
					promo: this.getHomeData().promo,
					onButtonClick: this.handlePromoButtonClick,
					isButtonLoading: this.state.isPromoActivationInProgress,
				}),
				...categories.map((category, index) => this.renderCategoryItem(category, index, categories.length)),
			);
		}

		renderState({ title, description, testIdSuffix, actionText = null })
		{
			return View(
				{
					testId: this.getTestId(testIdSuffix),
					style: {
						flex: 1,
						alignItems: 'center',
						justifyContent: 'center',
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingVertical: Indent.XL3.toNumber(),
					},
				},
				Text2({
					testId: this.getTestId(`${testIdSuffix}-title`),
					text: title,
					accent: true,
					color: Color.base1,
					style: {
						textAlign: 'center',
					},
				}),
				Text4({
					testId: this.getTestId(`${testIdSuffix}-description`),
					text: description,
					color: Color.base3,
					style: {
						marginTop: Indent.M.toNumber(),
						textAlign: 'center',
					},
				}),
				actionText && Button({
					testId: this.getTestId(`${testIdSuffix}-retry`),
					text: actionText,
					size: ButtonSize.L,
					design: ButtonDesign.FILLED,
					style: {
						marginTop: Indent.XL.toNumber(),
					},
					onClick: this.handleRefresh,
				}),
			);
		}

		renderCategoryItem(category, index, total)
		{
			const appsCount = Number(category?.appsCount ?? 0);
			const showDivider = index < total - 1;

			return View(
				{
					style: {
						flexDirection: 'column',
					},
				},
				View(
					{
						testId: this.getTestId(`category-item-${index}`),
						onClick: this.getCategoryClickHandler(category),
						style: {
							paddingHorizontal: LIST_SIDE_PADDING,
							paddingVertical: LIST_ROW_VERTICAL_PADDING,
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					View(
						{
							style: {
								flex: 1,
								paddingRight: CATEGORY_COLUMNS_GAP,
							},
						},
						Text4({
							testId: this.getTestId(`category-title-${index}`),
							text: category?.title ?? '',
							accent: true,
							color: Color.base1,
							numberOfLines: 1,
						}),
						Text5({
							testId: this.getTestId(`category-description-${index}`),
							text: category?.description ?? '',
							color: Color.base3,
							numberOfLines: 2,
							style: {
								marginTop: Indent.XS.toNumber(),
							},
						}),
					),
					View(
						{
							style: {
								flexDirection: 'row',
								alignItems: 'center',
							},
						},
						this.renderCategoryCount(appsCount, index),
						IconView({
							testId: this.getTestId(`category-chevron-${index}`),
							icon: Icon.CHEVRON_TO_THE_RIGHT,
							size: HEADER_ICON_SIZE,
							color: Color.base4,
							style: {
								marginLeft: CATEGORY_META_GAP,
							},
						}),
					),
				),
				showDivider && View(
					{
						style: {
							height: CATEGORY_DIVIDER_WIDTH,
							marginLeft: LIST_SIDE_PADDING,
							backgroundColor: Color.bgSeparatorSecondary.toHex(),
						},
					},
				),
			);
		}

		renderCategoryCount(count, index)
		{
			return View(
				{
					style: {
						minHeight: 18,
						justifyContent: 'center',
						paddingHorizontal: Indent.S.toNumber(),
						borderRadius: Component.elementAccentCorner.toNumber(),
						alignItems: 'center',
						backgroundColor: Color.base7.toHex(),
					},
				},
				Text5({
					testId: this.getTestId(`category-count-${index}`),
					text: String(count),
					color: Color.base4,
					accent: true,
				}),
			);
		}
	}

	module.exports = {
		MarketHome: (props = {}) => new MarketHome(props),
	};
});
