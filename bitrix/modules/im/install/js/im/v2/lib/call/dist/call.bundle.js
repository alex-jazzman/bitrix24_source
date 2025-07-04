/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core_events,ui_vue3_vuex,call_core,call_core_engine,im_public,im_v2_lib_slider,im_v2_lib_logger,im_v2_lib_promo,im_v2_lib_soundNotification,rest_client,im_v2_lib_rest,im_v2_const,main_core,ui_buttons,im_v2_application_core) {
	'use strict';

	class BetaCallService {
	  static createRoom(chatId) {
	    im_v2_lib_rest.runAction(im_v2_const.RestMethod.imCallBetaCreateRoom, {
	      data: {
	        chatId
	      }
	    });
	  }
	}

	let _ = t => t,
	  _t;
	const openCallUserSelector = async params => {
	  const handleAddCLick = () => {
	    const selectedItems = dialog.getSelectedItems();
	    const preparedItems = prepareUser(selectedItems);
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
	    footer: getFooter(handleAddCLick, handleCancelCLick)
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
	      name: user.title.text,
	      avatar: user.avatar,
	      avatar_hr: user.avatar,
	      gender: user.customData.get('imUser').GENDER
	    };
	  });
	};
	const getFooter = (handleAddCLick, handleCancelCLick) => {
	  const addButtonTitle = main_core.Loc.getMessage('IM_LIB_CALL_ADD_BUTTON');
	  const cancelButtonTitle = main_core.Loc.getMessage('IM_LIB_CALL_CANCEL_BUTTON');
	  return main_core.Tag.render(_t || (_t = _`
		<button class="ui-btn ui-btn-xs ui-btn-primary" onclick="${0}">${0}</button>
		<button class="ui-btn ui-btn-xs ui-btn-light-border" onclick="${0}">${0}</button>
	`), handleAddCLick, addButtonTitle, handleCancelCLick, cancelButtonTitle);
	};

	var _controller = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("controller");
	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _restClient = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restClient");
	var _onCallJoinHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCallJoinHandler");
	var _onCallLeaveHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCallLeaveHandler");
	var _onCallDestroyHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCallDestroyHandler");
	var _getController = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getController");
	var _subscribeToEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribeToEvents");
	var _subscribeToCallEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribeToCallEvents");
	var _unsubscribeFromCallEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unsubscribeFromCallEvents");
	var _onCallCreated = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCallCreated");
	var _onCallJoin = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCallJoin");
	var _onCallLeave = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCallLeave");
	var _onCallDestroy = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCallDestroy");
	var _onOpenChat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onOpenChat");
	var _checkCallSupport = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkCallSupport");
	var _checkUserCallSupport = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkUserCallSupport");
	var _checkChatCallSupport = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkChatCallSupport");
	var _pushServerIsActive = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pushServerIsActive");
	var _getCurrentDialogId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCurrentDialogId");
	var _getDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDialog");
	var _getChatId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatId");
	var _isUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isUser");
	var _getChatInfo = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatInfo");
	var _prepareChatInfo = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareChatInfo");
	var _prepareCall = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareCall");
	var _getChatUserCounter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatUserCounter");
	class CallManager {
	  static getInstance() {
	    if (!this.instance) {
	      this.instance = new this();
	    }
	    return this.instance;
	  }
	  constructor() {
	    Object.defineProperty(this, _getChatUserCounter, {
	      value: _getChatUserCounter2
	    });
	    Object.defineProperty(this, _prepareCall, {
	      value: _prepareCall2
	    });
	    Object.defineProperty(this, _prepareChatInfo, {
	      value: _prepareChatInfo2
	    });
	    Object.defineProperty(this, _getChatInfo, {
	      value: _getChatInfo2
	    });
	    Object.defineProperty(this, _isUser, {
	      value: _isUser2
	    });
	    Object.defineProperty(this, _getChatId, {
	      value: _getChatId2
	    });
	    Object.defineProperty(this, _getDialog, {
	      value: _getDialog2
	    });
	    Object.defineProperty(this, _getCurrentDialogId, {
	      value: _getCurrentDialogId2
	    });
	    Object.defineProperty(this, _pushServerIsActive, {
	      value: _pushServerIsActive2
	    });
	    Object.defineProperty(this, _checkChatCallSupport, {
	      value: _checkChatCallSupport2
	    });
	    Object.defineProperty(this, _checkUserCallSupport, {
	      value: _checkUserCallSupport2
	    });
	    Object.defineProperty(this, _checkCallSupport, {
	      value: _checkCallSupport2
	    });
	    Object.defineProperty(this, _onOpenChat, {
	      value: _onOpenChat2
	    });
	    Object.defineProperty(this, _onCallDestroy, {
	      value: _onCallDestroy2
	    });
	    Object.defineProperty(this, _onCallLeave, {
	      value: _onCallLeave2
	    });
	    Object.defineProperty(this, _onCallJoin, {
	      value: _onCallJoin2
	    });
	    Object.defineProperty(this, _onCallCreated, {
	      value: _onCallCreated2
	    });
	    Object.defineProperty(this, _unsubscribeFromCallEvents, {
	      value: _unsubscribeFromCallEvents2
	    });
	    Object.defineProperty(this, _subscribeToCallEvents, {
	      value: _subscribeToCallEvents2
	    });
	    Object.defineProperty(this, _subscribeToEvents, {
	      value: _subscribeToEvents2
	    });
	    Object.defineProperty(this, _getController, {
	      value: _getController2
	    });
	    Object.defineProperty(this, _controller, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _restClient, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onCallJoinHandler, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onCallLeaveHandler, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onCallDestroyHandler, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = im_v2_application_core.Core.getStore();
	    babelHelpers.classPrivateFieldLooseBase(this, _restClient)[_restClient] = im_v2_application_core.Core.getRestClient();
	    if (this.isAvailable()) {
	      babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller] = babelHelpers.classPrivateFieldLooseBase(this, _getController)[_getController]();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _subscribeToEvents)[_subscribeToEvents]();
	    babelHelpers.classPrivateFieldLooseBase(this, _onCallJoinHandler)[_onCallJoinHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onCallJoin)[_onCallJoin].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _onCallLeaveHandler)[_onCallLeaveHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onCallLeave)[_onCallLeave].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _onCallDestroyHandler)[_onCallDestroyHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onCallDestroy)[_onCallDestroy].bind(this);
	  }
	  isAvailable() {
	    const {
	      callInstalled
	    } = main_core.Extension.getSettings('im.v2.lib.call');
	    return callInstalled === true;
	  }
	  createBetaCallRoom(chatId) {
	    if (!this.isAvailable()) {
	      return;
	    }
	    BetaCallService.createRoom(chatId);
	  }
	  startCall(dialogId, withVideo = true, callToken = '') {
	    if (!this.isAvailable()) {
	      return;
	    }
	    im_v2_lib_logger.Logger.warn('CallManager: startCall', dialogId, withVideo);
	    babelHelpers.classPrivateFieldLooseBase(this, _prepareCall)[_prepareCall](dialogId);
	    babelHelpers.classPrivateFieldLooseBase(this, _getChatInfo)[_getChatInfo](dialogId).then(chatInfo => {
	      babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].startCall(dialogId, withVideo, chatInfo);
	    });
	  }
	  joinCall(callId, callUuid, dialogId, withVideo = true) {
	    if (!this.isAvailable()) {
	      return;
	    }
	    im_v2_lib_logger.Logger.warn('CallManager: joinCall', callId, callUuid, withVideo);
	    babelHelpers.classPrivateFieldLooseBase(this, _prepareCall)[_prepareCall](dialogId);
	    babelHelpers.classPrivateFieldLooseBase(this, _getChatInfo)[_getChatInfo](dialogId).then(chatInfo => {
	      babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].joinCall(callId, callUuid, withVideo, {
	        chatInfo
	      });
	    });
	  }
	  leaveCurrentCall() {
	    if (!this.isAvailable()) {
	      return;
	    }
	    im_v2_lib_logger.Logger.warn('CallManager: leaveCurrentCall');
	    babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].leaveCurrentCall();
	  }
	  onAnswerButtonClick(mediaParams, callParams) {
	    if (!this.isAvailable()) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].onAnswerButtonClick(mediaParams, callParams);
	  }
	  onJoinFromRecentItem() {
	    babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].closeCallNotification();
	  }
	  deleteRecentCall(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('recent/calls/deleteActiveCall', {
	      dialogId
	    });
	  }
	  foldCurrentCall() {
	    if (!this.isAvailable() || !babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].hasActiveCall() || !babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].hasVisibleCall()) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].fold();
	  }
	  unfoldCurrentCall() {
	    if (!this.isAvailable() || !babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].hasActiveCall()) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].unfold();
	  }
	  getCurrentCallDialogId() {
	    var _babelHelpers$classPr, _babelHelpers$classPr2;
	    if (!this.isAvailable() || !babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].hasActiveCall()) {
	      return '';
	    }
	    return (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller]) == null ? void 0 : (_babelHelpers$classPr2 = _babelHelpers$classPr.currentCall) == null ? void 0 : _babelHelpers$classPr2.associatedEntity.id;
	  }
	  getCurrentCall() {
	    if (!this.isAvailable() || !babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].hasActiveCall()) {
	      return false;
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].currentCall;
	  }
	  getCurrentUser() {
	    const currentUserId = im_v2_application_core.Core.getUserId();
	    return im_v2_application_core.Core.getStore().getters['users/get'](currentUserId);
	  }
	  hasCurrentCall() {
	    if (!this.isAvailable()) {
	      return false;
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].hasActiveCall();
	  }
	  hasCurrentScreenSharing() {
	    if (!this.isAvailable() || !babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].hasActiveCall()) {
	      return false;
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].currentCall.isScreenSharingStarted();
	  }
	  hasVisibleCall() {
	    if (!this.isAvailable() || !babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].hasActiveCall()) {
	      return false;
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].hasVisibleCall();
	  }
	  startTest() {
	    if (!this.isAvailable()) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].test();
	  }
	  toggleDebugFlag(debug) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].debug = debug;
	  }
	  chatCanBeCalled(dialogId) {
	    if (!this.isAvailable()) {
	      return false;
	    }
	    const callSupported = babelHelpers.classPrivateFieldLooseBase(this, _checkCallSupport)[_checkCallSupport](dialogId);
	    const hasCurrentCall = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['recent/calls/hasActiveCall'](dialogId);
	    return callSupported && !hasCurrentCall;
	  }
	  hasActiveCurrentCall(dialogId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['recent/calls/hasActiveCall'](dialogId) && this.getCurrentCallDialogId() === dialogId;
	  }
	  hasActiveAnotherCall(dialogId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['recent/calls/hasActiveCall']() && !this.hasActiveCurrentCall(dialogId);
	  }
	  getCallUserLimit() {
	    return BX.Call.Util.getUserLimit();
	  }
	  isChatUserLimitExceeded(dialogId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getChatUserCounter)[_getChatUserCounter](dialogId) > this.getCallUserLimit();
	  }
	  updateRecentCallsList(activeCalls) {
	    const recentCalls = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['recent/calls/get'];
	    const activeCallsMap = new Map(Object.values(activeCalls).map(call => [call.ID, call]));
	    activeCallsMap.forEach(call => {
	      const instantiatedCall = babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].isLegacyCall(call.PROVIDER, call.SCHEME) ? call_core.EngineLegacy.instantiateCall(call, call.USERS, call.LOG_TOKEN, call.CONNECTION_DATA, call.USER_DATA) : call_core_engine.CallEngine.instantiateCall(call, call.CALL_TOKEN, call.LOG_TOKEN, call.USER_DATA);
	      babelHelpers.classPrivateFieldLooseBase(this, _subscribeToCallEvents)[_subscribeToCallEvents](instantiatedCall);
	    });
	    recentCalls.filter(oldCall => !activeCallsMap.has(oldCall.call.id)).forEach(oldCall => {
	      babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('recent/calls/deleteActiveCall', {
	        dialogId: oldCall.dialogId
	      });
	    });
	  }
	  isConference(dialogId) {
	    const dialog = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['chats/get'](dialogId);
	    return dialog.type === im_v2_const.ChatType.videoconf;
	  }

	  // endregion call events
	}
	function _getController2() {
	  return new call_core.Controller({
	    init: true,
	    language: im_v2_application_core.Core.getLanguageId(),
	    messengerFacade: {
	      getDefaultZIndex: () => im_v2_lib_slider.MessengerSlider.getInstance().getZIndex(),
	      isMessengerOpen: () => im_v2_lib_slider.MessengerSlider.getInstance().isOpened(),
	      isSliderFocused: () => im_v2_lib_slider.MessengerSlider.getInstance().isFocused(),
	      isThemeDark: () => false,
	      openMessenger: dialogId => {
	        return im_public.Messenger.openChat(dialogId);
	      },
	      openHistory: dialogId => {
	        return im_public.Messenger.openChat(dialogId);
	      },
	      openSettings: () => {
	        return im_public.Messenger.openSettings();
	      },
	      openHelpArticle: () => {},
	      // TODO
	      getContainer: () => document.querySelector(`.${CallManager.viewContainerClass}`),
	      getMessageCount: () => babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['counters/getTotalChatCounter'],
	      getCurrentDialogId: () => babelHelpers.classPrivateFieldLooseBase(this, _getCurrentDialogId)[_getCurrentDialogId](),
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
	        im_v2_lib_promo.PromoManager.getInstance().markAsWatched(code);
	      },
	      [call_core.Controller.Events.onOpenVideoConference]: event => {
	        var _dialog$public;
	        const {
	          dialogId: chatId
	        } = event.getData();
	        const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](`chat${chatId}`, true);
	        return im_public.Messenger.openConference({
	          code: (_dialog$public = dialog.public) == null ? void 0 : _dialog$public.code
	        });
	      }
	    }
	  });
	}
	function _subscribeToEvents2() {
	  main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onLayoutChange, babelHelpers.classPrivateFieldLooseBase(this, _onOpenChat)[_onOpenChat].bind(this));
	  main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onOpenNotifications, this.foldCurrentCall.bind(this));
	  main_core_events.EventEmitter.subscribe(im_v2_const.EventType.call.onJoinFromRecentItem, this.onJoinFromRecentItem.bind(this));
	  main_core_events.EventEmitter.subscribe('CallEvents::callCreated', babelHelpers.classPrivateFieldLooseBase(this, _onCallCreated)[_onCallCreated].bind(this));
	}
	function _subscribeToCallEvents2(call) {
	  call.addEventListener(BX.Call.Event.onJoin, babelHelpers.classPrivateFieldLooseBase(this, _onCallJoinHandler)[_onCallJoinHandler]);
	  call.addEventListener(BX.Call.Event.onLeave, babelHelpers.classPrivateFieldLooseBase(this, _onCallLeaveHandler)[_onCallLeaveHandler]);
	  call.addEventListener(BX.Call.Event.onDestroy, babelHelpers.classPrivateFieldLooseBase(this, _onCallDestroyHandler)[_onCallDestroyHandler]);
	}
	function _unsubscribeFromCallEvents2(call) {
	  call.removeEventListener(BX.Call.Event.onJoin, babelHelpers.classPrivateFieldLooseBase(this, _onCallJoinHandler)[_onCallJoinHandler]);
	  call.removeEventListener(BX.Call.Event.onLeave, babelHelpers.classPrivateFieldLooseBase(this, _onCallLeaveHandler)[_onCallLeaveHandler]);
	  call.removeEventListener(BX.Call.Event.onDestroy, babelHelpers.classPrivateFieldLooseBase(this, _onCallDestroyHandler)[_onCallDestroyHandler]);
	}
	function _onCallCreated2(event) {
	  const {
	    call
	  } = event.getData()[0];
	  const currentCall = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['recent/calls/getCallByDialog'](call.associatedEntity.id);
	  const isNewCall = (currentCall == null ? void 0 : currentCall.call.uuid) !== call.uuid;
	  const state = call.state === call_core.State.Connected || call.state === call_core.State.Proceeding ? im_v2_const.RecentCallStatus.joined : im_v2_const.RecentCallStatus.waiting;
	  if (isNewCall) {
	    if (currentCall) {
	      babelHelpers.classPrivateFieldLooseBase(this, _unsubscribeFromCallEvents)[_unsubscribeFromCallEvents](currentCall.call);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _subscribeToCallEvents)[_subscribeToCallEvents](call);
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('recent/calls/addActiveCall', {
	      dialogId: call.associatedEntity.id,
	      name: call.associatedEntity.name,
	      call,
	      state
	    });
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('recent/calls/updateActiveCall', {
	    dialogId: call.associatedEntity.id,
	    fields: {
	      name: call.associatedEntity.name,
	      state,
	      call
	    }
	  });
	}
	function _onCallJoin2(event) {
	  babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('recent/calls/updateActiveCall', {
	    dialogId: event.call.associatedEntity.id,
	    fields: {
	      state: im_v2_const.RecentCallStatus.joined
	    }
	  });
	}
	function _onCallLeave2(event) {
	  babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('recent/calls/updateActiveCall', {
	    dialogId: event.call.associatedEntity.id,
	    fields: {
	      state: im_v2_const.RecentCallStatus.waiting
	    }
	  });
	}
	function _onCallDestroy2(event) {
	  const dialogId = event.call.associatedEntity.id;
	  const currentCall = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['recent/calls/getCallByDialog'](dialogId);
	  if (currentCall) {
	    babelHelpers.classPrivateFieldLooseBase(this, _unsubscribeFromCallEvents)[_unsubscribeFromCallEvents](currentCall.call);
	  }
	  if ((currentCall == null ? void 0 : currentCall.call.uuid) === event.call.uuid) {
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('recent/calls/deleteActiveCall', {
	      dialogId
	    });
	  }
	}
	function _onOpenChat2(event) {
	  const callDialogId = this.getCurrentCallDialogId();
	  const openedChat = event.getData().to.entityId;
	  if (callDialogId === openedChat) {
	    return;
	  }
	  this.foldCurrentCall();
	}
	function _checkCallSupport2(dialogId) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _pushServerIsActive)[_pushServerIsActive]() || !BX.Call.Util.isWebRTCSupported()) {
	    return false;
	  }
	  const userId = Number(dialogId);
	  return userId > 0 ? babelHelpers.classPrivateFieldLooseBase(this, _checkUserCallSupport)[_checkUserCallSupport](userId) : babelHelpers.classPrivateFieldLooseBase(this, _checkChatCallSupport)[_checkChatCallSupport](dialogId);
	}
	function _checkUserCallSupport2(userId) {
	  const user = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['users/get'](userId);
	  const isBot = user.type === im_v2_const.UserType.bot;
	  return user && user.status !== 'guest' && !isBot && !user.network && user.id !== im_v2_application_core.Core.getUserId() && Boolean(user.lastActivityDate);
	}
	function _checkChatCallSupport2(dialogId) {
	  const userCounter = babelHelpers.classPrivateFieldLooseBase(this, _getChatUserCounter)[_getChatUserCounter](dialogId);
	  return (userCounter > 1 || this.isConference(dialogId)) && userCounter <= this.getCallUserLimit();
	}
	function _pushServerIsActive2() {
	  return true;
	}
	function _getCurrentDialogId2() {
	  const layout = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['application/getLayout'];
	  if (layout.name !== im_v2_const.Layout.chat.name) {
	    return '';
	  }
	  return layout.entityId;
	}
	function _getDialog2(dialogId) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['chats/get'](dialogId);
	}
	function _getChatId2(dialogId) {
	  var _babelHelpers$classPr3;
	  return (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _getDialog)[_getDialog](dialogId)) == null ? void 0 : _babelHelpers$classPr3.chatId;
	}
	function _isUser2(dialogId) {
	  const dialog = babelHelpers.classPrivateFieldLooseBase(this, _getDialog)[_getDialog](dialogId);
	  return (dialog == null ? void 0 : dialog.type) === im_v2_const.ChatType.user;
	}
	function _getChatInfo2(dialogId) {
	  const chatInfo = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['chats/get'](dialogId, true);
	  if (chatInfo.chatId === 0) {
	    return im_public.Messenger.openChat(dialogId).then(() => {
	      const updatedChatInfo = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['chats/get'](dialogId, true);
	      return babelHelpers.classPrivateFieldLooseBase(this, _prepareChatInfo)[_prepareChatInfo](updatedChatInfo);
	    }).catch(error => {
	      im_v2_lib_logger.Logger.error('Open chat error', error);
	      return babelHelpers.classPrivateFieldLooseBase(this, _prepareChatInfo)[_prepareChatInfo](chatInfo);
	    });
	  }
	  return new Promise(resolve => {
	    resolve(babelHelpers.classPrivateFieldLooseBase(this, _prepareChatInfo)[_prepareChatInfo](chatInfo));
	  });
	}
	function _prepareChatInfo2(chatInfo) {
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
	function _prepareCall2(dialogId) {
	  if (!this.isAvailable()) {
	    return;
	  }
	  const currentUserId = im_v2_application_core.Core.getUserId();
	  const currentUser = im_v2_application_core.Core.getStore().getters['users/get'](currentUserId);
	  const callData = {
	    dialogId,
	    userData: {
	      [currentUserId]: currentUser
	    }
	  };
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isUser)[_isUser](dialogId)) {
	    const currentCompanion = im_v2_application_core.Core.getStore().getters['users/get'](dialogId);
	    callData['user'] = currentCompanion.id;
	    callData['userData'][currentCompanion.id] = currentCompanion;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _controller)[_controller].prepareCall(callData);
	}
	function _getChatUserCounter2(dialogId) {
	  const {
	    userCounter
	  } = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['chats/get'](dialogId, true);
	  return userCounter;
	}
	CallManager.viewContainerClass = 'bx-im-messenger__call_container';

	exports.CallManager = CallManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Event,BX.Vue3.Vuex,BX.Call,BX,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX,BX.Messenger.v2.Lib,BX.Messenger.v2.Const,BX,BX.UI,BX.Messenger.v2.Application));
//# sourceMappingURL=call.bundle.js.map
