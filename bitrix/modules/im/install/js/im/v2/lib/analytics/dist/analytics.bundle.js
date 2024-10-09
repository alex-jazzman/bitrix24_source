/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,ui_analytics,im_v2_application_core,im_v2_const) {
	'use strict';

	const CopilotChatType = Object.freeze({
	  private: 'chatType_private',
	  multiuser: 'chatType_multiuser'
	});
	const AnalyticsEvent = Object.freeze({
	  openMessenger: 'open_messenger',
	  openChat: 'open_chat',
	  createNewChat: 'create_new_chat',
	  audioUse: 'audio_use',
	  openTab: 'open_tab',
	  popupOpen: 'popup_open',
	  openPrices: 'open_prices',
	  openSettings: 'open_settings',
	  clickCreateNew: 'click_create_new',
	  openExisting: 'open_existing',
	  view: 'view',
	  click: 'click',
	  clickEdit: 'click_edit',
	  submitEdit: 'submit_edit'
	});
	const AnalyticsTool = Object.freeze({
	  ai: 'ai',
	  checkin: 'checkin',
	  im: 'im',
	  infoHelper: 'InfoHelper'
	});
	const AnalyticsCategory = Object.freeze({
	  chatOperations: 'chat_operations',
	  shift: 'shift',
	  messenger: 'messenger',
	  chat: 'chat',
	  channel: 'channel',
	  videoconf: 'videoconf',
	  copilot: 'copilot',
	  limit: 'limit',
	  limitBanner: 'limit_banner',
	  toolOff: 'tool_off'
	});
	const AnalyticsType = Object.freeze({
	  ai: 'ai',
	  chat: 'chat',
	  channel: 'channel',
	  videoconf: 'videoconf',
	  copilot: 'copilot',
	  limitOfficeChatingHistory: 'limit_office_chating_history'
	});
	const AnalyticsSection = Object.freeze({
	  copilotTab: 'copilot_tab',
	  chat: 'chat',
	  chatStart: 'chat_start',
	  chatHistory: 'chat_history',
	  sidebar: 'sidebar',
	  chatWindow: 'chat_window',
	  messageLink: 'message_link'
	});
	const AnalyticsStatus = Object.freeze({
	  success: 'success',
	  errorTurnedOff: 'error_turnedoff'
	});
	const AnalyticsSubSection = Object.freeze({
	  contextMenu: 'context_menu'
	});

	const CUSTOM_CHAT_TYPE = 'custom';
	function getChatType(chat) {
	  var _ChatType$chat$type;
	  return (_ChatType$chat$type = im_v2_const.ChatType[chat.type]) != null ? _ChatType$chat$type : CUSTOM_CHAT_TYPE;
	}

	var _onHistoryLimitBannerClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onHistoryLimitBannerClick");
	var _getSidebarPanelNameForAnalytics = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSidebarPanelNameForAnalytics");
	class HistoryLimit {
	  constructor() {
	    Object.defineProperty(this, _getSidebarPanelNameForAnalytics, {
	      value: _getSidebarPanelNameForAnalytics2
	    });
	    Object.defineProperty(this, _onHistoryLimitBannerClick, {
	      value: _onHistoryLimitBannerClick2
	    });
	  }
	  onDialogHistoryLimitExceeded({
	    dialogId,
	    noMessages
	  }) {
	    const sectionValue = noMessages ? AnalyticsSection.chatStart : AnalyticsSection.chatHistory;
	    const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const chatType = getChatType(dialog);
	    const params = {
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.limitBanner,
	      event: AnalyticsEvent.view,
	      type: AnalyticsType.limitOfficeChatingHistory,
	      c_section: sectionValue,
	      p1: `chatType_${chatType}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onSidebarHistoryLimitExceeded({
	    dialogId,
	    panel
	  }) {
	    const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const chatType = getChatType(dialog);
	    const params = {
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.limitBanner,
	      event: AnalyticsEvent.view,
	      type: AnalyticsType.limitOfficeChatingHistory,
	      c_section: AnalyticsSection.sidebar,
	      c_element: babelHelpers.classPrivateFieldLooseBase(this, _getSidebarPanelNameForAnalytics)[_getSidebarPanelNameForAnalytics](panel),
	      p1: `chatType_${chatType}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onDialogHistoryLimitBannerClick({
	    dialogId
	  }) {
	    const section = AnalyticsSection.chatWindow;
	    babelHelpers.classPrivateFieldLooseBase(this, _onHistoryLimitBannerClick)[_onHistoryLimitBannerClick]({
	      dialogId,
	      section
	    });
	  }
	  onSidebarHistoryLimitBannerClick({
	    dialogId,
	    panel
	  }) {
	    const section = AnalyticsSection.sidebar;
	    const element = babelHelpers.classPrivateFieldLooseBase(this, _getSidebarPanelNameForAnalytics)[_getSidebarPanelNameForAnalytics](panel);
	    babelHelpers.classPrivateFieldLooseBase(this, _onHistoryLimitBannerClick)[_onHistoryLimitBannerClick]({
	      dialogId,
	      section,
	      element
	    });
	  }
	  onGoToContextHistoryLimitClick({
	    dialogId
	  }) {
	    const section = AnalyticsSection.messageLink;
	    babelHelpers.classPrivateFieldLooseBase(this, _onHistoryLimitBannerClick)[_onHistoryLimitBannerClick]({
	      dialogId,
	      section
	    });
	  }
	}
	function _onHistoryLimitBannerClick2({
	  dialogId,
	  section,
	  element
	}) {
	  const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	  const chatType = getChatType(dialog);
	  const params = {
	    tool: AnalyticsTool.im,
	    category: AnalyticsCategory.limitBanner,
	    event: AnalyticsEvent.click,
	    type: AnalyticsType.limitOfficeChatingHistory,
	    c_section: section,
	    p1: `chatType_${chatType}`
	  };
	  if (element) {
	    params.c_element = element;
	  }
	  ui_analytics.sendData(params);
	}
	function _getSidebarPanelNameForAnalytics2(panel) {
	  switch (panel) {
	    case im_v2_const.SidebarDetailBlock.main:
	      return 'main';
	    case im_v2_const.SidebarDetailBlock.file:
	    case im_v2_const.SidebarDetailBlock.fileUnsorted:
	    case im_v2_const.SidebarDetailBlock.audio:
	    case im_v2_const.SidebarDetailBlock.brief:
	    case im_v2_const.SidebarDetailBlock.document:
	    case im_v2_const.SidebarDetailBlock.media:
	    case im_v2_const.SidebarDetailBlock.other:
	      return 'docs';
	    case im_v2_const.SidebarDetailBlock.messageSearch:
	      return 'message_search';
	    case im_v2_const.SidebarDetailBlock.favorite:
	      return 'favs';
	    case im_v2_const.SidebarDetailBlock.link:
	      return 'links';
	    case im_v2_const.SidebarDetailBlock.task:
	      return 'task';
	    case im_v2_const.SidebarDetailBlock.meeting:
	      return 'event';
	    default:
	      return 'unknown';
	  }
	}

	function getCategoryByChatType(type) {
	  switch (type) {
	    case im_v2_const.ChatType.channel:
	    case im_v2_const.ChatType.openChannel:
	    case im_v2_const.ChatType.comment:
	    case im_v2_const.ChatType.generalChannel:
	      return AnalyticsCategory.channel;
	    case im_v2_const.ChatType.copilot:
	      return AnalyticsCategory.copilot;
	    case im_v2_const.ChatType.videoconf:
	      return AnalyticsCategory.videoconf;
	    default:
	      return AnalyticsCategory.chat;
	  }
	}

	var _excludedChats = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("excludedChats");
	var _currentTab = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentTab");
	var _historyLimit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("historyLimit");
	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	class Analytics {
	  constructor() {
	    Object.defineProperty(this, _excludedChats, {
	      writable: true,
	      value: new Set()
	    });
	    Object.defineProperty(this, _currentTab, {
	      writable: true,
	      value: im_v2_const.Layout.chat.name
	    });
	    Object.defineProperty(this, _historyLimit, {
	      writable: true,
	      value: new HistoryLimit()
	    });
	  }
	  static getInstance() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance] = new this();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance];
	  }
	  onOpenMessenger() {
	    ui_analytics.sendData({
	      event: AnalyticsEvent.openMessenger,
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.messenger
	    });
	  }
	  onCreateCopilotChat({
	    chatId,
	    dialogId
	  }) {
	    babelHelpers.classPrivateFieldLooseBase(this, _excludedChats)[_excludedChats].add(dialogId);
	    ui_analytics.sendData({
	      event: AnalyticsEvent.createNewChat,
	      tool: AnalyticsTool.ai,
	      category: AnalyticsCategory.chatOperations,
	      c_section: AnalyticsSection.copilotTab,
	      type: AnalyticsType.ai,
	      p3: CopilotChatType.private,
	      p5: `chatId_${chatId}`
	    });
	  }
	  onOpenCopilotChat(dialogId) {
	    const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const copilotChatType = dialog.userCounter <= 2 ? CopilotChatType.private : CopilotChatType.multiuser;
	    ui_analytics.sendData({
	      event: AnalyticsEvent.openChat,
	      tool: AnalyticsTool.ai,
	      category: AnalyticsCategory.chatOperations,
	      c_section: AnalyticsSection.copilotTab,
	      type: AnalyticsType.ai,
	      p3: copilotChatType,
	      p5: `chatId_${dialog.chatId}`
	    });
	  }
	  onOpenCopilotTab({
	    isAvailable = true
	  } = {}) {
	    const payload = {
	      event: AnalyticsEvent.openTab,
	      tool: AnalyticsTool.ai,
	      category: AnalyticsCategory.chatOperations,
	      c_section: AnalyticsSection.copilotTab,
	      status: isAvailable ? AnalyticsStatus.success : AnalyticsStatus.errorTurnedOff
	    };
	    ui_analytics.sendData(payload);
	  }
	  onOpenTab(tabName) {
	    const existingTabs = [im_v2_const.Layout.chat.name, im_v2_const.Layout.copilot.name, im_v2_const.Layout.channel.name, im_v2_const.Layout.notification.name, im_v2_const.Layout.settings.name, im_v2_const.Layout.openlines.name];
	    if (!existingTabs.includes(tabName)) {
	      return;
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _currentTab)[_currentTab] === tabName) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _currentTab)[_currentTab] = tabName;
	    ui_analytics.sendData({
	      event: AnalyticsEvent.openTab,
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.messenger,
	      type: tabName
	    });
	  }
	  onUseCopilotAudioInput() {
	    ui_analytics.sendData({
	      event: AnalyticsEvent.audioUse,
	      tool: AnalyticsTool.ai,
	      category: AnalyticsCategory.chatOperations,
	      c_section: AnalyticsSection.copilotTab
	    });
	  }
	  onOpenCheckInPopup() {
	    ui_analytics.sendData({
	      event: AnalyticsEvent.popupOpen,
	      tool: AnalyticsTool.checkin,
	      category: AnalyticsCategory.shift,
	      c_section: AnalyticsSection.chat
	    });
	  }
	  onOpenPriceTable(featureId) {
	    ui_analytics.sendData({
	      tool: AnalyticsTool.infoHelper,
	      category: AnalyticsCategory.limit,
	      event: AnalyticsEvent.openPrices,
	      type: featureId,
	      c_section: AnalyticsSection.chat
	    });
	  }
	  onOpenToolsSettings(toolId) {
	    ui_analytics.sendData({
	      tool: AnalyticsTool.infoHelper,
	      category: AnalyticsCategory.toolOff,
	      event: AnalyticsEvent.openSettings,
	      type: toolId,
	      c_section: AnalyticsSection.chat
	    });
	  }
	  onStartCreateNewChat(type) {
	    const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(type),
	      event: AnalyticsEvent.clickCreateNew,
	      type,
	      c_section: `${currentLayout}_tab`
	    });
	  }
	  onCreateChat(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _excludedChats)[_excludedChats].add(dialogId);
	  }
	  onOpenChat(dialog) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _excludedChats)[_excludedChats].has(dialog.dialogId)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _excludedChats)[_excludedChats].delete(dialog.dialogId);
	      return;
	    }
	    const chatType = getChatType(dialog);
	    if (chatType === im_v2_const.ChatType.copilot) {
	      this.onOpenCopilotChat(dialog.dialogId);
	    }
	    const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	    const isMember = dialog.role === im_v2_const.UserRole.guest ? 'N' : 'Y';
	    const params = {
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chatType),
	      event: AnalyticsEvent.openExisting,
	      type: chatType,
	      c_section: `${currentLayout}_tab`,
	      p3: `isMember_${isMember}`,
	      p5: `chatId_${dialog.chatId}`
	    };
	    if (chatType === im_v2_const.ChatType.comment) {
	      const parentChat = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](dialog.parentChatId);
	      params.p1 = `chatType_${parentChat.type}`;
	      params.p4 = `parentChatId_${dialog.parentChatId}`;
	    }
	    ui_analytics.sendData(params);
	  }
	  onOpenChatEditForm(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.clickEdit,
	      c_section: AnalyticsSection.sidebar,
	      c_sub_section: AnalyticsSubSection.contextMenu,
	      p1: `chatType_${chat.type}`,
	      p5: `chatId_${chat.chatId}`
	    });
	  }
	  onSubmitChatEditForm(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _excludedChats)[_excludedChats].add(dialogId);
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.submitEdit,
	      p1: `chatType_${chat.type}`,
	      p5: `chatId_${chat.chatId}`
	    });
	  }
	  onCancelChatEditForm(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _excludedChats)[_excludedChats].add(dialogId);
	  }

	  // region History Limit Analytics
	  onDialogHistoryLimitExceeded({
	    dialogId,
	    noMessages
	  }) {
	    babelHelpers.classPrivateFieldLooseBase(this, _historyLimit)[_historyLimit].onDialogHistoryLimitExceeded({
	      dialogId,
	      noMessages
	    });
	  }
	  onDialogHistoryLimitBannerClick({
	    dialogId
	  }) {
	    babelHelpers.classPrivateFieldLooseBase(this, _historyLimit)[_historyLimit].onDialogHistoryLimitBannerClick({
	      dialogId
	    });
	  }
	  onSidebarHistoryLimitExceeded({
	    dialogId,
	    panel
	  }) {
	    babelHelpers.classPrivateFieldLooseBase(this, _historyLimit)[_historyLimit].onSidebarHistoryLimitExceeded({
	      dialogId,
	      panel
	    });
	  }
	  onSidebarHistoryLimitBannerClick({
	    dialogId,
	    panel
	  }) {
	    babelHelpers.classPrivateFieldLooseBase(this, _historyLimit)[_historyLimit].onSidebarHistoryLimitBannerClick({
	      dialogId,
	      panel
	    });
	  }
	  onGoToContextHistoryLimitClick({
	    dialogId
	  }) {
	    babelHelpers.classPrivateFieldLooseBase(this, _historyLimit)[_historyLimit].onGoToContextHistoryLimitClick({
	      dialogId
	    });
	  }
	  // endregion
	}
	Object.defineProperty(Analytics, _instance, {
	  writable: true,
	  value: void 0
	});

	exports.Analytics = Analytics;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.UI.Analytics,BX.Messenger.v2.Application,BX.Messenger.v2.Const));
//# sourceMappingURL=analytics.bundle.js.map
