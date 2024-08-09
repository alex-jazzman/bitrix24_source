/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,ui_analytics,im_v2_const,im_v2_application_core) {
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
	  openExisting: 'open_existing'
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
	  toolOff: 'tool_off'
	});
	const AnalyticsType = Object.freeze({
	  ai: 'ai',
	  chat: 'chat',
	  channel: 'channel',
	  videoconf: 'videoconf',
	  copilot: 'copilot'
	});
	const AnalyticsSection = Object.freeze({
	  copilotTab: 'copilot_tab',
	  chat: 'chat'
	});

	const CUSTOM_CHAT_TYPE = 'custom';
	var _createdChats = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createdChats");
	var _currentTab = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentTab");
	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	var _getCategoryByChatType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCategoryByChatType");
	var _getChatType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatType");
	class Analytics {
	  constructor() {
	    Object.defineProperty(this, _getChatType, {
	      value: _getChatType2
	    });
	    Object.defineProperty(this, _getCategoryByChatType, {
	      value: _getCategoryByChatType2
	    });
	    Object.defineProperty(this, _createdChats, {
	      writable: true,
	      value: new Set()
	    });
	    Object.defineProperty(this, _currentTab, {
	      writable: true,
	      value: ''
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
	    babelHelpers.classPrivateFieldLooseBase(this, _createdChats)[_createdChats].add(dialogId);
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
	  onOpenCopilotTab() {
	    ui_analytics.sendData({
	      event: AnalyticsEvent.openTab,
	      tool: AnalyticsTool.ai,
	      category: AnalyticsCategory.chatOperations,
	      c_section: AnalyticsSection.copilotTab
	    });
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
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getCategoryByChatType)[_getCategoryByChatType](type),
	      event: AnalyticsEvent.clickCreateNew,
	      type,
	      c_section: `${currentLayout}_tab`
	    });
	  }
	  onCreateChat(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _createdChats)[_createdChats].add(dialogId);
	  }
	  onOpenChat(dialog) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _createdChats)[_createdChats].has(dialog.dialogId)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _createdChats)[_createdChats].delete(dialog.dialogId);
	      return;
	    }
	    const chatType = babelHelpers.classPrivateFieldLooseBase(this, _getChatType)[_getChatType](dialog);
	    if (chatType === im_v2_const.ChatType.copilot) {
	      this.onOpenCopilotChat(dialog.dialogId);
	    }
	    const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	    const isMember = dialog.role === im_v2_const.UserRole.guest ? 'N' : 'Y';
	    const params = {
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getCategoryByChatType)[_getCategoryByChatType](chatType),
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
	}
	function _getCategoryByChatType2(type) {
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
	function _getChatType2(chat) {
	  var _ChatType$chat$type;
	  return (_ChatType$chat$type = im_v2_const.ChatType[chat.type]) != null ? _ChatType$chat$type : CUSTOM_CHAT_TYPE;
	}
	Object.defineProperty(Analytics, _instance, {
	  writable: true,
	  value: void 0
	});

	exports.Analytics = Analytics;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.UI.Analytics,BX.Messenger.v2.Const,BX.Messenger.v2.Application));
//# sourceMappingURL=analytics.bundle.js.map
