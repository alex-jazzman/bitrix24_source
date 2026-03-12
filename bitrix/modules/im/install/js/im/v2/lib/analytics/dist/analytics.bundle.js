/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core,im_v2_lib_analytics,im_v2_lib_messageComponent,ui_analytics,im_v2_application_core,im_v2_const) {
	'use strict';

	const PSEUDO_CHAT_TYPE_FOR_NOTES = 'notes';
	const AI_ASSISTANT_CHAT_TYPE = 'chatType_aiAssistant';
	const CopilotChatType = Object.freeze({
	  private: 'chatType_private',
	  multiuser: 'chatType_multiuser'
	});
	const AnalyticsEvent = Object.freeze({
	  openChat: 'open_chat',
	  createNewChat: 'create_new_chat',
	  audioUse: 'audio_use',
	  openTab: 'open_tab',
	  popupOpen: 'popup_open',
	  openPrices: 'open_prices',
	  openSettings: 'open_settings',
	  clickCreateNew: 'click_create_new',
	  openExisting: 'open_existing',
	  typeMessage: 'type_message',
	  pinChat: 'pin_chat',
	  clickDelete: 'click_delete',
	  clickShare: 'click_share',
	  cancelDelete: 'cancel_delete',
	  delete: 'delete',
	  view: 'view',
	  click: 'click',
	  clickEdit: 'click_edit',
	  submitEdit: 'submit_edit',
	  clickCallButton: 'click_call_button',
	  clickStartConf: 'click_start_conf',
	  clickJoin: 'click_join',
	  clickAddUser: 'click_add_user',
	  openCalendar: 'open_calendar',
	  openTasks: 'open_tasks',
	  openFiles: 'open_files',
	  clickCreatePoll: 'click_create_poll',
	  clickCreateTask: 'click_create_task',
	  clickCreateEvent: 'click_create_event',
	  clickAttach: 'click_attach',
	  downloadFile: 'download_file',
	  saveToDisk: 'save_to_disk',
	  pinMessage: 'pin_message',
	  unpinMessage: 'unpin_message',
	  pinnedMessageLimitException: 'pinned_message_limit_exception',
	  startSearch: 'start_search',
	  openSearch: 'open_search',
	  searchResult: 'search_result',
	  selectSearchResult: 'select_search_result',
	  selectRecipient: 'select_recipient',
	  selectUser: 'select_user',
	  openCreateMenu: 'open_create_menu',
	  clickUpdate: 'click_update',
	  clickMoreInformation: 'click_more_information',
	  goToWeb: 'go_to_web',
	  copyMessage: 'copy_message',
	  clickReply: 'click_reply',
	  copyFile: 'copy_file',
	  copyLink: 'copy_link',
	  addToFav: 'add_to_fav',
	  seeLater: 'see_later',
	  select: 'select',
	  addFeedback: 'add_feedback',
	  viewPopup: 'view_popup',
	  selectAppMode: 'select_app_mode',
	  copyChatLink: 'copy_chat_link',
	  viewTranscription: 'view_transcription',
	  play: 'play',
	  pause: 'pause',
	  changeSpeed: 'change_speed',
	  askCopilot: 'ask_copilot',
	  modeOn: 'mode_on',
	  modeOff: 'mode_off',
	  clickMcpIntegrations: 'click_mcp_integrations',
	  notificationOpen: 'notif_open',
	  notificationUnsubscribe: 'notif_unsubscribe',
	  openEmoteSelector: 'open_emote_selector',
	  openStickerTab: 'open_sticker_tab',
	  viewStickerPopup: 'view_popup',
	  clickCreateStickerPack: 'click_create_stickerpack',
	  addStickerPack: 'add_stickerpack',
	  unpinChat: 'unpin_chat',
	  openProfile: 'open_profile',
	  findCommonChats: 'find_common_chats',
	  mute: 'mute',
	  unmute: 'unmute',
	  hideChat: 'hide_chat',
	  readAll: 'read_all',
	  leave: 'leave',
	  useFormatToolbar: 'use_text_formatting',
	  closeSearch: 'cancel_search',
	  selectSearchRecent: 'click_recent_suggest'
	});
	const AnalyticsTool = Object.freeze({
	  ai: 'ai',
	  checkin: 'checkin',
	  im: 'im',
	  infoHelper: 'InfoHelper',
	  inform: 'inform',
	  notification: 'notification'
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
	  toolOff: 'tool_off',
	  message: 'message',
	  chatPopup: 'chat_popup',
	  call: 'call',
	  collab: 'collab',
	  updateAppPopup: 'update_app_popup',
	  audioMessage: 'audiomessage',
	  videoMessage: 'videomessage',
	  notificationOperations: 'notif_ops'
	});
	const AnalyticsType = Object.freeze({
	  ai: 'ai',
	  chat: 'chat',
	  channel: 'channel',
	  videoconf: 'videoconf',
	  copilot: 'copilot',
	  deletedMessage: 'deleted_message',
	  limitOfficeChatingHistory: 'limit_office_chating_history',
	  privateCall: 'private',
	  groupCall: 'group',
	  may25DesktopRelease: 'may_25_desktop_release',
	  selectAppMode: 'select_app_mode',
	  oneWindow: 'single_window',
	  aiAssistant: 'aiAssistant',
	  think: 'think',
	  stickers: 'stickers',
	  formatBold: 'bold',
	  formatItalic: 'italic',
	  formatUnderline: 'underline',
	  formatStrikethrough: 'strikethrough',
	  formatLink: 'link',
	  formatCode: 'code'
	});
	const AnalyticsSection = Object.freeze({
	  copilotTab: 'copilot_tab',
	  chat: 'chat',
	  chatStart: 'chat_start',
	  chatHistory: 'chat_history',
	  sidebar: 'sidebar',
	  popup: 'popup',
	  activeChat: 'active_chat',
	  comments: 'comments',
	  chatHeader: 'chat_header',
	  chatSidebar: 'chat_sidebar',
	  chatTextarea: 'chat_textarea',
	  editor: 'editor',
	  chatWindow: 'chat_window',
	  forward: 'forward',
	  userAdd: 'user_add',
	  chatCreateMenu: 'chat_create_menu',
	  chatEmptyState: 'chat_empty_state',
	  settings: 'settings',
	  miniChat: 'mini_chat',
	  stickerPackPopup: 'stickerpack_popup',
	  chatLayout: 'chat_tab',
	  taskCommentsLayout: 'tasksTask_tab',
	  notificationLayout: 'notification_tab'
	});
	const AnalyticsSubSection = Object.freeze({
	  contextMenu: 'context_menu',
	  sidebar: 'sidebar',
	  chatWindow: 'chat_window',
	  messageLink: 'message_link',
	  chatSidebar: 'chat_sidebar',
	  chatList: 'chat_list',
	  window: 'window',
	  membersPanel: 'user_list',
	  recentContextMenu: 'recent_context_menu',
	  recentChats: 'recent_chats',
	  recentSearch: 'recent_search'
	});
	const AnalyticsElement = Object.freeze({
	  initialBanner: 'initial_banner',
	  videocall: 'videocall',
	  audiocall: 'audiocall',
	  startButton: 'start_button',
	  more: 'more'
	});
	const AnalyticsStatus = Object.freeze({
	  success: 'success',
	  errorTurnedOff: 'error_turnedoff',
	  notFound: 'not_found'
	});
	const CreateChatContext = Object.freeze({
	  collabEmptyState: 'collab_empty_state'
	});
	const MessagePinsTypes = Object.freeze({
	  single: 'single',
	  multiple: 'multiple',
	  selected: 'selected'
	});
	const NotificationEntryPoint = Object.freeze({
	  quickAccessLabel: 'bell_button'
	});

	function getCollabId(chatId) {
	  const collabInfo = im_v2_application_core.Core.getStore().getters['chats/collabs/getByChatId'](chatId);
	  if (!collabInfo) {
	    return null;
	  }
	  return `collabId_${collabInfo.collabId}`;
	}

	const AnalyticUserType = Object.freeze({
	  userIntranet: 'user_intranet',
	  userExtranet: 'user_extranet',
	  userCollaber: 'user_collaber'
	});
	function getUserType() {
	  const user = im_v2_application_core.Core.getStore().getters['users/get'](im_v2_application_core.Core.getUserId(), true);
	  switch (user.type) {
	    case im_v2_const.UserType.user:
	      return AnalyticUserType.userIntranet;
	    case im_v2_const.UserType.extranet:
	      return AnalyticUserType.userExtranet;
	    case im_v2_const.UserType.collaber:
	      return AnalyticUserType.userCollaber;
	    default:
	      return AnalyticUserType.userIntranet;
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
	    case im_v2_const.ChatType.collab:
	      return AnalyticsCategory.collab;
	    default:
	      return AnalyticsCategory.chat;
	  }
	}

	function isAiAssistant(dialogId) {
	  return im_v2_application_core.Core.getStore().getters['users/bots/isAiAssistant'](dialogId);
	}

	function isNotes(dialogId) {
	  return im_v2_application_core.Core.getStore().getters['chats/isNotes'](dialogId);
	}

	const CUSTOM_CHAT_TYPE = 'custom';
	const AI_ASSISTANT_CHAT_TYPE$1 = 'aiAssistant';
	function getChatType(chat) {
	  if (isNotes(chat.dialogId)) {
	    return PSEUDO_CHAT_TYPE_FOR_NOTES;
	  }
	  if (isAiAssistant(chat.dialogId)) {
	    return AI_ASSISTANT_CHAT_TYPE$1;
	  }
	  const chatTypeExists = Object.values(im_v2_const.ChatType).includes(chat.type);
	  if (chatTypeExists) {
	    return chat.type;
	  }
	  return CUSTOM_CHAT_TYPE;
	}

	const EntityToEventMap = {
	  [im_v2_const.CollabEntityType.tasks]: AnalyticsEvent.openTasks,
	  [im_v2_const.CollabEntityType.calendar]: AnalyticsEvent.openCalendar,
	  [im_v2_const.CollabEntityType.files]: AnalyticsEvent.openFiles
	};
	class CollabEntities {
	  onClick(dialogId, type) {
	    const event = EntityToEventMap[type];
	    if (!event) {
	      return;
	    }
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    const params = {
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.collab,
	      event,
	      c_section: AnalyticsSection.chatHeader,
	      p2: getUserType(),
	      p5: `chatId_${chat.chatId}`
	    };
	    if (chat.type === im_v2_const.ChatType.collab) {
	      params.p4 = getCollabId(chat.chatId);
	    }
	    ui_analytics.sendData(params);
	  }
	}

	var _onClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClick");
	class ChatEntities {
	  constructor() {
	    Object.defineProperty(this, _onClick, {
	      value: _onClick2
	    });
	  }
	  onCreateTaskFromSidebarClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onClick)[_onClick]({
	      dialogId,
	      event: AnalyticsEvent.clickCreateTask,
	      section: AnalyticsSection.chatSidebar
	    });
	  }
	  onCreateTaskFromTextareaClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onClick)[_onClick]({
	      dialogId,
	      event: AnalyticsEvent.clickCreateTask,
	      section: AnalyticsSection.chatTextarea
	    });
	  }
	  onCreateEventFromSidebarClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onClick)[_onClick]({
	      dialogId,
	      event: AnalyticsEvent.clickCreateEvent,
	      section: AnalyticsSection.chatSidebar
	    });
	  }
	  onCreateEventFromTextareaClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onClick)[_onClick]({
	      dialogId,
	      event: AnalyticsEvent.clickCreateEvent,
	      section: AnalyticsSection.chatTextarea
	    });
	  }
	  onCreateVoteFromTextareaClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onClick)[_onClick]({
	      dialogId,
	      event: AnalyticsEvent.clickCreatePoll,
	      section: AnalyticsSection.chatTextarea
	    });
	  }
	}
	function _onClick2({
	  dialogId,
	  event,
	  section
	}) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	  const params = {
	    tool: AnalyticsTool.im,
	    category: getCategoryByChatType(chat.type),
	    event,
	    c_section: section,
	    p1: `chatType_${getChatType(chat)}`,
	    p2: getUserType(),
	    p5: `chatId_${chat.chatId}`
	  };
	  if (chat.type === im_v2_const.ChatType.collab) {
	    params.p4 = getCollabId(chat.chatId);
	  }
	  ui_analytics.sendData(params);
	}

	class ChatDelete {
	  onClick(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.clickDelete,
	      type: getChatType(chat),
	      c_section: AnalyticsSection.sidebar,
	      c_sub_section: AnalyticsSubSection.contextMenu,
	      p1: `chatType_${chat.type}`
	    });
	  }
	  onCancel(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.cancelDelete,
	      type: getChatType(chat),
	      c_section: AnalyticsSection.popup,
	      p1: `chatType_${chat.type}`
	    });
	  }
	  onConfirm(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.delete,
	      type: getChatType(chat),
	      c_section: AnalyticsSection.popup,
	      p1: `chatType_${chat.type}`,
	      p5: `chatId_${chat.chatId}`
	    });
	  }
	  onChatDeletedNotification(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const category = getCategoryByChatType(chat);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.chatPopup,
	      event: AnalyticsEvent.view,
	      type: `deleted_${category}`,
	      c_section: AnalyticsSection.activeChat,
	      p1: `chatType_${chat.type}`
	    });
	  }
	}

	class MessageDelete {
	  onNotFoundNotification({
	    dialogId
	  }) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    if (!chat) {
	      return;
	    }
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.chatPopup,
	      event: AnalyticsEvent.view,
	      type: AnalyticsType.deletedMessage,
	      p1: `chatType_${chat.type}`
	    });
	  }
	  onDeletedPostNotification({
	    dialogId
	  }) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.chatPopup,
	      event: AnalyticsEvent.view,
	      type: AnalyticsType.deletedMessage,
	      c_section: AnalyticsSection.comments,
	      p1: `chatType_${chat.type}`,
	      p4: `parentChatId_${chat.chatId}`
	    });
	  }
	}

	var _onBannerClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onBannerClick");
	var _getSidebarPanelNameForAnalytics = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSidebarPanelNameForAnalytics");
	class HistoryLimit {
	  constructor() {
	    Object.defineProperty(this, _getSidebarPanelNameForAnalytics, {
	      value: _getSidebarPanelNameForAnalytics2
	    });
	    Object.defineProperty(this, _onBannerClick, {
	      value: _onBannerClick2
	    });
	  }
	  onDialogLimitExceeded({
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
	  onSidebarLimitExceeded({
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
	  onDialogBannerClick({
	    dialogId
	  }) {
	    const section = AnalyticsSection.chatWindow;
	    babelHelpers.classPrivateFieldLooseBase(this, _onBannerClick)[_onBannerClick]({
	      dialogId,
	      section
	    });
	  }
	  onSidebarBannerClick({
	    dialogId,
	    panel
	  }) {
	    const section = AnalyticsSection.sidebar;
	    const element = babelHelpers.classPrivateFieldLooseBase(this, _getSidebarPanelNameForAnalytics)[_getSidebarPanelNameForAnalytics](panel);
	    babelHelpers.classPrivateFieldLooseBase(this, _onBannerClick)[_onBannerClick]({
	      dialogId,
	      section,
	      element
	    });
	  }
	  onGoToContextLimitExceeded({
	    dialogId
	  }) {
	    const section = AnalyticsSection.messageLink;
	    babelHelpers.classPrivateFieldLooseBase(this, _onBannerClick)[_onBannerClick]({
	      dialogId,
	      section
	    });
	  }
	}
	function _onBannerClick2({
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

	const SelectUserSource = Object.freeze({
	  recent: 'recent',
	  searchResult: 'search_result'
	});
	var _hasSearchedBefore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasSearchedBefore");
	var _onSelectUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSelectUser");
	var _onAddUserClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onAddUserClick");
	class UserAdd {
	  constructor() {
	    Object.defineProperty(this, _onAddUserClick, {
	      value: _onAddUserClick2
	    });
	    Object.defineProperty(this, _onSelectUser, {
	      value: _onSelectUser2
	    });
	    Object.defineProperty(this, _hasSearchedBefore, {
	      writable: true,
	      value: false
	    });
	  }
	  onChatSidebarClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onAddUserClick)[_onAddUserClick](dialogId, AnalyticsSection.chatSidebar);
	  }
	  onChatHeaderClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onAddUserClick)[_onAddUserClick](dialogId, AnalyticsSection.chatHeader);
	  }
	  onStartSearch({
	    dialogId
	  }) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _hasSearchedBefore)[_hasSearchedBefore]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _hasSearchedBefore)[_hasSearchedBefore] = true;
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.startSearch,
	      c_section: AnalyticsSection.userAdd,
	      p1: `chatType_${chat.type}`,
	      p2: getUserType()
	    });
	  }
	  onClosePopup() {
	    babelHelpers.classPrivateFieldLooseBase(this, _hasSearchedBefore)[_hasSearchedBefore] = false;
	  }
	  onSelectUserFromRecent({
	    dialogId,
	    position
	  }) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onSelectUser)[_onSelectUser]({
	      dialogId,
	      position,
	      source: SelectUserSource.recent
	    });
	  }
	  onSelectUserFromSearchResult({
	    dialogId,
	    position
	  }) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onSelectUser)[_onSelectUser]({
	      dialogId,
	      position,
	      source: SelectUserSource.searchResult
	    });
	  }
	}
	function _onSelectUser2({
	  dialogId,
	  position,
	  source
	}) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	  ui_analytics.sendData({
	    tool: AnalyticsTool.im,
	    category: getCategoryByChatType(chat.type),
	    event: AnalyticsEvent.selectUser,
	    type: source,
	    c_section: AnalyticsSection.userAdd,
	    p1: `chatType_${chat.type}`,
	    p2: getUserType(),
	    p3: `position_${position}`
	  });
	}
	function _onAddUserClick2(dialogId, element) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	  const params = {
	    tool: AnalyticsTool.im,
	    category: getCategoryByChatType(chat.type),
	    event: AnalyticsEvent.clickAddUser,
	    c_section: element,
	    p1: `chatType_${getChatType(chat)}`,
	    p2: getUserType(),
	    p5: `chatId_${chat.chatId}`
	  };
	  if (chat.type === im_v2_const.ChatType.collab) {
	    params.p4 = getCollabId(chat.chatId);
	  }
	  ui_analytics.sendData(params);
	}

	class ChatEdit {
	  onOpenForm(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const params = {
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.clickEdit,
	      c_section: AnalyticsSection.sidebar,
	      c_sub_section: AnalyticsSubSection.contextMenu,
	      p1: `chatType_${chat.type}`,
	      p5: `chatId_${chat.chatId}`
	    };
	    if (chat.type === im_v2_const.ChatType.collab) {
	      params.p4 = getCollabId(chat.chatId);
	    }
	    ui_analytics.sendData(params);
	  }
	  onSubmitForm(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const params = {
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      c_section: AnalyticsSection.editor,
	      event: AnalyticsEvent.submitEdit,
	      p1: `chatType_${chat.type}`,
	      p2: getUserType(),
	      p5: `chatId_${chat.chatId}`
	    };
	    if (chat.type === im_v2_const.ChatType.collab) {
	      params.p4 = getCollabId(chat.chatId);
	    }
	    ui_analytics.sendData(params);
	  }
	}

	class ChatCreate {
	  onStartClick(type) {
	    const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(type),
	      event: AnalyticsEvent.clickCreateNew,
	      type,
	      c_section: `${currentLayout}_tab`,
	      p2: getUserType()
	    });
	  }
	  onCollabEmptyStateCreateClick() {
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(im_v2_const.ChatType.collab),
	      event: AnalyticsEvent.clickCreateNew,
	      type: im_v2_const.ChatType.collab,
	      c_section: CreateChatContext.collabEmptyState,
	      p2: getUserType()
	    });
	  }
	  onMenuCreateClick() {
	    const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.messenger,
	      event: AnalyticsEvent.openCreateMenu,
	      c_section: `${currentLayout}_tab`
	    });
	  }
	}

	class Supervisor {
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
	}

	class CheckIn {
	  onOpenCheckInPopup() {
	    ui_analytics.sendData({
	      event: AnalyticsEvent.popupOpen,
	      tool: AnalyticsTool.checkin,
	      category: AnalyticsCategory.shift,
	      c_section: AnalyticsSection.chat
	    });
	  }
	}

	const CopilotEntryPoint = Object.freeze({
	  create_menu: 'create_menu',
	  role_picker: 'role_picker'
	});
	var _sendDataForCopilotCreation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendDataForCopilotCreation");
	class Copilot {
	  constructor() {
	    Object.defineProperty(this, _sendDataForCopilotCreation, {
	      value: _sendDataForCopilotCreation2
	    });
	  }
	  onCreateChat(chatId) {
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
	  onCreateDefaultChatInRecent() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendDataForCopilotCreation)[_sendDataForCopilotCreation]({
	      c_sub_section: CopilotEntryPoint.create_menu
	    });
	  }
	  onSelectRoleInRecent() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendDataForCopilotCreation)[_sendDataForCopilotCreation]({
	      c_sub_section: CopilotEntryPoint.role_picker
	    });
	  }
	  onOpenChat(dialogId) {
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
	  onOpenTab({
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
	  onUseAudioInput(dialogId) {
	    var _aiModel$name;
	    const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const isCopilot = dialog.type === im_v2_const.ChatType.copilot;
	    if (!isCopilot) {
	      return;
	    }
	    const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	    const role = im_v2_application_core.Core.getStore().getters['copilot/chats/getRole'](dialogId);
	    const aiModel = im_v2_application_core.Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
	    const aiModelName = (_aiModel$name = aiModel.name) != null ? _aiModel$name : aiModel;
	    const copilotChatType = dialog.userCounter <= 2 ? CopilotChatType.private : CopilotChatType.multiuser;
	    ui_analytics.sendData({
	      event: AnalyticsEvent.audioUse,
	      tool: AnalyticsTool.ai,
	      category: AnalyticsCategory.chatOperations,
	      c_section: `${currentLayout}_tab`,
	      p2: `provider_${aiModelName}`,
	      p3: copilotChatType,
	      p4: `role_${main_core.Text.toCamelCase(role.code)}`,
	      p5: `chatId_${dialog.chatId}`
	    });
	  }
	  onToggleReasoning(dialogId) {
	    var _aiModel$name2;
	    const isReasoningEnabled = im_v2_application_core.Core.getStore().getters['copilot/chats/isReasoningEnabled'](dialogId);
	    const event = isReasoningEnabled ? AnalyticsEvent.modeOn : AnalyticsEvent.modeOff;
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	    const role = im_v2_application_core.Core.getStore().getters['copilot/chats/getRole'](dialogId);
	    const aiModel = im_v2_application_core.Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
	    const aiModelName = (_aiModel$name2 = aiModel.name) != null ? _aiModel$name2 : aiModel;
	    ui_analytics.sendData({
	      event,
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.copilot,
	      type: AnalyticsType.think,
	      c_section: `${currentLayout}_tab`,
	      p1: getChatType(chat),
	      p2: `provider_${aiModelName}`,
	      p4: `role_${main_core.Text.toCamelCase(role.code)}`,
	      p5: `chatId_${chat.chatId}`
	    });
	  }
	}
	function _sendDataForCopilotCreation2(params) {
	  const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	  ui_analytics.sendData({
	    event: AnalyticsEvent.clickCreateNew,
	    tool: AnalyticsTool.im,
	    category: AnalyticsCategory.copilot,
	    c_section: `${currentLayout}_tab`,
	    type: AnalyticsType.copilot,
	    ...params
	  });
	}

	class AttachMenu {
	  onOpenUploadMenu(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const chatType = getChatType(chat);
	    const params = {
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.clickAttach,
	      c_section: AnalyticsSection.chatTextarea,
	      p1: `chatType_${chatType}`,
	      p2: getUserType(),
	      p5: `chatId_${chat.chatId}`
	    };
	    if (chat.type === im_v2_const.ChatType.collab) {
	      params.p4 = getCollabId(chat.chatId);
	    }
	    ui_analytics.sendData(params);
	  }
	}

	class Vote {
	  getSerializedParams(dialogId) {
	    const options = this.getAnalyticsOptions(dialogId);
	    const queryParams = Object.entries(options).map(([optionName, optionValue]) => {
	      return `st[${optionName}]=${encodeURIComponent(optionValue)}`;
	    });
	    return queryParams.join('&');
	  }
	  getAnalyticsOptions(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    const chatType = chat.type;
	    const options = {
	      tool: AnalyticsTool.im,
	      event: AnalyticsEvent.clickCreatePoll,
	      category: getCategoryByChatType(chatType),
	      p1: `chatType_${chatType}`,
	      p2: getUserType(),
	      p5: `chatId_${chat.chatId}`
	    };
	    if (chatType === im_v2_const.ChatType.comment) {
	      const parentChat = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](chat.parentChatId);
	      options.p1 = `chatType_${parentChat.type}`;
	      options.p4 = `parentChatId_${chat.parentChatId}`;
	    }
	    if (chatType === im_v2_const.ChatType.collab) {
	      options.p4 = getCollabId(chat.chatId);
	    }
	    return options;
	  }
	}

	var _getEventSpecificParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEventSpecificParams");
	class MessagePins {
	  constructor() {
	    Object.defineProperty(this, _getEventSpecificParams, {
	      value: _getEventSpecificParams2
	    });
	  }
	  onUnpin({
	    dialogId,
	    eventParams = {}
	  }) {
	    this.onSendData({
	      dialogId,
	      eventParams: {
	        event: AnalyticsEvent.unpinMessage,
	        ...eventParams
	      }
	    });
	  }
	  onSendData({
	    dialogId,
	    eventParams
	  }) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    const params = {
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      p1: `chatType_${getChatType(chat)}`,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getEventSpecificParams)[_getEventSpecificParams](eventParams.event, chat.chatId),
	      ...eventParams
	    };
	    ui_analytics.sendData(params);
	  }
	}
	function _getEventSpecificParams2(event, chatId) {
	  const pinnedCount = im_v2_application_core.Core.getStore().getters['messages/pin/getPinned'](chatId).length;
	  if (event === AnalyticsEvent.pinMessage) {
	    return {
	      p3: `pinnedCount_${pinnedCount}`,
	      type: pinnedCount > 1 ? MessagePinsTypes.multiple : MessagePinsTypes.single
	    };
	  }
	  if (event === AnalyticsEvent.unpinMessage) {
	    return {
	      type: pinnedCount > 0 ? MessagePinsTypes.selected : MessagePinsTypes.single
	    };
	  }
	  return {};
	}

	const SelectRecipientSource = Object.freeze({
	  recent: 'recent',
	  searchResult: 'search_result',
	  notes: 'notes'
	});
	var _hasSearchedBefore$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasSearchedBefore");
	var _onSelectRecipient = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSelectRecipient");
	class MessageForward {
	  constructor() {
	    Object.defineProperty(this, _onSelectRecipient, {
	      value: _onSelectRecipient2
	    });
	    Object.defineProperty(this, _hasSearchedBefore$1, {
	      writable: true,
	      value: false
	    });
	  }
	  onClickForward(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.clickShare,
	      c_section: AnalyticsSection.chatWindow,
	      c_sub_section: AnalyticsSubSection.contextMenu,
	      p1: `chatType_${getChatType(chat)}`,
	      p2: im_v2_lib_analytics.getUserType()
	    });
	  }
	  onStartSearch({
	    dialogId
	  }) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _hasSearchedBefore$1)[_hasSearchedBefore$1]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _hasSearchedBefore$1)[_hasSearchedBefore$1] = true;
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.startSearch,
	      c_section: AnalyticsSection.forward,
	      p1: `chatType_${getChatType(chat)}`,
	      p2: im_v2_lib_analytics.getUserType()
	    });
	  }
	  onSelectRecipientFromRecent({
	    dialogId,
	    position
	  }) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onSelectRecipient)[_onSelectRecipient]({
	      dialogId,
	      position,
	      source: SelectRecipientSource.recent
	    });
	  }
	  onSelectRecipientFromSearchResult({
	    dialogId,
	    position
	  }) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onSelectRecipient)[_onSelectRecipient]({
	      dialogId,
	      position,
	      source: SelectRecipientSource.searchResult
	    });
	  }
	  onClosePopup() {
	    babelHelpers.classPrivateFieldLooseBase(this, _hasSearchedBefore$1)[_hasSearchedBefore$1] = false;
	  }
	}
	function _onSelectRecipient2({
	  dialogId,
	  position,
	  source
	}) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	  const type = isNotes(dialogId) ? SelectRecipientSource.notes : source;
	  ui_analytics.sendData({
	    tool: AnalyticsTool.im,
	    category: getCategoryByChatType(chat.type),
	    event: AnalyticsEvent.selectRecipient,
	    type,
	    c_section: AnalyticsSection.forward,
	    p1: `chatType_${getChatType(chat)}`,
	    p2: im_v2_lib_analytics.getUserType(),
	    p3: `position_${position}`
	  });
	}

	const AnalyticsAmountFilesType = {
	  single: 'files_single',
	  many: 'files_all'
	};
	const AnalyticsFileType = {
	  ...im_v2_const.FileType,
	  media: 'media',
	  any: 'any'
	};
	var _onCopyTextCopilot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCopyTextCopilot");
	var _getFilesAmountParam = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFilesAmountParam");
	var _getAnalyticsFileType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAnalyticsFileType");
	var _getBaseParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBaseParams");
	class MessageContextMenu {
	  constructor() {
	    Object.defineProperty(this, _getBaseParams, {
	      value: _getBaseParams2
	    });
	    Object.defineProperty(this, _getAnalyticsFileType, {
	      value: _getAnalyticsFileType2
	    });
	    Object.defineProperty(this, _getFilesAmountParam, {
	      value: _getFilesAmountParam2
	    });
	    Object.defineProperty(this, _onCopyTextCopilot, {
	      value: _onCopyTextCopilot2
	    });
	    this.messageForward = new MessageForward();
	    this.messagePins = new MessagePins();
	  }
	  onSendFeedback(dialogId) {
	    var _aiModel$name;
	    const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	    const role = im_v2_application_core.Core.getStore().getters['copilot/chats/getRole'](dialogId);
	    const aiModel = im_v2_application_core.Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
	    const aiModelName = (_aiModel$name = aiModel.name) != null ? _aiModel$name : aiModel;
	    ui_analytics.sendData({
	      category: AnalyticsCategory.copilot,
	      event: AnalyticsEvent.addFeedback,
	      c_section: `${currentLayout}_tab`,
	      p2: `provider_${aiModelName}`,
	      p4: `role_${main_core.Text.toCamelCase(role.code)}`,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onDelete({
	    messageId,
	    dialogId
	  }) {
	    const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
	    const type = new im_v2_lib_messageComponent.MessageComponentManager(message).getName();
	    ui_analytics.sendData({
	      category: AnalyticsCategory.message,
	      event: AnalyticsEvent.clickDelete,
	      type,
	      c_section: AnalyticsSection.chatWindow,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onCancelDelete({
	    messageId,
	    dialogId
	  }) {
	    const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
	    const type = new im_v2_lib_messageComponent.MessageComponentManager(message).getName();
	    ui_analytics.sendData({
	      category: AnalyticsCategory.message,
	      event: AnalyticsEvent.cancelDelete,
	      type,
	      c_section: AnalyticsSection.popup,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onFileDownload({
	    messageId,
	    dialogId
	  }) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const params = {
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.downloadFile,
	      type: babelHelpers.classPrivateFieldLooseBase(this, _getAnalyticsFileType)[_getAnalyticsFileType](messageId),
	      c_section: AnalyticsSection.chatWindow,
	      p2: im_v2_lib_analytics.getUserType(),
	      p3: babelHelpers.classPrivateFieldLooseBase(this, _getFilesAmountParam)[_getFilesAmountParam](messageId),
	      p5: `chatId_${chat.chatId}`,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    };
	    if (chat.type === im_v2_const.ChatType.collab) {
	      params.p4 = im_v2_lib_analytics.getCollabId(chat.chatId);
	    }
	    ui_analytics.sendData(params);
	  }
	  onSaveOnDisk({
	    messageId,
	    dialogId
	  }) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const params = {
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.saveToDisk,
	      type: babelHelpers.classPrivateFieldLooseBase(this, _getAnalyticsFileType)[_getAnalyticsFileType](messageId),
	      c_section: AnalyticsSection.chatWindow,
	      c_element: AnalyticsElement.more,
	      p2: im_v2_lib_analytics.getUserType(),
	      p3: babelHelpers.classPrivateFieldLooseBase(this, _getFilesAmountParam)[_getFilesAmountParam](messageId),
	      p5: `chatId_${chat.chatId}`,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    };
	    if (chat.type === im_v2_const.ChatType.collab) {
	      params.p4 = im_v2_lib_analytics.getCollabId(chat.chatId);
	    }
	    ui_analytics.sendData(params);
	  }
	  onCopyLink(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    ui_analytics.sendData({
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.copyLink,
	      c_section: AnalyticsSection.chatWindow,
	      c_element: AnalyticsElement.more,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onCopyFile({
	    dialogId,
	    fileId
	  }) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    const file = im_v2_application_core.Core.getStore().getters['files/get'](fileId);
	    ui_analytics.sendData({
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.copyFile,
	      type: file.type,
	      c_section: AnalyticsSection.chatWindow,
	      c_element: AnalyticsElement.more,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onEdit(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    ui_analytics.sendData({
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.clickEdit,
	      c_section: AnalyticsSection.chatWindow,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onCreateTask(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    ui_analytics.sendData({
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.clickCreateTask,
	      c_section: AnalyticsSection.chatWindow,
	      c_element: AnalyticsElement.more,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onSelect(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    ui_analytics.sendData({
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.select,
	      c_section: AnalyticsSection.chatWindow,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onMark(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    ui_analytics.sendData({
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.seeLater,
	      c_section: AnalyticsSection.chatWindow,
	      c_element: AnalyticsElement.more,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onReply(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    ui_analytics.sendData({
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.clickReply,
	      c_section: AnalyticsSection.chatWindow,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onAddFavorite({
	    dialogId,
	    messageId
	  }) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
	    const type = new im_v2_lib_messageComponent.MessageComponentManager(message).getName();
	    ui_analytics.sendData({
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.addToFav,
	      type,
	      c_section: AnalyticsSection.chatWindow,
	      c_element: AnalyticsElement.more,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onCreateEvent(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    ui_analytics.sendData({
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.clickCreateEvent,
	      c_section: AnalyticsSection.chatWindow,
	      c_element: AnalyticsElement.more,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onCopyText({
	    dialogId,
	    messageId
	  }) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
	    const type = new im_v2_lib_messageComponent.MessageComponentManager(message).getName();
	    if (chat.type === im_v2_const.ChatType.copilot) {
	      babelHelpers.classPrivateFieldLooseBase(this, _onCopyTextCopilot)[_onCopyTextCopilot]({
	        dialogId,
	        messageId
	      });
	      return;
	    }
	    ui_analytics.sendData({
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.copyMessage,
	      type,
	      c_section: AnalyticsSection.chatWindow,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	  onPin(dialogId) {
	    this.messagePins.onSendData({
	      dialogId,
	      eventParams: {
	        event: AnalyticsEvent.pinMessage,
	        c_section: AnalyticsSection.chatWindow
	      }
	    });
	  }
	  onReachingPinsLimit(dialogId) {
	    this.messagePins.onSendData({
	      dialogId,
	      eventParams: {
	        event: AnalyticsEvent.pinnedMessageLimitException,
	        c_section: AnalyticsSection.chatWindow
	      }
	    });
	  }
	  onUnpin(dialogId) {
	    this.messagePins.onUnpin({
	      dialogId,
	      eventParams: {
	        c_section: AnalyticsSection.chatWindow
	      }
	    });
	  }
	  onForward(dialogId) {
	    this.messageForward.onClickForward(dialogId);
	  }
	  onAskCopilot(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    ui_analytics.sendData({
	      category: getCategoryByChatType(chat.type),
	      event: AnalyticsEvent.askCopilot,
	      c_section: AnalyticsSection.chatWindow,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	    });
	  }
	}
	function _onCopyTextCopilot2({
	  dialogId,
	  messageId
	}) {
	  var _aiModel$name2;
	  const aiModel = im_v2_application_core.Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
	  const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	  const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
	  const role = im_v2_application_core.Core.getStore().getters['copilot/chats/getRole'](dialogId);
	  const type = new im_v2_lib_messageComponent.MessageComponentManager(message).getName();
	  const aiModelName = (_aiModel$name2 = aiModel.name) != null ? _aiModel$name2 : aiModel;
	  ui_analytics.sendData({
	    category: AnalyticsCategory.copilot,
	    event: AnalyticsEvent.copyMessage,
	    type,
	    c_section: `${currentLayout}_tab`,
	    p2: `provider_${aiModelName}`,
	    p4: `role_${main_core.Text.toCamelCase(role.code)}`,
	    p5: `chatId_${chat.chatId}`,
	    ...babelHelpers.classPrivateFieldLooseBase(this, _getBaseParams)[_getBaseParams](dialogId)
	  });
	}
	function _getFilesAmountParam2(messageId) {
	  const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
	  if (message.files.length === 1) {
	    return AnalyticsAmountFilesType.single;
	  }
	  return AnalyticsAmountFilesType.many;
	}
	function _getAnalyticsFileType2(messageId) {
	  const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
	  const fileTypes = message.files.map(fileId => {
	    return im_v2_application_core.Core.getStore().getters['files/get'](fileId).type;
	  });
	  const uniqueTypes = [...new Set(fileTypes)];
	  if (uniqueTypes.length === 1) {
	    return uniqueTypes[0];
	  }
	  if (uniqueTypes.length === 2 && uniqueTypes.includes(im_v2_const.FileType.image) && uniqueTypes.includes(im_v2_const.FileType.video)) {
	    return AnalyticsFileType.media;
	  }
	  return AnalyticsFileType.any;
	}
	function _getBaseParams2(dialogId) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	  return {
	    tool: AnalyticsTool.im,
	    c_sub_section: AnalyticsSubSection.contextMenu,
	    p1: `chatType_${getChatType(chat)}`
	  };
	}

	class SliderInvite {
	  getEmptyStateContext() {
	    return AnalyticsSection.chatEmptyState;
	  }
	  getRecentCreateMenuContext() {
	    return AnalyticsSection.chatCreateMenu;
	  }
	}

	var _buildModeEnableData = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildModeEnableData");
	class DesktopMode {
	  constructor() {
	    Object.defineProperty(this, _buildModeEnableData, {
	      value: _buildModeEnableData2
	    });
	  }
	  onBannerShow() {
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.messenger,
	      event: AnalyticsEvent.viewPopup,
	      type: AnalyticsType.selectAppMode
	    });
	  }
	  onBannerOneWindowEnable() {
	    ui_analytics.sendData(babelHelpers.classPrivateFieldLooseBase(this, _buildModeEnableData)[_buildModeEnableData](AnalyticsType.oneWindow, AnalyticsSection.popup));
	  }
	  onBannerTwoWindowEnable() {
	    ui_analytics.sendData(babelHelpers.classPrivateFieldLooseBase(this, _buildModeEnableData)[_buildModeEnableData](AnalyticsType.twoWindow, AnalyticsSection.popup));
	  }
	  onSettingsOneWindowEnable() {
	    ui_analytics.sendData(babelHelpers.classPrivateFieldLooseBase(this, _buildModeEnableData)[_buildModeEnableData](AnalyticsType.oneWindow, AnalyticsSection.settings));
	  }
	  onSettingsTwoWindowEnable() {
	    ui_analytics.sendData(babelHelpers.classPrivateFieldLooseBase(this, _buildModeEnableData)[_buildModeEnableData](AnalyticsType.twoWindow, AnalyticsSection.settings));
	  }
	}
	function _buildModeEnableData2(type, section) {
	  return {
	    tool: AnalyticsTool.im,
	    category: AnalyticsCategory.messenger,
	    event: AnalyticsEvent.selectAppMode,
	    type,
	    c_section: section
	  };
	}

	var _buildAnalyticsData = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildAnalyticsData");
	class ChatInviteLink {
	  constructor() {
	    Object.defineProperty(this, _buildAnalyticsData, {
	      value: _buildAnalyticsData2
	    });
	  }
	  onCopyMembersPanel(dialogId) {
	    ui_analytics.sendData(babelHelpers.classPrivateFieldLooseBase(this, _buildAnalyticsData)[_buildAnalyticsData](dialogId, AnalyticsSubSection.membersPanel));
	  }
	  onCopyContextMenu(dialogId) {
	    ui_analytics.sendData(babelHelpers.classPrivateFieldLooseBase(this, _buildAnalyticsData)[_buildAnalyticsData](dialogId, AnalyticsSubSection.contextMenu));
	  }
	}
	function _buildAnalyticsData2(dialogId, subSection) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	  return {
	    tool: AnalyticsTool.im,
	    category: getCategoryByChatType(chat.type),
	    event: AnalyticsEvent.copyChatLink,
	    c_section: AnalyticsSection.sidebar,
	    c_sub_section: subSection
	  };
	}

	class AiAssistant {
	  onOpenWidget(dialog) {
	    const chatType = getChatType(dialog);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chatType),
	      event: AnalyticsEvent.openExisting,
	      type: chatType,
	      c_section: AnalyticsSection.miniChat,
	      p2: getUserType(),
	      p5: `chatId_${dialog.chatId}`
	    });
	  }
	  onOpenChatAI(dialog, fromWidget = false) {
	    const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	    ui_analytics.sendData({
	      tool: AnalyticsTool.ai,
	      category: AnalyticsCategory.chatOperations,
	      event: AnalyticsEvent.openChat,
	      type: AI_ASSISTANT_CHAT_TYPE,
	      c_section: fromWidget ? AnalyticsSection.miniChat : `${currentLayout}_tab`,
	      p2: getUserType(),
	      p3: `chatType_${getChatType(dialog)}`,
	      p5: `chatId_${dialog.chatId}`
	    });
	  }
	  onUseAudioInput(dialogId) {
	    const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	    const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	    if (!isAiAssistant(dialog.dialogId)) {
	      return;
	    }
	    ui_analytics.sendData({
	      event: AnalyticsEvent.audioUse,
	      tool: AnalyticsTool.ai,
	      category: AnalyticsCategory.chatOperations,
	      c_section: `${currentLayout}_tab`,
	      p3: AI_ASSISTANT_CHAT_TYPE,
	      p5: `chatId_${dialog.chatId}`
	    });
	  }
	  onMcpIntegrationClick() {
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.chat,
	      event: AnalyticsEvent.clickMcpIntegrations,
	      c_section: AnalyticsSection.chatTextarea,
	      p1: AI_ASSISTANT_CHAT_TYPE
	    });
	  }
	}

	var _getTypeByChatId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTypeByChatId");
	var _getCategoryByFileType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCategoryByFileType");
	class Player {
	  constructor() {
	    Object.defineProperty(this, _getCategoryByFileType, {
	      value: _getCategoryByFileType2
	    });
	    Object.defineProperty(this, _getTypeByChatId, {
	      value: _getTypeByChatId2
	    });
	  }
	  onViewTranscription(fileId, status) {
	    const file = im_v2_application_core.Core.getStore().getters['files/get'](fileId);
	    const chatType = babelHelpers.classPrivateFieldLooseBase(this, _getTypeByChatId)[_getTypeByChatId](file.chatId);
	    const category = babelHelpers.classPrivateFieldLooseBase(this, _getCategoryByFileType)[_getCategoryByFileType](file);
	    const normalizedStatus = status.toLowerCase();
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category,
	      event: AnalyticsEvent.viewTranscription,
	      status: normalizedStatus,
	      p1: `chatType_${chatType}`
	    });
	  }
	  onPlay(fileId) {
	    const file = im_v2_application_core.Core.getStore().getters['files/get'](fileId);
	    const chatType = babelHelpers.classPrivateFieldLooseBase(this, _getTypeByChatId)[_getTypeByChatId](file.chatId);
	    const category = babelHelpers.classPrivateFieldLooseBase(this, _getCategoryByFileType)[_getCategoryByFileType](file);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category,
	      event: AnalyticsEvent.play,
	      p1: `chatType_${chatType}`
	    });
	  }
	  onPause(fileId) {
	    const file = im_v2_application_core.Core.getStore().getters['files/get'](fileId);
	    const chatType = babelHelpers.classPrivateFieldLooseBase(this, _getTypeByChatId)[_getTypeByChatId](file.chatId);
	    const category = babelHelpers.classPrivateFieldLooseBase(this, _getCategoryByFileType)[_getCategoryByFileType](file);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category,
	      event: AnalyticsEvent.pause,
	      p1: `chatType_${chatType}`
	    });
	  }
	  onChangeRate(chatId, rate) {
	    const chatType = babelHelpers.classPrivateFieldLooseBase(this, _getTypeByChatId)[_getTypeByChatId](chatId);
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.audioMessage,
	      event: AnalyticsEvent.changeSpeed,
	      p1: `chatType_${chatType}`,
	      p2: `speed_${rate}`
	    });
	  }
	}
	function _getTypeByChatId2(chatId) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](chatId);
	  return getChatType(chat);
	}
	function _getCategoryByFileType2(file) {
	  if (file.isVideoNote) {
	    return AnalyticsCategory.videoMessage;
	  }
	  return AnalyticsCategory.audioMessage;
	}

	class Notification {
	  onOpenFromQuickAccessPanel() {
	    ui_analytics.sendData({
	      tool: AnalyticsTool.notification,
	      category: AnalyticsCategory.notificationOperations,
	      event: AnalyticsEvent.notificationOpen,
	      c_element: NotificationEntryPoint.quickAccessLabel
	    });
	  }
	  onUnsubscribeFromNotification(params) {
	    ui_analytics.sendData({
	      tool: AnalyticsTool.notification,
	      category: AnalyticsCategory.notificationOperations,
	      event: AnalyticsEvent.notificationUnsubscribe,
	      p1: params.moduleId,
	      p2: params.optionName
	    });
	  }
	}

	var _getChatCategory = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatCategory");
	var _getChatType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatType");
	class Stickers {
	  constructor() {
	    Object.defineProperty(this, _getChatType, {
	      value: _getChatType2
	    });
	    Object.defineProperty(this, _getChatCategory, {
	      value: _getChatCategory2
	    });
	  }
	  onOpenEmoteSelector(dialogId) {
	    const params = {
	      event: AnalyticsEvent.openEmoteSelector,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory)[_getChatCategory](dialogId),
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType)[_getChatType](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onOpenStickerTab(dialogId) {
	    const params = {
	      event: AnalyticsEvent.openStickerTab,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory)[_getChatCategory](dialogId),
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType)[_getChatType](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onViewPromoPopup(dialogId) {
	    const params = {
	      event: AnalyticsEvent.viewStickerPopup,
	      type: AnalyticsType.stickers,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory)[_getChatCategory](dialogId),
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType)[_getChatType](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onShowCreateForm(dialogId) {
	    const params = {
	      event: AnalyticsEvent.clickCreateStickerPack,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory)[_getChatCategory](dialogId),
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType)[_getChatType](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onLinkPackFromPopup(dialogId) {
	    const params = {
	      event: AnalyticsEvent.addStickerPack,
	      c_section: AnalyticsSection.stickerPackPopup,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory)[_getChatCategory](dialogId),
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType)[_getChatType](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	}
	function _getChatCategory2(dialogId) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	  return getCategoryByChatType(chat.type);
	}
	function _getChatType2(dialogId) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	  return getChatType(chat);
	}

	var _getChatCategory$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatCategory");
	var _getChatType$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatType");
	class MessageSearch {
	  constructor() {
	    Object.defineProperty(this, _getChatType$1, {
	      value: _getChatType2$1
	    });
	    Object.defineProperty(this, _getChatCategory$1, {
	      value: _getChatCategory2$1
	    });
	  }
	  onOpenSearchPanel(dialogId) {
	    const chatType = babelHelpers.classPrivateFieldLooseBase(this, _getChatType$1)[_getChatType$1](dialogId);
	    const params = {
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$1)[_getChatCategory$1](dialogId),
	      event: AnalyticsEvent.openSearch,
	      c_section: AnalyticsSection.chatSidebar,
	      p1: `chatType_${chatType}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onStartSearch(dialogId) {
	    const chatType = babelHelpers.classPrivateFieldLooseBase(this, _getChatType$1)[_getChatType$1](dialogId);
	    const params = {
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$1)[_getChatCategory$1](dialogId),
	      event: AnalyticsEvent.startSearch,
	      c_section: AnalyticsSection.chatSidebar,
	      p1: `chatType_${chatType}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onGetSearchResult(dialogId, searchResult) {
	    const chatType = babelHelpers.classPrivateFieldLooseBase(this, _getChatType$1)[_getChatType$1](dialogId);
	    const status = searchResult.length > 0 ? AnalyticsStatus.success : AnalyticsStatus.notFound;
	    const params = {
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$1)[_getChatCategory$1](dialogId),
	      event: AnalyticsEvent.searchResult,
	      c_section: AnalyticsSection.chatSidebar,
	      status,
	      p1: `chatType_${chatType}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onSearchResultClick(dialogId) {
	    const chatType = babelHelpers.classPrivateFieldLooseBase(this, _getChatType$1)[_getChatType$1](dialogId);
	    const params = {
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$1)[_getChatCategory$1](dialogId),
	      event: AnalyticsEvent.selectSearchResult,
	      c_section: AnalyticsSection.chatSidebar,
	      p1: `chatType_${chatType}`
	    };
	    ui_analytics.sendData(params);
	  }
	}
	function _getChatCategory2$1(dialogId) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	  return getCategoryByChatType(chat.type);
	}
	function _getChatType2$1(dialogId) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	  return getChatType(chat);
	}

	var _getChatCategory$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatCategory");
	var _getChatType$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatType");
	var _getLayout = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLayout");
	class RecentContextMenu {
	  constructor() {
	    Object.defineProperty(this, _getLayout, {
	      value: _getLayout2
	    });
	    Object.defineProperty(this, _getChatType$2, {
	      value: _getChatType2$2
	    });
	    Object.defineProperty(this, _getChatCategory$2, {
	      value: _getChatCategory2$2
	    });
	  }
	  onUnread(dialogId) {
	    const params = {
	      event: AnalyticsEvent.seeLater,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$2)[_getChatCategory$2](dialogId),
	      c_section: `${babelHelpers.classPrivateFieldLooseBase(this, _getLayout)[_getLayout]()}_tab`,
	      c_sub_section: AnalyticsSubSection.recentContextMenu,
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType$2)[_getChatType$2](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onPin(dialogId) {
	    const params = {
	      event: AnalyticsEvent.pinChat,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$2)[_getChatCategory$2](dialogId),
	      c_section: `${babelHelpers.classPrivateFieldLooseBase(this, _getLayout)[_getLayout]()}_tab`,
	      c_sub_section: AnalyticsSubSection.recentContextMenu,
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType$2)[_getChatType$2](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onUnpin(dialogId) {
	    const params = {
	      event: AnalyticsEvent.unpinChat,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$2)[_getChatCategory$2](dialogId),
	      c_section: `${babelHelpers.classPrivateFieldLooseBase(this, _getLayout)[_getLayout]()}_tab`,
	      c_sub_section: AnalyticsSubSection.recentContextMenu,
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType$2)[_getChatType$2](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onOpenProfile(dialogId) {
	    const params = {
	      event: AnalyticsEvent.openProfile,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$2)[_getChatCategory$2](dialogId),
	      c_section: `${babelHelpers.classPrivateFieldLooseBase(this, _getLayout)[_getLayout]()}_tab`,
	      c_sub_section: AnalyticsSubSection.recentContextMenu,
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType$2)[_getChatType$2](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onFindChatsWithUser(dialogId) {
	    const params = {
	      event: AnalyticsEvent.findCommonChats,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$2)[_getChatCategory$2](dialogId),
	      c_section: `${babelHelpers.classPrivateFieldLooseBase(this, _getLayout)[_getLayout]()}_tab`,
	      c_sub_section: AnalyticsSubSection.recentContextMenu,
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType$2)[_getChatType$2](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onMute(dialogId) {
	    const params = {
	      event: AnalyticsEvent.mute,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$2)[_getChatCategory$2](dialogId),
	      c_section: `${babelHelpers.classPrivateFieldLooseBase(this, _getLayout)[_getLayout]()}_tab`,
	      c_sub_section: AnalyticsSubSection.recentContextMenu,
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType$2)[_getChatType$2](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onUnmute(dialogId) {
	    const params = {
	      event: AnalyticsEvent.unmute,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$2)[_getChatCategory$2](dialogId),
	      c_section: `${babelHelpers.classPrivateFieldLooseBase(this, _getLayout)[_getLayout]()}_tab`,
	      c_sub_section: AnalyticsSubSection.recentContextMenu,
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType$2)[_getChatType$2](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onHide(dialogId) {
	    const params = {
	      event: AnalyticsEvent.hideChat,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$2)[_getChatCategory$2](dialogId),
	      c_section: `${babelHelpers.classPrivateFieldLooseBase(this, _getLayout)[_getLayout]()}_tab`,
	      c_sub_section: AnalyticsSubSection.recentContextMenu,
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType$2)[_getChatType$2](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onRead(dialogId) {
	    const params = {
	      event: AnalyticsEvent.readAll,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$2)[_getChatCategory$2](dialogId),
	      c_section: `${babelHelpers.classPrivateFieldLooseBase(this, _getLayout)[_getLayout]()}_tab`,
	      c_sub_section: AnalyticsSubSection.recentContextMenu,
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType$2)[_getChatType$2](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	  onLeave(dialogId) {
	    const params = {
	      event: AnalyticsEvent.leave,
	      tool: AnalyticsTool.im,
	      category: babelHelpers.classPrivateFieldLooseBase(this, _getChatCategory$2)[_getChatCategory$2](dialogId),
	      c_section: `${babelHelpers.classPrivateFieldLooseBase(this, _getLayout)[_getLayout]()}_tab`,
	      c_sub_section: AnalyticsSubSection.recentContextMenu,
	      p1: `chatType_${babelHelpers.classPrivateFieldLooseBase(this, _getChatType$2)[_getChatType$2](dialogId)}`
	    };
	    ui_analytics.sendData(params);
	  }
	}
	function _getChatCategory2$2(dialogId) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	  return getCategoryByChatType(chat.type);
	}
	function _getChatType2$2(dialogId) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	  return getChatType(chat);
	}
	function _getLayout2() {
	  return im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	}

	var _sendData = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendData");
	class FormatToolbar {
	  constructor() {
	    Object.defineProperty(this, _sendData, {
	      value: _sendData2
	    });
	  }
	  onCodeClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData](dialogId, AnalyticsType.formatCode);
	  }
	  onLinkClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData](dialogId, AnalyticsType.formatLink);
	  }
	  onStrikethroughClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData](dialogId, AnalyticsType.formatStrikethrough);
	  }
	  onUnderlineClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData](dialogId, AnalyticsType.formatUnderline);
	  }
	  onItalicClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData](dialogId, AnalyticsType.formatItalic);
	  }
	  onBoldClick(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData](dialogId, AnalyticsType.formatBold);
	  }
	}
	function _sendData2(dialogId, type) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	  const chatType = getChatType(chat);
	  ui_analytics.sendData({
	    tool: AnalyticsTool.im,
	    category: getCategoryByChatType(chatType),
	    event: AnalyticsEvent.useFormatToolbar,
	    p1: `chatType_${chatType}`,
	    type
	  });
	}

	const SectionByLayoutName = {
	  [im_v2_const.Layout.chat]: AnalyticsSection.chatLayout,
	  [im_v2_const.Layout.notification]: AnalyticsSection.notificationLayout,
	  [im_v2_const.Layout.taskComments]: AnalyticsSection.taskCommentsLayout
	};
	var _hasSearchedBefore$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasSearchedBefore");
	var _onShowResult = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onShowResult");
	var _onSelectFromRecent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSelectFromRecent");
	class RecentSearch {
	  constructor() {
	    Object.defineProperty(this, _onSelectFromRecent, {
	      value: _onSelectFromRecent2
	    });
	    Object.defineProperty(this, _onShowResult, {
	      value: _onShowResult2
	    });
	    Object.defineProperty(this, _hasSearchedBefore$2, {
	      writable: true,
	      value: {}
	    });
	  }
	  onStart(layoutName) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _hasSearchedBefore$2)[_hasSearchedBefore$2][layoutName]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _hasSearchedBefore$2)[_hasSearchedBefore$2][layoutName] = true;
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.messenger,
	      event: AnalyticsEvent.startSearch,
	      c_section: SectionByLayoutName[layoutName]
	    });
	  }
	  onOpen(layoutName) {
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.messenger,
	      event: AnalyticsEvent.openSearch,
	      c_section: SectionByLayoutName[layoutName]
	    });
	  }
	  onClose(layoutName) {
	    babelHelpers.classPrivateFieldLooseBase(this, _hasSearchedBefore$2)[_hasSearchedBefore$2][layoutName] = false;
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.messenger,
	      event: AnalyticsEvent.closeSearch,
	      c_section: SectionByLayoutName[layoutName]
	    });
	  }
	  onSelectFromSearchResult(layoutName, position) {
	    ui_analytics.sendData({
	      tool: AnalyticsTool.im,
	      category: AnalyticsCategory.messenger,
	      event: AnalyticsEvent.selectSearchResult,
	      c_section: SectionByLayoutName[layoutName],
	      p3: `position_${position}`
	    });
	  }
	  onSelectFromRecentSearch(layoutName, dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onSelectFromRecent)[_onSelectFromRecent](layoutName, dialogId, AnalyticsSubSection.recentSearch);
	  }
	  onSelectFromRecentChats(layoutName, dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onSelectFromRecent)[_onSelectFromRecent](layoutName, dialogId, AnalyticsSubSection.recentChats);
	  }
	  onShowSuccessResult(layoutName) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onShowResult)[_onShowResult](layoutName, AnalyticsStatus.success);
	  }
	  onShowNotFoundResult(layoutName) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onShowResult)[_onShowResult](layoutName, AnalyticsStatus.notFound);
	  }
	}
	function _onShowResult2(layoutName, status) {
	  ui_analytics.sendData({
	    tool: AnalyticsTool.im,
	    category: AnalyticsCategory.messenger,
	    event: AnalyticsEvent.searchResult,
	    c_section: SectionByLayoutName[layoutName],
	    status
	  });
	}
	function _onSelectFromRecent2(layoutName, dialogId, subSection) {
	  const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	  ui_analytics.sendData({
	    tool: AnalyticsTool.im,
	    category: AnalyticsCategory.messenger,
	    event: AnalyticsEvent.selectSearchRecent,
	    c_section: SectionByLayoutName[layoutName],
	    c_sub_section: subSection,
	    p1: `chatType_${getChatType(chat)}`
	  });
	}

	var _excludedChats = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("excludedChats");
	var _chatsWithTyping = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("chatsWithTyping");
	var _currentTab = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentTab");
	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	class Analytics {
	  constructor() {
	    Object.defineProperty(this, _excludedChats, {
	      writable: true,
	      value: new Set()
	    });
	    Object.defineProperty(this, _chatsWithTyping, {
	      writable: true,
	      value: new Set()
	    });
	    Object.defineProperty(this, _currentTab, {
	      writable: true,
	      value: im_v2_const.Layout.chat
	    });
	    this.chatCreate = new ChatCreate();
	    this.chatEdit = new ChatEdit();
	    this.chatDelete = new ChatDelete();
	    this.messageDelete = new MessageDelete();
	    this.historyLimit = new HistoryLimit();
	    this.userAdd = new UserAdd();
	    this.collabEntities = new CollabEntities();
	    this.chatEntities = new ChatEntities();
	    this.supervisor = new Supervisor();
	    this.checkIn = new CheckIn();
	    this.copilot = new Copilot();
	    this.attachMenu = new AttachMenu();
	    this.vote = new Vote();
	    this.messagePins = new MessagePins();
	    this.messageForward = new MessageForward();
	    this.messageContextMenu = new MessageContextMenu();
	    this.sliderInvite = new SliderInvite();
	    this.desktopMode = new DesktopMode();
	    this.chatInviteLink = new ChatInviteLink();
	    this.aiAssistant = new AiAssistant();
	    this.player = new Player();
	    this.notification = new Notification();
	    this.stickers = new Stickers();
	    this.messageSearch = new MessageSearch();
	    this.recentContextMenu = new RecentContextMenu();
	    this.formatToolbar = new FormatToolbar();
	    this.recentSearch = new RecentSearch();
	  }
	  static getInstance() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance] = new this();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance];
	  }
	  ignoreNextChatOpen(dialogId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _excludedChats)[_excludedChats].add(dialogId);
	  }
	  onOpenTab(tabName) {
	    const trackedTabs = [im_v2_const.Layout.copilot, im_v2_const.Layout.collab, im_v2_const.Layout.channel, im_v2_const.Layout.notification, im_v2_const.Layout.settings, im_v2_const.Layout.openlines, im_v2_const.Layout.taskComments];
	    if (!trackedTabs.includes(tabName)) {
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
	      type: tabName,
	      p2: getUserType()
	    });
	  }
	  onOpenChat(dialog) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _excludedChats)[_excludedChats].has(dialog.dialogId)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _excludedChats)[_excludedChats].delete(dialog.dialogId);
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _chatsWithTyping)[_chatsWithTyping].delete(dialog.dialogId);
	    const chatType = getChatType(dialog);
	    if (chatType === im_v2_const.ChatType.copilot) {
	      this.copilot.onOpenChat(dialog.dialogId);
	    }
	    if (isAiAssistant(dialog.dialogId)) {
	      this.aiAssistant.onOpenChatAI(dialog);
	    }
	    const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
	    const isMember = dialog.role === im_v2_const.UserRole.guest ? 'N' : 'Y';
	    const params = {
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chatType),
	      event: AnalyticsEvent.openExisting,
	      type: chatType,
	      c_section: `${currentLayout}_tab`,
	      p2: getUserType()
	    };
	    if (!isNotes(dialog.dialogId)) {
	      params.p5 = `chatId_${dialog.chatId}`;
	    }
	    if (chatType === im_v2_const.ChatType.comment) {
	      const parentChat = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](dialog.parentChatId);
	      params.p1 = `chatType_${parentChat.type}`;
	      params.p4 = `parentChatId_${dialog.parentChatId}`;
	    }
	    if (chatType === im_v2_const.ChatType.collab) {
	      params.p4 = getCollabId(dialog.chatId);
	    }
	    if (chatType !== im_v2_const.ChatType.copilot) {
	      params.p3 = `isMember_${isMember}`;
	    }
	    if (chatType === im_v2_const.ChatType.copilot) {
	      const role = im_v2_application_core.Core.getStore().getters['copilot/chats/getRole'](dialog.dialogId);
	      params.p4 = `role_${main_core.Text.toCamelCase(role.code)}`;
	    }
	    ui_analytics.sendData(params);
	  }
	  onTypeMessage(dialog) {
	    if (!isNotes(dialog.dialogId) || babelHelpers.classPrivateFieldLooseBase(this, _chatsWithTyping)[_chatsWithTyping].has(dialog.dialogId)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _chatsWithTyping)[_chatsWithTyping].add(dialog.dialogId);
	    const chatType = getChatType(dialog);
	    const params = {
	      tool: AnalyticsTool.im,
	      category: getCategoryByChatType(chatType),
	      event: AnalyticsEvent.typeMessage,
	      p1: `chatType_${chatType}`
	    };
	    ui_analytics.sendData(params);
	  }
	}
	Object.defineProperty(Analytics, _instance, {
	  writable: true,
	  value: void 0
	});

	exports.Analytics = Analytics;
	exports.CreateChatContext = CreateChatContext;
	exports.getCollabId = getCollabId;
	exports.getUserType = getUserType;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.UI.Analytics,BX.Messenger.v2.Application,BX.Messenger.v2.Const));
//# sourceMappingURL=analytics.bundle.js.map
