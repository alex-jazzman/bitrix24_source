/*
* @module call/sync/component
*/
(() => {
	const { SyncCallService } = jn.require('call/sync');
	const { ChipInnerTab } = jn.require('ui-system/blocks/chips/chip-inner-tab');
	const { Icon } = jn.require('ui-system/blocks/icon');
	const { ListView } = jn.require('call/callList/listView');
	const { openFastCallView } = jn.require('call/callList/fastCallView');
	const { openJoinMeetingView } = jn.require('call/sync/joinMeetingView');
	const { EmptyView } = jn.require('call/callList/emptyView');
	const { CallListAnalyticsController } = jn.require('call/callList/analyticsController');
	const { SyncAnalyticsController } = jn.require('call/sync/analyticsController');
	const { Analytics } = jn.require('call/const');
	const { CallListService, SCOPES } = jn.require('call/callList/core');
	const { Indent } = jn.require('tokens');
	const { HeroBanner } = jn.require('call/sync/heroBanner');
	const { ActionRow } = jn.require('call/sync/actionRow');

	const HORIZONTAL_PADDING = 18;
	const PATH_TO_IMG = '/bitrix/mobileapp/callmobile/components/call/sync/images/';

	const ACTIVE_TAB = Object.freeze({
		HOME: 'home',
		CALL_LIST: 'callList',
	});

	const OPEN_SOURCE = Object.freeze({
		MENU: 'menu',
	});

	class SyncComponent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.state = {
				activeTab: ACTIVE_TAB.HOME,

				// call list state
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
			};

			this.syncCallService = new SyncCallService();
			this.callListMountedFlag = false;

			this.callListService = new CallListService({
				setState: (updater, callback) => this.setState(updater, callback),
				getState: () => this.state,
				isMounted: () => this.callListMountedFlag,
				layout,
			});

			this.boundOnUpdateUserCounters = (data) => this.callListService.onUpdateUserCounters(data);
			this.boundOnAppActive = () => this.onAppActive();

			BX.addCustomEvent('onUpdateUserCounters', this.boundOnUpdateUserCounters);
			BX.addCustomEvent('onAppActive', this.boundOnAppActive);

			this.boundOnTabsSelected = (id) => this.onTabsSelected(id);
			BX.addCustomEvent('onTabsSelected', this.boundOnTabsSelected);

			BX.onViewLoaded(() => this.initFloatingButton());

			const openSource = BX.componentParameters.get('openSource', null);
			if (openSource === OPEN_SOURCE.MENU)
			{
				const type = this.state.activeTab === ACTIVE_TAB.CALL_LIST
					? Analytics.AnalyticsType.callList
					: Analytics.AnalyticsType.sync;
				SyncAnalyticsController.sendOpenSection({
					type,
					section: Analytics.AnalyticsSection.menu,
				});
			}
		}

		componentWillUnmount()
		{
			this.callListService.destroy();
			BX.removeCustomEvent('onUpdateUserCounters', this.boundOnUpdateUserCounters);
			BX.removeCustomEvent('onAppActive', this.boundOnAppActive);
			BX.removeCustomEvent('onTabsSelected', this.boundOnTabsSelected);
			this.callListMountedFlag = false;
		}

		onTabsSelected(id)
		{
			if (String(id) !== 'sync')
			{
				return;
			}

			const type = this.state.activeTab === ACTIVE_TAB.CALL_LIST
				? Analytics.AnalyticsType.callList
				: Analytics.AnalyticsType.sync;

			SyncAnalyticsController.sendOpenSection({ type });

			if (this.state.activeTab === ACTIVE_TAB.CALL_LIST)
			{
				CallListAnalyticsController.sendOpenCallTab(Analytics.AnalyticsSection.syncTab);
			}
		}

		switchToTab(tabId)
		{
			if (tabId === this.state.activeTab)
			{
				return;
			}

			this.setState({ activeTab: tabId }, () => {
				if (tabId === ACTIVE_TAB.CALL_LIST)
				{
					CallListAnalyticsController.sendOpenCallTab(Analytics.AnalyticsSection.syncPage);

					const moreButton = {
						type: 'more',
						callback: () => this.openFilterMenu(),
					};

					if (this.callListMountedFlag)
					{
						this.initRightButtons(moreButton);
					}
					else
					{
						this.callListMountedFlag = true;
						this.callListService.searchController.setupSearch([moreButton]);
						this.callListService.init();
					}
				}
				else
				{
					SyncAnalyticsController.sendOpenSyncTab();
					this.hideRightButtons();
				}
			});
		}

		initRightButtons(moreButton)
		{
			BX.onViewLoaded(() => {
				const mainLayout = this.callListService.layout || layout;
				if (mainLayout && typeof mainLayout.setRightButtons === 'function')
				{
					mainLayout.setRightButtons([
						{
							type: 'search',
							id: 'search',
							callback: () => this.callListService.searchController.openSearch(mainLayout),
						},
						moreButton,
					]);
				}
			});
		}

		hideRightButtons()
		{
			BX.onViewLoaded(() => {
				const mainLayout = this.callListService.layout || layout;
				if (mainLayout && typeof mainLayout.setRightButtons === 'function')
				{
					mainLayout.setRightButtons([]);
				}
			});
		}

		// floating button (visible on both tabs)
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

		openFilterMenu()
		{
			const scopeItems = [
				{ id: SCOPES.ALL, title: BX.message('CALLMOBILE_SYNC_FILTER_ALL'), sectionCode: 'myCallsSection' },
				{ id: SCOPES.MISSED, title: BX.message('CALLMOBILE_SYNC_FILTER_MISSED'), sectionCode: 'myCallsSection' },
				{ id: SCOPES.INCOMING, title: BX.message('CALLMOBILE_SYNC_FILTER_INCOMING'), sectionCode: 'myCallsSection' },
				{ id: SCOPES.OUTGOING, title: BX.message('CALLMOBILE_SYNC_FILTER_OUTGOING'), sectionCode: 'myCallsSection' },
			];

			const sections = [
				{ id: 'myCallsSection', title: BX.message('CALLMOBILE_SYNC_FILTER_MENU_SECTION_MY_CALLS') },
			];

			const items = scopeItems.map((item) => ({
				...item,
				checked: item.id === this.state.selectedScopeId,
			}));

			const menu = dialogs.createPopupMenu();

			menu.setData(items, sections, (event, item) => {
				if (event === 'onItemSelected')
				{
					this.onFilterMenuItemClick(item.id);
				}
			});

			menu.show();
		}

		onFilterMenuItemClick(scopeId)
		{
			if (scopeId !== this.state.selectedScopeId)
			{
				this.callListService.switchScope(scopeId);
			}
		}

		onAppActive()
		{
			if (this.callListMountedFlag && this.state.activeTab === ACTIVE_TAB.CALL_LIST)
			{
				this.callListService.onAppActive();
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

		renderTopTabs()
		{
			const { activeTab } = this.state;

			return ScrollView(
				{
					horizontal: true,
					showsHorizontalScrollIndicator: false,
					style: {
						height: 52,
						flexDirection: 'row',
						alignItems: 'center',
						width: '100%',
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							paddingHorizontal: HORIZONTAL_PADDING,
						},
					},
					View(
						{
							style: {
								paddingRight: 3,
								marginRight: 7,
							},
						},
						ChipInnerTab({
							testId: 'sync-tab-home',
							text: BX.message('CALLMOBILE_SYNC_TAB_HOME'),
							selected: activeTab === ACTIVE_TAB.HOME,
							onClick: () => this.switchToTab(ACTIVE_TAB.HOME),
						}),
					),
					View(
						{
							style: {
								paddingRight: 3,
								marginRight: 7,
							},
						},
						ChipInnerTab({
							testId: 'sync-tab-callList',
							text: BX.message('CALLMOBILE_SYNC_TAB_CALL_LIST'),
							selected: activeTab === ACTIVE_TAB.CALL_LIST,
							onClick: () => this.switchToTab(ACTIVE_TAB.CALL_LIST),
						}),
					),
				),
			);
		}

		renderHomeContent()
		{
			return View(
				{
					style: {
						flexDirection: 'column',
						paddingHorizontal: HORIZONTAL_PADDING,
						paddingTop: Indent.XL3.toNumber(),
					},
				},
				HeroBanner({
					testId: 'card-start-call',
					imageUri: `${currentDomain}${PATH_TO_IMG}start-call.png`,
					backgroundImageUri: `${currentDomain}${PATH_TO_IMG}banner-bg.jpg`,
					title: BX.message('CALLMOBILE_SYNC_BUTTON_START_CALL'),
					description: BX.message('CALLMOBILE_SYNC_START_CALL_SUBTITLE'),
					onClick: () => {
						SyncAnalyticsController.sendStartCall();
						this.syncCallService.startCall();
					},
				}),
				View(
					{
						style: {
							marginTop: Indent.XL2.toNumber(),
						},
					},
					ActionRow({
						testId: 'card-join',
						iconUri: `${currentDomain}${PATH_TO_IMG}connect.png`,
						title: BX.message('CALLMOBILE_SYNC_CARD_JOIN_CALL'),
						description: BX.message('CALLMOBILE_SYNC_CARD_JOIN_CALL_DESC'),
						onClick: () => {
							SyncAnalyticsController.sendClickJoin();
							openJoinMeetingView(layout);
						},
					}),
				),
				View(
					{
						style: {
							marginTop: Indent.XL2.toNumber(),
						},
					},
					ActionRow({
						testId: 'card-schedule',
						iconUri: `${currentDomain}${PATH_TO_IMG}schedule.png`,
						title: BX.message('CALLMOBILE_SYNC_BUTTON_SCHEDULE_MEETING'),
						description: BX.message('CALLMOBILE_SYNC_CARD_SCHEDULE_DESC'),
						onClick: async () => {
							SyncAnalyticsController.sendClickCreateEvent();
							// eslint-disable-next-line no-undef
							const { Entry: CalendarEntry } = await requireLazy('calendar:entry');
							if (!CalendarEntry)
							{
								return;
							}

							void CalendarEntry.openEventEditForm({
								ownerId: env.userId,
								calType: 'user',
								eventType: '#call_sync#',
							});
						},
					}),
				),
				View(
					{
						style: {
							marginTop: Indent.XL2.toNumber(),
						},
					},
					ActionRow({
						testId: 'card-free-slots',
						iconUri: `${currentDomain}${PATH_TO_IMG}online-booking.png`,
						title: BX.message('CALLMOBILE_SYNC_CARD_FREE_SLOTS'),
						description: BX.message('CALLMOBILE_SYNC_CARD_FREE_SLOTS_DESC'),
						onClick: async () => {
							SyncAnalyticsController.sendClickOpenSlots();
							/* eslint-disable no-undef */
							const [
								{ Sharing, SharingContext },
								{ DialogSharing },
								{ FeatureId },
								{ getFeatureRestriction },
								{ BottomSheet },
								{ Color },
							] = await Promise.all([
								requireLazy('calendar:sharing'),
								requireLazy('calendar:layout/dialog/dialog-sharing'),
								requireLazy('calendar:enums'),
								requireLazy('tariff-plan-restriction'),
								requireLazy('bottom-sheet'),
								requireLazy('tokens'),
							]);
							/* eslint-enable no-undef */

							const {
								isRestricted,
								showRestriction,
							} = getFeatureRestriction(FeatureId.CALENDAR_SHARING);

							if (isRestricted())
							{
								showRestriction({
									parentWidget: layout,
								});

								return;
							}

							const sharing = new Sharing({
								type: SharingContext.CALENDAR,
							});

							const initPromise = sharing.init();

							const component = (layoutWidget) => {
								const dialog = new DialogSharing({
									layoutWidget,
									sharing,
									onSharing: (fields) => {
										sharing.getModel().setFields(fields);
									},
								});

								void initPromise.then(() => {
									dialog.setState({
										model: {
											...sharing.getModel().getFieldsValues(),
										},
									});
								});

								return dialog;
							};

							void new BottomSheet({ component })
								.setBackgroundColor(Color.bgNavigation.toHex())
								.setMediumPositionPercent(70)
								.disableContentSwipe()
								.open()
							;
						},
					}),
				),
			);
		}

		renderCallListContent()
		{
			const callItems = this.callListService.getSortedItems();
			const isSearch = this.state.isSearchMode;
			const noData = (this.state.allItems.length === 0);
			const showBodyLoader = (
				((!this.state.isReady) && !isSearch)
				|| ((this.callListService.isFetching && noData) && !isSearch)
				|| (this.state.isLoadingTab && this.callListService.wasEmptyBeforeSwitch && !isSearch)
			);
			const showEmptyState = (
				!showBodyLoader
				&& !isSearch
				&& !this.state.isLoadingTab
				&& callItems.length === 0
			);

			const loaderView = View(
				{
					style: {
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				this.callListService.loader,
			);

			const listView = ListView({
				items: callItems,
				testId: 'sync-callList',
				style: {
					flex: 1,
				},
				onRefresh: () => this.onRefresh(),
				isRefreshing: this.state.isRefreshing,
				hasMore: (!showBodyLoader && this.callListService.hasMore && !isSearch),
				onLoadMore: (!showBodyLoader && this.callListService.hasMore && !isSearch)
					? () => this.callListService.fetchList(false)
					: null,
				onItemClick: (item) => this.callListService.startCall(item),
				onOpenChat: (item) => this.callListService.openChat(item),
				onDelete: (item) => this.callListService.deleteCallItem(item),
			});

			const emptyView = EmptyView({
				text: this.callListService.getTabEmptyStateText(),
			});

			let content = listView;
			if (showBodyLoader)
			{
				content = loaderView;
			}
			else if (showEmptyState)
			{
				content = emptyView;
			}

			return View(
				{
					style: {
						flex: 1,
					},
				},
				content,
			);
		}

		render()
		{
			const { activeTab } = this.state;

			return View(
				{
					style: {
						flex: 1,
					},
				},
				this.renderTopTabs(),
				activeTab === ACTIVE_TAB.HOME
					? this.renderHomeContent()
					: this.renderCallListContent(),
			);
		}
	}

	layout.showComponent(new SyncComponent());
})();
