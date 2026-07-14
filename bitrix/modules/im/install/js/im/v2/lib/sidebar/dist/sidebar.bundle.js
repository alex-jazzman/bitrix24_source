/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_lib_feature, im_v2_const, im_v2_lib_channel, im_v2_lib_market, main_core, im_v2_lib_collab) {
	'use strict';

	class BlockFilter {
		#dialogId;
		#chat;
		#blocks;
		constructor(dialogId, blocks) {
			this.#dialogId = dialogId;
			this.#chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			this.#blocks = blocks;
		}
		run() {
			const blocksSet = new Set(this.#blocks);
			if (this.#isFileMigrationFinished()) {
				blocksSet.delete(im_v2_const.SidebarMainPanelBlock.fileUnsortedList);
			} else {
				blocksSet.delete(im_v2_const.SidebarMainPanelBlock.fileList);
			}
			if (!this.#hasMarketApps()) {
				blocksSet.delete(im_v2_const.SidebarMainPanelBlock.marketAppList);
			}
			if (!this.#hasHistoryLimit()) {
				blocksSet.delete(im_v2_const.SidebarMainPanelBlock.tariffLimit);
			}
			return [...blocksSet];
		}
		#isFileMigrationFinished() {
			return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.sidebarFiles);
		}
		#hasMarketApps() {
			return im_v2_lib_market.MarketManager.getInstance().getAvailablePlacementsByType(im_v2_const.PlacementType.sidebar, this.#dialogId).length > 0;
		}
		#hasHistoryLimit() {
			const isChannelCommentsChat = im_v2_const.ChatType.comment === this.#chat.type;
			const isChannelChat = im_v2_lib_channel.ChannelManager.isChannel(this.#dialogId);
			if (isChannelChat || isChannelCommentsChat || im_v2_lib_feature.TariffManager.chatHistory.isAvailable()) {
				return false;
			}
			return im_v2_application_core.Core.getStore().getters['sidebar/hasHistoryLimit'](this.#chat.chatId);
		}
	}

	const baseBlocks = [im_v2_const.SidebarMainPanelBlock.chat, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList, im_v2_const.SidebarMainPanelBlock.marketAppList];

	class SidebarPreset {
		#configTemplate;
		constructor(rawConfig = {}) {
			this.#configTemplate = {
				...this.#getDefaultConfig(),
				...rawConfig
			};
		}
		get() {
			return this.#configTemplate;
		}
		#getDefaultConfig() {
			return {
				blocks: baseBlocks,
				getHeaderTitle: () => main_core.Loc.getMessage('IM_SIDEBAR_HEADER_TITLE'),
				isHeaderMenuEnabled: () => true,
				areSharedChatsEnabled: () => true,
				areChatMembersEnabled: () => true,
				isAutoDeleteEnabled: () => true,
				getCustomDescription: () => ''
			};
		}
	}

	class SidebarConfig {
		#dialogId;
		#blocks;
		#getHeaderTitle;
		#getCustomDescription;
		#areChatMembersEnabled;
		#isHeaderMenuEnabled;
		#areSharedChatsEnabled;
		#isAutoDeleteEnabled;
		constructor(dialogId, preset) {
			const presetInstance = preset ?? new SidebarPreset();
			const {
				blocks,
				getHeaderTitle,
				isHeaderMenuEnabled,
				getCustomDescription,
				areSharedChatsEnabled,
				areChatMembersEnabled,
				isAutoDeleteEnabled
			} = presetInstance.get();
			this.#dialogId = dialogId;
			this.#blocks = blocks;
			this.#getHeaderTitle = getHeaderTitle;
			this.#areSharedChatsEnabled = areSharedChatsEnabled;
			this.#areChatMembersEnabled = areChatMembersEnabled;
			this.#getCustomDescription = getCustomDescription;
			this.#isHeaderMenuEnabled = isHeaderMenuEnabled;
			this.#isAutoDeleteEnabled = isAutoDeleteEnabled;
		}
		getBlocks() {
			return new BlockFilter(this.#dialogId, this.#blocks).run();
		}
		getHeaderTitle() {
			return this.#getHeaderTitle();
		}
		getCustomDescription() {
			return this.#getCustomDescription(this.#dialogId);
		}
		isHeaderMenuEnabled() {
			return this.#isHeaderMenuEnabled();
		}
		isAutoDeleteEnabled() {
			return this.#isAutoDeleteEnabled();
		}
		areSharedChatsEnabled() {
			return this.#areSharedChatsEnabled();
		}
		areChatMembersEnabled() {
			return this.#areChatMembersEnabled(this.#dialogId);
		}
	}

	const isChat = chatContext => chatContext.type === im_v2_const.ChatType.chat;
	const chatPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.chat, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList, im_v2_const.SidebarMainPanelBlock.marketAppList]
	});

	const isUser = chatContext => chatContext.type === im_v2_const.ChatType.user;
	const userPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.user, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList, im_v2_const.SidebarMainPanelBlock.marketAppList]
	});

	const isBot = chatContext => {
		const user = im_v2_application_core.Core.getStore().getters['users/get'](chatContext.dialogId);
		return user?.type === im_v2_const.UserType.bot;
	};
	const botPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.user, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList, im_v2_const.SidebarMainPanelBlock.marketAppList]
	});

	const isSelfChat = chatContext => {
		return im_v2_application_core.Core.getStore().getters['chats/isSelfChat'](chatContext.dialogId);
	};
	const selfChatPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.selfChat, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList]
	});

	const isLines = chatContext => chatContext.type === im_v2_const.ChatType.lines;
	const linesPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.chat, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList],
		isHeaderMenuEnabled: () => false
	});

	const isCollab = chatContext => chatContext.type === im_v2_const.ChatType.collab;
	const collabPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.chat, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.fileUnsortedList, im_v2_const.SidebarMainPanelBlock.collabHelpdesk],
		getHeaderTitle: () => im_v2_lib_collab.CollabManager.getSidebarHeaderText()
	});

	const isSupport = chatContext => im_v2_application_core.Core.getStore().getters['sidebar/multidialog/isSupport'](chatContext.dialogId);
	const supportPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.support, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.multidialog, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList]
	});

	const isAiAssistantBot = chatContext => im_v2_application_core.Core.getStore().getters['users/bots/isAiAssistant'](chatContext.dialogId);
	const aiAssistantBotPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.user, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList],
		areSharedChatsEnabled: () => false,
		getCustomDescription: () => {
			return main_core.Loc.getMessage('IM_SIDEBAR_AI_ASSISTANT_DESCRIPTION');
		}
	});

	const isComment = chatContext => chatContext.type === im_v2_const.ChatType.comment;
	const commentPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.post, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList],
		getHeaderTitle: () => main_core.Loc.getMessage('IM_SIDEBAR_COMMENTS_HEADER_TITLE'),
		isHeaderMenuEnabled: () => false
	});

	const isChannel = chatContext => im_v2_lib_channel.ChannelManager.isChannel(chatContext.dialogId);
	const channelPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.chat, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList],
		getHeaderTitle: () => main_core.Loc.getMessage('IM_SIDEBAR_CHANNEL_HEADER_TITLE')
	});

	const isCopilot = chatContext => chatContext.type === im_v2_const.ChatType.copilot;
	const copilotPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.copilot, im_v2_const.SidebarMainPanelBlock.tariffLimit, im_v2_const.SidebarMainPanelBlock.copilotInfo, im_v2_const.SidebarMainPanelBlock.taskList, im_v2_const.SidebarMainPanelBlock.meetingList]
	});

	const isTaskComments = chatContext => chatContext.type === im_v2_const.ChatType.taskComments;
	const taskCommentsPreset = new SidebarPreset({
		blocks: [im_v2_const.SidebarMainPanelBlock.task, im_v2_const.SidebarMainPanelBlock.info, im_v2_const.SidebarMainPanelBlock.fileList, im_v2_const.SidebarMainPanelBlock.meetingList, im_v2_const.SidebarMainPanelBlock.taskCommentsHistory],
		isHeaderMenuEnabled: () => false,
		getHeaderTitle: () => main_core.Loc.getMessage('IM_SIDEBAR_TASK_COMMENTS_HEADER_TITLE')
	});

	class SidebarManager {
		static #instance = null;
		#defaultConfigMap = new Map();
		#customConfigMap = new Map();
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new SidebarManager();
			}
			return this.#instance;
		}
		constructor() {
			this.#checkMigrationStatus();
			this.#registerDefaultConfigs();
		}
		registerConfig(callback, sidebarPreset) {
			this.#customConfigMap.set(callback, sidebarPreset);
		}
		getConfig(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const allConfigEntries = [...this.#customConfigMap.entries(), ...this.#defaultConfigMap.entries()];
			for (const [callback, preset] of allConfigEntries) {
				if (callback(chat)) {
					return new SidebarConfig(dialogId, preset);
				}
			}
			return new SidebarConfig(dialogId);
		}
		#checkMigrationStatus() {
			const filesMigrated = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.sidebarFiles);
			const linksMigrated = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.sidebarLinks);
			void im_v2_application_core.Core.getStore().dispatch('sidebar/setFilesMigrated', filesMigrated);
			void im_v2_application_core.Core.getStore().dispatch('sidebar/setLinksMigrated', linksMigrated);
		}
		#registerDefaultConfigs() {
			// most specific configs first
			this.#defaultConfigMap.set(isTaskComments, taskCommentsPreset);
			this.#defaultConfigMap.set(isCopilot, copilotPreset);
			this.#defaultConfigMap.set(isChannel, channelPreset);
			this.#defaultConfigMap.set(isComment, commentPreset);
			this.#defaultConfigMap.set(isSupport, supportPreset);
			this.#defaultConfigMap.set(isAiAssistantBot, aiAssistantBotPreset);
			this.#defaultConfigMap.set(isBot, botPreset);
			this.#defaultConfigMap.set(isSelfChat, selfChatPreset);
			this.#defaultConfigMap.set(isLines, linesPreset);
			this.#defaultConfigMap.set(isCollab, collabPreset);
			this.#defaultConfigMap.set(isUser, userPreset);
			this.#defaultConfigMap.set(isChat, chatPreset);
		}
	}

	exports.SidebarConfig = SidebarConfig;
	exports.SidebarManager = SidebarManager;
	exports.SidebarPreset = SidebarPreset;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Messenger.v2.Lib);
//# sourceMappingURL=sidebar.bundle.js.map
