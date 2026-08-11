/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, im_call_compatible, main_core_events, im_public, im_v2_application_core, im_v2_const, im_v2_lib_desktopApi, im_v2_lib_logger, im_v2_lib_promo, im_v2_lib_slider, im_v2_lib_soundNotification, im_v2_provider_service_chat, call_core, call_lib_callSliderManager, main_core, ui_buttons, im_v2_lib_access) {
	'use strict';

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

	class CallManager {
		static instance;
		static viewContainerClass = 'bx-im-messenger__call_container';
		#controller;
		#sliderManager;
		#nextCallOptions = null;
		#openChatActionByChatType = {
			[im_v2_const.ChatType.taskComments]: dialogId => {
				if (im_public.Messenger.isEmbeddedMode() || im_public.Messenger.isMessengerSliderOpened()) {
					return im_public.Messenger.openTaskComments(dialogId);
				}
				return Promise.resolve();
			}
		};
		#onCallJoinHandler;
		#onCallLeaveHandler;
		#onCallDestroyHandler;
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}
		constructor() {
			this.#controller = this.#getController();
			this.#sliderManager = new call_lib_callSliderManager.CallSliderManager({
				hasCurrentCall: () => this.hasCurrentCall(),
				leaveCurrentCall: () => this.leaveCurrentCall()
			});
			this.#subscribeToEvents();
			this.#onCallJoinHandler = this.#onCallJoin.bind(this);
			this.#onCallLeaveHandler = this.#onCallLeave.bind(this);
			this.#onCallDestroyHandler = this.#onCallDestroy.bind(this);
		}
		async sendBroadcastRequest(callId) {
			if (!im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				return [];
			}
			if (!this.#controller.callMultiBroadcastClient) {
				return [];
			}
			return this.#controller.callMultiBroadcastClient.broadcastRequest(callId, {
				timeout: 100
			});
		}
		startCall(dialogId, withVideo = true) {
			im_v2_lib_logger.Logger.warn('CallManager: startCall', dialogId, withVideo);
			this.#sliderManager.setTopSliderId();
			this.#prepareCall(dialogId);
			this.#getChatInfo(dialogId).then(chatInfo => {
				const callOptions = this.#nextCallOptions ?? {};
				this.#nextCallOptions = null;
				this.#controller.startCall(dialogId, withVideo, chatInfo, callOptions);
			});
		}
		joinCall(callId, callUuid, dialogId, withVideo = true) {
			im_v2_lib_logger.Logger.warn('CallManager: joinCall', callId, callUuid, withVideo);
			this.#sliderManager.setTopSliderId();
			this.#prepareCall(dialogId);
			this.#getChatInfo(dialogId).then(chatInfo => {
				this.#controller.joinCall(callId, callUuid, withVideo, {
					chatInfo
				});
			});
		}
		leaveCurrentCall() {
			im_v2_lib_logger.Logger.warn('CallManager: leaveCurrentCall');
			this.#controller.leaveCurrentCall();
			this.#sliderManager.clearSliderId();
		}
		onAnswerButtonClick(mediaParams, callParams) {
			this.#controller.onAnswerButtonClick(mediaParams, callParams);
		}
		onJoinFromRecentItem() {
			this.#controller.closeCallNotification();
		}
		deleteRecentCall(dialogId) {
			void im_v2_application_core.Core.getStore().dispatch('recent/calls/deleteActiveCall', {
				dialogId
			});
		}
		foldCurrentCall() {
			if (!this.#controller.hasActiveCall() || !this.#controller.hasVisibleCall()) {
				return;
			}
			this.#controller.fold();
		}
		unfoldCurrentCall() {
			if (!this.#controller.hasActiveCall()) {
				return;
			}
			this.#controller.unfold();
		}
		getCurrentCallDialogId() {
			if (!this.#controller.hasActiveCall()) {
				return '';
			}
			return this.#controller?.currentCall?.associatedEntity.id;
		}
		getCurrentCall() {
			if (!this.#controller.hasActiveCall()) {
				return false;
			}
			return this.#controller.currentCall;
		}
		getCurrentUser() {
			const currentUserId = im_v2_application_core.Core.getUserId();
			return im_v2_application_core.Core.getStore().getters['users/get'](currentUserId);
		}
		hasCurrentCall() {
			return this.#controller.hasActiveCall();
		}
		hasCurrentScreenSharing() {
			if (!this.#controller.hasActiveCall()) {
				return false;
			}
			return this.#controller.currentCall.isScreenSharingStarted();
		}
		hasVisibleCall() {
			if (!this.#controller.hasActiveCall()) {
				return false;
			}
			return this.#controller.hasVisibleCall();
		}
		toggleDebugFlag(debug) {
			if (!this.#controller) {
				return;
			}
			this.#controller.debug = debug;
		}
		chatCanBeCalled(dialogId) {
			const callSupported = this.#checkCallSupport(dialogId);
			const hasCurrentCall = im_v2_application_core.Core.getStore().getters['recent/calls/hasActiveCall'](dialogId);
			return callSupported && !hasCurrentCall;
		}
		hasActiveCurrentCall(dialogId) {
			return (
				im_v2_application_core.Core.getStore().getters['recent/calls/hasActiveCall'](dialogId) && this.getCurrentCallDialogId() === dialogId
			);
		}
		hasActiveAnotherCall(dialogId) {
			return im_v2_application_core.Core.getStore().getters['recent/calls/hasActiveCall']() && !this.hasActiveCurrentCall(dialogId);
		}
		getCallUserLimit() {
			return BX.Call.Util.getUserLimit();
		}
		isChatUserLimitExceeded(dialogId) {
			return this.#getChatUserCounter(dialogId) > this.getCallUserLimit();
		}
		updateRecentCallsList(activeCalls) {
			const recentCalls = im_v2_application_core.Core.getStore().getters['recent/calls/get'];
			const activeCallsMap = new Map(Object.values(activeCalls).map(call => [call.ID, call]));
			activeCallsMap.forEach(call => {
				const instantiatedCall = call_core.Util.isLegacyCall(call.PROVIDER, call.SCHEME)
				? call_core.EngineLegacy.instantiateCall(call, call.USERS, call.LOG_TOKEN, call.CONNECTION_DATA, call.USER_DATA)
				: call_core.Engine.instantiateCall(call, call.CALL_TOKEN, call.LOG_TOKEN, call.USER_DATA);
				this.#subscribeToCallEvents(instantiatedCall);
			});
			recentCalls
			.filter(oldCall => !activeCallsMap.has(oldCall.call.id))
			.forEach(oldCall => {
				void im_v2_application_core.Core.getStore().dispatch('recent/calls/deleteActiveCall', {
					dialogId: oldCall.dialogId
				});
			});
		}
		#getController() {
			return new call_core.Controller({
				init: true,
				language: im_v2_application_core.Core.getLanguageId(),
				messengerFacade: {
					getDefaultZIndex: () => im_v2_lib_slider.MessengerSlider.getInstance().getZIndex(),
					isMessengerOpen: () => im_v2_lib_slider.MessengerSlider.getInstance().isOpened(),
					isSliderFocused: () => im_v2_lib_slider.MessengerSlider.getInstance().isFocused(),
					isThemeDark: () => false,
					openMessenger: (dialogId, force = false) => {
						if (!force) {
							const dialog = this.#getDialog(dialogId);
							if (dialog && dialog.type in this.#openChatActionByChatType) {
								return this.#openChatActionByChatType[dialog.type](dialogId);
							}
						}
						const sidePanel = BX?.SidePanel?.Instance;
						const hasChatUnderSlider = sidePanel?.getOpenSlidersCount?.() > 0 && sidePanel?.getPageUrl?.()?.includes('/online/');
						if (hasChatUnderSlider) {
							const topSlider = sidePanel?.getTopSlider?.();
							if (topSlider?.close) {
								return new Promise(resolve => {
									topSlider.close(false, resolve);
								}).then(() => im_public.Messenger.openChat(dialogId));
							}
							return im_public.Messenger.openChat(dialogId);
						}
						return im_public.Messenger.openChat(dialogId);
					},
					openHistory: dialogId => {
						return im_public.Messenger.openChat(dialogId);
					},
					openSettings: () => {
						return im_public.Messenger.openSettings();
					},
					openHelpArticle: () => {},
					getMessageCount: () => im_v2_application_core.Core.getStore().getters['counters/getTotalChatCounter'],
					getCurrentDialogId: () => this.#getCurrentDialogId(),
					isPromoRequired: promoCode => {
						return im_v2_lib_promo.PromoManager.getInstance().needToShow(promoCode);
					},
					repeatSound: (soundType, timeout, force) => {
						im_v2_lib_soundNotification.SoundNotificationManager.getInstance().playLoop(soundType, timeout, force);
					},
					stopRepeatSound: soundType => {
						im_v2_lib_soundNotification.SoundNotificationManager.getInstance().stop(soundType);
					},
					showUserSelector: openCallUserSelector
				},
				events: {
					[call_core.Controller.Events.onPromoViewed]: event => {
						const {
							code
						} = event.getData();
						void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(code);
					},
					[call_core.Controller.Events.onOpenVideoConference]: event => {
						const {
							dialogId: chatId
						} = event.getData();
						const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](`chat${chatId}`, true);
						return im_public.Messenger.openConference({
							code: dialog.public?.code
						});
					}
				}
			});
		}
		#getChatService() {
			if (!this.chatService) {
				this.chatService = new im_v2_provider_service_chat.ChatService();
			}
			return this.chatService;
		}
		#subscribeToEvents() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onLayoutChange, this.#onOpenChat.bind(this));
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onOpenNotifications, this.foldCurrentCall.bind(this));
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.call.onJoinFromRecentItem, this.onJoinFromRecentItem.bind(this));
			main_core_events.EventEmitter.subscribe('CallEvents::callCreated', this.#onCallCreated.bind(this));
		}
		#subscribeToCallEvents(call) {
			call.addEventListener(BX.Call.Event.onJoin, this.#onCallJoinHandler);
			call.addEventListener(BX.Call.Event.onLeave, this.#onCallLeaveHandler);
			call.addEventListener(BX.Call.Event.onDestroy, this.#onCallDestroyHandler);
		}
		#unsubscribeFromCallEvents(call) {
			call.removeEventListener(BX.Call.Event.onJoin, this.#onCallJoinHandler);
			call.removeEventListener(BX.Call.Event.onLeave, this.#onCallLeaveHandler);
			call.removeEventListener(BX.Call.Event.onDestroy, this.#onCallDestroyHandler);
		}
		#onCallCreated(event) {
			const {
				call
			} = event.getData()[0];
			const currentCall = im_v2_application_core.Core.getStore().getters['recent/calls/getCallByDialog'](call.associatedEntity.id);
			const isNewCall = currentCall?.call.uuid !== call.uuid;
			const state = call.state === call_core.State.Connected || call.state === call_core.State.Proceeding ? im_v2_const.RecentCallStatus.joined : im_v2_const.RecentCallStatus.waiting;
			if (isNewCall) {
				if (currentCall) {
					this.#unsubscribeFromCallEvents(currentCall.call);
				}
				this.#subscribeToCallEvents(call);
				this.#addChatToModel(call);
				void im_v2_application_core.Core.getStore().dispatch('recent/calls/addActiveCall', {
					dialogId: call.associatedEntity.id,
					name: call.associatedEntity.name,
					call,
					state
				});
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('recent/calls/updateActiveCall', {
				dialogId: call.associatedEntity.id,
				fields: {
					name: call.associatedEntity.name,
					state,
					call
				}
			});
		}
		#onCallJoin(event) {
			void im_v2_application_core.Core.getStore().dispatch('recent/calls/updateActiveCall', {
				dialogId: event.call.associatedEntity.id,
				fields: {
					state: im_v2_const.RecentCallStatus.joined
				}
			});
		}
		#onCallLeave(event) {
			void im_v2_application_core.Core.getStore().dispatch('recent/calls/updateActiveCall', {
				dialogId: event.call.associatedEntity.id,
				fields: {
					state: im_v2_const.RecentCallStatus.waiting
				}
			});
		}
		#onCallDestroy(event) {
			const dialogId = event.call.associatedEntity.id;
			const currentCall = im_v2_application_core.Core.getStore().getters['recent/calls/getCallByDialog'](dialogId);
			if (currentCall) {
				this.#unsubscribeFromCallEvents(currentCall.call);
			}
			if (currentCall?.call.uuid === event.call.uuid) {
				void im_v2_application_core.Core.getStore().dispatch('recent/calls/deleteActiveCall', {
					dialogId
				});
			}
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
			const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return dialog.type === im_v2_const.ChatType.videoconf;
		}
		#checkCallSupport(dialogId) {
			if (!this.#pushServerIsActive() || !BX.Call.Util.isWebRTCSupported()) {
				return false;
			}
			const userId = Number(dialogId);
			return userId > 0 ? this.#checkUserCallSupport(userId) : this.#checkChatCallSupport(dialogId);
		}
		#checkUserCallSupport(userId) {
			const user = im_v2_application_core.Core.getStore().getters['users/get'](userId);
			const isBot = user.type === im_v2_const.UserType.bot;
			return user && user.status !== 'guest' && !isBot && !user.network && user.id !== im_v2_application_core.Core.getUserId() && Boolean(user.lastActivityDate);
		}
		#checkChatCallSupport(dialogId) {
			const userCounter = this.#getChatUserCounter(dialogId);
			return (userCounter > 1 || this.isConference(dialogId)) && userCounter <= this.getCallUserLimit();
		}
		#pushServerIsActive() {
			return true;
		}
		#getCurrentDialogId() {
			const layout = im_v2_application_core.Core.getStore().getters['application/getLayout'];
			if (layout.name !== im_v2_const.Layout.chat && layout.name !== im_v2_const.Layout.taskComments) {
				return '';
			}
			return layout.entityId;
		}
		#getDialog(dialogId) {
			return im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
		}
		#isUser(dialogId) {
			const dialog = this.#getDialog(dialogId);
			return dialog?.type === im_v2_const.ChatType.user;
		}
		async #getChatInfo(dialogId) {
			const chatInfo = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			if (chatInfo.chatId === 0) {
				try {
					await this.#getChatService().loadChat(dialogId);
					const updatedChatInfo = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
					return this.#prepareChatInfo(updatedChatInfo);
				} catch (error) {
					im_v2_lib_logger.Logger.error('Open chat error', error);
					return this.#prepareChatInfo(chatInfo);
				}
			}
			return this.#prepareChatInfo(chatInfo);
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
		#addChatToModel(call) {
			const entity = call.associatedEntity;
			const chatFields = {
				dialogId: entity.id,
				type: entity.advanced?.chatType,
				name: entity.name,
				avatar: entity.avatar,
				color: entity.avatarColor
			};
			void im_v2_application_core.Core.getStore().dispatch('chats/add', chatFields);
		}
		#prepareCall(dialogId) {
			const currentUserId = im_v2_application_core.Core.getUserId();
			const currentUser = im_v2_application_core.Core.getStore().getters['users/get'](currentUserId);
			const callData = {
				dialogId,
				userData: {
					[currentUserId]: currentUser
				}
			};
			if (this.#isUser(dialogId)) {
				const currentCompanion = im_v2_application_core.Core.getStore().getters['users/get'](dialogId);
				callData.user = currentCompanion.id;
				callData.userData[currentCompanion.id] = currentCompanion;
			}
			this.#controller.prepareCall(callData);
		}
		#getChatUserCounter(dialogId) {
			const {
				userCounter
			} = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			return userCounter;
		}
	}

	exports.CallManager = CallManager;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX, BX.Event, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Call, BX.Call.Lib, BX, BX.UI, BX.Messenger.v2.Lib);
//# sourceMappingURL=call-manager.bundle.js.map
