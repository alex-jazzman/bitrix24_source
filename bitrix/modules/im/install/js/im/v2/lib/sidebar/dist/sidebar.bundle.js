/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_lib_feature,im_v2_lib_market,im_v2_application_core,main_core,im_v2_lib_channel,im_v2_const) {
	'use strict';

	const baseBlocks = [im_v2_const.SidebarMainPanelBlock.chat, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList, im_v2_const.SidebarMainPanelBlock.marketAppList];

	var _dialogId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialogId");
	var _chat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("chat");
	var _blocks = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("blocks");
	var _isFileMigrationFinished = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isFileMigrationFinished");
	var _hasMarketApps = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasMarketApps");
	var _hasHistoryLimit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasHistoryLimit");
	class BlockFilter {
	  constructor(dialogId, blocks) {
	    Object.defineProperty(this, _hasHistoryLimit, {
	      value: _hasHistoryLimit2
	    });
	    Object.defineProperty(this, _hasMarketApps, {
	      value: _hasMarketApps2
	    });
	    Object.defineProperty(this, _isFileMigrationFinished, {
	      value: _isFileMigrationFinished2
	    });
	    Object.defineProperty(this, _dialogId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _chat, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _blocks, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _dialogId)[_dialogId] = dialogId;
	    babelHelpers.classPrivateFieldLooseBase(this, _chat)[_chat] = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    babelHelpers.classPrivateFieldLooseBase(this, _blocks)[_blocks] = blocks;
	  }
	  run() {
	    const blocksSet = new Set(babelHelpers.classPrivateFieldLooseBase(this, _blocks)[_blocks]);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isFileMigrationFinished)[_isFileMigrationFinished]()) {
	      blocksSet.delete(im_v2_const.SidebarMainPanelBlock.fileUnsortedList);
	    } else {
	      blocksSet.delete(im_v2_const.SidebarMainPanelBlock.fileList);
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _hasMarketApps)[_hasMarketApps]()) {
	      blocksSet.delete(im_v2_const.SidebarMainPanelBlock.marketAppList);
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _hasHistoryLimit)[_hasHistoryLimit]()) {
	      blocksSet.delete(im_v2_const.SidebarMainPanelBlock.tariffLimit);
	    }
	    return [...blocksSet];
	  }
	}
	function _isFileMigrationFinished2() {
	  return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.sidebarFiles);
	}
	function _hasMarketApps2() {
	  return im_v2_lib_market.MarketManager.getInstance().getAvailablePlacementsByType(im_v2_const.PlacementType.sidebar, babelHelpers.classPrivateFieldLooseBase(this, _dialogId)[_dialogId]).length > 0;
	}
	function _hasHistoryLimit2() {
	  const isChannelCommentsChat = im_v2_const.ChatType.comment === babelHelpers.classPrivateFieldLooseBase(this, _chat)[_chat].type;
	  const isChannelChat = im_v2_lib_channel.ChannelManager.isChannel(babelHelpers.classPrivateFieldLooseBase(this, _dialogId)[_dialogId]);
	  if (isChannelChat || isChannelCommentsChat || im_v2_lib_feature.FeatureManager.chatHistory.isAvailable()) {
	    return false;
	  }
	  return im_v2_application_core.Core.getStore().getters['sidebar/hasHistoryLimit'](babelHelpers.classPrivateFieldLooseBase(this, _chat)[_chat].chatId);
	}

	var _blocks$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("blocks");
	var _headerTitle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("headerTitle");
	var _headerMenuEnabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("headerMenuEnabled");
	var _getDefaultConfig = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDefaultConfig");
	class SidebarConfig {
	  constructor(rawConfig = {}) {
	    Object.defineProperty(this, _getDefaultConfig, {
	      value: _getDefaultConfig2
	    });
	    Object.defineProperty(this, _blocks$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _headerTitle, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _headerMenuEnabled, {
	      writable: true,
	      value: void 0
	    });
	    const preparedConfig = {
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getDefaultConfig)[_getDefaultConfig](),
	      ...rawConfig
	    };
	    const {
	      blocks,
	      headerTitle,
	      headerMenuEnabled
	    } = preparedConfig;
	    babelHelpers.classPrivateFieldLooseBase(this, _blocks$1)[_blocks$1] = blocks;
	    babelHelpers.classPrivateFieldLooseBase(this, _headerTitle)[_headerTitle] = headerTitle;
	    babelHelpers.classPrivateFieldLooseBase(this, _headerMenuEnabled)[_headerMenuEnabled] = headerMenuEnabled;
	  }
	  getBlocks(dialogId) {
	    return new BlockFilter(dialogId, babelHelpers.classPrivateFieldLooseBase(this, _blocks$1)[_blocks$1]).run();
	  }
	  getHeaderTitle() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _headerTitle)[_headerTitle];
	  }
	  isMenuEnabled() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _headerMenuEnabled)[_headerMenuEnabled];
	  }
	}
	function _getDefaultConfig2() {
	  return {
	    blocks: baseBlocks,
	    headerTitle: main_core.Loc.getMessage('IM_SIDEBAR_HEADER_TITLE'),
	    headerMenuEnabled: true
	  };
	}

	const isChat = chatContext => chatContext.type === im_v2_const.ChatType.chat;
	const chatConfig = new SidebarConfig({
	  blocks: [im_v2_const.SidebarMainPanelBlock.chat, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList, im_v2_const.SidebarMainPanelBlock.marketAppList]
	});

	const isUser = chatContext => chatContext.type === im_v2_const.ChatType.user;
	const userConfig = new SidebarConfig({
	  blocks: [im_v2_const.SidebarMainPanelBlock.user, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList, im_v2_const.SidebarMainPanelBlock.marketAppList]
	});

	const isBot = chatContext => {
	  const user = im_v2_application_core.Core.getStore().getters['users/get'](chatContext.dialogId);
	  return (user == null ? void 0 : user.type) === im_v2_const.UserType.bot;
	};
	const botConfig = new SidebarConfig({
	  blocks: [im_v2_const.SidebarMainPanelBlock.user, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList, im_v2_const.SidebarMainPanelBlock.marketAppList]
	});

	const isNotes = chatContext => {
	  return chatContext.type === im_v2_const.ChatType.user && Number(chatContext.dialogId) === im_v2_application_core.Core.getUserId();
	};
	const notesConfig = new SidebarConfig({
	  blocks: [im_v2_const.SidebarMainPanelBlock.notes, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList]
	});

	const isLines = chatContext => chatContext.type === im_v2_const.ChatType.lines;
	const linesConfig = new SidebarConfig({
	  blocks: [im_v2_const.SidebarMainPanelBlock.chat, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList],
	  headerMenuEnabled: false
	});

	const isCollab = chatContext => chatContext.type === im_v2_const.ChatType.collab;
	const collabConfig = new SidebarConfig({
	  blocks: [im_v2_const.SidebarMainPanelBlock.chat, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList, im_v2_const.SidebarMainPanelBlock.collabHelpdesk],
	  headerTitle: main_core.Loc.getMessage('IM_SIDEBAR_COLLAB_HEADER_TITLE')
	});

	const isSupport = chatContext => im_v2_application_core.Core.getStore().getters['sidebar/multidialog/isSupport'](chatContext.dialogId);
	const supportConfig = new SidebarConfig({
	  blocks: [im_v2_const.SidebarMainPanelBlock.support, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.multidialog, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList]
	});

	const isAiAssistant = chatContext => im_v2_application_core.Core.getStore().getters['users/bots/isAiAssistant'](chatContext.dialogId);
	const aiAssistantConfig = new SidebarConfig({
	  blocks: [im_v2_const.SidebarMainPanelBlock.user, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.info]
	});

	const isComment = chatContext => chatContext.type === im_v2_const.ChatType.comment;
	const commentConfig = new SidebarConfig({
	  blocks: [im_v2_const.SidebarMainPanelBlock.post, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList],
	  headerTitle: main_core.Loc.getMessage('IM_SIDEBAR_COMMENTS_HEADER_TITLE'),
	  headerMenuEnabled: false
	});

	const isChannel = chatContext => im_v2_lib_channel.ChannelManager.isChannel(chatContext.dialogId);
	const channelConfig = new SidebarConfig({
	  blocks: [im_v2_const.SidebarMainPanelBlock.chat, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList],
	  headerTitle: main_core.Loc.getMessage('IM_SIDEBAR_CHANNEL_HEADER_TITLE')
	});

	const isCopilot = chatContext => chatContext.type === im_v2_const.ChatType.copilot;
	const copilotConfig = new SidebarConfig({
	  blocks: [im_v2_const.SidebarMainPanelBlock.copilot, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.copilotInfo, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList]
	});

	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	var _defaultConfigMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("defaultConfigMap");
	var _customConfigMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("customConfigMap");
	var _checkMigrationStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkMigrationStatus");
	var _registerDefaultConfigs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerDefaultConfigs");
	class SidebarManager {
	  static getInstance() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance] = new SidebarManager();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance];
	  }
	  constructor() {
	    Object.defineProperty(this, _registerDefaultConfigs, {
	      value: _registerDefaultConfigs2
	    });
	    Object.defineProperty(this, _checkMigrationStatus, {
	      value: _checkMigrationStatus2
	    });
	    Object.defineProperty(this, _defaultConfigMap, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _customConfigMap, {
	      writable: true,
	      value: new Map()
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _checkMigrationStatus)[_checkMigrationStatus]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerDefaultConfigs)[_registerDefaultConfigs]();
	  }
	  registerConfig(callback, sidebarConfig) {
	    babelHelpers.classPrivateFieldLooseBase(this, _customConfigMap)[_customConfigMap].set(callback, sidebarConfig);
	  }
	  getConfig(dialogId) {
	    const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
	    const allConfigEntries = [...babelHelpers.classPrivateFieldLooseBase(this, _customConfigMap)[_customConfigMap].entries(), ...babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].entries()];
	    for (const [callback, config] of allConfigEntries) {
	      if (callback(chat)) {
	        return config;
	      }
	    }
	    return new SidebarConfig();
	  }
	}
	function _checkMigrationStatus2() {
	  const filesMigrated = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.sidebarFiles);
	  const linksMigrated = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.sidebarLinks);
	  void im_v2_application_core.Core.getStore().dispatch('sidebar/setFilesMigrated', filesMigrated);
	  void im_v2_application_core.Core.getStore().dispatch('sidebar/setLinksMigrated', linksMigrated);
	}
	function _registerDefaultConfigs2() {
	  // most specific configs first
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].set(isCopilot, copilotConfig);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].set(isChannel, channelConfig);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].set(isComment, commentConfig);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].set(isSupport, supportConfig);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].set(isAiAssistant, aiAssistantConfig);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].set(isBot, botConfig);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].set(isNotes, notesConfig);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].set(isLines, linesConfig);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].set(isCollab, collabConfig);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].set(isUser, userConfig);
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultConfigMap)[_defaultConfigMap].set(isChat, chatConfig);
	}
	Object.defineProperty(SidebarManager, _instance, {
	  writable: true,
	  value: null
	});

	exports.SidebarManager = SidebarManager;
	exports.SidebarConfig = SidebarConfig;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Application,BX,BX.Messenger.v2.Lib,BX.Messenger.v2.Const));
//# sourceMappingURL=sidebar.bundle.js.map
