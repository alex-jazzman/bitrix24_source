/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core_events,ui_vue3_vuex,rest_client,ui_dialogs_messagebox,im_v2_lib_call,im_v2_provider_service_recent,im_v2_lib_invite,im_public,im_v2_provider_service_chat,im_v2_lib_chat,im_v2_lib_message,im_v2_lib_promo,im_v2_lib_parser,im_v2_lib_entityCreator,im_v2_provider_service_message,im_v2_provider_service_disk,im_v2_lib_market,im_v2_lib_utils,im_v2_lib_feature,im_v2_lib_channel,im_v2_lib_analytics,im_v2_lib_copilot,im_v2_lib_feedback,im_v2_lib_notifier,im_v2_lib_permission,im_v2_lib_confirm,main_core,ui_iconSet_api_core,ui_system_menu,im_v2_application_core,im_v2_provider_service_sending,im_v2_provider_service_sticker,im_v2_const) {
	'use strict';

	const EVENT_NAMESPACE = 'BX.Messenger.v2.Lib.Menu';
	var _prepareItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareItems");
	var _bindBlurEvent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindBlurEvent");
	class BaseMenu extends main_core_events.EventEmitter {
	  constructor() {
	    super();
	    Object.defineProperty(this, _bindBlurEvent, {
	      value: _bindBlurEvent2
	    });
	    Object.defineProperty(this, _prepareItems, {
	      value: _prepareItems2
	    });
	    this.id = 'im-base-context-menu';
	    this.setEventNamespace(EVENT_NAMESPACE);
	    this.store = im_v2_application_core.Core.getStore();
	    this.restClient = im_v2_application_core.Core.getRestClient();
	  }

	  // public
	  openMenu(context, target) {
	    if (this.menuInstance) {
	      this.close();
	    }
	    this.context = context;
	    this.target = target;
	    this.menuInstance = new ui_system_menu.Menu(this.getMenuOptions());
	    this.menuInstance.show(this.target);
	    babelHelpers.classPrivateFieldLooseBase(this, _bindBlurEvent)[_bindBlurEvent]();
	  }
	  getMenuOptions() {
	    return {
	      id: this.id,
	      bindOptions: {
	        forceBindPosition: true,
	        position: 'bottom'
	      },
	      targetContainer: document.body,
	      cacheable: false,
	      closeByEsc: true,
	      className: this.getMenuClassName(),
	      items: babelHelpers.classPrivateFieldLooseBase(this, _prepareItems)[_prepareItems](),
	      sections: this.getMenuGroups(),
	      events: {
	        onClose: () => this.close(),
	        onDestroy: () => this.destroy()
	      }
	    };
	  }
	  getMenuItems() {
	    return [];
	  }
	  getMenuGroups() {
	    return [];
	  }
	  groupItems(menuItems, group) {
	    return menuItems.filter(item => item !== null).map(item => {
	      return {
	        ...item,
	        sectionCode: group
	      };
	    });
	  }
	  getMenuClassName() {
	    return '';
	  }
	  close() {
	    this.emit(BaseMenu.events.close);
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
	}
	function _prepareItems2() {
	  return this.getMenuItems().filter(item => item !== null);
	}
	function _bindBlurEvent2() {
	  main_core.Event.bindOnce(window, 'blur', () => {
	    this.destroy();
	  });
	}
	BaseMenu.events = {
	  close: 'close'
	};

	const MenuSectionCode = {
	  first: 'first',
	  second: 'second',
	  third: 'third'
	};
	var _leaveChat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("leaveChat");
	var _leaveCollab = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("leaveCollab");
	var _canHideChat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canHideChat");
	var _getRecentItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getRecentItem");
	var _isInvitationActive = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isInvitationActive");
	var _canResendInvitation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canResendInvitation");
	class RecentMenu extends BaseMenu {
	  constructor(applicationContext) {
	    super();
	    Object.defineProperty(this, _canResendInvitation, {
	      value: _canResendInvitation2
	    });
	    Object.defineProperty(this, _isInvitationActive, {
	      value: _isInvitationActive2
	    });
	    Object.defineProperty(this, _getRecentItem, {
	      value: _getRecentItem2
	    });
	    Object.defineProperty(this, _canHideChat, {
	      value: _canHideChat2
	    });
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
	    const {
	      emitter
	    } = applicationContext;
	    this.emitter = emitter;
	  }
	  getMenuOptions() {
	    return {
	      ...super.getMenuOptions(),
	      className: this.getMenuClassName()
	    };
	  }
	  getMenuClassName() {
	    return this.context.compactMode ? '' : super.getMenuClassName();
	  }
	  getMenuItems() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isInvitationActive)[_isInvitationActive]()) {
	      const firstGroupItems = [this.getSendMessageItem(), this.getOpenProfileItem()];
	      return [...this.groupItems(firstGroupItems, MenuSectionCode.first), ...this.groupItems(this.getInviteItems(), MenuSectionCode.second)];
	    }
	    return [this.getUnreadMessageItem(), this.getPinMessageItem(), this.getMuteItem(), this.getOpenProfileItem(), this.getChatsWithUserItem(), this.getHideItem(), this.getLeaveItem()];
	  }
	  getMenuGroups() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isInvitationActive)[_isInvitationActive]()) {
	      return [{
	        code: MenuSectionCode.first
	      }, {
	        code: MenuSectionCode.second
	      }];
	    }
	    return [];
	  }
	  getSendMessageItem() {
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_WRITE_V2'),
	      onClick: () => {
	        void im_public.Messenger.openChat(this.context.dialogId);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getOpenItem() {
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN'),
	      onClick: () => {
	        void im_public.Messenger.openChat(this.context.dialogId);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getUnreadMessageItem() {
	    const {
	      recentItem,
	      dialogId
	    } = this.context;
	    if (!recentItem) {
	      return null;
	    }
	    const dialog = this.store.getters['chats/get'](dialogId, true);
	    const showReadOption = recentItem.unread || dialog.counter > 0;
	    return {
	      title: showReadOption ? main_core.Loc.getMessage('IM_LIB_MENU_READ') : main_core.Loc.getMessage('IM_LIB_MENU_UNREAD'),
	      onClick: () => {
	        if (showReadOption) {
	          this.chatService.readDialog(dialogId);
	          im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onRead(dialogId);
	        } else {
	          this.chatService.unreadDialog(dialogId);
	          im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onUnread(dialogId);
	        }
	        this.menuInstance.close();
	      }
	    };
	  }
	  getPinMessageItem() {
	    const {
	      dialogId
	    } = this.context;
	    if (this.isGuestRole()) {
	      return null;
	    }
	    const recentItem = babelHelpers.classPrivateFieldLooseBase(this, _getRecentItem)[_getRecentItem]();
	    const isPinned = recentItem ? recentItem.pinned : false;
	    return {
	      title: isPinned ? main_core.Loc.getMessage('IM_LIB_MENU_UNPIN_MSGVER_1') : main_core.Loc.getMessage('IM_LIB_MENU_PIN_MSGVER_1'),
	      onClick: () => {
	        if (isPinned) {
	          this.chatService.unpinChat(dialogId);
	          im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onUnpin(dialogId);
	        } else {
	          this.chatService.pinChat(dialogId);
	          im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onPin(dialogId);
	        }
	        this.menuInstance.close();
	      }
	    };
	  }
	  getMuteItem() {
	    const {
	      dialogId
	    } = this.context;
	    const canMute = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.mute, dialogId);
	    if (!canMute) {
	      return null;
	    }
	    const dialog = this.store.getters['chats/get'](dialogId, true);
	    const isMuted = dialog.muteList.includes(im_v2_application_core.Core.getUserId());
	    return {
	      title: isMuted ? main_core.Loc.getMessage('IM_LIB_MENU_UNMUTE_2') : main_core.Loc.getMessage('IM_LIB_MENU_MUTE_2'),
	      onClick: () => {
	        if (isMuted) {
	          this.chatService.unmuteChat(dialogId);
	          im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onUnmute(dialogId);
	        } else {
	          this.chatService.muteChat(dialogId);
	          im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onMute(dialogId);
	        }
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
	      title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN_PROFILE_V2'),
	      onClick: () => {
	        BX.SidePanel.Instance.open(profileUri);
	        im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onOpenProfile(this.context.dialogId);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getHideItem() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _canHideChat)[_canHideChat]()) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_HIDE_MSGVER_1'),
	      onClick: () => {
	        im_v2_provider_service_recent.LegacyRecentService.getInstance().hideChat(this.context.dialogId);
	        im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onHide(this.context.dialogId);
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
	      title: main_core.Loc.getMessage('IM_LIB_MENU_FIND_SHARED_CHATS'),
	      onClick: async () => {
	        if (!isAnyChatOpened) {
	          await im_public.Messenger.openChat(this.context.dialogId);
	        }
	        this.emitter.emit(im_v2_const.EventType.sidebar.open, {
	          panel: im_v2_const.SidebarDetailBlock.chatsWithUser,
	          standalone: true,
	          dialogId: this.context.dialogId
	        });
	        im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onFindChatsWithUser(this.context.dialogId);
	        this.menuInstance.close();
	      }
	    };
	  }

	  // region invitation
	  getInviteItems() {
	    const {
	      recentItem
	    } = this.context;
	    if (!recentItem) {
	      return [];
	    }
	    const items = [];
	    let canInvite; // TODO change to APPLICATION variable
	    if (main_core.Type.isUndefined(BX.MessengerProxy)) {
	      canInvite = true;
	      console.error('BX.MessengerProxy.canInvite() method not found in v2 version!');
	    } else {
	      canInvite = BX.MessengerProxy.canInvite();
	    }
	    const canManageInvite = canInvite && im_v2_application_core.Core.getUserId() === recentItem.invitation.originator;
	    if (canManageInvite) {
	      items.push(this.getResendInviteItem(), this.getCancelInviteItem());
	    }
	    return items;
	  }
	  getResendInviteItem() {
	    const {
	      recentItem,
	      dialogId
	    } = this.context;
	    if (!recentItem || !babelHelpers.classPrivateFieldLooseBase(this, _canResendInvitation)[_canResendInvitation]()) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_INVITE_RESEND'),
	      onClick: () => {
	        im_v2_lib_invite.InviteManager.resendInvite(dialogId);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getCancelInviteItem() {
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_INVITE_CANCEL'),
	      onClick: () => {
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
	  isCollabChat() {
	    const {
	      type
	    } = this.store.getters['chats/get'](this.context.dialogId, true);
	    return type === im_v2_const.ChatType.collab;
	  }
	  isOpenChat() {
	    const {
	      type
	    } = this.store.getters['chats/get'](this.context.dialogId, true);
	    return type === im_v2_const.ChatType.open;
	  }
	  isGuestRole() {
	    const {
	      role
	    } = this.store.getters['chats/get'](this.context.dialogId, true);
	    return role === im_v2_const.UserRole.guest;
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
	  const title = this.isChannel() ? main_core.Loc.getMessage('IM_LIB_MENU_LEAVE_CHANNEL') : main_core.Loc.getMessage('IM_LIB_MENU_LEAVE_MSGVER_1');
	  return {
	    title,
	    onClick: async () => {
	      this.menuInstance.close();
	      const userChoice = await im_v2_lib_confirm.showLeaveChatConfirm(this.context.dialogId);
	      if (userChoice === true) {
	        this.chatService.leaveChat(this.context.dialogId);
	        im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onLeave(this.context.dialogId);
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
	    title: main_core.Loc.getMessage('IM_LIB_MENU_LEAVE_MSGVER_1'),
	    onClick: async () => {
	      this.menuInstance.close();
	      const userChoice = await im_v2_lib_confirm.showLeaveChatConfirm(this.context.dialogId);
	      if (!userChoice) {
	        return;
	      }
	      this.chatService.leaveCollab(this.context.dialogId);
	    }
	  };
	}
	function _canHideChat2() {
	  const {
	    dialogId
	  } = this.context;
	  const recentItem = babelHelpers.classPrivateFieldLooseBase(this, _getRecentItem)[_getRecentItem]();
	  if (!recentItem) {
	    return null;
	  }
	  const isInvitation = babelHelpers.classPrivateFieldLooseBase(this, _isInvitationActive)[_isInvitationActive]();
	  const isFakeUser = recentItem.isFakeElement;
	  const isAiAssistantBot = this.store.getters['users/bots/isAiAssistant'](dialogId);
	  return !isInvitation && !isFakeUser && !isAiAssistantBot;
	}
	function _getRecentItem2() {
	  return this.context.recentItem || this.store.getters['recent/get'](this.context.dialogId);
	}
	function _isInvitationActive2() {
	  const {
	    recentItem
	  } = this.context;
	  if (!recentItem || !recentItem.invitation) {
	    return false;
	  }
	  return recentItem.invitation.isActive;
	}
	function _canResendInvitation2() {
	  const {
	    recentItem
	  } = this.context;
	  if (!recentItem || !recentItem.invitation) {
	    return false;
	  }
	  return recentItem.invitation.canResend;
	}

	var _getKickItemText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getKickItemText");
	var _kickUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("kickUser");
	class UserMenu extends BaseMenu {
	  constructor(applicationContext) {
	    super();
	    Object.defineProperty(this, _kickUser, {
	      value: _kickUser2
	    });
	    Object.defineProperty(this, _getKickItemText, {
	      value: _getKickItemText2
	    });
	    this.id = 'bx-im-user-context-menu';
	    this.permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
	    const {
	      emitter
	    } = applicationContext;
	    this.emitter = emitter;
	  }
	  getKickItem() {
	    const canKick = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.kick, this.context.dialog.dialogId);
	    if (!canKick) {
	      return null;
	    }
	    return {
	      title: babelHelpers.classPrivateFieldLooseBase(this, _getKickItemText)[_getKickItemText](),
	      onClick: async () => {
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
	      title: main_core.Loc.getMessage('IM_LIB_MENU_USER_MENTION'),
	      onClick: () => {
	        this.emitter.emit(im_v2_const.EventType.textarea.insertMention, {
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
	      title: main_core.Loc.getMessage('IM_LIB_MENU_USER_WRITE'),
	      onClick: () => {
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
	      title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN_PROFILE_V2'),
	      onClick: () => {
	        BX.SidePanel.Instance.open(profileUri);
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

	const MenuSectionCode$1 = {
	  first: 'first',
	  second: 'second',
	  third: 'third'
	};
	const NestedMenuSectionCode = {
	  first: 'first',
	  second: 'second',
	  third: 'third'
	};
	var _isStickerMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isStickerMessage");
	var _needNestedMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("needNestedMenu");
	var _getFirstFile = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFirstFile");
	var _isSingleFile = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isSingleFile");
	var _onDelete = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDelete");
	var _isDeletionCancelled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isDeletionCancelled");
	var _getDownloadSingleFileItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDownloadSingleFileItem");
	var _getDownloadSeveralFilesItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDownloadSeveralFilesItem");
	var _arePinsExceedLimit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("arePinsExceedLimit");
	class MessageMenu extends BaseMenu {
	  constructor(applicationContext) {
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
	    Object.defineProperty(this, _isSingleFile, {
	      value: _isSingleFile2
	    });
	    Object.defineProperty(this, _getFirstFile, {
	      value: _getFirstFile2
	    });
	    Object.defineProperty(this, _needNestedMenu, {
	      value: _needNestedMenu2
	    });
	    Object.defineProperty(this, _isStickerMessage, {
	      value: _isStickerMessage2
	    });
	    this.maxPins = 20;
	    this.id = 'bx-im-message-context-menu';
	    this.diskService = new im_v2_provider_service_disk.DiskService();
	    this.marketManager = im_v2_lib_market.MarketManager.getInstance();
	    const {
	      emitter
	    } = applicationContext;
	    this.emitter = emitter;
	  }
	  getMenuOptions() {
	    return {
	      ...super.getMenuOptions(),
	      className: this.getMenuClassName(),
	      angle: true,
	      offsetLeft: 11,
	      minWidth: 238
	    };
	  }
	  getMenuItems() {
	    const firstGroupItems = [this.getReplyItem(), this.getCopyItem(), this.getEditItem(), this.getDownloadFileItem(), this.getForwardItem(), this.getAskCopilotItem(), this.getCreateTaskItem(), ...this.getAdditionalItems()];
	    const secondGroupItems = [this.getDeleteItem(), this.getSelectItem()];
	    return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems(secondGroupItems, MenuSectionCode$1.second)];
	  }
	  getMenuGroups() {
	    return [{
	      code: MenuSectionCode$1.first
	    }, {
	      code: MenuSectionCode$1.second
	    }];
	  }
	  getNestedMenuGroups() {
	    return [{
	      code: NestedMenuSectionCode.first
	    }, {
	      code: NestedMenuSectionCode.second
	    }];
	  }
	  getSelectItem() {
	    if (this.isDeletedMessage() || !this.isRealMessage()) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_SELECT'),
	      icon: ui_iconSet_api_core.Outline.CIRCLE_CHECK,
	      onClick: () => {
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onSelect(this.context.dialogId);
	        this.emitter.emit(im_v2_const.EventType.dialog.openBulkActionsMode, {
	          messageId: this.context.id,
	          dialogId: this.context.dialogId
	        });
	        this.menuInstance.close();
	      }
	    };
	  }
	  getReplyItem() {
	    return {
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_REPLY'),
	      onClick: () => {
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onReply(this.context.dialogId);
	        this.emitter.emit(im_v2_const.EventType.textarea.replyMessage, {
	          messageId: this.context.id,
	          dialogId: this.context.dialogId
	        });
	        this.menuInstance.close();
	      },
	      icon: ui_iconSet_api_core.Outline.QUOTE
	    };
	  }
	  getForwardItem() {
	    if (this.isDeletedMessage() || !this.isRealMessage()) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_FORWARD'),
	      icon: ui_iconSet_api_core.Outline.FORWARD,
	      onClick: () => {
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onForward(this.context.dialogId);
	        this.emitter.emit(im_v2_const.EventType.dialog.showForwardPopup, {
	          messagesIds: [this.context.id]
	        });
	        this.menuInstance.close();
	      }
	    };
	  }
	  getCopyItem() {
	    if (this.isDeletedMessage() || this.context.text.trim().length === 0) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY'),
	      onClick: async () => {
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCopyText({
	          dialogId: this.context.dialogId,
	          messageId: this.context.id
	        });
	        const textToCopy = im_v2_lib_parser.Parser.prepareCopy(this.context);
	        await im_v2_lib_utils.Utils.text.copyToClipboard(textToCopy);
	        im_v2_lib_notifier.Notifier.message.onCopyComplete();
	        this.menuInstance.close();
	      },
	      icon: ui_iconSet_api_core.Outline.COPY
	    };
	  }
	  getCopyLinkItem() {
	    return {
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY_LINK_MSGVER_1'),
	      icon: ui_iconSet_api_core.Outline.LINK,
	      onClick: () => {
	        var _BX$clipboard;
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCopyLink(this.context.dialogId);
	        const textToCopy = im_v2_lib_chat.ChatManager.buildMessageLink(this.context.dialogId, this.context.id);
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
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY_FILE'),
	      icon: ui_iconSet_api_core.Outline.COPY,
	      onClick: () => {
	        var _BX$clipboard2;
	        const fileId = this.context.files[0];
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCopyFile({
	          dialogId: this.context.dialogId,
	          fileId
	        });
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
	    if (this.isDeletedMessage() || !canPin) {
	      return null;
	    }
	    const isPinned = this.store.getters['messages/pin/isPinned']({
	      chatId: this.context.chatId,
	      messageId: this.context.id
	    });
	    return {
	      title: isPinned ? main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_UNPIN') : main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_PIN'),
	      icon: ui_iconSet_api_core.Outline.PIN,
	      onClick: () => {
	        const messageService = new im_v2_provider_service_message.MessageService({
	          chatId: this.context.chatId
	        });
	        if (isPinned) {
	          messageService.unpinMessage(this.context.chatId, this.context.id);
	          im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onUnpin(this.context.dialogId);
	        } else {
	          if (babelHelpers.classPrivateFieldLooseBase(this, _arePinsExceedLimit)[_arePinsExceedLimit]()) {
	            im_v2_lib_notifier.Notifier.chat.onMessagesPinLimitError(this.maxPins);
	            im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onReachingPinsLimit(this.context.dialogId);
	            this.menuInstance.close();
	            return;
	          }
	          messageService.pinMessage(this.context.chatId, this.context.id);
	          im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onPin(this.context.dialogId);
	        }
	        this.menuInstance.close();
	      }
	    };
	  }
	  getFavoriteItem() {
	    if (this.isDeletedMessage()) {
	      return null;
	    }
	    const isInFavorite = this.store.getters['sidebar/favorites/isFavoriteMessage'](this.context.chatId, this.context.id);
	    const menuItemText = isInFavorite ? main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_REMOVE_FROM_SAVED') : main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE');
	    return {
	      title: menuItemText,
	      icon: ui_iconSet_api_core.Outline.FAVORITE,
	      onClick: () => {
	        const messageService = new im_v2_provider_service_message.MessageService({
	          chatId: this.context.chatId
	        });
	        if (isInFavorite) {
	          messageService.removeMessageFromFavorite(this.context.id);
	        } else {
	          im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onAddFavorite({
	            dialogId: this.context.dialogId,
	            messageId: this.context.id
	          });
	          messageService.addMessageToFavorite(this.context.id);
	        }
	        this.menuInstance.close();
	      }
	    };
	  }
	  getMarkItem() {
	    const canUnread = this.context.viewed && !this.isOwnMessage();
	    const dialog = this.store.getters['chats/getByChatId'](this.context.chatId);
	    const isMarked = this.context.id === dialog.markedId;
	    if (!canUnread || isMarked) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_MARK'),
	      icon: ui_iconSet_api_core.Outline.NEW_MESSAGE,
	      onClick: () => {
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onMark(this.context.dialogId);
	        const messageService = new im_v2_provider_service_message.MessageService({
	          chatId: this.context.chatId
	        });
	        messageService.markMessage(this.context.id);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getCreateTaskItem() {
	    if (this.isDeletedMessage() || babelHelpers.classPrivateFieldLooseBase(this, _isStickerMessage)[_isStickerMessage]()) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_CREATE_TASK_MSGVER_1'),
	      icon: ui_iconSet_api_core.Outline.TASK,
	      onClick: () => {
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCreateTask(this.context.dialogId);
	        const entityCreator = new im_v2_lib_entityCreator.EntityCreator(this.context.chatId);
	        void entityCreator.createTaskForMessage(this.context.id);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getCreateMeetingItem() {
	    if (this.isDeletedMessage() || babelHelpers.classPrivateFieldLooseBase(this, _isStickerMessage)[_isStickerMessage]()) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_CREATE_MEETING_MSGVER_1'),
	      icon: ui_iconSet_api_core.Outline.CALENDAR_WITH_SLOTS,
	      onClick: () => {
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCreateEvent(this.context.dialogId);
	        const entityCreator = new im_v2_lib_entityCreator.EntityCreator(this.context.chatId);
	        void entityCreator.createMeetingForMessage(this.context.id);
	        this.menuInstance.close();
	      }
	    };
	  }
	  getEditItem() {
	    if (!im_v2_lib_message.MessageManager.isEditable(this.context.id)) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_EDIT'),
	      icon: ui_iconSet_api_core.Outline.EDIT_L,
	      onClick: () => {
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onEdit(this.context.dialogId);
	        this.emitter.emit(im_v2_const.EventType.textarea.editMessage, {
	          messageId: this.context.id,
	          dialogId: this.context.dialogId
	        });
	        this.menuInstance.close();
	      }
	    };
	  }
	  getAskCopilotItem() {
	    if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotMentionAvailable)) {
	      return null;
	    }
	    if (!this.canSendMessage() || this.isDeletedMessage()) {
	      return null;
	    }
	    const isChannel = im_v2_lib_channel.ChannelManager.isChannel(this.context.dialogId);
	    if (isChannel) {
	      return null;
	    }
	    const copilotBotDialogId = this.store.getters['users/bots/getCopilotBotDialogId'];
	    const {
	      name: mentionText
	    } = this.store.getters['users/get'](copilotBotDialogId, true);
	    return {
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_ASK_COPILOT'),
	      icon: ui_iconSet_api_core.Outline.COPILOT,
	      design: ui_system_menu.MenuItemDesign.Copilot,
	      onClick: () => {
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onAskCopilot(this.context.dialogId);
	        this.emitter.emit(im_v2_const.EventType.textarea.insertMention, {
	          mentionText,
	          mentionReplacement: im_v2_lib_utils.Utils.text.getMentionBbCode(copilotBotDialogId, mentionText),
	          dialogId: this.context.dialogId
	        });
	        this.emitter.emit(im_v2_const.EventType.textarea.replyMessage, {
	          messageId: this.context.id,
	          dialogId: this.context.dialogId
	        });
	      }
	    };
	  }
	  getDeleteItem() {
	    if (this.isDeletedMessage()) {
	      return null;
	    }
	    const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
	    const canDeleteOthersMessage = permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.deleteOthersMessage, this.context.dialogId);
	    if (!this.isOwnMessage() && !canDeleteOthersMessage) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_DELETE'),
	      design: ui_system_menu.MenuItemDesign.Alert,
	      icon: ui_iconSet_api_core.Outline.TRASHCAN,
	      onClick: babelHelpers.classPrivateFieldLooseBase(this, _onDelete)[_onDelete].bind(this)
	    };
	  }
	  getMarketItems() {
	    const {
	      dialogId,
	      id
	    } = this.context;
	    const placements = this.marketManager.getAvailablePlacementsByType(im_v2_const.PlacementType.contextMenu, dialogId);
	    const marketMenuItem = [];
	    const context = {
	      messageId: id,
	      dialogId
	    };
	    placements.forEach(placement => {
	      marketMenuItem.push({
	        title: placement.title,
	        icon: ui_iconSet_api_core.Outline.MARKET,
	        onClick: () => {
	          void im_v2_lib_market.MarketManager.openSlider(placement, context);
	          this.menuInstance.close();
	        }
	      });
	    });
	    const MARKET_ITEMS_LIMIT = 10;
	    return marketMenuItem.slice(0, MARKET_ITEMS_LIMIT);
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
	      title: menuItemText,
	      icon: ui_iconSet_api_core.Outline.FOLDER_24,
	      onClick: async function () {
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onSaveOnDisk({
	          messageId: this.context.id,
	          dialogId: this.context.dialogId
	        });
	        this.menuInstance.close();
	        await this.diskService.save(this.context.files);
	        im_v2_lib_notifier.Notifier.file.onDiskSaveComplete(babelHelpers.classPrivateFieldLooseBase(this, _isSingleFile)[_isSingleFile]());
	      }.bind(this)
	    };
	  }
	  getAdditionalItems() {
	    const items = this.getNestedItems();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _needNestedMenu)[_needNestedMenu](items)) {
	      return [{
	        title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_MORE'),
	        subMenu: {
	          items,
	          sections: this.getNestedMenuGroups()
	        }
	      }];
	    }
	    return items;
	  }
	  getNestedItems() {
	    const firstGroupItems = [this.getPinItem(), this.getCopyLinkItem(), this.getCopyFileItem(), this.getMarkItem(), this.getFavoriteItem(), this.getSaveToDiskItem(), this.getCreateMeetingItem()];
	    return [...this.groupItems(firstGroupItems, NestedMenuSectionCode.first), ...this.groupItems(this.getMarketItems(), NestedMenuSectionCode.second)];
	  }
	  isOwnMessage() {
	    return this.context.authorId === im_v2_application_core.Core.getUserId();
	  }
	  isDeletedMessage() {
	    return this.context.isDeleted;
	  }
	  isRealMessage() {
	    return this.store.getters['messages/isRealMessage'](this.context.id);
	  }
	  canSendMessage() {
	    const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](this.context.dialogId, true);
	    if (!dialog.isTextareaEnabled) {
	      return false;
	    }
	    return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.send, this.context.dialogId);
	  }
	}
	function _isStickerMessage2() {
	  return this.store.getters['stickers/messages/isSticker'](this.context.id);
	}
	function _needNestedMenu2(additionalItems) {
	  const NESTED_MENU_MIN_ITEMS = 3;
	  const menuItems = additionalItems.filter(item => item !== null);
	  return menuItems.length >= NESTED_MENU_MIN_ITEMS;
	}
	function _getFirstFile2() {
	  return this.store.getters['files/get'](this.context.files[0]);
	}
	function _isSingleFile2() {
	  return this.context.files.length === 1;
	}
	async function _onDelete2() {
	  const {
	    id: messageId,
	    dialogId,
	    chatId
	  } = this.context;
	  im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onDelete({
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
	    im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCancelDelete({
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
	    title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_DOWNLOAD_FILE'),
	    icon: ui_iconSet_api_core.Outline.DOWNLOAD,
	    onClick: function () {
	      im_v2_lib_utils.Utils.file.downloadFiles([file]);
	      im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onFileDownload({
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
	    title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_DOWNLOAD_FILES'),
	    icon: ui_iconSet_api_core.Outline.DOWNLOAD,
	    onClick: async () => {
	      var _this$menuInstance2;
	      im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onFileDownload({
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
	    const firstGroupItems = [this.getCopyItem(), this.getEditItem(), this.getDownloadFileItem(), this.getForwardItem(), this.getAskCopilotItem(), this.getCreateTaskItem(), ...this.getAdditionalItems()];
	    const secondGroupItems = [this.getDeleteItem(), this.getSelectItem()];
	    return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems(secondGroupItems, MenuSectionCode$1.second)];
	  }
	  getNestedItems() {
	    const firstGroupItems = [this.getPinItem(), this.getCopyLinkItem(), this.getCopyFileItem(), this.getMarkItem(), this.getFavoriteItem(), this.getSaveToDiskItem(), this.getCreateMeetingItem()];
	    return this.groupItems(firstGroupItems, NestedMenuSectionCode.first);
	  }
	  getNestedMenuGroups() {
	    return [{
	      code: NestedMenuSectionCode.first
	    }];
	  }
	}

	var _getCommentsPostMenuItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCommentsPostMenuItems");
	var _getDefaultMenuItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDefaultMenuItems");
	class CommentsMessageMenu extends MessageMenu {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getDefaultMenuItems, {
	      value: _getDefaultMenuItems2
	    });
	    Object.defineProperty(this, _getCommentsPostMenuItems, {
	      value: _getCommentsPostMenuItems2
	    });
	  }
	  getMenuItems() {
	    const message = this.context;
	    const contextDialogId = this.context.dialogId;
	    if (im_v2_lib_channel.ChannelManager.isCommentsPostMessage(message, contextDialogId)) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _getCommentsPostMenuItems)[_getCommentsPostMenuItems]();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _getDefaultMenuItems)[_getDefaultMenuItems]();
	  }
	  getNestedItems() {
	    const firstGroupItems = [this.getCopyFileItem(), this.getFavoriteItem(), this.getSaveToDiskItem(), this.getCreateMeetingItem()];
	    return this.groupItems(firstGroupItems, NestedMenuSectionCode.first);
	  }
	  getMenuGroups() {
	    return [{
	      code: MenuSectionCode$1.first
	    }, {
	      code: MenuSectionCode$1.second
	    }, {
	      code: MenuSectionCode$1.third
	    }];
	  }
	  getNestedMenuGroups() {
	    return [{
	      code: NestedMenuSectionCode.first
	    }];
	  }
	  getOpenInChannelItem() {
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_COMMENTS_OPEN_IN_CHANNEL'),
	      icon: ui_iconSet_api_core.Outline.GO_TO_MESSAGE,
	      onClick: () => {
	        this.emitter.emit(im_v2_const.EventType.dialog.closeComments);
	        this.menuInstance.close();
	      }
	    };
	  }
	}
	function _getCommentsPostMenuItems2() {
	  const firstGroupItems = [this.getCopyItem(), this.getCopyFileItem()];
	  const secondGroupItems = [this.getDownloadFileItem(), this.getSaveToDiskItem()];
	  return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems(secondGroupItems, MenuSectionCode$1.second), ...this.groupItems([this.getOpenInChannelItem()], MenuSectionCode$1.third)];
	}
	function _getDefaultMenuItems2() {
	  const firstGroupItems = [this.getReplyItem(), this.getCopyItem(), this.getEditItem(), this.getDownloadFileItem(), this.getAskCopilotItem(), this.getCreateTaskItem(), ...this.getAdditionalItems()];
	  return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems([this.getDeleteItem()], MenuSectionCode$1.second)];
	}

	var _openForm = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openForm");
	var _getUserCounter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getUserCounter");
	class CopilotMessageMenu extends MessageMenu {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getUserCounter, {
	      value: _getUserCounter2
	    });
	    Object.defineProperty(this, _openForm, {
	      value: _openForm2
	    });
	  }
	  getMenuItems() {
	    const firstGroupItems = [this.getCopyItem(), this.getMarkItem(), this.getFavoriteItem(), this.getForwardItem(), this.getSendFeedbackItem()];
	    const secondGroupItems = [this.getDeleteItem(), this.getSelectItem()];
	    return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems(secondGroupItems, MenuSectionCode$1.second)];
	  }
	  getSendFeedbackItem() {
	    const copilotManager = new im_v2_lib_copilot.CopilotManager();
	    if (!copilotManager.isCopilotBot(this.context.authorId)) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_AI_ASSISTANT_FEEDBACK'),
	      icon: ui_iconSet_api_core.Outline.FEEDBACK,
	      onClick: () => {
	        im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onSendFeedback(this.context.dialogId);
	        void babelHelpers.classPrivateFieldLooseBase(this, _openForm)[_openForm]();
	        this.menuInstance.close();
	      }
	    };
	  }
	}
	async function _openForm2() {
	  void new im_v2_lib_feedback.FeedbackManager().openCopilotForm({
	    userCounter: babelHelpers.classPrivateFieldLooseBase(this, _getUserCounter)[_getUserCounter](),
	    text: this.context.text
	  });
	}
	function _getUserCounter2() {
	  const chat = this.store.getters['chats/get'](this.context.dialogId);
	  return chat.userCounter;
	}

	class AiAssistantMessageMenu extends MessageMenu {
	  getMenuItems() {
	    const firstGroupItems = [this.getCopyItem(), this.getDownloadFileItem(), this.getForwardItem(), this.getCreateTaskItem(), ...this.getAdditionalItems()];
	    return this.groupItems(firstGroupItems, MenuSectionCode$1.first);
	  }
	  getNestedItems() {
	    const firstGroupItems = [this.getCopyFileItem(), this.getMarkItem(), this.getFavoriteItem(), this.getSaveToDiskItem(), this.getCreateMeetingItem()];
	    return [...this.groupItems(firstGroupItems, NestedMenuSectionCode.first), ...this.groupItems([this.getSendFeedbackItem()], NestedMenuSectionCode.second), ...this.groupItems(this.getMarketItems(), NestedMenuSectionCode.third)];
	  }
	  getNestedMenuGroups() {
	    return [{
	      code: NestedMenuSectionCode.first
	    }, {
	      code: NestedMenuSectionCode.second
	    }, {
	      code: NestedMenuSectionCode.third
	    }];
	  }
	  getSendFeedbackItem() {
	    const isAiAssistantBot = im_v2_application_core.Core.getStore().getters['users/bots/isAiAssistant'](this.context.authorId);
	    if (!isAiAssistantBot) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_AI_ASSISTANT_FEEDBACK'),
	      icon: ui_iconSet_api_core.Outline.FEEDBACK,
	      onClick: () => {
	        void new im_v2_lib_feedback.FeedbackManager().openAiAssistantForm({});
	        this.menuInstance.close();
	      }
	    };
	  }
	}

	class TaskCommentsMessageMenu extends MessageMenu {
	  getMenuItems() {
	    const firstGroupItems = [this.getReplyItem(), this.getCopyItem(), this.getEditItem(), this.getDownloadFileItem(), this.getAskCopilotItem(), this.getCreateTaskItem(), this.getAddResultItem(), this.getRemoveResultItem(), ...this.getAdditionalItems()];
	    const secondGroupItems = [this.getDeleteItem()];
	    return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems(secondGroupItems, MenuSectionCode$1.second)];
	  }
	  getNestedItems() {
	    const firstGroupItems = [this.getPinItem(), this.getCopyLinkItem(), this.getCopyFileItem(), this.getFavoriteItem(), this.getSaveToDiskItem(), this.getCreateMeetingItem()];
	    return this.groupItems(firstGroupItems, NestedMenuSectionCode.first);
	  }
	  getMenuGroups() {
	    return [{
	      code: MenuSectionCode$1.first
	    }, {
	      code: MenuSectionCode$1.second
	    }];
	  }
	  getNestedMenuGroups() {
	    return [{
	      code: NestedMenuSectionCode.first
	    }];
	  }
	  getAddResultItem() {
	    return null;
	  }
	  getRemoveResultItem() {
	    return null;
	  }
	}

	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	var _defaultMenuByCallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("defaultMenuByCallback");
	var _customMenuByCallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("customMenuByCallback");
	var _menuByMessageType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("menuByMessageType");
	var _menuInstance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("menuInstance");
	var _resolveMenuClass = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resolveMenuClass");
	var _registerDefaultMenus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerDefaultMenus");
	var _isCustomMenuAllowed = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCustomMenuAllowed");
	var _getDefaultMenuClass = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDefaultMenuClass");
	var _getCustomMenuClass = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCustomMenuClass");
	var _getClassByMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getClassByMap");
	var _getChatType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatType");
	var _isChannel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isChannel");
	var _isComment = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isComment");
	var _isCopilot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCopilot");
	var _isAiAssistant = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isAiAssistant");
	var _isTaskComments = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isTaskComments");
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
	    Object.defineProperty(this, _isTaskComments, {
	      value: _isTaskComments2
	    });
	    Object.defineProperty(this, _isAiAssistant, {
	      value: _isAiAssistant2
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
	    Object.defineProperty(this, _getChatType, {
	      value: _getChatType2
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
	    Object.defineProperty(this, _isCustomMenuAllowed, {
	      value: _isCustomMenuAllowed2
	    });
	    Object.defineProperty(this, _registerDefaultMenus, {
	      value: _registerDefaultMenus2
	    });
	    Object.defineProperty(this, _resolveMenuClass, {
	      value: _resolveMenuClass2
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
	    Object.defineProperty(this, _menuInstance, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerDefaultMenus)[_registerDefaultMenus]();
	  }
	  openMenu(payload) {
	    this.destroyMenuInstance();
	    const {
	      messageContext,
	      target,
	      applicationContext
	    } = payload;
	    const MenuClass = babelHelpers.classPrivateFieldLooseBase(this, _resolveMenuClass)[_resolveMenuClass](messageContext);
	    babelHelpers.classPrivateFieldLooseBase(this, _menuInstance)[_menuInstance] = new MenuClass(applicationContext);
	    babelHelpers.classPrivateFieldLooseBase(this, _menuInstance)[_menuInstance].openMenu(messageContext, target);
	  }
	  registerMenuByCallback(callback, menuClass) {
	    babelHelpers.classPrivateFieldLooseBase(this, _customMenuByCallback)[_customMenuByCallback].set(callback, menuClass);
	  }
	  unregisterMenuByCallback(callback) {
	    babelHelpers.classPrivateFieldLooseBase(this, _customMenuByCallback)[_customMenuByCallback].delete(callback);
	  }
	  destroyMenuInstance() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _menuInstance)[_menuInstance]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _menuInstance)[_menuInstance].destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _menuInstance)[_menuInstance] = null;
	  }
	  shouldUseNativeContextMenu(target) {
	    return Boolean(target.closest(`[${im_v2_const.DataAttribute.useNativeContextMenu}]`));
	  }
	  registerMenuByMessageType(messageType, menuClass) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _hasMenuForMessageType)[_hasMenuForMessageType](messageType)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _menuByMessageType)[_menuByMessageType].set(messageType, menuClass);
	  }
	}
	function _resolveMenuClass2(context) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isCustomMenuAllowed)[_isCustomMenuAllowed](context)) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getDefaultMenuClass)[_getDefaultMenuClass](context);
	  }
	  const customMenu = babelHelpers.classPrivateFieldLooseBase(this, _getCustomMenuClass)[_getCustomMenuClass](context);
	  return customMenu != null ? customMenu : babelHelpers.classPrivateFieldLooseBase(this, _getDefaultMenuClass)[_getDefaultMenuClass](context);
	}
	function _registerDefaultMenus2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultMenuByCallback)[_defaultMenuByCallback].set(babelHelpers.classPrivateFieldLooseBase(this, _isChannel)[_isChannel].bind(this), ChannelMessageMenu);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultMenuByCallback)[_defaultMenuByCallback].set(babelHelpers.classPrivateFieldLooseBase(this, _isComment)[_isComment].bind(this), CommentsMessageMenu);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultMenuByCallback)[_defaultMenuByCallback].set(babelHelpers.classPrivateFieldLooseBase(this, _isCopilot)[_isCopilot].bind(this), CopilotMessageMenu);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultMenuByCallback)[_defaultMenuByCallback].set(babelHelpers.classPrivateFieldLooseBase(this, _isAiAssistant)[_isAiAssistant].bind(this), AiAssistantMessageMenu);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultMenuByCallback)[_defaultMenuByCallback].set(babelHelpers.classPrivateFieldLooseBase(this, _isTaskComments)[_isTaskComments].bind(this), TaskCommentsMessageMenu);
	}
	function _isCustomMenuAllowed2(context) {
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
	function _getChatType2(dialogId) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	  return chat.type;
	}
	function _isChannel2(context) {
	  return im_v2_lib_channel.ChannelManager.isChannel(context.dialogId);
	}
	function _isComment2(context) {
	  const type = babelHelpers.classPrivateFieldLooseBase(this, _getChatType)[_getChatType](context.dialogId);
	  return type === im_v2_const.ChatType.comment;
	}
	function _isCopilot2(context) {
	  return new im_v2_lib_copilot.CopilotManager().isCopilotChat(context.dialogId);
	}
	function _isAiAssistant2(context) {
	  return im_v2_application_core.Core.getStore().getters['users/bots/isAiAssistant'](context.dialogId);
	}
	function _isTaskComments2(context) {
	  const type = babelHelpers.classPrivateFieldLooseBase(this, _getChatType)[_getChatType](context.dialogId);
	  return type === im_v2_const.ChatType.taskComments;
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

	const MenuSectionCode$2 = {
	  first: 'first',
	  second: 'second'
	};
	var _isPackOwner = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isPackOwner");
	var _isVendorStickerPack = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isVendorStickerPack");
	var _canUnlinkPack = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canUnlinkPack");
	var _canDeletePack = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canDeletePack");
	class StickerPackMenu extends BaseMenu {
	  constructor() {
	    super();
	    Object.defineProperty(this, _canDeletePack, {
	      value: _canDeletePack2
	    });
	    Object.defineProperty(this, _canUnlinkPack, {
	      value: _canUnlinkPack2
	    });
	    Object.defineProperty(this, _isVendorStickerPack, {
	      value: _isVendorStickerPack2
	    });
	    Object.defineProperty(this, _isPackOwner, {
	      value: _isPackOwner2
	    });
	    this.id = im_v2_const.PopupType.stickerPackContextMenu;
	  }
	  getMenuOptions() {
	    return {
	      ...super.getMenuOptions(),
	      angle: false
	    };
	  }
	  getMenuItems() {
	    if (this.context.isRecent) {
	      return [this.getClearRecentItem()];
	    }
	    return [...this.groupItems([this.getEditPackItem()], MenuSectionCode$2.first), ...this.groupItems([this.getUnlinkPackItem(), this.getDeletePackItem()], MenuSectionCode$2.second)];
	  }
	  getMenuGroups() {
	    return this.getMenuItems().map(menuItem => {
	      return {
	        code: menuItem.sectionCode
	      };
	    });
	  }
	  getEditPackItem() {
	    if (!im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.changeStickerPack)) {
	      return null;
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isPackOwner)[_isPackOwner]()) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_EDIT_STICKER_PACK'),
	      icon: ui_iconSet_api_core.Outline.EDIT_M,
	      onClick: () => {
	        this.emit(StickerPackMenu.events.showPackForm);
	      }
	    };
	  }
	  getDeletePackItem() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _canDeletePack)[_canDeletePack]()) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_REMOVE_STICKER_PACK'),
	      design: ui_system_menu.MenuItemDesign.Alert,
	      icon: ui_iconSet_api_core.Outline.TRASHCAN,
	      onClick: async () => {
	        const confirmResult = await im_v2_lib_confirm.showStickerPackDeleteConfirm();
	        if (!confirmResult) {
	          return;
	        }
	        this.emit(StickerPackMenu.events.closeParentPopup);
	        await im_v2_provider_service_sticker.StickerService.getInstance().deletePack({
	          id: this.context.pack.id,
	          type: this.context.pack.type
	        });
	        im_v2_lib_notifier.Notifier.sticker.onRemovePackComplete();
	      }
	    };
	  }
	  getUnlinkPackItem() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _canUnlinkPack)[_canUnlinkPack]()) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_UNLINK_STICKER_PACK'),
	      design: ui_system_menu.MenuItemDesign.Alert,
	      icon: ui_iconSet_api_core.Outline.TRASHCAN,
	      onClick: async () => {
	        const confirmResult = await im_v2_lib_confirm.showStickerPackUnlinkConfirm();
	        if (!confirmResult) {
	          return;
	        }
	        this.emit(StickerPackMenu.events.closeParentPopup);
	        await im_v2_provider_service_sticker.StickerService.getInstance().unlinkPack({
	          id: this.context.pack.id,
	          type: this.context.pack.type
	        });
	        im_v2_lib_notifier.Notifier.sticker.onRemovePackComplete();
	      }
	    };
	  }
	  getClearRecentItem() {
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_CLEAR_RECENT_STICKERS'),
	      icon: ui_iconSet_api_core.Outline.BROOM,
	      onClick: () => {
	        void im_v2_provider_service_sticker.StickerService.getInstance().clearRecent();
	      }
	    };
	  }
	}
	function _isPackOwner2() {
	  return this.context.pack.authorId === im_v2_application_core.Core.getUserId();
	}
	function _isVendorStickerPack2() {
	  return this.context.packType === im_v2_const.StickerPackType.vendor;
	}
	function _canUnlinkPack2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isVendorStickerPack)[_isVendorStickerPack]()) {
	    return false;
	  }
	  if (!this.context.pack.isAdded) {
	    return false;
	  }
	  return !babelHelpers.classPrivateFieldLooseBase(this, _isPackOwner)[_isPackOwner]();
	}
	function _canDeletePack2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isVendorStickerPack)[_isVendorStickerPack]()) {
	    return false;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _isPackOwner)[_isPackOwner]();
	}
	StickerPackMenu.events = {
	  showPackForm: 'showPackForm',
	  closeParentPopup: 'closeParentPopup'
	};

	var _isPackOwner$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isPackOwner");
	class StickerMenu extends BaseMenu {
	  constructor() {
	    super();
	    Object.defineProperty(this, _isPackOwner$1, {
	      value: _isPackOwner2$1
	    });
	    this.id = im_v2_const.PopupType.stickerContextMenu;
	  }
	  getMenuOptions() {
	    return {
	      ...super.getMenuOptions(),
	      angle: false
	    };
	  }
	  getMenuItems() {
	    return [this.getSendItem(), this.getRemoveFromRecentItem(), this.getDeleteFromPackItem()];
	  }
	  getSendItem() {
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_SEND_STICKER'),
	      icon: ui_iconSet_api_core.Outline.SEND,
	      onClick: () => {
	        this.emit(StickerMenu.events.closeParentPopup);
	        void im_v2_provider_service_sending.SendingService.getInstance().sendMessageWithSticker({
	          dialogId: this.context.dialogId,
	          stickerParams: {
	            id: this.context.sticker.id,
	            packId: this.context.sticker.packId,
	            packType: this.context.sticker.packType
	          }
	        });
	        this.menuInstance.close();
	      }
	    };
	  }
	  getDeleteFromPackItem() {
	    if (this.context.isRecent) {
	      return null;
	    }
	    const isPacksOwner = babelHelpers.classPrivateFieldLooseBase(this, _isPackOwner$1)[_isPackOwner$1]();
	    if (!isPacksOwner) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_REMOVE_STICKER'),
	      design: ui_system_menu.MenuItemDesign.Alert,
	      icon: ui_iconSet_api_core.Outline.TRASHCAN,
	      onClick: () => {
	        void im_v2_provider_service_sticker.StickerService.getInstance().deleteStickerFromPack({
	          ids: [this.context.sticker.id],
	          packId: this.context.sticker.packId,
	          packType: this.context.sticker.packType
	        });
	        this.menuInstance.close();
	      }
	    };
	  }
	  getRemoveFromRecentItem() {
	    if (!this.context.isRecent) {
	      return null;
	    }
	    return {
	      title: main_core.Loc.getMessage('IM_LIB_MENU_REMOVE_RECENT_STICKER'),
	      icon: ui_iconSet_api_core.Outline.CIRCLE_MINUS,
	      design: ui_system_menu.MenuItemDesign.Alert,
	      onClick: () => {
	        void im_v2_provider_service_sticker.StickerService.getInstance().removeFromRecent({
	          id: this.context.sticker.id,
	          packId: this.context.sticker.packId,
	          packType: this.context.sticker.packType
	        });
	      }
	    };
	  }
	}
	function _isPackOwner2$1() {
	  const pack = im_v2_application_core.Core.getStore().getters['stickers/packs/getByIdentifier']({
	    id: this.context.sticker.packId,
	    type: this.context.sticker.packType
	  });
	  if (!pack) {
	    return false;
	  }
	  return pack.authorId === im_v2_application_core.Core.getUserId();
	}
	StickerMenu.events = {
	  closeParentPopup: 'closeParentPopup'
	};

	exports.BaseMenu = BaseMenu;
	exports.RecentMenu = RecentMenu;
	exports.UserMenu = UserMenu;
	exports.MessageMenuManager = MessageMenuManager;
	exports.MessageMenu = MessageMenu;
	exports.AiAssistantMessageMenu = AiAssistantMessageMenu;
	exports.StickerPackMenu = StickerPackMenu;
	exports.StickerMenu = StickerMenu;
	exports.TaskCommentsMessageMenu = TaskCommentsMessageMenu;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Event,BX.Vue3.Vuex,BX,BX.UI.Dialogs,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Messenger.v2.Service,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX,BX.UI.IconSet,BX.UI.System,BX.Messenger.v2.Application,BX.Messenger.v2.Service,BX.Messenger.v2.Provider.Service,BX.Messenger.v2.Const));
//# sourceMappingURL=registry.bundle.js.map
