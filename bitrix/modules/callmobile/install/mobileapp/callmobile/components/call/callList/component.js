/*
* @module call/callList/component
*/
(() => {
	const require = (ext) => jn.require(ext);
	const { LoaderItem } = require('im/messenger/lib/ui/base/loader');
	const { parseStatusTime, restCall } = require('call/callList/utils');
	const { Tabs } = require('call/callList/tabs');
	const { ListView } = require('call/callList/listView');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const { openFastCallView } = require('call/callList/fastCallView');
	const { CallLogType } = require('call/const');
	const { EmptyView } = require('call/callList/emptyView');
	const { SearchController } = require('call/callList/searchController');
	const { CallListAnalyticsController } = require('call/callList/analyticsController');
	const { Icon } = require('ui-system/blocks/icon');

	const SITE_ID = BX.componentParameters.get('SITE_ID', 's1');
	const PER_PAGE = 40;
	const COMPONENT_ID = 'CALL_LIST';
	const TAB_ID = 'call_list';

	const SCOPES = Object.freeze({
		ALL: 'all',
		MISSED: CallLogType.Status.MISSED,
		INCOMING: CallLogType.Type.INCOMING,
		OUTGOING: CallLogType.Type.OUTGOING,
	});

	const TAB_EMPTY_STATE_TEXTS = Object.freeze({
		[SCOPES.ALL]: {
			title: BX.message('MOBILEAPP_EMPTY_TAB_MAIN_TITLE'),
			description: BX.message('MOBILEAPP_EMPTY_TAB_MAIN_DESCRIPTION'),
		},
		[SCOPES.MISSED]: {
			title: BX.message('MOBILEAPP_EMPTY_TAB_MISSED'),
		},
		[SCOPES.INCOMING]: {
			title: BX.message('MOBILEAPP_EMPTY_TAB_INCOMING'),
		},
		[SCOPES.OUTGOING]: {
			title: BX.message('MOBILEAPP_EMPTY_TAB_OUTGOING'),
		},
	});

	const FILTER_BY_SCOPE = Object.freeze({
		[SCOPES.MISSED]: { STATUS: CallLogType.Status.MISSED },
		[SCOPES.INCOMING]: { STATUS: CallLogType.Status.ANSWERED },
		[SCOPES.OUTGOING]: { TYPE: CallLogType.Type.OUTGOING },
		[SCOPES.ALL]: {},
	});

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
				isTestOk: false,
				searchQuery: '',
				isSearchMode: false,
				searchItems: [],
				isLoadingTab: false,
			};

			this.isFetching = false;
			this.hasMore = true;
			this.lastId = 0;
			this.unsubscribeFromPull = null;
			this.wasEmptyBeforeSwitch = false;
			this.loader = new LoaderItem(
				{
					enable: true,
					text: BX.message('MOBILEAPP_LOADING_TEXT'),
				},
			);
			this.searchController = new SearchController(this);

			BX.addCustomEvent('onUpdateUserCounters', this.onUpdateUserCounters.bind(this));
			BX.addCustomEvent('onTabsSelected', this.onTabsSelected.bind(this));
			BX.addCustomEvent('onTabsReSelected', this.onTabsReSelected.bind(this));
			BX.addCustomEvent('onAppActive', this.onAppActive.bind(this));

			this.pullSubscribe();
			this.fetchList(true);
		}

		componentDidMount()
		{
			this.isMountedFlag = true;
			this.searchController.setupSearch();
			this.initFloatingButton();
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
			if (this.unsubscribeFromPull)
			{
				this.unsubscribeFromPull();
				this.unsubscribeFromPull = null;
			}

			BX.removeCustomEvent('onUpdateUserCounters', this.onUpdateUserCounters.bind(this));
			BX.removeCustomEvent('onTabsSelected', this.onTabsSelected.bind(this));
			BX.removeCustomEvent('onTabsReSelected', this.onTabsReSelected.bind(this));
			BX.removeCustomEvent('onAppActive', this.onAppActive.bind(this));

			this.isMountedFlag = false;
			this.cleanupOnExit();
		}

		onAppActive()
		{
			if (this.isMountedFlag)
			{
				this.fetchList(true);
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
					await this.fetchList(true);
				}
				finally
				{
					this.setState({ isRefreshing: false });
				}
			});
		}

		onTabsSelected(id)
		{
			if (String(id) === TAB_ID)
			{
				this.isMountedFlag = true;
				CallListAnalyticsController.sendOpenCallTab();
			}
			else if (this.isMountedFlag)
			{
				this.isMountedFlag = false;
				this.cleanupOnExit();
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

		onBadgeUpdate(count)
		{
			Application.setBadges({ call_list: count });
		}

		onUpdateUserCounters(data)
		{
			const counters = data?.[SITE_ID];
			if (!counters)
			{
				return;
			}

			if (typeof counters.call_list === 'undefined' && typeof counters.CALL_LIST === 'undefined')
			{
				return;
			}

			const missed = Number(counters.call_list ?? counters.CALL_LIST) || 0;
			this.applyMissedCount(missed);
		}

		applyMissedCount(nextMissed)
		{
			this.setState({ missedCount: nextMissed });
			this.onBadgeUpdate(nextMissed);
		}

		recalcMissedCountFrom(items)
		{
			return items.filter((item) => item.status === CallLogType.Status.MISSED && item.isUnseen).length;
		}

		computeTabItems(items, scopeId)
		{
			if (scopeId === CallLogType.Status.MISSED)
			{
				return items.filter((item) => item.status === CallLogType.Status.MISSED);
			}

			if (scopeId === CallLogType.Type.INCOMING)
			{
				return items.filter((item) => (
					item.type === CallLogType.Type.INCOMING && item.status !== CallLogType.Status.MISSED
				));
			}

			if (scopeId === CallLogType.Type.OUTGOING)
			{
				return items.filter((item) => item.type === CallLogType.Type.OUTGOING);
			}

			return items;
		}

		pullSubscribe()
		{
			this.unsubscribeFromPull = BX.PULL.subscribe({
				moduleId: 'call',
				callback: (data) => this.processPullEvent(data),
			});
		}

		processPullEvent(data)
		{
			const command = data?.command || '';
			const params = data?.params || {};

			switch (command)
			{
				case 'Call::callLogAdd':
					this.onCallLogAdd(params);
					break;
				case 'Call::callLogUpdate':
					this.onCallLogUpdate(params);
					break;
				case 'Call::callLogCounterUpdate':
					this.onCallLogCounterUpdate(params);
					break;
				default:
			}
		}

		onCallLogAdd(params)
		{
			const callData = {
				id: params.id,
				statusTime: params.statusTime,
				sourceType: params.sourceType,
				sourceCallId: params.sourceCallId,
				userId: params.userId,
				status: params.status,
				chatInfo: params.chatInfo,
				callData: params.callData || {},
				isUnseen: params.isUnseen,
				type: params.type,
			};

			const mappedCall = this.normalizeCallData(callData);
			const callId = String(mappedCall.id);

			this.setState((prev) => {
				const existingIndex = prev.allItems.findIndex((item) => String(item.id) === callId);
				const allItems = existingIndex === -1
					? [mappedCall, ...prev.allItems]
					: prev.allItems.map((item, index) => (index === existingIndex ? mappedCall : item));

				const tabItems = this.computeTabItems(allItems, prev.selectedScopeId);
				const missedCount = this.recalcMissedCountFrom(allItems);
				this.applyMissedCount(missedCount);

				return { allItems, tabItems, missedCount };
			});
		}

		onCallLogUpdate(params)
		{
			const callData = {
				id: params.id,
				statusTime: params.statusTime,
				sourceType: params.sourceType,
				sourceCallId: params.sourceCallId,
				userId: params.userId,
				status: params.status,
				chatInfo: params.chatInfo,
				callData: params.callData || {},
				isUnseen: params.isUnseen,
				type: params.type,
				previousStatus: params.previousStatus,
			};

			const mappedCall = this.normalizeCallData(callData);

			this.setState((prev) => {
				const allItems = prev.allItems.map((item) => {
					if (String(item.id) === String(mappedCall.id))
					{
						return mappedCall;
					}

					return item;
				});

				const tabItems = this.computeTabItems(allItems, prev.selectedScopeId);
				const missedCount = this.recalcMissedCountFrom(allItems);
				this.applyMissedCount(missedCount);

				return { allItems, tabItems, missedCount };
			});
		}

		onCallLogCounterUpdate(params)
		{
			const callIds = params.callIds || [];
			const counterValue = params.counterValue ?? null;

			if (counterValue !== null)
			{
				this.applyMissedCount(Number(counterValue));
			}

			if (callIds.length > 0)
			{
				this.setState((prev) => {
					const allItems = prev.allItems.map((item) => {
						if (callIds.includes(item.id))
						{
							return {
								...item,
								isUnseen: false,
							};
						}

						return item;
					});

					const tabItems = this.computeTabItems(allItems, prev.selectedScopeId);

					return { allItems, tabItems };
				});
			}
		}

		cleanupOnExit()
		{
			this.clearMissedTimer();
			this.searchController.cleanup();

			this.markAllAsSeen();
		}

		startSeenTimerIfNeeded()
		{
			if (!this.isMountedFlag)
			{
				return;
			}

			if (this.state.selectedScopeId === CallLogType.Status.MISSED)
			{
				this.scheduleMissedTimer();
			}
		}

		clearMissedTimer()
		{
			if (this.markTimer)
			{
				clearTimeout(this.markTimer);
				this.markTimer = null;
			}
		}

		scheduleMissedTimer()
		{
			// existing timer check
			if (this.markTimer)
			{
				return;
			}

			const missedCount = Number(this.state.missedCount || 0);
			const hasUnseenOnTab = (this.state.selectedScopeId === CallLogType.Status.MISSED)
				? this.state.tabItems.some((item) => item.status === CallLogType.Status.MISSED && item.isUnseen === true)
				: false;
			if (missedCount > 0 || hasUnseenOnTab)
			{
				this.markTimer = setTimeout(() => this.markMissedAsSeen(), 1000);
			}
		}

		markMissedAsSeen()
		{
			if (this.state.selectedScopeId !== CallLogType.Status.MISSED)
			{
				return;
			}
			this.clearMissedTimer();

			restCall('call.CallLog.markAllAsSeen', { scope: CallLogType.Status.MISSED })
				.then(() => {
					// locally drop of missed calls badge
					this.setState((prev) => {
						const allItems = prev.allItems.map((item) => (
							item.status === CallLogType.Status.MISSED ? { ...item, isUnseen: false } : item
						));
						const missedCount = 0;
						this.applyMissedCount(missedCount);

						return { allItems, missedCount };
					});

					this.fetchList(true);
				})
				.catch((e) => {
					console.error('[CallList][markMissedAsSeen][rest][error]', e);
				});
		}

		// when we left from missed tab - drop badges
		onTabChange(scopeId)
		{
			if (this.state.selectedScopeId === SCOPES.MISSED)
			{
				this.clearMissedTimer();
			}

			const selectedScopeId = String(scopeId);

			this.wasEmptyBeforeSwitch = (this.state.tabItems.length === 0);

			this.setState({
				selectedScopeId,
				isLoadingTab: true,
			}, () => {
				this.fetchList(true);

				if (selectedScopeId === SCOPES.MISSED)
				{
					this.scheduleMissedTimer();
				}

				if (selectedScopeId !== SCOPES.ALL)
				{
					CallListAnalyticsController.sendTabChange(selectedScopeId);
				}
			});
		}

		normalizeCallData(api)
		{
			const statusTime = api?.statusTime || null;
			const ts = parseStatusTime(statusTime);
			const sourceType = api?.sourceType || '';
			const callData = api?.callData || {};
			const { title, phone } = this.extractTitleAndPhone(sourceType, callData);
			const id = String(api?.id ?? '');

			return {
				id,
				key: id,
				ts,
				title,
				phone,
				sourceType,
				dialogId: (callData?.dialogId ? String(callData.dialogId) : ''),
				chatId: Number(callData.chatId) || 0,
				chatType: (callData?.chatType || ''),
				avatar: (callData?.avatar || ''),
				color: (callData?.color || ''),
				type: (api?.type === CallLogType.Type.INCOMING
					? CallLogType.Type.INCOMING
					: CallLogType.Type.OUTGOING),
				status: (api?.status === CallLogType.Status.MISSED ? CallLogType.Status.MISSED : CallLogType.Status.ANSWERED),
				isUnseen: Boolean(api?.isUnseen),
				duration: callData?.duration || 0,
				userCount: callData?.userCount || 0,
			};
		}

		extractTitleAndPhone(sourceType, callData)
		{
			let title = '';
			let phone = '';

			if (sourceType === 'voximplant')
			{
				title = callData.phoneNumber || callData.displayName || '';
				phone = callData.phoneNumber || '';
			}
			else if (sourceType === 'call')
			{
				title = callData.title || '';
			}

			return { title, phone };
		}

		async markAllAsSeen()
		{
			try
			{
				await restCall('call.CallLog.markAllAsSeen', {});

				this.setState((prev) => {
					const allItems = prev.allItems.map((item) => ({
						...item,
						isUnseen: (item.status === CallLogType.Status.MISSED ? false : item.isUnseen),
					}));
					const missedCount = 0;
					this.applyMissedCount(missedCount);

					return { allItems, missedCount };
				});

				this.fetchList(true);
			}
			catch (e)
			{
				console.error('[CallList][markAllAsSeen][error]', e);
			}
		}

		async fetchList(reset)
		{
			if (this.isFetching)
			{
				return Promise.resolve();
			}
			this.isFetching = true;

			try
			{
				const selectedScopeId = this.state.selectedScopeId;
				const isInitial = (this.lastId === 0 && this.state.allItems.length === 0);
				if (reset)
				{
					this.lastId = 0;
					this.hasMore = true;
				}

				const filter = {
					...(FILTER_BY_SCOPE[selectedScopeId]),
				};

				const payload = await restCall('call.CallLog.list', {
					filter,
					lastId: this.lastId,
					count: PER_PAGE,
				});

				const calls = (payload?.calls && Array.isArray(payload.calls))
					? payload.calls
					: (payload?.result?.calls || []);

				const mapped = calls.map((callData) => this.normalizeCallData(callData));

				this.lastId = (calls.length > 0) ? Number(calls[calls.length - 1].id) : this.lastId;
				this.hasMore = (calls.length === PER_PAGE);
				this.setState((prev) => {
					if (prev.selectedScopeId !== selectedScopeId)
					{
						return prev;
					}

					const list = reset ? mapped : [...prev.allItems, ...mapped];
					const tabItems = this.computeTabItems(list, selectedScopeId);
					let missedCount = prev.missedCount;
					if (selectedScopeId === SCOPES.ALL)
					{
						missedCount = this.recalcMissedCountFrom(list);
						this.applyMissedCount(missedCount);
					}

					return {
						allItems: list,
						tabItems,
						isReady: (isInitial ? true : prev.isReady),
						missedCount,
						isLoadingTab: false,
					};
				}, () => {
					this.wasEmptyBeforeSwitch = false;
				});

				this.startSeenTimerIfNeeded();

				return Promise.resolve();
			}
			catch (e)
			{
				console.error('[CallList][list][error]', e);
				this.setState((prev) => prev);

				return Promise.reject(e);
			}
			finally
			{
				this.isFetching = false;
			}
		}

		startCall(item)
		{
			const dialogIdRaw = String(item.dialogId || '');
			const isGroup = dialogIdRaw.startsWith('chat') || item.chatType === 'group';
			const avatarRel = String(item.avatar || '');
			const avatarUri = avatarRel ? `${currentDomain}${avatarRel}` : null;

			CallListAnalyticsController.sendCallClick(item, this.state.isSearchMode, this.state.selectedScopeId);

			// telephony call
			if (item.phone)
			{
				this.startPhoneCall(item.phone);

				return;
			}

			// groups and conference call
			if (isGroup)
			{
				this.startGroupCall(item, dialogIdRaw, avatarUri);

				return;
			}

			// plain call 1 by 1
			this.startPrivateCall(item, dialogIdRaw, avatarUri);
		}

		startPhoneCall(phone)
		{
			BX.postComponentEvent('onPhoneTo', [{ number: phone }], 'calls');
		}

		startGroupCall(item, dialogIdRaw, avatarUri)
		{
			const chatId = item.chatId || (dialogIdRaw.startsWith('chat') ? Number(dialogIdRaw.replace('chat', '')) : 0);
			if (chatId > 0)
			{
				const dialogId = dialogIdRaw || `chat${chatId}`;
				const eventData = {
					dialogId,
					video: false,
					chatData: {
						dialogId,
						chatId,
						name: item.title,
						avatar: avatarUri,
						userCounter: item.userCount,
					},
				};
				BX.postComponentEvent('onCallInvite', [eventData], 'calls');
			}
		}

		startPrivateCall(item, dialogIdRaw, avatarUri)
		{
			const isUserId = item.chatType === 'private';
			if (isUserId)
			{
				const userId = Number(dialogIdRaw || 0);

				if (!userId)
				{
					return;
				}

				const eventData = {
					userId,
					video: false,
					chatData: {
						dialogId: userId,
						chatId: item.chatId,
						name: item.title,
						avatar: avatarUri,
					},
					userData: {
						[userId]: {
							id: userId,
							name: item.title,
							avatar: avatarUri,
						},
					},
				};
				BX.postComponentEvent('onCallInvite', [eventData], 'calls');
			}
		}

		getSortedItems()
		{
			if (this.state.isSearchMode)
			{
				// Если searchItems === null, возвращаем пустой массив
				if (this.state.searchItems === null)
				{
					return [];
				}

				return [...this.state.searchItems].sort((a, b) => (b.ts || 0) - (a.ts || 0));
			}

			const items = this.state.tabItems.length > 0 ? this.state.tabItems : this.state.allItems;

			return [...items].sort((a, b) => (b.ts || 0) - (a.ts || 0));
		}

		getTabEmptyStateText()
		{
			const { selectedScopeId } = this.state;

			return TAB_EMPTY_STATE_TEXTS[selectedScopeId] || TAB_EMPTY_STATE_TEXTS[SCOPES.ALL];
		}

		openChat(item)
		{
			const dialogIdRaw = String(item.dialogId || (item.chatId ? `chat${item.chatId}` : ''));
			if (dialogIdRaw)
			{
				CallListAnalyticsController.sendOpenChat();
				DialogOpener.open({ dialogId: dialogIdRaw });
			}
		}

		deleteCallItem(item)
		{
			const callId = Number(item.id) || item.id;

			CallListAnalyticsController.sendDeleteCall(item, this.state.selectedScopeId);

			restCall('call.CallLog.delete', { callId })
				.then(() => {
					this.setState((prev) => {
						const allItems = prev.allItems.filter((callItem) => String(callItem.id) !== String(item.id));
						const tabItems = prev.tabItems.filter((callItem) => String(callItem.id) !== String(item.id));
						const missedCount = this.recalcMissedCountFrom(allItems);
						this.applyMissedCount(missedCount);

						return { allItems, tabItems, missedCount };
					});
				})
				.catch((e) => console.error('[CallList][delete][error]', e));
		}

		render()
		{
			const callItems = this.getSortedItems();
			const isSearch = this.state.isSearchMode;
			const noData = (this.state.allItems.length === 0);
			const showBodyLoader = (
				((!this.state.isReady) && !isSearch)
				|| ((this.isFetching && noData) && !isSearch)
				|| (this.state.isLoadingTab && this.wasEmptyBeforeSwitch && !isSearch)
			);
			const unseenMissed = Number(this.state.missedCount || 0);
			const showEmptyState = (
				!showBodyLoader
				&& !isSearch
				&& !this.state.isLoadingTab
				&& callItems.length === 0
			);

			const loaderView = View({
				style: {
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
				},
			}, this.loader);

			const listView = ListView({
				items: callItems,
				testId: COMPONENT_ID,
				style: {
					flex: 1,
				},
				onRefresh: () => this.onRefresh(),
				isRefreshing: this.state.isRefreshing,
				hasMore: (!showBodyLoader && this.hasMore && !isSearch),
				onLoadMore: (!showBodyLoader && this.hasMore && !isSearch) ? () => this.fetchList(false) : null,
				onItemClick: (item) => this.startCall(item),
				onOpenChat: (item) => this.openChat(item),
				onDelete: (item) => this.deleteCallItem(item),
			});

			const emptyView = EmptyView({
				text: this.getTabEmptyStateText(),
			});

			return View(
				{
					style: {
						flex: 1,
					},
				},
				Tabs({
					selectedScopeId: this.state.selectedScopeId,
					missedTotal: unseenMissed,
					onScrollRef: (ref) => {
						this.tabsScrollRef = ref;
					},
					onChange: (scopeId) => this.onTabChange(scopeId),
				}),
				(showBodyLoader
					? loaderView
					: (showEmptyState
						? emptyView
						: listView
					)
				),
			);
		}
	}

	layout.showComponent(new CallsListComponent());
})();
