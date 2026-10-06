/*
 * @module call/callList/core
 */
jn.define('call/callList/core', (require, exports, module) => {
	const { CallLogType } = require('call/const');
	const { restCall, parseStatusTime } = require('call/callList/utils');
	const { CallListAnalyticsController } = require('call/callList/analyticsController');
	const { SearchController } = require('call/callList/searchController');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const { LoaderItem } = require('im/messenger/lib/ui/base/loader');

	const PER_PAGE = 40;

	const SCOPES = Object.freeze({
		ALL: 'all',
		MISSED: CallLogType.Status.MISSED,
		INCOMING: CallLogType.Type.INCOMING,
		OUTGOING: CallLogType.Type.OUTGOING,
	});

	const FILTER_BY_SCOPE = Object.freeze({
		[SCOPES.MISSED]: { STATUS: CallLogType.Status.MISSED },
		[SCOPES.INCOMING]: {
			STATUS: [
				CallLogType.Status.ANSWERED,
				CallLogType.Status.DECLINED,
			],
		},
		[SCOPES.OUTGOING]: { TYPE: CallLogType.Type.OUTGOING },
		[SCOPES.ALL]: {},
	});

	const ACTION_SHEET_BUTTONS = Object.freeze({
		OUTSIDE_TAP: 0,
		PHONE_CALL: 1,
		PHONE_CANCEL: 2,
		CALL_WITH_VIDEO: 1,
		CALL_WITHOUT_VIDEO: 2,
		OPEN_CHAT: 3,
		CALL_CANCEL: 4,
	});

	const IS_ANDROID_PLATFORM = Application.getPlatform() === 'android';

	const SITE_ID = BX.componentParameters.get('SITE_ID', 's1');

	class CallListService
	{
		constructor(config)
		{
			this.setState = config.setState;
			this.getState = config.getState;
			this.isMounted = config.isMounted;
			this.layout = config.layout;

			this.isFetching = false;
			this.hasMore = true;
			this.lastId = 0;
			this.unsubscribeFromPull = null;
			this.wasEmptyBeforeSwitch = false;
			this.markTimer = null;

			this.loader = new LoaderItem({
				enable: true,
				text: BX.message('MOBILEAPP_LOADING_TEXT'),
			});

			this.searchController = new SearchController(this);
		}

		init()
		{
			this.pullSubscribe();

			return this.fetchList(true);
		}

		destroy()
		{
			this.pullUnsubscribe();
			this.clearMissedTimer();
			this.searchController.cleanup();
			this.markAllAsSeen();
		}

		switchScope(scopeId)
		{
			if (this.getState().selectedScopeId === SCOPES.MISSED)
			{
				this.clearMissedTimer();
			}

			this.wasEmptyBeforeSwitch = (this.getState().tabItems.length === 0);

			this.setState({ selectedScopeId: String(scopeId), isLoadingTab: true }, () => {
				this.fetchList(true);

				if (scopeId === SCOPES.MISSED)
				{
					this.scheduleMissedTimer();
				}

				if (scopeId !== SCOPES.ALL)
				{
					CallListAnalyticsController.sendTabChange(scopeId);
				}
			});
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
				const selectedScopeId = this.getState().selectedScopeId;
				const isInitial = (this.lastId === 0 && this.getState().allItems.length === 0);

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
				console.error('[CallListService][fetchList][error]', e);
				this.setState((prev) => prev);

				return Promise.reject(e);
			}
			finally
			{
				this.isFetching = false;
			}
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
				status: (
					api?.status === CallLogType.Status.MISSED
					|| api?.status === CallLogType.Status.DECLINED
				)
					? api.status
					: CallLogType.Status.ANSWERED,
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

		getSortedItems()
		{
			const state = this.getState();

			if (state.isSearchMode)
			{
				if (state.searchItems === null)
				{
					return [];
				}

				return [...state.searchItems].sort((a, b) => (b.ts || 0) - (a.ts || 0));
			}

			const items = state.tabItems.length > 0 ? state.tabItems : state.allItems;

			return [...items].sort((a, b) => (b.ts || 0) - (a.ts || 0));
		}

		getTabEmptyStateText()
		{
			const { selectedScopeId } = this.getState();

			const TAB_EMPTY_STATE_TEXTS = {
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
			};

			return TAB_EMPTY_STATE_TEXTS[selectedScopeId] || TAB_EMPTY_STATE_TEXTS[SCOPES.ALL];
		}

		pullSubscribe()
		{
			if (this.unsubscribeFromPull)
			{
				return;
			}

			this.unsubscribeFromPull = BX.PULL.subscribe({
				moduleId: 'call',
				callback: (data) => this.processPullEvent(data),
			});
		}

		pullUnsubscribe()
		{
			if (this.unsubscribeFromPull)
			{
				this.unsubscribeFromPull();
				this.unsubscribeFromPull = null;
			}
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

				return { allItems, tabItems };
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

				return { allItems, tabItems };
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

		startCall(item)
		{
			const dialogIdRaw = String(item.dialogId || '');
			const isGroup = dialogIdRaw.startsWith('chat') || item.chatType === 'group';
			const isTelephonyCall = Boolean(item.phone) || item.sourceType === 'voximplant';
			const avatarRel = String(item.avatar || '');
			const avatarUri = avatarRel ? `${currentDomain}${avatarRel}` : null;
			const state = this.getState();

			CallListAnalyticsController.sendCallClick(item, state.isSearchMode, state.selectedScopeId);

			if (state.isSearchMode)
			{
				this.executeCall(item, dialogIdRaw, avatarUri, isGroup, isTelephonyCall);

				return;
			}

			if (isTelephonyCall)
			{
				this.showTelephonyCallActionSheet(item);

				return;
			}

			this.showCallActionSheet(item, dialogIdRaw, avatarUri, isGroup);
		}

		showTelephonyCallActionSheet(item)
		{
			navigator.notification.confirm(
				'',
				(button) => {
					if (button === ACTION_SHEET_BUTTONS.PHONE_CALL)
					{
						this.startPhoneCall(item.phone);
					}
				},
				BX.message('MOBILEAPP_CALL_LIST_ACTION_CALL_TELEPHONY_TITLE'),
				[
					BX.message('MOBILEAPP_CALL_LIST_ACTION_CALL_TELEPHONY'),
					BX.message('MOBILEAPP_CALL_LIST_ACTION_CANCEL'),
				],
			);
		}

		showCallActionSheet(item, dialogIdRaw, avatarUri, isGroup)
		{
			const buttons = IS_ANDROID_PLATFORM
				? [
					BX.message('MOBILEAPP_CALL_LIST_ACTION_WITHOUT_VIDEO'),
					BX.message('MOBILEAPP_CALL_LIST_ACTION_CANCEL'),
					BX.message('MOBILEAPP_CALL_LIST_ACTION_WITH_VIDEO'),
				]
				: [
					BX.message('MOBILEAPP_CALL_LIST_ACTION_WITH_VIDEO'),
					BX.message('MOBILEAPP_CALL_LIST_ACTION_WITHOUT_VIDEO'),
					BX.message('MOBILEAPP_CALL_LIST_ACTION_OPEN_CHAT'),
					BX.message('MOBILEAPP_CALL_LIST_ACTION_CANCEL'),
				];

			navigator.notification.confirm(
				'',
				(button) => {
					if (IS_ANDROID_PLATFORM)
					{
						if (button === 1)
						{
							this.executeCall(item, dialogIdRaw, avatarUri, isGroup, false, false);
						}

						if (button === 3)
						{
							this.executeCall(item, dialogIdRaw, avatarUri, isGroup, false, true);
						}

						return;
					}

					if (button === ACTION_SHEET_BUTTONS.OPEN_CHAT)
					{
						this.openChat(item);

						return;
					}

					if (
						button === ACTION_SHEET_BUTTONS.CALL_WITH_VIDEO
						|| button === ACTION_SHEET_BUTTONS.CALL_WITHOUT_VIDEO
					)
					{
						const video = button === ACTION_SHEET_BUTTONS.CALL_WITH_VIDEO;
						this.executeCall(item, dialogIdRaw, avatarUri, isGroup, false, video);
					}
				},
				BX.message('MOBILEAPP_CALL_LIST_ACTION_CALL_TITLE'),
				buttons,
			);
		}

		executeCall(item, dialogIdRaw, avatarUri, isGroup, isTelephonyCall, video = false)
		{
			if (isTelephonyCall)
			{
				this.startPhoneCall(item.phone);

				return;
			}

			if (isGroup)
			{
				this.startGroupCall(item, dialogIdRaw, avatarUri, video);

				return;
			}

			this.startPrivateCall(item, dialogIdRaw, avatarUri, video);
		}

		startPhoneCall(phone)
		{
			BX.postComponentEvent('onPhoneTo', [{ number: phone }], 'calls');
		}

		startGroupCall(item, dialogIdRaw, avatarUri, video = false)
		{
			const chatId = item.chatId || (dialogIdRaw.startsWith('chat') ? Number(dialogIdRaw.replace('chat', '')) : 0);

			if (chatId > 0)
			{
				const dialogId = dialogIdRaw || `chat${chatId}`;
				const eventData = {
					dialogId,
					video,
					chatData: {
						dialogId,
						chatId,
						name: item.title,
						avatar: avatarUri,
						color: item.color || '',
						userCounter: item.userCount,
					},
				};

				BX.postComponentEvent('onCallInvite', [eventData], 'calls');
			}
		}

		startPrivateCall(item, dialogIdRaw, avatarUri, video = false)
		{
			const isUserId = item.chatType === 'private';

			if (isUserId)
			{
				const userId = Number(dialogIdRaw || 0);

				if (!userId)
				{
					return;
				}

				const color = item.color || item.userColor || '';
				const eventData = {
					userId,
					video,
					chatData: {
						dialogId: userId,
						chatId: item.chatId,
						name: item.title,
						avatar: avatarUri,
						color,
					},
					userData: {
						[userId]: {
							id: userId,
							name: item.title,
							avatar: avatarUri,
							color,
						},
					},
				};

				BX.postComponentEvent('onCallInvite', [eventData], 'calls');
			}
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
			const state = this.getState();

			CallListAnalyticsController.sendDeleteCall(item, state.selectedScopeId);

			restCall('call.CallLog.delete', { callId })
				.then(() => {
					this.setState((prev) => {
						const allItems = prev.allItems.filter(
							(callItem) => String(callItem.id) !== String(item.id),
						);
						const tabItems = prev.tabItems.filter(
							(callItem) => String(callItem.id) !== String(item.id),
						);
						const missedCount = this.recalcMissedCountFrom(allItems);
						this.applyMissedCount(missedCount);

						return { allItems, tabItems, missedCount };
					});
				})
				.catch((e) => console.error('[CallListService][deleteCallItem][error]', e));
		}

		applyMissedCount(nextMissed)
		{
			this.setState({ missedCount: nextMissed });
			this.onBadgeUpdate(nextMissed);
		}

		recalcMissedCountFrom(items)
		{
			return items.filter(
				(item) => item.status === CallLogType.Status.MISSED && item.isUnseen,
			).length;
		}

		onBadgeUpdate(count)
		{
			Application.setBadges({ call_list: count });
			BX.postComponentEvent('ImRecent::counter::list', [{ call_list: count }], 'communication');
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

		onAppActive()
		{
			if (this.isMounted())
			{
				this.fetchList(true);
			}
		}

		markMissedAsSeen()
		{
			if (this.getState().selectedScopeId !== CallLogType.Status.MISSED)
			{
				return;
			}

			this.clearMissedTimer();

			restCall('call.CallLog.markAllAsSeen', { scope: CallLogType.Status.MISSED })
				.then(() => {
					this.setState((prev) => {
						const allItems = prev.allItems.map(
							(item) => (item.status === CallLogType.Status.MISSED ? { ...item, isUnseen: false } : item),
						);
						const missedCount = 0;
						this.applyMissedCount(missedCount);

						return { allItems, missedCount };
					});

					this.fetchList(true);
				})
				.catch((e) => {
					console.error('[CallListService][markMissedAsSeen][rest][error]', e);
				});
		}

		async markAllAsSeen()
		{
			const state = this.getState();

			if (!this.isFetching && state.allItems.length === 0)
			{
				return;
			}

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
				console.error('[CallListService][markAllAsSeen][error]', e);
			}
		}

		startSeenTimerIfNeeded()
		{
			if (!this.isMounted())
			{
				return;
			}

			if (this.getState().selectedScopeId === CallLogType.Status.MISSED)
			{
				this.scheduleMissedTimer();
			}
		}

		scheduleMissedTimer()
		{
			if (this.markTimer)
			{
				return;
			}

			const state = this.getState();
			const missedCount = Number(state.missedCount || 0);
			const hasUnseenOnTab = (state.selectedScopeId === CallLogType.Status.MISSED)
				? state.tabItems.some(
					(item) => item.status === CallLogType.Status.MISSED && item.isUnseen === true,
				)
				: false;

			if (missedCount > 0 || hasUnseenOnTab)
			{
				this.markTimer = setTimeout(() => this.markMissedAsSeen(), 1000);
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
	}

	module.exports = { CallListService, SCOPES, FILTER_BY_SCOPE, PER_PAGE };
});
