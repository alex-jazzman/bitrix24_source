/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_popup,ui_vue3_vuex,rest_client,ui_dialogs_messagebox,call_lib_analytics,im_v2_lib_call,im_v2_provider_service_recent,im_v2_lib_invite,im_public,im_v2_provider_service_chat,im_v2_lib_promo,im_v2_lib_analytics,im_v2_application_core,im_v2_lib_parser,im_v2_lib_entityCreator,im_v2_provider_service_message,im_v2_provider_service_disk,im_v2_lib_market,im_v2_lib_utils,im_v2_lib_permission,im_v2_lib_confirm,im_v2_lib_notifier,main_core_events,im_v2_const,im_v2_lib_channel,main_core,im_v2_lib_copilot) {
	'use strict';

	const EVENT_NAMESPACE = 'BX.Messenger.v2.Lib.Menu';
	var _prepareMenuItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareMenuItems");
	var _filterExcessDelimiters = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filterExcessDelimiters");
	var _filterDuplicateDelimiters = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filterDuplicateDelimiters");
	var _filterFinishingDelimiter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filterFinishingDelimiter");
	class BaseMenu extends main_core_events.EventEmitter {
	  constructor() {
	    super();
	    Object.defineProperty(this, _filterFinishingDelimiter, {
	      value: _filterFinishingDelimiter2
	    });
	    Object.defineProperty(this, _filterDuplicateDelimiters, {
	      value: _filterDuplicateDelimiters2
	    });
	    Object.defineProperty(this, _filterExcessDelimiters, {
	      value: _filterExcessDelimiters2
	    });
	    Object.defineProperty(this, _prepareMenuItems, {
	      value: _prepareMenuItems2
	    });
	    this.id = 'im-base-context-menu';
	    this.setEventNamespace(EVENT_NAMESPACE);
	    this.store = im_v2_application_core.Core.getStore();
	    this.restClient = im_v2_application_core.Core.getRestClient();
	    this.onClosePopupHandler = this.onClosePopup.bind(this);
	  }

	  // public
	  openMenu(context, target) {
	    if (this.menuInstance) {
	      this.close();
	    }
	    this.context = context;
	    this.target = target;
	    this.menuInstance = this.getMenuInstance();
	    this.menuInstance.show();

	    // EventEmitter.subscribe(EventType.dialog.closePopup, this.onClosePopupHandler);
	  }

	  getMenuInstance() {
	    return main_popup.MenuManager.create(this.getMenuOptions());
	  }
	  getMenuOptions() {
	    return {
	      id: this.id,
	      bindOptions: {
	        forceBindPosition: true,
	        position: 'bottom'
	      },
	      targetContainer: document.body,
	      bindElement: this.target,
	      cacheable: false,
	      className: this.getMenuClassName(),
	      items: babelHelpers.classPrivateFieldLooseBase(this, _prepareMenuItems)[_prepareMenuItems](),
	      events: {
	        onClose: () => {
	          this.emit(BaseMenu.events.onCloseMenu);
	          this.close();
	        }
	      }
	    };
	  }
	  getMenuItems() {
	    return [];
	  }
	  getMenuClassName() {
	    return '';
	  }
	  onClosePopup() {
	    this.close();
	  }
	  close() {
	    // EventEmitter.unsubscribe(EventType.dialog.closePopup, this.onClosePopupHandler);
	    if (!this.menuInstance) {
	      return;
	    }
	    this.menuInstance.destroy();
	    this.menuInstance = null;
	  }
	  destroy() {
	    this.close();
	  }
	  getCurrentUserId() {
	    return im_v2_application_core.Core.getUserId();
	  }
	  isDelimiter(element) {
	    return main_core.Type.isObjectLike(element) && element.delimiter === true;
	  }
	}
	function _prepareMenuItems2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _filterExcessDelimiters)[_filterExcessDelimiters](this.getMenuItems());
	}
	function _filterExcessDelimiters2(menuItems) {
	  const menuItemsWithoutDuplicates = babelHelpers.classPrivateFieldLooseBase(this, _filterDuplicateDelimiters)[_filterDuplicateDelimiters](menuItems);
	  return babelHelpers.classPrivateFieldLooseBase(this, _filterFinishingDelimiter)[_filterFinishingDelimiter](menuItemsWithoutDuplicates);
	}
	function _filterDuplicateDelimiters2(menuItems) {
	  let previousElement = null;
	  return menuItems.filter(element => {
	    if (this.isDelimiter(previousElement) && this.isDelimiter(element)) {
	      return false;
	    }
	    if (element !== null) {
	      previousElement = element;
	    }
	    return true;
	  });
	}
	function _filterFinishingDelimiter2(menuItems) {
	  let previousElement = null;
	  return menuItems.reverse().filter(element => {
	    if (previousElement === null && this.isDelimiter(element)) {
	      return false;
	    }
	    if (element !== null) {
	      previousElement = element;
	    }
	    return true;
	  }).reverse();
	}
	BaseMenu.events = {
	  onCloseMenu: 'onCloseMenu'
	};

	var _leaveChat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("leaveChat");
	var _leaveCollab = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("leaveCollab");
	class RecentMenu extends BaseMenu {
	  constructor() {
	    super();
	    Object.defineProperty(this, _leaveCollab, {
	      value: _leaveCollab2
	    });
	    Object.defineProperty(this, _leaveChat, {
	      value: _leaveChat2
	    });
	    this.id = 'im-recent-context-menu';
	    this.chatService = new im_v2_provider_service_chat.ChatService();
	    this.callManager = im_v2_lib_call.CallManager.getInstance();
	    this.permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
	  }
	  getMenuOptions() {
	    return {
	      ...super.getMenuOptions(),
	      className: this.getMenuClassName(),
	      angle: true,
	      offsetLeft: 32
	    };
	  }
	  getMenuClassName() {
	    return this.context.compactMode ? '' : super.getMenuClassName();
	  }
	  getMenuItems() {
	    if (this.context.invitation.isActive) {
	      return this.getInviteItems();
	    }
	    return [this.getUnreadMessageItem(), this.getPinMessageItem(), this.getMuteItem(), this.getOpenProfileItem(), this.getChatsWithUserItem(), this.getHideItem(), this.getLeaveItem()];
	  }
	  getSendMessageItem() {
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_MENU_WRITE_V2'),
	      onclick: () => {
	        im_public.Messenger.openChat(this.context.dialogId);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getOpenItem() {
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_MENU_OPEN'),
	      onclick: () => {
	        im_public.Messenger.openChat(this.context.dialogId);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getUnreadMessageItem() {
	    const dialog = this.store.getters['chats/get'](this.context.dialogId, true);
	    const showReadOption = this.context.unread || dialog.counter > 0;
	    return {
	      text: showReadOption ? main_core.Loc.getMessage('IM_LIB_MENU_READ') : main_core.Loc.getMessage('IM_LIB_MENU_UNREAD'),
	      onclick: () => {
	        if (showReadOption) {
	          this.chatService.readDialog(this.context.dialogId);
	        } else {
	          this.chatService.unreadDialog(this.context.dialogId);
	        }
	        this.menuInstance.close();
	      }
	    };
	  }
	  getPinMessageItem() {
	    const isPinned = this.context.pinned;
	    return {
	      text: isPinned ? main_core.Loc.getMessage('IM_LIB_MENU_UNPIN_MSGVER_1') : main_core.Loc.getMessage('IM_LIB_MENU_PIN_MSGVER_1'),
	      onclick: () => {
	        if (isPinned) {
	          this.chatService.unpinChat(this.context.dialogId);
	        } else {
	          const dialog = this.store.getters['chats/get'](this.context.dialogId, true);
	          this.chatService.pinChat(this.context.dialogId);
	          im_v2_lib_analytics.Analytics.getInstance().onPinChat(dialog);
	        }
	        this.menuInstance.close();
	      }
	    };
	  }
	  getMuteItem() {
	    const canMute = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.mute, this.context.dialogId);
	    if (!canMute) {
	      return null;
	    }
	    const dialog = this.store.getters['chats/get'](this.context.dialogId, true);
	    const isMuted = dialog.muteList.includes(im_v2_application_core.Core.getUserId());
	    return {
	      text: isMuted ? main_core.Loc.getMessage('IM_LIB_MENU_UNMUTE_2') : main_core.Loc.getMessage('IM_LIB_MENU_MUTE_2'),
	      onclick: () => {
	        if (isMuted) {
	          this.chatService.unmuteChat(this.context.dialogId);
	        } else {
	          this.chatService.muteChat(this.context.dialogId);
	        }
	        this.menuInstance.close();
	      }
	    };
	  }
	  getCallItem() {
	    const chatCanBeCalled = this.callManager.chatCanBeCalled(this.context.dialogId);
	    const chatIsAllowedToCall = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.call, this.context.dialogId);
	    if (!chatCanBeCalled || !chatIsAllowedToCall) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_MENU_CALL_2'),
	      onclick: () => {
	        call_lib_analytics.Analytics.getInstance().onRecentStartCallClick({
	          isGroupChat: this.context.dialogId.includes('chat'),
	          chatId: this.context.chatId
	        });
	        this.callManager.startCall(this.context.dialogId);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getOpenProfileItem() {
	    if (!this.isUser() || this.isBot()) {
	      return null;
	    }
	    const profileUri = im_v2_lib_utils.Utils.user.getProfileLink(this.context.dialogId);
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_MENU_OPEN_PROFILE_V2'),
	      href: profileUri,
	      onclick: () => {
	        this.menuInstance.close();
	      }
	    };
	  }
	  getHideItem() {
	    var _this$context$invitat, _this$context$options;
	    if ((_this$context$invitat = this.context.invitation) != null && _this$context$invitat.isActive || (_this$context$options = this.context.options) != null && _this$context$options.default_user_record) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_MENU_HIDE_MSGVER_1'),
	      onclick: () => {
	        im_v2_provider_service_recent.RecentService.getInstance().hideChat(this.context.dialogId);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getLeaveItem() {
	    if (this.isCollabChat()) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _leaveCollab)[_leaveCollab]();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _leaveChat)[_leaveChat]();
	  }
	  getChatsWithUserItem() {
	    if (!this.isUser() || this.isBot() || this.isChatWithCurrentUser()) {
	      return null;
	    }
	    const isAnyChatOpened = this.store.getters['application/getLayout'].entityId.length > 0;
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_MENU_FIND_SHARED_CHATS'),
	      onclick: async () => {
	        if (!isAnyChatOpened) {
	          await im_public.Messenger.openChat(this.context.dialogId);
	        }
	        main_core_events.EventEmitter.emit(im_v2_const.EventType.sidebar.open, {
	          panel: im_v2_const.SidebarDetailBlock.chatsWithUser,
	          standalone: true,
	          dialogId: this.context.dialogId
	        });
	        this.menuInstance.close();
	      }
	    };
	  }

	  // region invitation
	  getInviteItems() {
	    const items = [this.getSendMessageItem(), this.getOpenProfileItem()];
	    let canInvite; // TODO change to APPLICATION variable
	    if (main_core.Type.isUndefined(BX.MessengerProxy)) {
	      canInvite = true;
	      console.error('BX.MessengerProxy.canInvite() method not found in v2 version!');
	    } else {
	      canInvite = BX.MessengerProxy.canInvite();
	    }
	    const canManageInvite = canInvite && im_v2_application_core.Core.getUserId() === this.context.invitation.originator;
	    if (canManageInvite) {
	      items.push(this.getDelimiter(), this.context.invitation.canResend ? this.getResendInviteItem() : null, this.getCancelInviteItem());
	    }
	    return items;
	  }
	  getResendInviteItem() {
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_INVITE_RESEND'),
	      onclick: () => {
	        im_v2_lib_invite.InviteManager.resendInvite(this.context.dialogId);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getCancelInviteItem() {
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_INVITE_CANCEL'),
	      onclick: () => {
	        ui_dialogs_messagebox.MessageBox.show({
	          message: main_core.Loc.getMessage('IM_LIB_INVITE_CANCEL_CONFIRM'),
	          modal: true,
	          buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
	          onOk: messageBox => {
	            im_v2_lib_invite.InviteManager.cancelInvite(this.context.dialogId);
	            messageBox.close();
	          },
	          onCancel: messageBox => {
	            messageBox.close();
	          }
	        });
	        this.menuInstance.close();
	      }
	    };
	  }
	  // endregion

	  getDelimiter() {
	    return {
	      delimiter: true
	    };
	  }
	  getChat() {
	    return this.store.getters['chats/get'](this.context.dialogId, true);
	  }
	  isUser() {
	    return this.store.getters['chats/isUser'](this.context.dialogId);
	  }
	  isBot() {
	    if (!this.isUser()) {
	      return false;
	    }
	    const user = this.store.getters['users/get'](this.context.dialogId);
	    return user.type === im_v2_const.UserType.bot;
	  }
	  isChannel() {
	    return im_v2_lib_channel.ChannelManager.isChannel(this.context.dialogId);
	  }
	  isCommentsChat() {
	    const {
	      type
	    } = this.store.getters['chats/get'](this.context.dialogId, true);
	    return type === im_v2_const.ChatType.comment;
	  }
	  isCollabChat() {
	    const {
	      type
	    } = this.store.getters['chats/get'](this.context.dialogId, true);
	    return type === im_v2_const.ChatType.collab;
	  }
	  isChatWithCurrentUser() {
	    return this.getCurrentUserId() === Number.parseInt(this.context.dialogId, 10);
	  }
	}
	function _leaveChat2() {
	  const canLeaveChat = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.leave, this.context.dialogId);
	  if (!canLeaveChat) {
	    return null;
	  }
	  const text = this.isChannel() ? main_core.Loc.getMessage('IM_LIB_MENU_LEAVE_CHANNEL') : main_core.Loc.getMessage('IM_LIB_MENU_LEAVE_MSGVER_1');
	  return {
	    text,
	    onclick: async () => {
	      this.menuInstance.close();
	      const userChoice = await im_v2_lib_confirm.showLeaveChatConfirm(this.context.dialogId);
	      if (userChoice === true) {
	        this.chatService.leaveChat(this.context.dialogId);
	      }
	    }
	  };
	}
	function _leaveCollab2() {
	  const canLeaveChat = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.leave, this.context.dialogId);
	  const canLeaveCollab = this.permissionManager.canPerformActionByUserType(im_v2_const.ActionByUserType.leaveCollab);
	  if (!canLeaveChat || !canLeaveCollab) {
	    return null;
	  }
	  return {
	    text: main_core.Loc.getMessage('IM_LIB_MENU_LEAVE_MSGVER_1'),
	    onclick: async () => {
	      this.menuInstance.close();
	      const userChoice = await im_v2_lib_confirm.showLeaveChatConfirm(this.context.dialogId);
	      if (!userChoice) {
	        return;
	      }
	      this.chatService.leaveCollab(this.context.dialogId);
	    }
	  };
	}

	var _getKickItemText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getKickItemText");
	var _kickUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("kickUser");
	class UserMenu extends BaseMenu {
	  constructor() {
	    super();
	    Object.defineProperty(this, _kickUser, {
	      value: _kickUser2
	    });
	    Object.defineProperty(this, _getKickItemText, {
	      value: _getKickItemText2
	    });
	    this.id = 'bx-im-user-context-menu';
	    this.permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
	  }
	  getKickItem() {
	    const canKick = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.kick, this.context.dialog.dialogId);
	    if (!canKick) {
	      return null;
	    }
	    return {
	      text: babelHelpers.classPrivateFieldLooseBase(this, _getKickItemText)[_getKickItemText](),
	      onclick: async () => {
	        this.menuInstance.close();
	        const userChoice = await im_v2_lib_confirm.showKickUserConfirm(this.context.dialog.dialogId);
	        if (userChoice !== true) {
	          return;
	        }
	        void babelHelpers.classPrivateFieldLooseBase(this, _kickUser)[_kickUser]();
	      }
	    };
	  }
	  getMentionItem() {
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_MENU_USER_MENTION'),
	      onclick: () => {
	        main_core_events.EventEmitter.emit(im_v2_const.EventType.textarea.insertMention, {
	          mentionText: this.context.user.name,
	          mentionReplacement: im_v2_lib_utils.Utils.text.getMentionBbCode(this.context.user.id, this.context.user.name),
	          dialogId: this.context.dialog.dialogId,
	          isMentionSymbol: false
	        });
	        this.menuInstance.close();
	      }
	    };
	  }
	  getSendItem() {
	    if (this.context.dialog.type === im_v2_const.ChatType.user) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_MENU_USER_WRITE'),
	      onclick: () => {
	        void im_public.Messenger.openChat(this.context.user.id);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getProfileItem() {
	    if (this.isBot()) {
	      return null;
	    }
	    const profileUri = im_v2_lib_utils.Utils.user.getProfileLink(this.context.user.id);
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_MENU_OPEN_PROFILE_V2'),
	      href: profileUri,
	      onclick: () => {
	        this.menuInstance.close();
	      }
	    };
	  }
	  isCollabChat() {
	    const {
	      type
	    } = this.store.getters['chats/get'](this.context.dialog.dialogId, true);
	    return type === im_v2_const.ChatType.collab;
	  }
	  isBot() {
	    return this.context.user.type === im_v2_const.UserType.bot;
	  }
	}
	function _getKickItemText2() {
	  if (this.isCollabChat()) {
	    return main_core.Loc.getMessage('IM_LIB_MENU_USER_KICK_FROM_COLLAB');
	  }
	  return main_core.Loc.getMessage('IM_LIB_MENU_USER_KICK_FROM_CHAT');
	}
	function _kickUser2() {
	  if (this.isCollabChat()) {
	    return new im_v2_provider_service_chat.ChatService().kickUserFromCollab(this.context.dialog.dialogId, this.context.user.id);
	  }
	  return new im_v2_provider_service_chat.ChatService().kickUserFromChat(this.context.dialog.dialogId, this.context.user.id);
	}

	var _needNestedMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("needNestedMenu");
	var _isOwnMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isOwnMessage");
	var _isDeletedMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isDeletedMessage");
	var _getFirstFile = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFirstFile");
	var _isSingleFile = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isSingleFile");
	var _isForwardedMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isForwardedMessage");
	var _isRealMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isRealMessage");
	var _onDelete = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDelete");
	var _isDeletionCancelled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isDeletionCancelled");
	var _getDownloadSingleFileItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDownloadSingleFileItem");
	var _getDownloadSeveralFilesItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDownloadSeveralFilesItem");
	var _arePinsExceedLimit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("arePinsExceedLimit");
	class MessageMenu extends BaseMenu {
	  constructor() {
	    super();
	    Object.defineProperty(this, _arePinsExceedLimit, {
	      value: _arePinsExceedLimit2
	    });
	    Object.defineProperty(this, _getDownloadSeveralFilesItem, {
	      value: _getDownloadSeveralFilesItem2
	    });
	    Object.defineProperty(this, _getDownloadSingleFileItem, {
	      value: _getDownloadSingleFileItem2
	    });
	    Object.defineProperty(this, _isDeletionCancelled, {
	      value: _isDeletionCancelled2
	    });
	    Object.defineProperty(this, _onDelete, {
	      value: _onDelete2
	    });
	    Object.defineProperty(this, _isRealMessage, {
	      value: _isRealMessage2
	    });
	    Object.defineProperty(this, _isForwardedMessage, {
	      value: _isForwardedMessage2
	    });
	    Object.defineProperty(this, _isSingleFile, {
	      value: _isSingleFile2
	    });
	    Object.defineProperty(this, _getFirstFile, {
	      value: _getFirstFile2
	    });
	    Object.defineProperty(this, _isDeletedMessage, {
	      value: _isDeletedMessage2
	    });
	    Object.defineProperty(this, _isOwnMessage, {
	      value: _isOwnMessage2
	    });
	    Object.defineProperty(this, _needNestedMenu, {
	      value: _needNestedMenu2
	    });
	    this.maxPins = 20;
	    this.id = 'bx-im-message-context-menu';
	    this.diskService = new im_v2_provider_service_disk.DiskService();
	    this.marketManager = im_v2_lib_market.MarketManager.getInstance();
	  }
	  getMenuOptions() {
	    return {
	      ...super.getMenuOptions(),
	      className: this.getMenuClassName(),
	      angle: true,
	      offsetLeft: 11,
	      minWidth: 178
	    };
	  }
	  getMenuItems() {
	    return [this.getReplyItem(), this.getCopyItem(), this.getEditItem(), this.getPinItem(), this.getForwardItem(), ...this.getAdditionalItems(), this.getDeleteItem(), this.getDelimiter(), this.getSelectItem()];
	  }
	  getSelectItem() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isDeletedMessage)[_isDeletedMessage]() || !babelHelpers.classPrivateFieldLooseBase(this, _isRealMessage)[_isRealMessage]()) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_SELECT'),
	      onclick: () => {
	        main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.openBulkActionsMode, {
	          messageId: this.context.id,
	          dialogId: this.context.dialogId
	        });
	        this.menuInstance.close();
	      }
	    };
	  }
	  getReplyItem() {
	    return {
	      text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_REPLY'),
	      onclick: () => {
	        main_core_events.EventEmitter.emit(im_v2_const.EventType.textarea.replyMessage, {
	          messageId: this.context.id,
	          dialogId: this.context.dialogId
	        });
	        this.menuInstance.close();
	      }
	    };
	  }
	  getForwardItem() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isDeletedMessage)[_isDeletedMessage]() || !babelHelpers.classPrivateFieldLooseBase(this, _isRealMessage)[_isRealMessage]()) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_FORWARD'),
	      onclick: () => {
	        im_v2_lib_analytics.Analytics.getInstance().messageForward.onClickForward({
	          dialogId: this.context.dialogId
	        });
	        main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.showForwardPopup, {
	          messagesIds: [this.context.id]
	        });
	        this.menuInstance.close();
	      }
	    };
	  }
	  getCopyItem() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isDeletedMessage)[_isDeletedMessage]() || this.context.text.trim().length === 0) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY'),
	      onclick: async () => {
	        const textToCopy = im_v2_lib_parser.Parser.prepareCopy(this.context);
	        await im_v2_lib_utils.Utils.text.copyToClipboard(textToCopy);
	        im_v2_lib_notifier.Notifier.message.onCopyComplete();
	        this.menuInstance.close();
	      }
	    };
	  }
	  getCopyLinkItem() {
	    return {
	      text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY_LINK_MSGVER_1'),
	      onclick: () => {
	        var _BX$clipboard;
	        const textToCopy = im_v2_lib_utils.Utils.text.getMessageLink(this.context.dialogId, this.context.id);
	        if ((_BX$clipboard = BX.clipboard) != null && _BX$clipboard.copy(textToCopy)) {
	          im_v2_lib_notifier.Notifier.message.onCopyLinkComplete();
	        }
	        this.menuInstance.close();
	      }
	    };
	  }
	  getCopyFileItem() {
	    if (this.context.files.length !== 1) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY_FILE'),
	      onclick: () => {
	        var _BX$clipboard2;
	        const textToCopy = im_v2_lib_parser.Parser.prepareCopyFile(this.context);
	        if ((_BX$clipboard2 = BX.clipboard) != null && _BX$clipboard2.copy(textToCopy)) {
	          im_v2_lib_notifier.Notifier.file.onCopyComplete();
	        }
	        this.menuInstance.close();
	      }
	    };
	  }
	  getPinItem() {
	    const canPin = im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.pinMessage, this.context.dialogId);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isDeletedMessage)[_isDeletedMessage]() || !canPin) {
	      return null;
	    }
	    const isPinned = this.store.getters['messages/pin/isPinned']({
	      chatId: this.context.chatId,
	      messageId: this.context.id
	    });
	    return {
	      text: isPinned ? main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_UNPIN') : main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_PIN'),
	      onclick: () => {
	        const messageService = new im_v2_provider_service_message.MessageService({
	          chatId: this.context.chatId
	        });
	        if (isPinned) {
	          messageService.unpinMessage(this.context.chatId, this.context.id);
	          im_v2_lib_analytics.Analytics.getInstance().messagePins.onUnpin(this.context.chatId);
	        } else {
	          if (babelHelpers.classPrivateFieldLooseBase(this, _arePinsExceedLimit)[_arePinsExceedLimit]()) {
	            im_v2_lib_notifier.Notifier.chat.onMessagesPinLimitError(this.maxPins);
	            im_v2_lib_analytics.Analytics.getInstance().messagePins.onReachingLimit(this.context.chatId);
	            this.menuInstance.close();
	            return;
	          }
	          messageService.pinMessage(this.context.chatId, this.context.id);
	          im_v2_lib_analytics.Analytics.getInstance().messagePins.onPin(this.context.chatId);
	        }
	        this.menuInstance.close();
	      }
	    };
	  }
	  getFavoriteItem() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isDeletedMessage)[_isDeletedMessage]()) {
	      return null;
	    }
	    const isInFavorite = this.store.getters['sidebar/favorites/isFavoriteMessage'](this.context.chatId, this.context.id);
	    const menuItemText = isInFavorite ? main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_REMOVE_FROM_SAVED') : main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE');
	    return {
	      text: menuItemText,
	      onclick: () => {
	        const messageService = new im_v2_provider_service_message.MessageService({
	          chatId: this.context.chatId
	        });
	        if (isInFavorite) {
	          messageService.removeMessageFromFavorite(this.context.id);
	        } else {
	          messageService.addMessageToFavorite(this.context.id);
	        }
	        this.menuInstance.close();
	      }
	    };
	  }
	  getMarkItem() {
	    const canUnread = this.context.viewed && !babelHelpers.classPrivateFieldLooseBase(this, _isOwnMessage)[_isOwnMessage]();
	    const dialog = this.store.getters['chats/getByChatId'](this.context.chatId);
	    const isMarked = this.context.id === dialog.markedId;
	    if (!canUnread || isMarked) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_MARK'),
	      onclick: () => {
	        const messageService = new im_v2_provider_service_message.MessageService({
	          chatId: this.context.chatId
	        });
	        messageService.markMessage(this.context.id);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getCreateTaskItem() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isDeletedMessage)[_isDeletedMessage]()) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_CREATE_TASK_MSGVER_1'),
	      onclick: () => {
	        const entityCreator = new im_v2_lib_entityCreator.EntityCreator(this.context.chatId);
	        void entityCreator.createTaskForMessage(this.context.id);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getCreateMeetingItem() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isDeletedMessage)[_isDeletedMessage]()) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_CREATE_MEETING_MSGVER_1'),
	      onclick: () => {
	        const entityCreator = new im_v2_lib_entityCreator.EntityCreator(this.context.chatId);
	        void entityCreator.createMeetingForMessage(this.context.id);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getEditItem() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isOwnMessage)[_isOwnMessage]() || babelHelpers.classPrivateFieldLooseBase(this, _isDeletedMessage)[_isDeletedMessage]() || babelHelpers.classPrivateFieldLooseBase(this, _isForwardedMessage)[_isForwardedMessage]()) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_EDIT'),
	      onclick: () => {
	        main_core_events.EventEmitter.emit(im_v2_const.EventType.textarea.editMessage, {
	          messageId: this.context.id,
	          dialogId: this.context.dialogId
	        });
	        this.menuInstance.close();
	      }
	    };
	  }
	  getDeleteItem() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isDeletedMessage)[_isDeletedMessage]()) {
	      return null;
	    }
	    const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
	    const canDeleteOthersMessage = permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.deleteOthersMessage, this.context.dialogId);
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isOwnMessage)[_isOwnMessage]() && !canDeleteOthersMessage) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_DELETE'),
	      className: 'menu-popup-no-icon bx-im-dialog-chat__message-menu_delete',
	      onclick: babelHelpers.classPrivateFieldLooseBase(this, _onDelete)[_onDelete].bind(this)
	    };
	  }
	  getMarketItems() {
	    const {
	      dialogId,
	      id
	    } = this.context;
	    const placements = this.marketManager.getAvailablePlacementsByType(im_v2_const.PlacementType.contextMenu, dialogId);
	    const marketMenuItem = [];
	    if (placements.length > 0) {
	      marketMenuItem.push(this.getDelimiter());
	    }
	    const context = {
	      messageId: id,
	      dialogId
	    };
	    placements.forEach(placement => {
	      marketMenuItem.push({
	        text: placement.title,
	        onclick: () => {
	          im_v2_lib_market.MarketManager.openSlider(placement, context);
	          this.menuInstance.close();
	        }
	      });
	    });

	    // (10 items + 1 delimiter), because we don't want to show long context menu.
	    const itemLimit = 11;
	    return marketMenuItem.slice(0, itemLimit);
	  }
	  getDownloadFileItem() {
	    if (!main_core.Type.isArrayFilled(this.context.files)) {
	      return null;
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isSingleFile)[_isSingleFile]()) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _getDownloadSingleFileItem)[_getDownloadSingleFileItem]();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _getDownloadSeveralFilesItem)[_getDownloadSeveralFilesItem]();
	  }
	  getSaveToDiskItem() {
	    if (!main_core.Type.isArrayFilled(this.context.files)) {
	      return null;
	    }
	    const menuItemText = babelHelpers.classPrivateFieldLooseBase(this, _isSingleFile)[_isSingleFile]() ? main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE_ON_DISK_MSGVER_1') : main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE_ALL_ON_DISK');
	    return {
	      text: menuItemText,
	      onclick: async function () {
	        im_v2_lib_analytics.Analytics.getInstance().messageFiles.onClickSaveOnDisk({
	          messageId: this.context.id,
	          dialogId: this.context.dialogId
	        });
	        this.menuInstance.close();
	        await this.diskService.save(this.context.files);
	        im_v2_lib_notifier.Notifier.file.onDiskSaveComplete(babelHelpers.classPrivateFieldLooseBase(this, _isSingleFile)[_isSingleFile]());
	      }.bind(this)
	    };
	  }
	  getDelimiter() {
	    return {
	      delimiter: true
	    };
	  }
	  getAdditionalItems() {
	    const additionalItems = this.getNestedItems();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _needNestedMenu)[_needNestedMenu](additionalItems)) {
	      return [{
	        text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_MORE'),
	        items: additionalItems
	      }];
	    }
	    return additionalItems;
	  }
	  getNestedItems() {
	    return [this.getCopyLinkItem(), this.getCopyFileItem(), this.getMarkItem(), this.getFavoriteItem(), this.getDownloadFileItem(), this.getSaveToDiskItem(), this.getDelimiter(), this.getCreateTaskItem(), this.getCreateMeetingItem(), ...this.getMarketItems()];
	  }
	}
	function _needNestedMenu2(additionalItems) {
	  const NESTED_MENU_MIN_ITEMS = 3;
	  const onlyMenuItems = additionalItems.filter(item => item && !this.isDelimiter(item));
	  return onlyMenuItems.length >= NESTED_MENU_MIN_ITEMS;
	}
	function _isOwnMessage2() {
	  return this.context.authorId === im_v2_application_core.Core.getUserId();
	}
	function _isDeletedMessage2() {
	  return this.context.isDeleted;
	}
	function _getFirstFile2() {
	  return this.store.getters['files/get'](this.context.files[0]);
	}
	function _isSingleFile2() {
	  return this.context.files.length === 1;
	}
	function _isForwardedMessage2() {
	  return main_core.Type.isStringFilled(this.context.forward.id);
	}
	function _isRealMessage2() {
	  return this.store.getters['messages/isRealMessage'](this.context.id);
	}
	async function _onDelete2() {
	  const {
	    id: messageId,
	    dialogId,
	    chatId
	  } = this.context;
	  im_v2_lib_analytics.Analytics.getInstance().messageDelete.onClickDelete({
	    messageId,
	    dialogId
	  });
	  this.menuInstance.close();
	  if (await babelHelpers.classPrivateFieldLooseBase(this, _isDeletionCancelled)[_isDeletionCancelled]()) {
	    return;
	  }
	  const messageService = new im_v2_provider_service_message.MessageService({
	    chatId
	  });
	  messageService.deleteMessages([messageId]);
	}
	async function _isDeletionCancelled2() {
	  const {
	    id: messageId,
	    dialogId
	  } = this.context;
	  if (!im_v2_lib_channel.ChannelManager.isChannel(dialogId)) {
	    return false;
	  }
	  const confirmResult = await im_v2_lib_confirm.showDeleteChannelPostConfirm();
	  if (!confirmResult) {
	    im_v2_lib_analytics.Analytics.getInstance().messageDelete.onCancel({
	      messageId,
	      dialogId
	    });
	    return true;
	  }
	  return false;
	}
	function _getDownloadSingleFileItem2() {
	  const file = babelHelpers.classPrivateFieldLooseBase(this, _getFirstFile)[_getFirstFile]();
	  return {
	    html: im_v2_lib_utils.Utils.file.createDownloadLink(main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_DOWNLOAD_FILE'), file.urlDownload, file.name),
	    onclick: function () {
	      im_v2_lib_analytics.Analytics.getInstance().messageFiles.onClickDownload({
	        messageId: this.context.id,
	        dialogId: this.context.dialogId
	      });
	      this.menuInstance.close();
	    }.bind(this)
	  };
	}
	function _getDownloadSeveralFilesItem2() {
	  const files = this.context.files.map(fileId => {
	    return this.store.getters['files/get'](fileId);
	  });
	  return {
	    text: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_DOWNLOAD_FILES'),
	    onclick: async () => {
	      var _this$menuInstance2;
	      im_v2_lib_analytics.Analytics.getInstance().messageFiles.onClickDownload({
	        messageId: this.context.id,
	        dialogId: this.context.dialogId
	      });
	      im_v2_lib_utils.Utils.file.downloadFiles(files);
	      const needToShowPopup = im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.downloadSeveralFiles);
	      if (needToShowPopup && im_v2_lib_utils.Utils.browser.isChrome() && !im_v2_lib_utils.Utils.platform.isBitrixDesktop()) {
	        var _this$menuInstance;
	        (_this$menuInstance = this.menuInstance) == null ? void 0 : _this$menuInstance.close();
	        await im_v2_lib_confirm.showDownloadAllFilesConfirm();
	        void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.downloadSeveralFiles);
	      }
	      (_this$menuInstance2 = this.menuInstance) == null ? void 0 : _this$menuInstance2.close();
	    }
	  };
	}
	function _arePinsExceedLimit2() {
	  const pins = this.store.getters['messages/pin/getPinned'](this.context.chatId);
	  return pins.length >= this.maxPins;
	}

	class ChannelMessageMenu extends MessageMenu {
	  getMenuItems() {
	    return [this.getCopyItem(), this.getEditItem(), this.getPinItem(), this.getForwardItem(), ...this.getAdditionalItems(), this.getDeleteItem(), this.getDelimiter(), this.getSelectItem()];
	  }
	  getNestedItems() {
	    return [this.getCopyLinkItem(), this.getCopyFileItem(), this.getMarkItem(), this.getFavoriteItem(), this.getDownloadFileItem(), this.getSaveToDiskItem()];
	  }
	}

	class CommentsMessageMenu extends MessageMenu {
	  getMenuItems() {
	    const message = this.context;
	    const contextDialogId = this.context.dialogId;
	    if (im_v2_lib_channel.ChannelManager.isCommentsPostMessage(message, contextDialogId)) {
	      return [this.getCopyItem(), this.getCopyFileItem(), this.getDelimiter(), this.getDownloadFileItem(), this.getSaveToDiskItem(), this.getDelimiter(), this.getOpenInChannelItem()];
	    }
	    return [this.getReplyItem(), this.getCopyItem(), this.getEditItem(), ...this.getAdditionalItems(), this.getDeleteItem()];
	  }
	  getNestedItems() {
	    return [this.getCopyFileItem(), this.getFavoriteItem(), this.getDownloadFileItem(), this.getSaveToDiskItem(), this.getDelimiter(), this.getCreateTaskItem(), this.getCreateMeetingItem()];
	  }
	  getOpenInChannelItem() {
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_MENU_COMMENTS_OPEN_IN_CHANNEL'),
	      onclick: () => {
	        main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.closeComments);
	        this.menuInstance.close();
	      }
	    };
	  }
	}

	const CopilotChatContext = Object.freeze({
	  personal: 'chat_copilot_tab_one_by_one',
	  group: 'chat_copilot_tab_multi'
	});
	class CopilotMessageMenu extends MessageMenu {
	  getMenuItems() {
	    return [this.getCopyItem(), this.getMarkItem(), this.getFavoriteItem(), this.getForwardItem(), this.getSendFeedbackItem(), this.getDeleteItem(), this.getSelectItem()];
	  }
	  getSendFeedbackItem() {
	    const copilotManager = new im_v2_lib_copilot.CopilotManager();
	    if (!copilotManager.isCopilotBot(this.context.authorId)) {
	      return null;
	    }
	    return {
	      text: main_core.Loc.getMessage('IM_LIB_MENU_COPILOT_FEEDBACK'),
	      onclick: () => {
	        void this.openForm();
	        this.menuInstance.close();
	      }
	    };
	  }
	  async openForm() {
	    const formId = Math.round(Math.random() * 1000);
	    await main_core.Runtime.loadExtension(['ui.feedback.form']);
	    BX.UI.Feedback.Form.open({
	      id: `im.copilot.feedback-${formId}`,
	      forms: [{
	        zones: ['es'],
	        id: 684,
	        lang: 'es',
	        sec: 'svvq1x'
	      }, {
	        zones: ['en'],
	        id: 686,
	        lang: 'en',
	        sec: 'tjwodz'
	      }, {
	        zones: ['de'],
	        id: 688,
	        lang: 'de',
	        sec: 'nrwksg'
	      }, {
	        zones: ['com.br'],
	        id: 690,
	        lang: 'com.br',
	        sec: 'kpte6m'
	      }, {
	        zones: ['ru', 'by', 'kz'],
	        id: 692,
	        lang: 'ru',
	        sec: 'jbujn0'
	      }],
	      presets: {
	        sender_page: this.getCopilotChatContext(),
	        language: main_core.Loc.getMessage('LANGUAGE_ID'),
	        cp_answer: this.context.text
	      }
	    });
	  }
	  getCopilotChatContext() {
	    const chat = this.store.getters['chats/get'](this.context.dialogId);
	    if (chat.userCounter <= 2) {
	      return CopilotChatContext.personal;
	    }
	    return CopilotChatContext.group;
	  }
	}

	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	var _defaultMenuByCallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("defaultMenuByCallback");
	var _customMenuByCallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("customMenuByCallback");
	var _menuByMessageType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("menuByMessageType");
	var _registerDefaultMenus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerDefaultMenus");
	var _contextCanBeCustomized = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("contextCanBeCustomized");
	var _getDefaultMenuClass = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDefaultMenuClass");
	var _getCustomMenuClass = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCustomMenuClass");
	var _getClassByMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getClassByMap");
	var _getDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDialog");
	var _isChannel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isChannel");
	var _isComment = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isComment");
	var _isCopilot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCopilot");
	var _hasMenuForMessageType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasMenuForMessageType");
	var _getMenuForMessageType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMenuForMessageType");
	class MessageMenuManager {
	  static getInstance() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance] = new MessageMenuManager();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance];
	  }
	  constructor() {
	    Object.defineProperty(this, _getMenuForMessageType, {
	      value: _getMenuForMessageType2
	    });
	    Object.defineProperty(this, _hasMenuForMessageType, {
	      value: _hasMenuForMessageType2
	    });
	    Object.defineProperty(this, _isCopilot, {
	      value: _isCopilot2
	    });
	    Object.defineProperty(this, _isComment, {
	      value: _isComment2
	    });
	    Object.defineProperty(this, _isChannel, {
	      value: _isChannel2
	    });
	    Object.defineProperty(this, _getDialog, {
	      value: _getDialog2
	    });
	    Object.defineProperty(this, _getClassByMap, {
	      value: _getClassByMap2
	    });
	    Object.defineProperty(this, _getCustomMenuClass, {
	      value: _getCustomMenuClass2
	    });
	    Object.defineProperty(this, _getDefaultMenuClass, {
	      value: _getDefaultMenuClass2
	    });
	    Object.defineProperty(this, _contextCanBeCustomized, {
	      value: _contextCanBeCustomized2
	    });
	    Object.defineProperty(this, _registerDefaultMenus, {
	      value: _registerDefaultMenus2
	    });
	    Object.defineProperty(this, _defaultMenuByCallback, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _customMenuByCallback, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _menuByMessageType, {
	      writable: true,
	      value: new Map()
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerDefaultMenus)[_registerDefaultMenus]();
	  }
	  openMenu(context, bindElement) {
	    const DefaultMenuClass = babelHelpers.classPrivateFieldLooseBase(this, _getDefaultMenuClass)[_getDefaultMenuClass](context);
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _contextCanBeCustomized)[_contextCanBeCustomized](context)) {
	      new DefaultMenuClass().openMenu(context, bindElement);
	      return;
	    }
	    const CustomMenuClass = babelHelpers.classPrivateFieldLooseBase(this, _getCustomMenuClass)[_getCustomMenuClass](context);
	    if (CustomMenuClass) {
	      new CustomMenuClass().openMenu(context, bindElement);
	      return;
	    }
	    new DefaultMenuClass().openMenu(context, bindElement);
	  }
	  registerMenuByCallback(callback, menuClass) {
	    babelHelpers.classPrivateFieldLooseBase(this, _customMenuByCallback)[_customMenuByCallback].set(callback, menuClass);
	  }
	  registerMenuByMessageType(messageType, menuClass) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _hasMenuForMessageType)[_hasMenuForMessageType](messageType)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _menuByMessageType)[_menuByMessageType].set(messageType, menuClass);
	  }
	}
	function _registerDefaultMenus2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultMenuByCallback)[_defaultMenuByCallback].set(babelHelpers.classPrivateFieldLooseBase(this, _isChannel)[_isChannel].bind(this), ChannelMessageMenu);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultMenuByCallback)[_defaultMenuByCallback].set(babelHelpers.classPrivateFieldLooseBase(this, _isComment)[_isComment].bind(this), CommentsMessageMenu);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultMenuByCallback)[_defaultMenuByCallback].set(babelHelpers.classPrivateFieldLooseBase(this, _isCopilot)[_isCopilot].bind(this), CopilotMessageMenu);
	}
	function _contextCanBeCustomized2(context) {
	  return !im_v2_lib_channel.ChannelManager.isCommentsPostMessage(context, context.dialogId);
	}
	function _getDefaultMenuClass2(context) {
	  const MenuClass = babelHelpers.classPrivateFieldLooseBase(this, _getClassByMap)[_getClassByMap](babelHelpers.classPrivateFieldLooseBase(this, _defaultMenuByCallback)[_defaultMenuByCallback], context);
	  return MenuClass != null ? MenuClass : MessageMenu;
	}
	function _getCustomMenuClass2(context) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _hasMenuForMessageType)[_hasMenuForMessageType](context.componentId)) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getMenuForMessageType)[_getMenuForMessageType](context.componentId);
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _getClassByMap)[_getClassByMap](babelHelpers.classPrivateFieldLooseBase(this, _customMenuByCallback)[_customMenuByCallback], context);
	}
	function _getClassByMap2(menuMap, context) {
	  const menuMapEntries = menuMap.entries();
	  for (const [callback, MenuClass] of menuMapEntries) {
	    if (callback(context)) {
	      return MenuClass;
	    }
	  }
	  return null;
	}
	function _getDialog2(dialogId) {
	  return im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	}
	function _isChannel2(context) {
	  return im_v2_lib_channel.ChannelManager.isChannel(context.dialogId);
	}
	function _isComment2(context) {
	  const chat = babelHelpers.classPrivateFieldLooseBase(this, _getDialog)[_getDialog](context.dialogId);
	  return chat.type === im_v2_const.ChatType.comment;
	}
	function _isCopilot2(context) {
	  return new im_v2_lib_copilot.CopilotManager().isCopilotChat(context.dialogId);
	}
	function _hasMenuForMessageType2(messageType) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _menuByMessageType)[_menuByMessageType].has(messageType);
	}
	function _getMenuForMessageType2(messageType) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _menuByMessageType)[_menuByMessageType].get(messageType);
	}
	Object.defineProperty(MessageMenuManager, _instance, {
	  writable: true,
	  value: null
	});

	exports.BaseMenu = BaseMenu;
	exports.RecentMenu = RecentMenu;
	exports.UserMenu = UserMenu;
	exports.MessageMenuManager = MessageMenuManager;
	exports.MessageMenu = MessageMenu;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Main,BX.Vue3.Vuex,BX,BX.UI.Dialogs,BX.Call.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Application,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Messenger.v2.Service,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Event,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX,BX.Messenger.v2.Lib));
//# sourceMappingURL=registry.bundle.js.map
