/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, call_lib_syncTabBannerLauncher, im_call_compatible, main_core, main_core_events, im_v2_application_core, im_v2_const, im_v2_lib_logger, im_v2_provider_service_chat, call_application_conferenceChannel, call_const, call_mapping, call_engine_registry, call_lib_callSliderManager, im_public, im_v2_lib_promo, im_v2_lib_slider, im_v2_lib_soundNotification, ui_buttons, im_v2_lib_access, ui_notification, im_v2_lib_feature) {
	'use strict';

	const createMessengerFacade = deps => {
		const {
			ui
		} = deps;
		const openMessenger = (dialogId, force = false) => {
			if (!force) {
				const dialog = deps.getDialog(dialogId);
				if (dialog && dialog.type === im_v2_const.ChatType.taskComments) {
					if (ui.isEmbeddedMode() || ui.isMessengerSliderOpened()) {
						return ui.openTaskComments(dialogId);
					}
					return Promise.resolve();
				}
			}
			const sidePanel = BX?.SidePanel?.Instance;
			const hasChatUnderSlider = sidePanel?.getOpenSlidersCount?.() > 0 && sidePanel?.getPageUrl?.()?.includes('/online/');
			if (hasChatUnderSlider) {
				const topSlider = sidePanel?.getTopSlider?.();
				if (topSlider?.close) {
					return new Promise(resolve => {
						topSlider.close(false, resolve);
					}).then(() => ui.openChat(dialogId));
				}
			}
			return ui.openChat(dialogId);
		};
		return {
			getDefaultZIndex: () => ui.sliderZIndex(),
			isMessengerOpen: () => ui.isSliderOpened(),
			isSliderFocused: () => ui.isSliderFocused(),
			isThemeDark: () => false,
			openMessenger,
			openHistory: dialogId => ui.openChat(dialogId),
			openSettings: () => ui.openSettings(),
			openHelpArticle: () => {},
			getMessageCount: () => deps.getMessageCount(),
			getCurrentDialogId: () => deps.getCurrentDialogId(),
			isPromoRequired: code => ui.isPromoRequired(code),
			repeatSound: (type, timeout, force) => ui.playSoundLoop(type, timeout, force),
			stopRepeatSound: type => ui.stopSound(type),
			showUserSelector: deps.showUserSelector,
			getCurrentUser: () => deps.getCurrentUser(),
			isCallJoinedOnDevice: callUuid => (deps.getRecentCalls() ?? []).some(item => item.call?.uuid === callUuid && item.state === im_v2_const.RecentCallStatus.joined)
		};
	};

	const methods$1 = {
		openChat(dialogId) {
			return im_public.Messenger.openChat(dialogId);
		},
		openConference(params) {
			return im_public.Messenger.openConference(params);
		},
		openSettings() {
			return im_public.Messenger.openSettings();
		},
		openTaskComments(dialogId) {
			return im_public.Messenger.openTaskComments(dialogId);
		},
		isEmbeddedMode() {
			return im_public.Messenger.isEmbeddedMode();
		},
		isMessengerSliderOpened() {
			return im_public.Messenger.isMessengerSliderOpened();
		},
		sliderZIndex() {
			return im_v2_lib_slider.MessengerSlider.getInstance().getZIndex();
		},
		isSliderOpened() {
			return im_v2_lib_slider.MessengerSlider.getInstance().isOpened();
		},
		isSliderFocused() {
			return im_v2_lib_slider.MessengerSlider.getInstance().isFocused();
		},
		isPromoRequired(code) {
			return im_v2_lib_promo.PromoManager.getInstance().needToShow(code);
		},
		markPromoWatched(code) {
			return im_v2_lib_promo.PromoManager.getInstance().markAsWatched(code);
		},
		playSoundLoop(type, timeout, force) {
			im_v2_lib_soundNotification.SoundNotificationManager.getInstance().playLoop(type, timeout, force);
		},
		stopSound(type) {
			im_v2_lib_soundNotification.SoundNotificationManager.getInstance().stop(type);
		}
	};
	const ImUiAdapter = new Proxy(methods$1, {
		get(target, property) {
			if (Reflect.has(target, property)) {
				return Reflect.get(target, property);
			}
			throw new Error(`ImUi: method "${String(property)}" is not registered in the adapter.`);
		}
	});

	const methods = {
		getCurrentUserId() {
			return im_v2_application_core.Core.getUserId();
		},
		getRecentCallByDialog(dialogId) {
			return im_v2_application_core.Core.getStore().getters['recent/calls/getCallByDialog'](dialogId) ?? null;
		},
		getRecentCalls() {
			return im_v2_application_core.Core.getStore().getters['recent/calls/get'];
		},
		hasActiveCall(dialogId) {
			return im_v2_application_core.Core.getStore().getters['recent/calls/hasActiveCall'](dialogId);
		},
		addActiveCall(params) {
			void im_v2_application_core.Core.getStore().dispatch('recent/calls/addActiveCall', params);
		},
		updateActiveCall(dialogId, fields) {
			void im_v2_application_core.Core.getStore().dispatch('recent/calls/updateActiveCall', {
				dialogId,
				fields
			});
		},
		deleteActiveCall(dialogId) {
			void im_v2_application_core.Core.getStore().dispatch('recent/calls/deleteActiveCall', {
				dialogId
			});
		},
		getChat(dialogId, full = false) {
			return im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, full);
		},
		addChat(fields) {
			void im_v2_application_core.Core.getStore().dispatch('chats/add', fields);
		},
		getUser(id) {
			return im_v2_application_core.Core.getStore().getters['users/get'](id);
		},
		isGuest(id) {
			return im_v2_application_core.Core.getStore().getters['users/isGuest'](id);
		},
		getTotalChatCounter() {
			return im_v2_application_core.Core.getStore().getters['counters/getTotalChatCounter'];
		},
		getLayout() {
			return im_v2_application_core.Core.getStore().getters['application/getLayout'];
		}
	};
	const ImStoreAdapter = new Proxy(methods, {
		get(target, property) {
			if (Reflect.has(target, property)) {
				return Reflect.get(target, property);
			}
			throw new Error(`ImStore: method "${String(property)}" is not registered in the adapter.`);
		}
	});

	function tryJoinCall(dialogId) {
		return main_core.ajax.runAction('call.Call.tryJoinCall', {
			data: {
				entityType: 'chat',
				entityId: dialogId,
				provider: call_mapping.Provider.Bitrix,
				callType: call_mapping.CallType.Instant
			}
		});
	}

	const openCallUserSelector = async params => {
		const handleAddClick = async () => {
			const selectedItems = dialog.getSelectedItems();
			const preparedItems = prepareUser(selectedItems);
			const userIds = preparedItems.map(item => String(item.id));
			const canAddChatUsers = await im_v2_lib_access.ChatAccessManager.canAddUsers(params.dialogId, userIds);
			if (!canAddChatUsers) {
				return;
			}
			params.onSelect({
				users: preparedItems
			});
		};
		const handleCancelCLick = () => {
			dialog.hide();
		};
		const {
			Dialog
		} = await main_core.Runtime.loadExtension('ui.entity-selector');
		const dialog = new Dialog({
			targetNode: params.bindElement,
			width: 400,
			enableSearch: true,
			dropdownMode: true,
			context: 'IM_CHAT_SEARCH',
			entities: [{
				id: 'user',
				dynamicLoad: true,
				itemOptions: {
					default: {
						linkTitle: '',
						link: ''
					}
				},
				options: {
					inviteEmployeeLink: false,
					'!userId': im_v2_application_core.Core.getUserId()
				},
				filters: [{
					id: 'im.userDataFilter'
				}]
			}],
			footer: getFooter(handleAddClick, handleCancelCLick),
			popupOptions: {
				targetContainer: params.targetContainer
			}
		});
		dialog.show();
		return Promise.resolve({
			close: () => {
				dialog.hide();
			}
		});
	};
	const prepareUser = users => {
		return users.map(user => {
			return {
				id: user.id,
				name: user.title?.text,
				avatar: user.avatar,
				avatar_hr: user.avatar,
				gender: user.customData.get('imUser').GENDER
			};
		});
	};
	const getFooter = (handleAddClick, handleCancelCLick) => {
		const addButtonTitle = main_core.Loc.getMessage('CALL_LIB_CALL_ADD_BUTTON');
		const cancelButtonTitle = main_core.Loc.getMessage('CALL_LIB_CALL_CANCEL_BUTTON');
		return main_core.Tag.render`
		<button class="ui-btn ui-btn-xs ui-btn-primary" onclick="${handleAddClick}">${addButtonTitle}</button>
		<button class="ui-btn ui-btn-xs ui-btn-light-border" onclick="${handleCancelCLick}">${cancelButtonTitle}</button>
	`;
	};

	const CALL_PHONE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M11.4898 9.16245L13.5108 10.6311C14.1215 11.081 14.1688 11.9701 13.6054 12.4772C11.4924 14.4356 7.97177 15.1958 3.33697 10.4435C-1.2979 5.69121 -0.376129 2.28926 1.73683 0.330898C2.29964 -0.176043 3.19623 -0.0921704 3.62458 0.52528L5.03805 2.53011C5.5331 3.26605 5.22041 4.26872 4.46091 4.76034L3.61245 5.30957C3.41748 5.43002 3.36316 5.6824 3.46778 5.87581C4.56505 7.74363 6.15032 9.3805 8.00435 10.5535C8.18926 10.657 8.45482 10.6035 8.58372 10.4328L9.18285 9.60919C9.70675 8.89133 10.7721 8.63946 11.4898 9.16245Z' fill='%2311A9D9'/%3E%3C/svg%3E";
	function notifyCallInAnotherTab() {
		const icon = `<img src="${CALL_PHONE_SVG}" width="14" height="14" style="vertical-align: middle; margin-right: 6px;" alt="">`;
		ui_notification.Center.notify({
			content: `${icon} ${main_core.Text.encode(main_core.Loc.getMessage('CALL_MULTI_TAB_BALLOON_TEXT') ?? '')}`,
			position: 'top-right',
			autoHideDelay: 10000,
			closeButton: true
		});
	}

	class ChatInfoProvider {
		#store;
		#createChatService;
		#chatTypes;
		#chatService = null;
		#onError;
		constructor(store, createChatService, chatTypes, onError) {
			this.#store = store;
			this.#createChatService = createChatService;
			this.#chatTypes = chatTypes;
			this.#onError = onError;
		}
		isConference(dialogId) {
			return this.#store.getChat(dialogId).type === this.#chatTypes.conference;
		}
		isUser(dialogId) {
			return this.#store.getChat(dialogId)?.type === this.#chatTypes.user;
		}
		buildPrepareData(dialogId) {
			const currentUserId = this.#store.getCurrentUserId();
			const currentUser = this.#store.getUser(currentUserId);
			const data = {
				dialogId,
				userData: {
					[currentUserId]: currentUser
				}
			};
			if (this.isUser(dialogId)) {
				const companion = this.#store.getUser(dialogId);
				data.user = companion.id;
				data.userData[companion.id] = companion;
			}
			return data;
		}
		async getChatInfo(dialogId) {
			const chatInfo = this.#store.getChat(dialogId, true);
			if (chatInfo.chatId === 0) {
				try {
					await this.#getChatService().loadChat(dialogId);
					return this.#prepareChatInfo(this.#store.getChat(dialogId, true));
				} catch (error) {
					this.#onError?.(error);
					return this.#prepareChatInfo(chatInfo);
				}
			}
			return this.#prepareChatInfo(chatInfo);
		}
		#getChatService() {
			if (!this.#chatService) {
				this.#chatService = this.#createChatService();
			}
			return this.#chatService;
		}
		#prepareChatInfo(chatInfo) {
			return {
				advanced: {
					chatType: chatInfo.type,
					entityType: chatInfo.entityType,
					entityId: chatInfo.entityId,
					entityData1: chatInfo.entityData1,
					entityData2: chatInfo.entityData2,
					entityData3: chatInfo.entityData3
				},
				id: chatInfo.dialogId,
				chatId: chatInfo.chatId,
				name: chatInfo.name,
				avatar: chatInfo.avatar || '/bitrix/js/im/images/blank.gif',
				avatarColor: chatInfo.color,
				type: 'chat',
				userCounter: chatInfo.userCounter
			};
		}
	}

	class CallAvailability {
		#store;
		#conference;
		#capabilities;
		#userTypes;
		constructor(store, conference, capabilities, userTypes) {
			this.#store = store;
			this.#conference = conference;
			this.#capabilities = capabilities;
			this.#userTypes = userTypes;
		}
		getCallUserLimit() {
			return this.#capabilities.getUserLimit();
		}
		chatCanBeCalled(dialogId) {
			return this.#checkCallSupport(dialogId) && !this.#store.hasActiveCall(dialogId);
		}
		hasActiveCurrentCall(dialogId, currentDialogId) {
			return this.#store.hasActiveCall(dialogId) && currentDialogId === dialogId;
		}
		hasActiveAnotherCall(dialogId, currentDialogId) {
			return this.#store.hasActiveCall() && !this.hasActiveCurrentCall(dialogId, currentDialogId);
		}
		hasActiveCallInDialog(dialogId) {
			return Boolean(this.#store.getRecentCallByDialog(dialogId));
		}
		isChatUserLimitExceeded(dialogId) {
			return this.#getChatUserCounter(dialogId) > this.getCallUserLimit();
		}
		#getChatUserCounter(dialogId) {
			return this.#store.getChat(dialogId, true).userCounter;
		}
		#checkCallSupport(dialogId) {
			const userId = Number(dialogId);
			if (!this.#checkGuestCallSupport(userId > 0)) {
				return false;
			}
			if (!this.#capabilities.isWebRTCSupported()) {
				return false;
			}
			return userId > 0 ? this.#checkUserCallSupport(userId) : this.#checkChatCallSupport(dialogId);
		}
		#checkGuestCallSupport(isPrivateTarget) {
			if (!this.#store.isGuest(this.#store.getCurrentUserId())) {
				return true;
			}
			return im_v2_lib_feature.FeatureManager.isFeatureAvailable(isPrivateTarget ? im_v2_lib_feature.Feature.isGuestOutgoingPrivateCallAvailable : im_v2_lib_feature.Feature.isGuestOutgoingCallAvailable);
		}
		#checkUserCallSupport(userId) {
			const user = this.#store.getUser(userId);
			const isBot = user.type === this.#userTypes.bot;
			return Boolean(user && user.status !== 'guest' && !isBot && !user.network && user.id !== this.#store.getCurrentUserId() && Boolean(user.lastActivityDate));
		}
		#checkChatCallSupport(dialogId) {
			const userCounter = this.#getChatUserCounter(dialogId);
			return (userCounter > 1 || this.#conference.isConference(dialogId)) && userCounter <= this.getCallUserLimit();
		}
	}

	class RecentCallsSync {
		#store;
		#deps;
		#onJoin;
		#onLeave;
		#onDestroy;
		#onCreated;
		constructor(store, deps) {
			this.#store = store;
			this.#deps = deps;
			this.#onJoin = event => this.#handleJoin(event);
			this.#onLeave = event => this.#handleLeave(event);
			this.#onDestroy = event => this.#handleDestroy(event);
			this.#onCreated = event => this.handleCallCreated(event.getData()[0].call);
		}
		start() {
			this.#deps.events.subscribe('CallEvents::callCreated', this.#onCreated);
		}
		stop() {
			this.#deps.events.unsubscribe('CallEvents::callCreated', this.#onCreated);
		}
		deleteRecentCall(dialogId) {
			this.#store.deleteActiveCall(dialogId);
		}
		updateFromActiveCalls(activeCalls) {
			const recentCalls = this.#store.getRecentCalls();
			const activeCallsMap = new Map(Object.values(activeCalls).map(call => [call.ID, call]));
			activeCallsMap.forEach(call => {
				const instance = this.#deps.instantiator.isLegacyCall(call.PROVIDER, call.SCHEME) ? this.#deps.instantiator.instantiateLegacy(call, call.USERS, call.LOG_TOKEN, call.CONNECTION_DATA, call.USER_DATA) : this.#deps.instantiator.instantiate(call, call.CALL_TOKEN, call.LOG_TOKEN, call.USER_DATA);
				this.#subscribeToCallEvents(instance);
			});
			recentCalls.filter(oldCall => !activeCallsMap.has(oldCall.call.id)).forEach(oldCall => this.#store.deleteActiveCall(oldCall.dialogId));
		}
		addMissingActiveCalls(activeCalls) {
			const existingUuids = this.#existingCallUuids();
			Object.values(activeCalls).forEach(call => {
				if (existingUuids.has(call.UUID)) {
					return;
				}
				if (this.#deps.instantiator.isFinished(call)) {
					return;
				}
				const instance = this.#deps.instantiator.isLegacyCall(call.PROVIDER, call.SCHEME) ? this.#deps.instantiator.instantiateLegacy(call, call.USERS, call.LOG_TOKEN, call.CONNECTION_DATA, call.USER_DATA) : this.#deps.instantiator.instantiate(call, call.CALL_TOKEN, call.LOG_TOKEN, call.USER_DATA);
				this.#subscribeToCallEvents(instance);
			});
		}
		hasMissingActiveCalls(activeCalls) {
			const existingUuids = this.#existingCallUuids();
			return Object.values(activeCalls).some(call => !existingUuids.has(call.UUID));
		}
		#existingCallUuids() {
			return new Set(this.#store.getRecentCalls().map(item => item.call?.uuid));
		}
		handleCallCreated(call) {
			const currentCall = this.#store.getRecentCallByDialog(call.associatedEntity.id);
			const isNewCall = currentCall?.call.uuid !== call.uuid;
			const state = this.#deps.connectedStates.includes(call.state) ? this.#deps.status.joined : this.#deps.status.waiting;
			if (isNewCall) {
				if (currentCall) {
					this.#unsubscribeFromCallEvents(currentCall.call);
				}
				this.#subscribeToCallEvents(call);
				this.#addChatToModel(call);
				this.#store.addActiveCall({
					dialogId: call.associatedEntity.id,
					name: call.associatedEntity.name,
					call,
					state
				});
				return;
			}
			this.#store.updateActiveCall(call.associatedEntity.id, {
				name: call.associatedEntity.name,
				state,
				call
			});
		}
		#handleJoin(event) {
			this.#store.updateActiveCall(event.call.associatedEntity.id, {
				state: this.#deps.status.joined
			});
		}
		#handleLeave(event) {
			this.#store.updateActiveCall(event.call.associatedEntity.id, {
				state: this.#deps.status.waiting
			});
		}
		#handleDestroy(event) {
			const dialogId = event.call.associatedEntity.id;
			const currentCall = this.#store.getRecentCallByDialog(dialogId);
			if (currentCall) {
				this.#unsubscribeFromCallEvents(currentCall.call);
			}
			if (currentCall?.call.uuid === event.call.uuid) {
				this.#store.deleteActiveCall(dialogId);
			}
		}
		#subscribeToCallEvents(call) {
			this.#deps.addCallListener(call, this.#deps.callEvent.onJoin, this.#onJoin);
			this.#deps.addCallListener(call, this.#deps.callEvent.onLeave, this.#onLeave);
			this.#deps.addCallListener(call, this.#deps.callEvent.onDestroy, this.#onDestroy);
		}
		#unsubscribeFromCallEvents(call) {
			this.#deps.removeCallListener(call, this.#deps.callEvent.onJoin, this.#onJoin);
			this.#deps.removeCallListener(call, this.#deps.callEvent.onLeave, this.#onLeave);
			this.#deps.removeCallListener(call, this.#deps.callEvent.onDestroy, this.#onDestroy);
		}
		#addChatToModel(call) {
			const entity = call.associatedEntity;
			this.#store.addChat({
				dialogId: entity.id,
				type: entity.advanced?.chatType,
				name: entity.name,
				avatar: entity.avatar,
				color: entity.avatarColor
			});
		}
	}

	class RecentReconcile {
		#deps;
		#pullOffline = true;
		#inFlight = false;
		#pending = false;
		#lastRunAt = 0;
		constructor(deps) {
			this.#deps = deps;
		}
		start() {
			if (!this.#deps.subscribePullStatus(data => this.#onPullStatusChange(data))) {
				this.#deps.onWarn('RecentReconcile: pull is unavailable, skipping pull status subscription');
			}
		}
		#onPullStatusChange(data) {
			if (data.status === this.#deps.pullStatus.online) {
				if (this.#pullOffline) {
					this.#pullOffline = false;
					void this.reconcile();
				}
				return;
			}
			if (data.status === this.#deps.pullStatus.offline) {
				this.#pullOffline = true;
			}
		}
		async reconcile() {
			if (this.#inFlight) {
				this.#pending = true;
				return;
			}
			const sinceLast = this.#deps.now() - this.#lastRunAt;
			if (sinceLast < this.#deps.minIntervalMs) {
				if (!this.#pending) {
					this.#pending = true;
					setTimeout(() => {
						this.#pending = false;
						void this.reconcile();
					}, this.#deps.minIntervalMs - sinceLast);
				}
				return;
			}
			this.#inFlight = true;
			try {
				const leanResponse = await this.#deps.fetchActiveCalls(false);
				const leanCalls = leanResponse?.data?.calls ?? {};
				if (this.#deps.hasMissingActiveCalls(leanCalls)) {
					const fullResponse = await this.#deps.fetchActiveCalls(true);
					this.#deps.addMissingActiveCalls(fullResponse?.data?.calls ?? {});
				}
				this.#lastRunAt = this.#deps.now();
			} catch (error) {
				this.#deps.onWarn('RecentReconcile: recent reconcile on pull online failed', error);
			} finally {
				this.#inFlight = false;
				if (this.#pending) {
					this.#pending = false;
					void this.reconcile();
				}
			}
		}
	}

	class GuestJoinHandler {
		#store;
		#deps;
		#handler;
		constructor(store, deps) {
			this.#store = store;
			this.#deps = deps;
			this.#handler = event => {
				void this.handleGuestIdentified(event.getData());
			};
		}
		start() {
			this.#deps.guestEvents.forEach(event => this.#deps.events.subscribe(event, this.#handler));
		}
		stop() {
			this.#deps.guestEvents.forEach(event => this.#deps.events.unsubscribe(event, this.#handler));
		}
		async handleGuestIdentified(payload) {
			const dialogId = payload?.dialogId;
			if (!dialogId || typeof dialogId !== 'string' && typeof dialogId !== 'number') {
				this.#deps.onWarn?.('CallManager: guestIdentified: invalid payload', payload);
				return;
			}
			const normalizedDialogId = String(dialogId);
			if (this.#deps.hasActiveCurrentCall(normalizedDialogId)) {
				return;
			}
			const storeItem = this.#store.getRecentCallByDialog(normalizedDialogId);
			if (storeItem !== null && storeItem !== undefined) {
				const storeCall = storeItem.call;
				this.#deps.join(storeCall.id, storeCall.uuid, normalizedDialogId, true);
				return;
			}
			let response;
			try {
				response = await this.#deps.tryJoinCall(normalizedDialogId);
			} catch (error) {
				this.#deps.onWarn?.('CallManager: guestIdentified: tryJoinCall request failed', error);
				return;
			}
			const data = response?.data;
			if (!data?.success) {
				this.#deps.onWarn?.('CallManager: guestIdentified: no active call for dialog', normalizedDialogId);
				return;
			}
			const call = data.call;
			if (this.#deps.instantiator.isLegacyCall(call?.PROVIDER, call?.SCHEME)) {
				this.#deps.instantiator.instantiateLegacy(call, data.users, data.logToken, data.connectionData, data.userData);
			} else {
				this.#deps.instantiator.instantiate(call, data.callToken, data.logToken, data.userData);
			}
			this.#deps.join(String(call?.ID), call?.UUID, normalizedDialogId, true);
		}
	}

	class ActiveCallStateSync {
		#store;
		#deps;
		constructor(store, deps) {
			this.#store = store;
			this.#deps = deps;
		}
		async syncActiveCallState(dialogId, callUuid) {
			const activeCalls = await this.#deps.broadcast(callUuid, {
				silent: true
			});
			if (activeCalls.some(Boolean)) {
				this.#applyJoinedCallState(dialogId);
				return;
			}
			await this.#syncActiveStateAcrossTabs(dialogId, callUuid, 'im-call-check');
		}
		async syncActiveConferenceState(dialogId, callUuid, conferenceCode) {
			const activeConferences = await this.#deps.conferenceRequest(conferenceCode);
			if (activeConferences.some(Boolean)) {
				this.#applyJoinedCallState(dialogId);
				return;
			}
			await this.#syncActiveStateAcrossTabs(dialogId, callUuid, 'im-conf-check');
		}
		async takeOverCall(dialogId, callUuid) {
			const waitForFinish = new Promise(resolve => {
				const timeout = setTimeout(() => {
					this.#deps.unsubscribePull(onPullFinish);
					resolve();
				}, 5000);
				const onPullFinish = data => {
					if (data.command === 'Call::finish' && data.params?.call?.UUID === callUuid) {
						clearTimeout(timeout);
						this.#deps.unsubscribePull(onPullFinish);
						resolve();
					}
				};
				this.#deps.subscribePull(onPullFinish);
			});
			await this.#deps.finishCall(callUuid);
			await waitForFinish;
			await this.#startCallWithRetry(dialogId);
		}
		async #syncActiveStateAcrossTabs(dialogId, callUuid, lockPrefix) {
			const channelName = `${lockPrefix}:${callUuid}`;
			if (!navigator.locks) {
				if (await this.#fetchIsCallActive(callUuid)) {
					this.#applyJoinedCallState(dialogId);
				}
				return;
			}
			const resultChannel = new BroadcastChannel(channelName);
			try {
				await navigator.locks.request(channelName, {
					ifAvailable: true
				}, async lock => {
					if (!lock) {
						await new Promise(resolve => {
							resultChannel.onmessage = ({
								data
							}) => {
								if (data.isActive) {
									this.#applyJoinedCallState(dialogId);
								}
								resolve();
							};
							setTimeout(resolve, 3000);
						});
						return;
					}
					const isActive = await this.#fetchIsCallActive(callUuid);
					resultChannel.postMessage({
						isActive
					});
					if (isActive) {
						this.#applyJoinedCallState(dialogId);
					}
				});
			} finally {
				resultChannel.close();
			}
		}
		#applyJoinedCallState(dialogId) {
			this.#store.updateActiveCall(dialogId, {
				state: this.#deps.status.joined
			});
		}
		async #startCallWithRetry(dialogId) {
			const maxAttempts = 3;
			const delayMs = 100;
			await new Promise(resolve => {
				setTimeout(resolve, delayMs);
			});
			for (let attempt = 0; attempt < maxAttempts; attempt++) {
				const succeeded = await new Promise(resolve => {
					const onFail = () => {
						cleanup();
						resolve(false);
					};
					const onSuccess = () => {
						cleanup();
						resolve(true);
					};
					const cleanup = () => {
						this.#deps.events.unsubscribe('CallEvents::callStartFailed', onFail);
						this.#deps.events.unsubscribe('CallEvents::callCreated', onSuccess);
					};
					this.#deps.events.subscribe('CallEvents::callStartFailed', onFail);
					this.#deps.events.subscribe('CallEvents::callCreated', onSuccess);
					this.#deps.startCall(dialogId);
				});
				if (succeeded) {
					return;
				}
				if (attempt < maxAttempts - 1) {
					await new Promise(resolve => {
						setTimeout(resolve, delayMs);
					});
				}
			}
		}
		async #fetchIsCallActive(callUuid) {
			const response = await this.#deps.fetchActiveCalls();
			const calls = response?.data?.calls ?? {};
			return Object.values(calls).some(call => call.UUID === callUuid && call.USER_STATE === 'ready');
		}
	}

	const RECONCILE_MIN_INTERVAL_MS = 3000;
	class CallManager {
		static instance;
		static viewContainerClass = 'bx-im-messenger__call_container';
		#engine;
		#sliderManager;
		#chatInfoProvider;
		#availability;
		#recentSync;
		#recentReconcile;
		#guestJoin;
		#activeCallStateSync;
		#nextCallOptions = null;
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}
		constructor() {
			this.#engine = call_engine_registry.engineRegistry.create(this.#buildEngineContext());
			const capabilities = call_engine_registry.engineRegistry.getCapabilities();
			const recentSource = call_engine_registry.engineRegistry.getRecentCallsSource();
			this.#sliderManager = new call_lib_callSliderManager.CallSliderManager({
				hasCurrentCall: () => this.hasCurrentCall(),
				leaveCurrentCall: () => this.leaveCurrentCall()
			});
			this.#chatInfoProvider = new ChatInfoProvider(ImStoreAdapter, () => new im_v2_provider_service_chat.ChatService(), {
				conference: im_v2_const.ChatType.videoconf,
				user: im_v2_const.ChatType.user
			}, error => im_v2_lib_logger.Logger.error('Open chat error', error));
			this.#availability = new CallAvailability(ImStoreAdapter, this.#chatInfoProvider, capabilities, {
				bot: im_v2_const.UserType.bot
			});
			this.#recentSync = new RecentCallsSync(ImStoreAdapter, {
				events: main_core_events.EventEmitter,
				callEvent: recentSource.callEvent,
				status: im_v2_const.RecentCallStatus,
				connectedStates: [call_mapping.CallState.Connected, call_mapping.CallState.Proceeding],
				instantiator: recentSource.instantiator,
				addCallListener: recentSource.addCallListener,
				removeCallListener: recentSource.removeCallListener
			});
			this.#guestJoin = new GuestJoinHandler(ImStoreAdapter, {
				events: main_core_events.EventEmitter,
				guestEvents: this.#collectGuestEvents(),
				hasActiveCurrentCall: dialogId => this.hasActiveCurrentCall(dialogId),
				tryJoinCall,
				instantiator: recentSource.instantiator,
				join: (callId, callUuid, dialogId, withVideo) => this.joinCall(callId, callUuid, dialogId, withVideo),
				onWarn: (message, ...args) => im_v2_lib_logger.Logger.warn(message, ...args)
			});
			this.#activeCallStateSync = new ActiveCallStateSync(ImStoreAdapter, {
				broadcast: (callUuid, options) => this.#engine.sendBroadcastRequest(callUuid, options),
				conferenceRequest: conferenceCode => call_application_conferenceChannel.ConferenceChannel.getInstance().sendRequest(conferenceCode),
				startCall: dialogId => this.startCall(dialogId),
				finishCall: callUuid => main_core.ajax.runAction('call.CallManager.finish', {
					data: {
						callUuid
					}
				}),
				fetchActiveCalls: () => main_core.ajax.runAction('call.Recent.getActive', {}),
				events: main_core_events.EventEmitter,
				subscribePull: handler => BX.addCustomEvent(window, 'onPullEvent-call', handler),
				unsubscribePull: handler => BX.removeCustomEvent(window, 'onPullEvent-call', handler),
				status: im_v2_const.RecentCallStatus
			});
			this.#recentReconcile = new RecentReconcile({
				subscribePullStatus: handler => this.#subscribeToPullStatus(handler),
				pullStatus: this.#getPullStatusValues(),
				fetchActiveCalls: withUserData => main_core.ajax.runAction('call.Recent.getActive', withUserData ? {
					data: {
						withUserData: 'Y'
					}
				} : {}),
				hasMissingActiveCalls: calls => this.#recentSync.hasMissingActiveCalls(calls),
				addMissingActiveCalls: calls => this.#recentSync.addMissingActiveCalls(calls),
				now: () => Date.now(),
				minIntervalMs: RECONCILE_MIN_INTERVAL_MS,
				onWarn: (message, ...args) => im_v2_lib_logger.Logger.warn(message, ...args)
			});
			this.#subscribeToEvents();
			this.#recentSync.start();
			this.#guestJoin.start();
			this.#recentReconcile.start();
		}
		#subscribeToPullStatus(handler) {
			const pullClient = BX.PULL;
			const pullClientClass = BX.PullClient;
			if (!pullClient || !pullClientClass) {
				return false;
			}
			pullClient.subscribe({
				type: pullClientClass.SubscriptionType.Status,
				callback: handler
			});
			return true;
		}
		#getPullStatusValues() {
			const pullStatus = BX.PullClient?.PullStatus;
			return {
				online: pullStatus?.Online ?? 'online',
				offline: pullStatus?.Offline ?? 'offline'
			};
		}
		#collectGuestEvents() {
			const events = Object.entries({
				guestIdentified: call_const.EventType?.callEvents?.guestIdentified,
				guestInitialChatOpen: call_const.EventType?.callEvents?.guestInitialChatOpen
			});
			const missing = events.filter(([, event]) => !event).map(([name]) => name);
			if (missing.length > 0) {
				im_v2_lib_logger.Logger.warn(`CallManager: call.const EventType is unavailable, skipping ${missing.join(', ')} subscription`);
			}
			return events.filter(([, event]) => Boolean(event)).map(([, event]) => event);
		}
		async sendBroadcastRequest(callUuid) {
			const activeCalls = await this.#engine.sendBroadcastRequest(callUuid, {
				silent: false
			});
			if (activeCalls.some(Boolean)) {
				notifyCallInAnotherTab();
				return true;
			}
			return false;
		}
		syncActiveCallState(dialogId, callUuid) {
			return this.#activeCallStateSync.syncActiveCallState(dialogId, callUuid);
		}
		syncActiveConferenceState(dialogId, callUuid, conferenceCode) {
			return this.#activeCallStateSync.syncActiveConferenceState(dialogId, callUuid, conferenceCode);
		}
		takeOverCall(dialogId, callUuid) {
			return this.#activeCallStateSync.takeOverCall(dialogId, callUuid);
		}
		setNextCallOptions(options) {
			this.#nextCallOptions = options;
		}
		startCall(dialogId, withVideo = true, callOptions = null) {
			im_v2_lib_logger.Logger.warn('CallManager: startCall', dialogId, withVideo);
			this.#sliderManager.setTopSliderId();
			this.#prepareCall(dialogId);
			const startOptions = {
				...callOptions
			};
			this.#chatInfoProvider.getChatInfo(dialogId).then(chatInfo => {
				const mergedOptions = {
					...this.#nextCallOptions,
					...startOptions
				};
				this.#nextCallOptions = null;
				this.#engine.startCall(dialogId, {
					withVideo,
					chatInfo,
					callOptions: mergedOptions
				});
			});
		}
		joinCall(callId, callUuid, dialogId, withVideo = true) {
			im_v2_lib_logger.Logger.warn('CallManager: joinCall', callId, callUuid, withVideo);
			this.#sliderManager.setTopSliderId();
			this.#prepareCall(dialogId);
			this.#chatInfoProvider.getChatInfo(dialogId).then(chatInfo => {
				this.#engine.joinCall(callId, callUuid, {
					withVideo,
					chatInfo
				});
			});
		}
		leaveCurrentCall() {
			im_v2_lib_logger.Logger.warn('CallManager: leaveCurrentCall');
			this.#engine.leaveCurrentCall();
			this.#sliderManager.clearSliderId();
		}
		onAnswerButtonClick(mediaParams, callParams) {
			this.#engine.onAnswerButtonClick(mediaParams, callParams);
		}
		onJoinFromRecentItem() {
			this.#engine.closeCallNotification();
		}
		releaseRingingCallSlot() {
			im_v2_lib_logger.Logger.warn('CallManager: releaseRingingCallSlot');
			this.#engine.releaseRingingCallSlot();
		}
		deleteRecentCall(dialogId) {
			this.#recentSync.deleteRecentCall(dialogId);
		}
		foldCurrentCall() {
			if (!this.#engine.hasActiveCall() || !this.#engine.hasVisibleCall()) {
				return;
			}
			this.#engine.fold();
		}
		unfoldCurrentCall() {
			if (!this.#engine.hasActiveCall()) {
				return;
			}
			this.#engine.unfold({
				isReturnGesture: true
			});
		}
		getCurrentCallDialogId() {
			return this.#engine.getActiveCall()?.dialogId ?? '';
		}
		getCurrentCall() {
			return this.#engine.getActiveCall()?.raw ?? false;
		}
		getCurrentUser() {
			return ImStoreAdapter.getUser(ImStoreAdapter.getCurrentUserId());
		}
		hasCurrentCall() {
			return this.#engine.hasActiveCall();
		}
		hasCurrentScreenSharing() {
			return this.#engine.getActiveCall()?.isScreenSharingStarted() ?? false;
		}
		hasVisibleCall() {
			if (!this.#engine.hasActiveCall()) {
				return false;
			}
			return this.#engine.hasVisibleCall();
		}
		toggleDebugFlag(debug) {
			this.#engine.setDebug(debug);
		}
		chatCanBeCalled(dialogId) {
			return this.#availability.chatCanBeCalled(dialogId);
		}
		hasActiveCurrentCall(dialogId) {
			return this.#availability.hasActiveCurrentCall(dialogId, this.getCurrentCallDialogId());
		}
		hasActiveAnotherCall(dialogId) {
			return this.#availability.hasActiveAnotherCall(dialogId, this.getCurrentCallDialogId());
		}
		hasActiveCallInDialog(dialogId) {
			return this.#availability.hasActiveCallInDialog(dialogId);
		}
		getCallUserLimit() {
			return this.#availability.getCallUserLimit();
		}
		isChatUserLimitExceeded(dialogId) {
			return this.#availability.isChatUserLimitExceeded(dialogId);
		}
		updateRecentCallsList(activeCalls) {
			this.#recentSync.updateFromActiveCalls(activeCalls);
		}
		#buildEngineContext() {
			return {
				language: im_v2_application_core.Core.getLanguageId(),
				messengerFacade: createMessengerFacade({
					ui: ImUiAdapter,
					getCurrentDialogId: () => this.#getCurrentDialogId(),
					getCurrentUser: () => this.getCurrentUser(),
					getMessageCount: () => ImStoreAdapter.getTotalChatCounter(),
					getDialog: dialogId => this.#getDialog(dialogId),
					getRecentCalls: () => ImStoreAdapter.getRecentCalls(),
					showUserSelector: openCallUserSelector
				}),
				events: {
					[call_mapping.ControllerEvent.onPromoViewed]: event => {
						const {
							code
						} = event.getData();
						void ImUiAdapter.markPromoWatched(code);
					},
					[call_mapping.ControllerEvent.onOpenVideoConference]: event => {
						const {
							dialogId: chatId
						} = event.getData();
						const dialog = ImStoreAdapter.getChat(`chat${chatId}`, true);
						return ImUiAdapter.openConference({
							code: dialog.public?.code
						});
					}
				}
			};
		}
		#subscribeToEvents() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onLayoutChange, this.#onOpenChat.bind(this));
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onOpenNotifications, this.foldCurrentCall.bind(this));
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.call.onJoinFromRecentItem, this.onJoinFromRecentItem.bind(this));
		}
		#onOpenChat(event) {
			const callDialogId = this.getCurrentCallDialogId();
			const openedChat = event.getData().to.entityId;
			if (callDialogId === openedChat) {
				return;
			}
			this.foldCurrentCall();
		}
		isConference(dialogId) {
			return this.#chatInfoProvider.isConference(dialogId);
		}
		#getCurrentDialogId() {
			const layout = ImStoreAdapter.getLayout();
			if (layout.name !== im_v2_const.Layout.chat && layout.name !== im_v2_const.Layout.taskComments) {
				return '';
			}
			return layout.entityId;
		}
		#getDialog(dialogId) {
			return ImStoreAdapter.getChat(dialogId);
		}
		#prepareCall(dialogId) {
			this.#engine.prepareCall(this.#chatInfoProvider.buildPrepareData(dialogId));
		}
	}

	exports.CallManager = CallManager;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX.Call.Lib, BX, BX, BX.Event, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.Application, BX.Call.Const, BX.Call.Mapping, BX.Call.EngineProviders.Registry, BX.Call.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI, BX.Messenger.v2.Lib, BX.UI.Notification, BX.Messenger.v2.Lib);
//# sourceMappingURL=call-manager.bundle.js.map
