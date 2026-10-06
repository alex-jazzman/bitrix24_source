/**
 * @module market/app-list/src/renderers/market-list-renderer
 */
jn.define('market/app-list/src/renderers/market-list-renderer', (require, exports, module) => {
	const { inAppUrl } = require('in-app-url');
	const { Loc } = require('loc');
	const { requireLazy } = require('require-lazy');
	const { Color, Component, Indent } = require('tokens');
	const { Icon } = require('assets/icons');
	const { UIScrollView } = require('layout/ui/scroll-view');
	const { ChipInnerTab } = require('ui-system/blocks/chips/chip-inner-tab');
	const { PopupMenu, PopupMenuPosition } = require('ui-system/popups/popup-menu');
	const { MarketListTabs } = require('market/mobile');
	const {
		MARKET_LIST_TYPE,
	} = require('market/app-list/src/providers/base-list-provider');
	const { MarketListProvider } = require('market/app-list/src/providers/market-list-provider');
	const { BaseListRenderer } = require('market/app-list/src/renderers/base-list-renderer');

	const CONTENT_SIDE_PADDING = Component.paddingLr.toNumber();
	const TABS_VERTICAL_PADDING = Indent.M.toNumber();
	const TAB_GAP = Indent.L.toNumber();
	const SORT_MENU_SECTION_CODE = 'sort';
	const SORT_ITEM_ID = Object.freeze({
		RATING: 'rating',
		INSTALLS: 'installs',
		DATE: 'date',
		FAVORITE: 'favorite',
	});

	function resolveSortMenuItemIcon(sortItem = {})
	{
		switch (String(sortItem?.id ?? ''))
		{
			case SORT_ITEM_ID.RATING:
				return Icon.ACHIEVEMENT;

			case SORT_ITEM_ID.INSTALLS:
				return Icon.DOUBLE_CHECK;

			case SORT_ITEM_ID.DATE:
				return Icon.CLOCK;

			case SORT_ITEM_ID.FAVORITE:
			default:
				return Icon.FAVORITE;
		}
	}

	class MarketListRenderer extends BaseListRenderer
	{
		constructor(props, provider = new MarketListProvider(props))
		{
			super(props, provider);

			this.sortPopupMenu = null;
		}

		componentWillUnmount()
		{
			this.sortPopupMenu?.hide?.();
			this.sortPopupMenu = null;
		}

		isInstalledList()
		{
			return this.getListType() === MARKET_LIST_TYPE.INSTALLED;
		}

		getTabs()
		{
			return new MarketListTabs(this.getListData().tabs ?? {});
		}

		getSortItems()
		{
			const sortItems = this.getSortInfo()?.items;

			return (Array.isArray(sortItems) ? sortItems : []);
		}

		shouldShowSortMenu()
		{
			return (
				!this.isInstalledList()
				&& this.getListData().showSortMenu === true
				&& this.getSortItems().length > 0
			);
		}

		getHeaderRightButtons()
		{
			if (!this.shouldShowSortMenu())
			{
				return [];
			}

			return [
				{
					id: 'market_list_more',
					type: 'more',
					callback: this.handleSortMenuClick,
				},
			];
		}

		showSortMenu()
		{
			if (!this.shouldShowSortMenu())
			{
				return false;
			}

			const sortItems = this.getSortItems().map((sortItem, index) => ({
				id: `market-list-sort-${index}`,
				testId: this.getTestId(`sort-menu-item-${index}`),
				title: sortItem.title,
				icon: resolveSortMenuItemIcon(sortItem),
				checked: this.getProvider().areSortOrdersEqual(sortItem.value, this.getCurrentSortOrder()),
				sectionCode: SORT_MENU_SECTION_CODE,
				onItemSelected: () => this.handleSortMenuItemSelected(sortItem),
			}));

			this.sortPopupMenu?.hide?.();
			this.sortPopupMenu = new PopupMenu({
				items: sortItems,
				sections: [
					{
						id: SORT_MENU_SECTION_CODE,
						title: Loc.getMessage('MOBILE_MARKET_LIST_SORT_MENU_TITLE'),
					},
				],
			});
			this.sortPopupMenu.show({
				position: PopupMenuPosition.TOP_RIGHT,
			});

			return true;
		}

		handleSortMenuClick = () => {
			this.showSortMenu();
		};

		handleSortMenuItemSelected = (sortItem) => {
			const nextSortOrder = this.getProvider().normalizeSortOrder(sortItem?.value);
			if (this.getProvider().areSortOrdersEqual(nextSortOrder, this.getCurrentSortOrder()))
			{
				return;
			}

			this.setState({
				currentSortOrder: nextSortOrder,
			}, () => {
				this.reloadStatefulList();
			});
		};

			handleNavigateTabClick = (tab) => {
				const categoryCode = String(tab?.id ?? '').trim();
				const initialTag = String(tab?.payload?.developerTag ?? '').trim();
				const title = String(tab?.title ?? '').trim();
				if (!categoryCode)
				{
					return;
			}

			void requireLazy('market/app-list/opener')
				.then(({ MarketListOpener }) => {
						MarketListOpener.openNested({
							categoryCode,
							initialTag,
							title,
							parentWidget: this.getParentWidget(),
						});
					})
				.catch(console.error)
			;
		};

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

			void requireLazy('market/detail/opener')
				.then(({ MarketDetailOpener }) => {
					MarketDetailOpener?.open({
						code: appCode,
						url: resolvedItem?.detailUrl ?? '',
						title: resolvedItem?.title ?? this.getHeaderTitle(),
						from: this.isInstalledList() ? 'mobile_market_installed_list' : 'mobile_market_list',
						parentWidget: this.getParentWidget(),
						onInstallCompleted: this.handleRefresh,
					});
				})
				.catch(console.error)
			;
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
			if (actionType === 'open')
			{
				const openAppUrl = String(resolvedItem?.openAppUrl ?? '').trim();
				if (!openAppUrl)
				{
					return;
				}

				inAppUrl.open(openAppUrl, {
					title: resolvedItem?.title ?? this.getHeaderTitle(),
				});

				return;
			}

			if (actionType === 'install')
			{
				void requireLazy('market/install/opener')
					.then(({ MarketInstallOpener }) => {
						MarketInstallOpener?.open({
							code: appCode,
							source: 'list',
							parentWidget: this.getParentWidget(),
							onCompleted: this.handleRefresh,
						});
					})
					.catch(console.error)
				;

				return;
			}

			if (actionType === 'subscription')
			{
				return;
			}

			this.handleItemClick(itemId, resolvedItem);
		};

		renderTabsBar()
		{
			const tabs = this.getTabs();
			if (this.isTabsBarHidden() || !tabs.isNavigateMode() || !tabs.hasItems())
			{
				return null;
			}

			const tabItems = tabs.toNavigateItems();

			return UIScrollView(
				{
					testId: this.getTestId('tabs'),
					style: {
						flexDirection: 'row',
						width: '100%',
						height: 51,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
					horizontal: true,
					showsHorizontalScrollIndicator: false,
				},
				...tabItems.map((tab, index) => this.renderTab(tab, {
					isFirst: index === 0,
					isLast: index === tabItems.length - 1,
				})),
			);
		}

		renderTab(tab, { isFirst = false, isLast = false } = {})
		{
			return ChipInnerTab({
				testId: this.getTestId(`tab-${tab.id}`),
				text: tab.title,
				selected: tab.active === true,
				onClick: () => this.handleNavigateTabClick(tab),
				style: {
					marginVertical: TABS_VERTICAL_PADDING,
					marginLeft: isFirst ? CONTENT_SIDE_PADDING : 0,
					marginRight: isLast ? CONTENT_SIDE_PADDING : TAB_GAP,
				},
			});
		}
	}

	module.exports = {
		MarketListRenderer,
	};
});
