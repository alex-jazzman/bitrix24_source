/*
* @module call/callList/component
*/
(() => {
	const require = (ext) => jn.require(ext);
	const { Tabs } = require('call/callList/tabs');
	const { ListView } = require('call/callList/listView');
	const { openFastCallView } = require('call/callList/fastCallView');
	const { EmptyView } = require('call/callList/emptyView');
	const { CallListAnalyticsController } = require('call/callList/analyticsController');
	const { Icon } = require('ui-system/blocks/icon');
	const { CallListService, SCOPES, CONTENT_STATE } = require('call/callList/core');

	const COMPONENT_ID = 'CALL_LIST';
	const TAB_ID = 'call_list';
	const IS_ANDROID_PLATFORM = Application.getPlatform() === 'android';

	class CallsListComponent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.state = {
				allItems: [],
				tabItems: [],
				selectedScopeId: SCOPES.ALL,
				missedCount: 0,
				isReady: false,
				isRefreshing: false,
				searchQuery: '',
				isSearchMode: false,
				searchItems: [],
				isLoadingTab: false,
				hasLoadError: false,
			};

			this.hideTabs = BX.componentParameters.get('hideTabs', false);
			if (this.hideTabs)
			{
				this.state.selectedScopeId = SCOPES.ALL;
			}

			this.isMountedFlag = false;

			this.callListService = new CallListService({
				setState: (updater, callback) => this.setState(updater, callback),
				getState: () => this.state,
				isMounted: () => this.isMountedFlag,
				layout,
			});

			this.boundOnUpdateUserCounters = (data) => this.callListService.onUpdateUserCounters(data);
			this.boundOnAppActive = () => this.callListService.onAppActive();

			BX.addCustomEvent('onUpdateUserCounters', this.boundOnUpdateUserCounters);
			BX.addCustomEvent('onTabsSelected', this.onTabsSelected.bind(this));
			BX.addCustomEvent('onTabsReSelected', this.onTabsReSelected.bind(this));
			BX.addCustomEvent('onAppActive', this.boundOnAppActive);

			this.callListService.init();
		}

		componentDidMount()
		{
			this.isMountedFlag = true;

			if (!this.callListService.isGuestMode)
			{
				this.callListService.searchController.setupSearch();
				this.initFloatingButton();
			}
		}

		initFloatingButton()
		{
			if (!layout?.setFloatingButton)
			{
				return;
			}

			layout.setFloatingButton({
				type: 'plus',
				callback: () => {
					this.onFloatingButtonClick();
				},
				icon: Icon.PLUS.getIconName(),
				animation: 'hide_on_scroll',
				showLoader: false,
				accentByDefault: false,
			});
		}

		onFloatingButtonClick()
		{
			CallListAnalyticsController.sendClickCreate(this.state.selectedScopeId);
			openFastCallView(layout);
		}

		componentWillUnmount()
		{
			this.callListService.destroy();
			BX.removeCustomEvent('onUpdateUserCounters', this.boundOnUpdateUserCounters);
			BX.removeCustomEvent('onTabsSelected', this.onTabsSelected.bind(this));
			BX.removeCustomEvent('onTabsReSelected', this.onTabsReSelected.bind(this));
			BX.removeCustomEvent('onAppActive', this.boundOnAppActive);
			this.isMountedFlag = false;
		}

		onTabsSelected(id)
		{
			if (String(id) === TAB_ID)
			{
				this.isMountedFlag = true;
				CallListAnalyticsController.sendOpenCallTab();
				this.callListService.resumePendingFetch();
			}
			else if (this.isMountedFlag)
			{
				this.isMountedFlag = false;
				this.callListService.destroy();
			}
		}

		onTabsReSelected(id)
		{
			if (String(id) !== TAB_ID)
			{
				return;
			}

			if (this.state.selectedScopeId !== SCOPES.ALL)
			{
				this.onTabChange(SCOPES.ALL);
			}

			if (this.tabsScrollRef)
			{
				this.tabsScrollRef.scrollToBegin(true);
			}
		}

		async onRefresh()
		{
			if (this.state.isRefreshing)
			{
				return;
			}
			this.setState({ isRefreshing: true }, async () => {
				try
				{
					await this.callListService.fetchList(true);
				}
				finally
				{
					this.setState({ isRefreshing: false });
				}
			});
		}

		onTabChange(scopeId)
		{
			BX.postComponentEvent('callList:onTabSelected', [{ tabId: scopeId }]);

			this.callListService.switchScope(scopeId);
		}

		render()
		{
			const callItems = this.callListService.getSortedItems();
			const isSearch = this.state.isSearchMode;
			const contentState = this.callListService.resolveContentState(callItems);
			const isLoading = (contentState === CONTENT_STATE.LOADING);
			const unseenMissed = Number(this.state.missedCount || 0);

			const loaderView = View({
				style: {
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
				},
			}, this.callListService.loader);

			const hasMore = (!isLoading && this.callListService.hasMore && !isSearch);
			const onLoadMore = hasMore
				? () => this.callListService.fetchList(false)
				: null;

			const listView = ListView({
				items: callItems,
				testId: COMPONENT_ID,
				style: {
					flex: 1,
				},
				onRefresh: () => this.onRefresh(),
				isRefreshing: this.state.isRefreshing,
				hasMore,
				onLoadMore,
				onItemClick: (item) => this.callListService.startCall(item),
				onOpenChat: (item) => this.callListService.openChat(item),
				onDelete: this.callListService.isGuestMode
					? null
					: (item) => this.callListService.deleteCallItem(item),
			});

			const emptyView = EmptyView({
				text: this.callListService.getTabEmptyStateText(),
				testId: 'call-list-empty-state',
			});

			const errorView = EmptyView({
				text: this.callListService.getErrorStateText(),
				showImage: false,
				testId: 'call-list-error-state',
			});

			let content = listView;
			if (isLoading)
			{
				content = loaderView;
			}
			else if (contentState === CONTENT_STATE.ERROR)
			{
				content = errorView;
			}
			else if (contentState === CONTENT_STATE.EMPTY)
			{
				content = emptyView;
			}

			return View(
				{
					style: {
						flex: 1,
					},
				},
				(!this.hideTabs && Tabs({
					selectedScopeId: this.state.selectedScopeId,
					missedTotal: unseenMissed,
					onScrollRef: (ref) => {
						this.tabsScrollRef = ref;
					},
					onChange: (scopeId) => this.onTabChange(scopeId),
				})),
				content,
			);
		}
	}

	layout.showComponent(new CallsListComponent());
})();
