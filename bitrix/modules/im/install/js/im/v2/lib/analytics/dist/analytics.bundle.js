/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, ui_analytics, im_v2_application_core, im_v2_const, im_v2_lib_feature, ui_pageContext, im_v2_lib_messageComponent) {
	'use strict';

	const PSEUDO_SELF_CHAT_TYPE = 'notes';
	const PROJECT_CHAT_TYPE = 'project';
	const AI_ASSISTANT_CHAT_TYPE$1 = 'chatType_aiAssistant';
	const CopilotChatType = Object.freeze({
		private: 'chatType_private',
		multiuser: 'chatType_multiuser'
	});
	const AnalyticsEvent = Object.freeze({
		openChat: 'open_chat',
		createNewChat: 'create_new_chat',
		audioUse: 'audio_use',
		openTab: 'open_tab',
		useChatFilter: 'use_chat_filter',
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
		clickCreateAiTask: 'click_create_ai_task',
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
		forwardResult: 'forward_result',
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
		selectSearchRecent: 'click_recent_suggest',
		openTaskCard: 'open_task_description',
		openSideCard: 'open_side_card',
		closeSideCard: 'close_side_card',
		addUser: 'add_mentioned_user',
		openUnreadMode: 'show_unread',
		readAllChats: 'read_all',
		viewJoinPopup: 'view_join_popup',
		copyGuestLink: 'copy_guest_link',
		openMiniChat: 'open_mini_chat',
		bitrixGptAgentPromoView: 'popup_view',
		bitrixGptAgentPromoButtonClick: 'button_click',
		bitrixGptAgentPromoClose: 'popup_close',
		suggestsShow: 'suggests_show',
		suggestsClick: 'suggests_click',
		modeChange: 'mode_change',
		clickStopGeneration: 'click_stop_generation',
		clickCreateFolder: 'click_create_folder',
		openList: 'open_list',
		addToFolder: 'add_to_folder',
		deleteFromFolder: 'delete_from_folder',
		chatLimitException: 'chat_limit_exception',
		folderLimitException: 'folder_limit_exception',
		openFolder: 'open_folder',
		goToDate: 'go_to_date',
		record: 'record'
	});
	const AnalyticsTool = Object.freeze({
		ai: 'ai',
		checkin: 'checkin',
		im: 'im',
		infoHelper: 'InfoHelper',
		inform: 'inform',
		notification: 'notification',
		tasks: 'tasks'
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
		collab: 'project',
		updateAppPopup: 'update_app_popup',
		audioMessage: 'audiomessage',
		videoMessage: 'videomessage',
		notificationOperations: 'notif_ops',
		popups: 'popups',
		taskOperations: 'task_operations',
		folders: 'folders'
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
		formatCode: 'code',
		tasks: 'tasks',
		chatTask: 'chat_task',
		ahaSpringRelease2026: 'ahaspringrelease2026',
		empty: 'empty',
		nonEmpty: 'non_empty',
		hotkeys: 'hotkeys',
		quickRecord: 'quick',
		lockedRecord: 'locked'
	});
	const AnalyticsSection = Object.freeze({
		copilotTab: 'copilot_tab',
		projectTab: 'project_tab',
		project: 'project',
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
		taskCommentsLayout: 'tasksTask_tab',
		mentionPopup: 'mention_popup',
		textareaMentionPopup: 'textarea_mention_popup',
		im: 'im',
		chatTasks: 'chat_tasks',
		createMenu: 'create_menu',
		folderList: 'folder_list',
		chatList: 'chat_list',
		filterRow: 'filter_row',
		folderMenu: 'folder_menu',
		search: 'search',
		dateDivider: 'dateDivider'
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
		recentSearch: 'recent_search',
		chatHeader: 'chat_header',
		message: 'message',
		sharedLink: 'link',
		sharedLinkMenu: 'link_context_menu',
		sharedLinkCompactMenu: 'link_menu',
		chatTaskCard: 'chat_task_card',
		multiselectPanel: 'multiselect_panel',
		folderContextMenu: 'folder_context_menu',
		folderList: 'folder_list'
	});
	const AnalyticsForwardTab = Object.freeze({
		all: 'all',
		chats: 'chats',
		tasks: 'tasks',
		projects: 'projects',
		channels: 'channels',
		copilot: 'copilot'
	});

	// Literals intentionally match AnalyticsForwardTab: the two objects answer different questions
	// and are never merged. Change a value only together with the server and mobile folder maps.
	const AnalyticsFolderType = Object.freeze({
		all: 'all',
		userFolder: 'user_folder',
		tasks: 'tasks',
		channels: 'channels',
		projects: 'projects',
		copilot: 'copilot',
		lines: 'lines',
		vibecodeApp: 'vibecode'
	});
	const AnalyticsElement = Object.freeze({
		initialBanner: 'initial_banner',
		videocall: 'videocall',
		audiocall: 'audiocall',
		startButton: 'start_button',
		more: 'more',
		taskButton: 'task_button',
		openButton: 'open_button',
		closeButton: 'close_button'
	});
	const AnalyticsStatus = Object.freeze({
		success: 'success',
		error: 'error',
		errorTurnedOff: 'error_turnedoff',
		notFound: 'not_found'
	});
	const CreateChatContext = Object.freeze({
		projectEmptyState: 'project_empty_state'
	});
	const MessagePinsTypes = Object.freeze({
		single: 'single',
		multiple: 'multiple',
		selected: 'selected'
	});
	const NotificationEntryPoint = Object.freeze({
		quickAccessLabel: 'bell_button'
	});

	// The entry the jump was started from is reported as the section of the event, so the values are
	// read from AnalyticsSection: two dictionaries holding the same wire value would drift apart.
	const DateNavigationEntryPoint = Object.freeze({
		search: AnalyticsSection.search,
		dateDivider: AnalyticsSection.dateDivider
	});

	// Resolves the collab chat that governs a chat's project subtree: the chat itself
	// when it is a collab, or its direct parent when that parent is a collab.
	function getProjectCollabChatId(chat) {
		if (chat.type === im_v2_const.ChatType.collab) {
			return chat.chatId;
		}
		if (!chat.parentChatId) {
			return null;
		}
		const parentChat = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](chat.parentChatId);
		if (!parentChat || parentChat.type !== im_v2_const.ChatType.collab) {
			return null;
		}
		return parentChat.chatId;
	}

	// Numeric collab entity id behind a collab chat, or null when it is missing/zero.
	// Shared store-access primitive so the collab and project labels below stay independent.
	function getCollabEntityId(chatId) {
		const collabInfo = im_v2_application_core.Core.getStore().getters['chats/collabs/getByChatId'](chatId);
		let entityId = collabInfo?.collabId ?? 0;
		if (entityId <= 0) {
			const collabChat = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](chatId);
			if (collabChat?.type === im_v2_const.ChatType.collab) {
				entityId = Number(collabChat.entityLink?.id) || 0;
			}
		}
		return entityId > 0 ? entityId : null;
	}

	// External contract consumed by the `call` module via the im.v2.lib.analytics facade.
	function getCollabId(chatId) {
		const collabEntityId = getCollabEntityId(chatId);
		if (!collabEntityId) {
			return null;
		}
		return `collabId_${collabEntityId}`;
	}

	// Project label for a chat located anywhere inside a collab subtree.
	function getProjectId(chat) {
		const collabChatId = getProjectCollabChatId(chat);
		if (!collabChatId) {
			return null;
		}
		return getProjectIdByChatId(collabChatId);
	}

	// Project label when only the root collab chatId is known (e.g. the project tab).
	function getProjectIdByChatId(chatId) {
		const collabEntityId = getCollabEntityId(chatId);
		if (!collabEntityId) {
			return null;
		}
		return `projectId_${collabEntityId}`;
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
			case PROJECT_CHAT_TYPE:
				return AnalyticsCategory.collab;
			default:
				return AnalyticsCategory.chat;
		}
	}
	function getCategoryByChat(chat) {
		const intrinsicCategory = getCategoryByChatType(chat.type);

		// Channel-like chats keep their intrinsic category even inside a project (chat-type priority).
		if (intrinsicCategory === AnalyticsCategory.channel) {
			return intrinsicCategory;
		}
		if (getProjectCollabChatId(chat) !== null) {
			return AnalyticsCategory.collab;
		}
		return intrinsicCategory;
	}

	function isAiAssistant(dialogId) {
		return im_v2_application_core.Core.getStore().getters['users/bots/isAiAssistant'](dialogId);
	}

	function isSelfChat(dialogId) {
		return im_v2_application_core.Core.getStore().getters['chats/isSelfChat'](dialogId);
	}

	const CUSTOM_CHAT_TYPE = 'custom';
	const AI_ASSISTANT_CHAT_TYPE = 'aiAssistant';
	function getChatType(chat) {
		if (isSelfChat(chat.dialogId)) {
			return PSEUDO_SELF_CHAT_TYPE;
		}
		if (isAiAssistant(chat.dialogId)) {
			return AI_ASSISTANT_CHAT_TYPE;
		}

		// The root CollabChat reports as a project (FIX-01); nested/derived chats keep their intrinsic type.
		if (chat.type === im_v2_const.ChatType.collab) {
			return PROJECT_CHAT_TYPE;
		}
		const chatTypeExists = Object.values(im_v2_const.ChatType).includes(chat.type);
		if (chatTypeExists) {
			return chat.type;
		}
		return CUSTOM_CHAT_TYPE;
	}

	const PROJECT_LAYOUT_NAME = 'project';
	function getLayoutName(layout) {
		// The projects section is named 'collab' inside the app; analytics reports it as a project.
		if (layout === im_v2_const.Layout.collab) {
			return PROJECT_LAYOUT_NAME;
		}
		return layout;
	}

	const AnalyticUserType = Object.freeze({
		userIntranet: 'user_intranet',
		userExtranet: 'user_extranet',
		userCollaber: 'user_collaber',
		userGuest: 'user_guest'
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
			case im_v2_const.UserType.guest:
				return AnalyticUserType.userGuest;
			default:
				return AnalyticUserType.userIntranet;
		}
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
		onOpenMiniChat() {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.copilot,
				event: AnalyticsEvent.openMiniChat
			});
		}
		onChatCreateClick() {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.copilot,
				event: AnalyticsEvent.clickCreateNew,
				type: AnalyticsType.copilot,
				c_section: AnalyticsSection.miniChat,
				p2: getUserType()
			});
		}
		onOpenChatAI(dialog, fromWidget = false) {
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			ui_analytics.sendData({
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.chatOperations,
				event: AnalyticsEvent.openChat,
				type: AI_ASSISTANT_CHAT_TYPE$1,
				c_section: fromWidget ? AnalyticsSection.miniChat : `${currentLayout}_tab`,
				p2: getUserType(),
				p3: `chatType_${getChatType(dialog)}`,
				p5: `chatId_${dialog.chatId}`
			});
		}
		onUseAudioInput(dialogId) {
			const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			if (!isAiAssistant(dialog.dialogId)) {
				return;
			}
			ui_analytics.sendData({
				event: AnalyticsEvent.audioUse,
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.chatOperations,
				c_section: `${currentLayout}_tab`,
				p3: AI_ASSISTANT_CHAT_TYPE$1,
				p5: `chatId_${dialog.chatId}`
			});
		}
		onMcpIntegrationClick() {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.chat,
				event: AnalyticsEvent.clickMcpIntegrations,
				c_section: AnalyticsSection.chatTextarea,
				p1: AI_ASSISTANT_CHAT_TYPE$1
			});
		}
	}

	class AttachMenu {
		onOpenUploadMenu(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.clickAttach,
				c_section: AnalyticsSection.chatTextarea,
				p1: `chatType_${chatType}`,
				p2: getUserType()
			};
			ui_analytics.sendData(params);
		}
	}

	// The panel of bulk actions over selected messages. It shares `click_create_ai_task` with the
	// message context menu (`MessageContextMenu.onCreateAiTask`) and differs from it by c_sub_section
	// alone, so the two entry points stay comparable row by row. The panel has no menu levels, so it
	// reports no c_element.
	class BulkActionsPanel {
		onCreateAiTask(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.clickCreateAiTask,
				c_section: AnalyticsSection.chatWindow,
				c_sub_section: AnalyticsSubSection.multiselectPanel,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType()
			});
		}
	}

	// The layout the user stands in named as the folder it shows: every system folder of the rail owns a
	// layout of its own, and the report reads all of them in the folder values. What is not a folder keeps
	// the historical `<layout>_tab` below - the plain chat list among them, since the "Chats" folder has no
	// value of the label table to move to.
	const SectionByLayout = {
		[im_v2_const.Layout.folderAll]: AnalyticsFolderType.all,
		[im_v2_const.Layout.folderAllSettings]: AnalyticsFolderType.all,
		[im_v2_const.Layout.folder]: AnalyticsFolderType.userFolder,
		[im_v2_const.Layout.taskComments]: AnalyticsFolderType.tasks,
		[im_v2_const.Layout.copilot]: AnalyticsFolderType.copilot,
		[im_v2_const.Layout.channel]: AnalyticsFolderType.channels,
		[im_v2_const.Layout.collab]: AnalyticsFolderType.projects,
		// Two layouts of one folder: the user sees "Lines" either way, and the report must not split them.
		[im_v2_const.Layout.openlines]: AnalyticsFolderType.lines,
		[im_v2_const.Layout.openlinesV2]: AnalyticsFolderType.lines,
		[im_v2_const.Layout.vibecodeApp]: AnalyticsFolderType.vibecodeApp
	};

	// Forms with no place of their own in the navigation (LayoutsWithRegularChatsList): on the left they
	// are handed the list of the section where plain chats live, so they name the folder that list belongs
	// to. Which list it is depends on the portal, and the answer must not name a folder the user has not
	// got. Notifications and a conference borrow the same list yet keep `<layout>_tab`: the decision was
	// taken about the forms alone and these two were never brought under it.
	const FormsWithRegularChatsList = new Set([im_v2_const.Layout.createChat, im_v2_const.Layout.updateChat, im_v2_const.Layout.createFolder, im_v2_const.Layout.updateFolder, im_v2_const.Layout.copyCollab]);

	// The rule belongs to `FolderManager.getRegularChatsLayout`, which resolves the very same folder before
	// handing the list to a form. It is asked of the store here instead of the manager because
	// `im.v2.lib.folder` imports this extension, and importing it back would close a cycle.
	function isAllFolderShown() {
		return Boolean(im_v2_application_core.Core.getStore().getters['recent/folders/getByCode'](im_v2_const.SystemFolderCode.all));
	}
	function getFolderSection(layoutName) {
		if (FormsWithRegularChatsList.has(layoutName)) {
			return isAllFolderShown() ? AnalyticsFolderType.all : `${layoutName}_tab`;
		}
		return SectionByLayout[layoutName] ?? `${layoutName}_tab`;
	}

	class ChatCreate {
		onStartClick(type) {
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			const resolvedType = type === im_v2_const.ChatType.collab ? PROJECT_CHAT_TYPE : type;
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: getCategoryByChatType(type),
				event: AnalyticsEvent.clickCreateNew,
				type: resolvedType,
				c_section: getFolderSection(currentLayout),
				p2: getUserType()
			});
		}
		onProjectEmptyStateCreateClick() {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: getCategoryByChatType(im_v2_const.ChatType.collab),
				event: AnalyticsEvent.clickCreateNew,
				type: PROJECT_CHAT_TYPE,
				c_section: CreateChatContext.projectEmptyState,
				p2: getUserType()
			});
		}
		onMenuCreateClick() {
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.openCreateMenu,
				c_section: getFolderSection(currentLayout)
			});
		}
	}

	class ChatDelete {
		onClick(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.clickDelete,
				type: chatType,
				c_section: AnalyticsSection.sidebar,
				c_sub_section: AnalyticsSubSection.contextMenu,
				p1: `chatType_${chatType}`
			};
			ui_analytics.sendData(params);
		}
		onCancel(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.cancelDelete,
				type: chatType,
				c_section: AnalyticsSection.popup,
				p1: `chatType_${chatType}`
			};
			ui_analytics.sendData(params);
		}
		onConfirm(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.delete,
				type: chatType,
				c_section: AnalyticsSection.popup,
				p1: `chatType_${chatType}`,
				p5: `chatId_${chat.chatId}`
			};
			if (params.category === AnalyticsCategory.collab) {
				const projectId = getProjectId(chat);
				if (projectId) {
					params.p4 = projectId;
				}
			}
			ui_analytics.sendData(params);
		}
		onChatDeletedNotification(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const category = getCategoryByChat(chat);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.chatPopup,
				event: AnalyticsEvent.view,
				type: `deleted_${category}`,
				c_section: AnalyticsSection.activeChat,
				p1: `chatType_${getChatType(chat)}`
			});
		}
	}

	class ChatEdit {
		onOpenForm(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.clickEdit,
				c_section: AnalyticsSection.sidebar,
				c_sub_section: AnalyticsSubSection.contextMenu,
				p1: `chatType_${getChatType(chat)}`,
				p5: `chatId_${chat.chatId}`
			};
			if (params.category === AnalyticsCategory.collab) {
				const projectId = getProjectId(chat);
				if (projectId) {
					params.p4 = projectId;
				}
			}
			ui_analytics.sendData(params);
		}
		onSubmitForm(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				c_section: AnalyticsSection.editor,
				event: AnalyticsEvent.submitEdit,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType(),
				p5: `chatId_${chat.chatId}`
			};
			if (params.category === AnalyticsCategory.collab) {
				const projectId = getProjectId(chat);
				if (projectId) {
					params.p4 = projectId;
				}
			}
			ui_analytics.sendData(params);
		}
	}

	class ChatEntities {
		onCreateTaskFromSidebarClick(dialogId) {
			this.#onClick({
				dialogId,
				event: AnalyticsEvent.clickCreateTask,
				section: AnalyticsSection.chatSidebar
			});
		}
		onCreateTaskFromTextareaClick(dialogId) {
			this.#onClick({
				dialogId,
				event: AnalyticsEvent.clickCreateTask,
				section: AnalyticsSection.chatTextarea
			});
		}
		onCreateEventFromSidebarClick(dialogId) {
			this.#onClick({
				dialogId,
				event: AnalyticsEvent.clickCreateEvent,
				section: AnalyticsSection.chatSidebar
			});
		}
		onCreateEventFromTextareaClick(dialogId) {
			this.#onClick({
				dialogId,
				event: AnalyticsEvent.clickCreateEvent,
				section: AnalyticsSection.chatTextarea
			});
		}
		onCreateVoteFromTextareaClick(dialogId) {
			this.#onClick({
				dialogId,
				event: AnalyticsEvent.clickCreatePoll,
				section: AnalyticsSection.chatTextarea,
				includeChatLabels: true
			});
		}

		// includeChatLabels adds where the click happened - p4 projectId_ and p5 chatId_. Only
		// click_create_poll still reports them; click_create_task / click_create_event report
		// neither, at any entry point.
		#onClick({
			dialogId,
			event,
			section,
			includeChatLabels = false
		}) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event,
				c_section: section,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType()
			};
			if (includeChatLabels) {
				params.p5 = `chatId_${chat.chatId}`;
				const projectId = params.category === AnalyticsCategory.collab ? getProjectId(chat) : null;
				if (projectId) {
					params.p4 = projectId;
				}
			}
			ui_analytics.sendData(params);
		}
	}

	class ChatInviteLink {
		onCopySharedLink(dialogId) {
			ui_analytics.sendData(this.#buildAnalyticsData(dialogId, AnalyticsSubSection.sharedLink));
		}
		onCopySharedLinkCompactMenu(dialogId) {
			ui_analytics.sendData(this.#buildAnalyticsData(dialogId, AnalyticsSubSection.sharedLinkCompactMenu));
		}
		onCopySharedLinkMenu(dialogId) {
			ui_analytics.sendData(this.#buildAnalyticsData(dialogId, AnalyticsSubSection.sharedLinkMenu));
		}
		onCopyMembersPanel(dialogId) {
			ui_analytics.sendData(this.#buildAnalyticsData(dialogId, AnalyticsSubSection.membersPanel));
		}
		onCopyContextMenu(dialogId) {
			ui_analytics.sendData(this.#buildAnalyticsData(dialogId, AnalyticsSubSection.contextMenu));
		}
		#buildAnalyticsData(dialogId, subSection) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.copyChatLink,
				c_section: AnalyticsSection.sidebar,
				c_sub_section: subSection,
				p1: `chatType_${getChatType(chat)}`
			};
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
				category: getCategoryByChat(chat),
				event,
				c_section: AnalyticsSection.chatHeader,
				p2: getUserType(),
				p5: `chatId_${chat.chatId}`
			};
			if (params.category === AnalyticsCategory.collab) {
				const projectId = getProjectId(chat);
				if (projectId) {
					params.p4 = projectId;
				}
			}
			ui_analytics.sendData(params);
		}
	}

	const convertToReadableValue = value => value ? 'on' : 'off';
	function getCopilotContext(dialogId, suggestsCount = null) {
		const store = im_v2_application_core.Core.getStore();
		const mcpAuth = store.getters['copilot/chats/getMcpAuth'](dialogId);
		const isMcpEnabled = Boolean(mcpAuth);
		const role = store.getters['copilot/chats/getRole'](dialogId);
		const context = {
			mcp: convertToReadableValue(isMcpEnabled),
			reasoning: convertToReadableValue(store.getters['copilot/chats/isReasoningEnabled'](dialogId)),
			webSearch: convertToReadableValue(store.getters['copilot/chats/isForceSearchEnabled'](dialogId)),
			agentMode: convertToReadableValue(store.getters['copilot/chats/isAgentModeEnabled'](dialogId)),
			role: role ? role.code : ''
		};
		if (isMcpEnabled) {
			context.mcpServer = mcpAuth.name;
		}
		if (suggestsCount !== null) {
			context.suggestsCount = suggestsCount;
		}
		return JSON.stringify(context);
	}

	const CopilotEntryPoint = Object.freeze({
		create_menu: 'create_menu',
		role_picker: 'role_picker'
	});
	class Copilot {
		#isBitrixGptV2Available = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
		#shownSuggestsMessageIds = new Set();
		onCreateChat(dialogId) {
			if (!main_core.Type.isStringFilled(dialogId)) {
				return;
			}
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			this.#sendCreateChatData({
				dialogId,
				context: `${currentLayout}_tab`
			});
		}
		onCreateChatFromWidget(dialogId) {
			if (!main_core.Type.isStringFilled(dialogId)) {
				return;
			}
			this.#sendCreateChatData({
				dialogId,
				context: AnalyticsSection.miniChat
			});
		}
		onCreateDefaultChatInRecent() {
			this.#sendDataForCopilotCreation({
				c_sub_section: CopilotEntryPoint.create_menu
			});
		}
		onSelectRoleInRecent() {
			this.#sendDataForCopilotCreation({
				c_sub_section: CopilotEntryPoint.role_picker
			});
		}
		onOpenChat(dialogId) {
			const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const copilotChatType = dialog.userCounter <= 2 ? CopilotChatType.private : CopilotChatType.multiuser;
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			ui_analytics.sendData({
				event: AnalyticsEvent.openChat,
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.chatOperations,
				c_section: `${currentLayout}_tab`,
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
			const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const isCopilot = dialog.type === im_v2_const.ChatType.copilot;
			if (!isCopilot) {
				return;
			}
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			const role = im_v2_application_core.Core.getStore().getters['copilot/chats/getRole'](dialogId);
			const aiModel = im_v2_application_core.Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
			const aiModelName = aiModel.name ?? aiModel;
			const copilotChatType = dialog.userCounter <= 2 ? CopilotChatType.private : CopilotChatType.multiuser;
			const params = {
				event: AnalyticsEvent.audioUse,
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.chatOperations,
				c_section: `${currentLayout}_tab`,
				p3: copilotChatType,
				p4: `role_${main_core.Text.toCamelCase(role.code)}`,
				p5: `chatId_${dialog.chatId}`
			};
			if (!this.#isBitrixGptV2Available) {
				params.p2 = `provider_${aiModelName}`;
			}
			ui_analytics.sendData(params);
		}
		onToggleReasoning(dialogId) {
			const isReasoningEnabled = im_v2_application_core.Core.getStore().getters['copilot/chats/isReasoningEnabled'](dialogId);
			const event = isReasoningEnabled ? AnalyticsEvent.modeOn : AnalyticsEvent.modeOff;
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			const role = im_v2_application_core.Core.getStore().getters['copilot/chats/getRole'](dialogId);
			const aiModel = im_v2_application_core.Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
			const aiModelName = aiModel.name ?? aiModel;
			const params = {
				event,
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.copilot,
				type: AnalyticsType.think,
				c_section: `${currentLayout}_tab`,
				p1: getChatType(chat),
				p4: `role_${main_core.Text.toCamelCase(role.code)}`,
				p5: `chatId_${chat.chatId}`
			};
			if (!this.#isBitrixGptV2Available) {
				params.p2 = `provider_${aiModelName}`;
			}
			ui_analytics.sendData(params);
		}
		onShowSuggestedPrompts(dialogId, messageId, suggestsCount) {
			if (!this.#isBitrixGptV2Available) {
				return;
			}
			if (this.#shownSuggestsMessageIds.has(messageId)) {
				return;
			}
			this.#shownSuggestsMessageIds.add(messageId);
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const params = {
				event: AnalyticsEvent.suggestsShow,
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.chatOperations,
				p4: getCopilotContext(dialogId, suggestsCount),
				p5: `chatId_${chat.chatId}`,
				...this.#getModuleSection()
			};
			ui_analytics.sendData(params);
		}
		onClickSuggestedPrompt(dialogId, suggestsCount) {
			if (!this.#isBitrixGptV2Available) {
				return;
			}
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const params = {
				event: AnalyticsEvent.suggestsClick,
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.chatOperations,
				p4: getCopilotContext(dialogId, suggestsCount),
				p5: `chatId_${chat.chatId}`,
				...this.#getModuleSection()
			};
			ui_analytics.sendData(params);
		}
		onChangeForceSearch(dialogId) {
			if (!this.#isBitrixGptV2Available) {
				return;
			}
			const isEnabled = im_v2_application_core.Core.getStore().getters['copilot/chats/isForceSearchEnabled'](dialogId);
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const params = {
				event: AnalyticsEvent.modeChange,
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.chatOperations,
				p1: isEnabled ? 'webSearch_on' : 'webSearch_off',
				p4: getCopilotContext(dialogId),
				p5: `chatId_${chat.chatId}`,
				...this.#getModuleSection()
			};
			ui_analytics.sendData(params);
		}
		onChangeMCP(dialogId) {
			if (!this.#isBitrixGptV2Available) {
				return;
			}
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const mcpAuth = im_v2_application_core.Core.getStore().getters['copilot/chats/getMcpAuth'](dialogId);
			const isEnabled = Boolean(mcpAuth);
			const params = {
				event: AnalyticsEvent.modeChange,
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.chatOperations,
				p1: isEnabled ? 'mcp_on' : 'mcp_off',
				p4: getCopilotContext(dialogId),
				p5: `chatId_${chat.chatId}`,
				...this.#getModuleSection()
			};
			ui_analytics.sendData(params);
		}
		onChangeReasoning(dialogId) {
			if (!this.#isBitrixGptV2Available) {
				return;
			}
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const isEnabled = im_v2_application_core.Core.getStore().getters['copilot/chats/isReasoningEnabled'](dialogId);
			const params = {
				event: AnalyticsEvent.modeChange,
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.chatOperations,
				p1: isEnabled ? 'reasoning_on' : 'reasoning_off',
				p4: getCopilotContext(dialogId),
				p5: `chatId_${chat.chatId}`,
				...this.#getModuleSection()
			};
			ui_analytics.sendData(params);
		}
		onChangeAgentMode(dialogId) {
			if (!this.#isBitrixGptV2Available) {
				return;
			}
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const isEnabled = im_v2_application_core.Core.getStore().getters['copilot/chats/isAgentModeEnabled'](dialogId);
			const params = {
				event: AnalyticsEvent.modeChange,
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.chatOperations,
				p1: isEnabled ? 'agentMode_on' : 'agentMode_off',
				p4: getCopilotContext(dialogId),
				p5: `chatId_${chat.chatId}`,
				...this.#getModuleSection()
			};
			ui_analytics.sendData(params);
		}
		onMcpIntegrationClick(dialogId) {
			const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			if (!dialog) {
				return;
			}
			const chatType = getChatType(dialog);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.copilot,
				event: AnalyticsEvent.clickMcpIntegrations,
				c_section: AnalyticsSection.chatTextarea,
				p1: `chatType_${chatType}`
			});
		}
		onClickStopGeneration(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			if (!chat) {
				return;
			}
			const generationState = im_v2_application_core.Core.getStore().getters['copilot/chats/getGenerationState'](dialogId);
			if (generationState?.initiatorId !== im_v2_application_core.Core.getUserId()) {
				return;
			}
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.clickStopGeneration,
				c_section: AnalyticsSection.chatTextarea,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType()
			});
		}
		#getModuleSection() {
			const module = ui_pageContext.PageContext.getModule();
			return module ? {
				c_section: module
			} : {};
		}
		#sendCreateChatData({
			dialogId,
			context
		}) {
			// Under BitrixGPT v2 the backend emits create_new_chat for every client, so sending it
			// here too would count the same chat twice in web scenarios.
			if (this.#isBitrixGptV2Available) {
				return;
			}
			const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			ui_analytics.sendData({
				event: AnalyticsEvent.createNewChat,
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.chatOperations,
				c_section: context,
				type: AnalyticsType.ai,
				p3: CopilotChatType.private,
				p5: `chatId_${dialog.chatId}`
			});
		}
		#sendDataForCopilotCreation(params) {
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			ui_analytics.sendData({
				event: AnalyticsEvent.clickCreateNew,
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.copilot,
				c_section: getFolderSection(currentLayout),
				type: AnalyticsType.copilot,
				...params
			});
		}
	}

	class DesktopMode {
		onBannerShow() {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.viewPopup,
				type: AnalyticsType.selectAppMode
			});
		}
		onBannerOneWindowEnable() {
			ui_analytics.sendData(this.#buildModeEnableData(AnalyticsType.oneWindow, AnalyticsSection.popup));
		}
		onBannerTwoWindowEnable() {
			ui_analytics.sendData(this.#buildModeEnableData(AnalyticsType.twoWindow, AnalyticsSection.popup));
		}
		onSettingsOneWindowEnable() {
			ui_analytics.sendData(this.#buildModeEnableData(AnalyticsType.oneWindow, AnalyticsSection.settings));
		}
		onSettingsTwoWindowEnable() {
			ui_analytics.sendData(this.#buildModeEnableData(AnalyticsType.twoWindow, AnalyticsSection.settings));
		}
		#buildModeEnableData(type, section) {
			return {
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.selectAppMode,
				type,
				c_section: section
			};
		}
	}

	// The table of labels has no value for "All" and "Chats", so they are simply left out of the map: a
	// system folder with no row of its own gets no type, and the sender drops the event.
	const FolderTypeByCode = {
		[im_v2_const.SystemFolderCode.tasksTask]: AnalyticsFolderType.tasks,
		[im_v2_const.SystemFolderCode.openChannel]: AnalyticsFolderType.channels,
		[im_v2_const.SystemFolderCode.collab]: AnalyticsFolderType.projects,
		[im_v2_const.SystemFolderCode.copilot]: AnalyticsFolderType.copilot,
		[im_v2_const.SystemFolderCode.openlines]: AnalyticsFolderType.lines
	};
	function getFolderType(folder) {
		if (folder.type === im_v2_const.FolderType.personal) {
			return AnalyticsFolderType.userFolder;
		}
		return FolderTypeByCode[folder.code] ?? null;
	}

	class Folder {
		#sendData;
		constructor(sendDataHandler = ui_analytics.sendData) {
			this.#sendData = sendDataHandler;
		}
		onClickCreateFolder(section) {
			const params = {
				event: AnalyticsEvent.clickCreateFolder,
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.folders
			};
			if (main_core.Type.isStringFilled(section)) {
				params.c_section = section;
			}
			this.#sendData(params);
		}
		onClickEdit({
			folderId,
			subSection
		}) {
			const params = {
				event: AnalyticsEvent.clickEdit,
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.folders,
				type: this.#getCompositionType(folderId)
			};
			if (main_core.Type.isStringFilled(subSection)) {
				params.c_sub_section = subSection;
			}
			this.#sendData(params);
		}
		onClickDelete({
			folderId,
			subSection
		}) {
			this.#sendData({
				event: AnalyticsEvent.clickDelete,
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.folders,
				type: this.#getEmptinessType(folderId),
				c_sub_section: subSection
			});
		}
		onOpenList(subSection) {
			const params = {
				event: AnalyticsEvent.openList,
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.folders
			};
			if (main_core.Type.isStringFilled(subSection)) {
				params.c_sub_section = subSection;
			}
			this.#sendData(params);
		}

		// A folder with no type of its own sends nothing at all: the rule lives here rather than in the
		// caller, so every future entry point into the event gets it for free.
		onOpenFolder(folder) {
			const type = getFolderType(folder);
			if (!main_core.Type.isStringFilled(type)) {
				return;
			}
			this.#sendData({
				event: AnalyticsEvent.openFolder,
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.folders,
				type
			});
		}
		onAddToFolder(params) {
			this.#sendChatMembershipEvent(AnalyticsEvent.addToFolder, params);
		}
		onDeleteFromFolder(params) {
			this.#sendChatMembershipEvent(AnalyticsEvent.deleteFromFolder, params);
		}

		// Both halves of one membership change answer the same question - which chat moved and where the
		// user was - so they share the payload. The surface is left out where the label table has no value
		// for it: the composition form of a folder is one, and a lost slot is better than an invented value.
		#sendChatMembershipEvent(event, {
			dialogId,
			subSection
		}) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const params = {
				event,
				tool: AnalyticsTool.im,
				category: getCategoryByChatType(chat.type),
				c_section: this.#getSection(),
				p1: `chatType_${getChatType(chat)}`
			};
			if (main_core.Type.isStringFilled(subSection)) {
				params.c_sub_section = subSection;
			}
			this.#sendData(params);
		}
		onChatLimitException() {
			this.#sendData({
				event: AnalyticsEvent.chatLimitException,
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.folders
			});
		}
		onFolderLimitException() {
			this.#sendData({
				event: AnalyticsEvent.folderLimitException,
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.folders
			});
		}

		// the composite folder is the "All" folder, every other folder of these menus is a personal one
		#getCompositionType(folderId) {
			const isComposite = im_v2_application_core.Core.getStore().getters['recent/folders/isComposite'](folderId);
			return isComposite ? AnalyticsFolderType.all : AnalyticsFolderType.userFolder;
		}
		#getEmptinessType(folderId) {
			const folder = im_v2_application_core.Core.getStore().getters['recent/folders/getById'](folderId);
			return main_core.Type.isArrayFilled(folder?.definition?.chats) ? AnalyticsType.nonEmpty : AnalyticsType.empty;
		}
		#getSection() {
			const layoutName = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
			return getFolderSection(layoutName);
		}
	}

	class FormatToolbar {
		onCodeClick(dialogId) {
			this.#sendData(dialogId, AnalyticsType.formatCode);
		}
		onLinkClick(dialogId) {
			this.#sendData(dialogId, AnalyticsType.formatLink);
		}
		onStrikethroughClick(dialogId) {
			this.#sendData(dialogId, AnalyticsType.formatStrikethrough);
		}
		onUnderlineClick(dialogId) {
			this.#sendData(dialogId, AnalyticsType.formatUnderline);
		}
		onItalicClick(dialogId) {
			this.#sendData(dialogId, AnalyticsType.formatItalic);
		}
		onBoldClick(dialogId) {
			this.#sendData(dialogId, AnalyticsType.formatBold);
		}
		#sendData(dialogId, type) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.useFormatToolbar,
				p1: `chatType_${chatType}`,
				type
			};
			ui_analytics.sendData(params);
		}
	}

	class HistoryLimit {
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
				c_element: this.#getSidebarPanelNameForAnalytics(panel),
				p1: `chatType_${chatType}`
			};
			ui_analytics.sendData(params);
		}
		onDialogBannerClick({
			dialogId
		}) {
			const section = AnalyticsSection.chatWindow;
			this.#onBannerClick({
				dialogId,
				section
			});
		}
		onSidebarBannerClick({
			dialogId,
			panel
		}) {
			const section = AnalyticsSection.sidebar;
			const element = this.#getSidebarPanelNameForAnalytics(panel);
			this.#onBannerClick({
				dialogId,
				section,
				element
			});
		}
		onGoToContextLimitExceeded({
			dialogId
		}) {
			const section = AnalyticsSection.messageLink;
			this.#onBannerClick({
				dialogId,
				section
			});
		}
		#onBannerClick({
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
		#getSidebarPanelNameForAnalytics(panel) {
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
	}

	class Mention {
		onClickAddToChat(dialogId) {
			this.#sendAddUserData(dialogId, AnalyticsSection.mentionPopup);
		}
		onClickAddToChatFromPopup(dialogId) {
			this.#sendAddUserData(dialogId, AnalyticsSection.textareaMentionPopup);
		}
		#sendAddUserData(dialogId, section) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.addUser,
				c_section: section,
				p1: `chatType_${chatType}`
			};
			if (params.category === AnalyticsCategory.collab) {
				const projectId = getProjectId(chat);
				if (projectId) {
					params.p4 = projectId;
				}
			}
			ui_analytics.sendData(params);
		}
	}

	class Guest {
		onShowGuestNamePopup(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.viewJoinPopup,
				p1: `chatType_${chatType}`
			});
		}
		onCopyGuestInviteLink(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.copyGuestLink,
				p1: `chatType_${chatType}`
			});
		}
	}

	const ForwardTabByRecentType = {
		[im_v2_const.RecentType.default]: AnalyticsForwardTab.chats,
		[im_v2_const.RecentType.taskComments]: AnalyticsForwardTab.tasks,
		[im_v2_const.RecentType.collab]: AnalyticsForwardTab.projects,
		[im_v2_const.RecentType.openChannel]: AnalyticsForwardTab.channels,
		[im_v2_const.RecentType.copilot]: AnalyticsForwardTab.copilot
	};
	function getForwardTab(section) {
		return ForwardTabByRecentType[section] ?? AnalyticsForwardTab.all;
	}

	const SelectRecipientSource = Object.freeze({
		searchResult: 'search_result',
		selfChat: 'notes'
	});
	class MessageForward {
		#hasSearchedBefore = false;
		#sendData;
		constructor(sendDataFunction = ui_analytics.sendData) {
			this.#sendData = sendDataFunction;
		}
		onClickForward(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.clickShare,
				c_section: AnalyticsSection.chatWindow,
				c_sub_section: AnalyticsSubSection.contextMenu,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType()
			};
			this.#sendData(params);
		}
		onStartSearch({
			dialogId,
			section
		}) {
			if (this.#hasSearchedBefore) {
				return;
			}
			this.#hasSearchedBefore = true;
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.startSearch,
				c_section: AnalyticsSection.forward,
				c_sub_section: getForwardTab(section),
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType()
			};
			this.#sendData(params);
		}
		onSelectRecipientFromRecent({
			dialogId,
			position,
			section
		}) {
			this.#onSelectRecipient({
				dialogId,
				position,
				source: getForwardTab(section)
			});
		}
		onSelectRecipientFromSearchResult({
			dialogId,
			position
		}) {
			this.#onSelectRecipient({
				dialogId,
				position,
				source: SelectRecipientSource.searchResult
			});
		}
		onClosePopup() {
			this.#hasSearchedBefore = false;
		}
		onOperationResult(params) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](params.dialogId);
			let status = 'success';
			if (params.unsuccessfulCount === params.recipientCount) {
				status = 'error';
			} else if (params.unsuccessfulCount > 0) {
				status = 'partial';
			}
			this.#sendData({
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.forwardResult,
				type: params.isRetry ? 'retry' : 'initial',
				status,
				c_section: AnalyticsSection.forward,
				c_element: params.limitReached ? 'limit_reached' : 'limit_not_reached',
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType(),
				p3: `recipients_${params.recipientCount}`,
				p4: `unsuccessful_${params.unsuccessfulCount}`,
				p5: `reasons_${[...new Set(params.reasonGroups)].sort().join(',') || 'none'}`
			});
		}
		#onSelectRecipient({
			dialogId,
			position,
			source
		}) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const type = isSelfChat(dialogId) ? SelectRecipientSource.selfChat : source;
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.selectRecipient,
				type,
				c_section: AnalyticsSection.forward,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType(),
				p3: `position_${position}`
			};
			this.#sendData(params);
		}
	}

	class MessagePins {
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
				category: getCategoryByChat(chat),
				p1: `chatType_${getChatType(chat)}`,
				...this.#getEventSpecificParams(eventParams.event, chat.chatId),
				...eventParams
			};
			ui_analytics.sendData(params);
		}
		#getEventSpecificParams(event, chatId) {
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
	class MessageContextMenu {
		messageForward = new MessageForward();
		messagePins = new MessagePins();
		#isBitrixGptV2Available = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
		onSendFeedback(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const role = im_v2_application_core.Core.getStore().getters['copilot/chats/getRole'](dialogId);
			const aiModel = im_v2_application_core.Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
			const aiModelName = aiModel.name ?? aiModel;
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			const isMiniChat = im_v2_application_core.Core.getStore().getters['copilot/isChatOpenedInWidget'](dialogId);
			const cSectionValue = isMiniChat ? AnalyticsSection.miniChat : getFolderSection(currentLayout);
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.addFeedback,
				c_section: cSectionValue,
				...this.#getBaseParams(dialogId)
			};
			if (!this.#isBitrixGptV2Available) {
				params.p2 = `provider_${aiModelName}`;
			}
			if (params.category !== AnalyticsCategory.collab && !this.#isBitrixGptV2Available) {
				params.p4 = `role_${main_core.Text.toCamelCase(role.code)}`;
			}
			ui_analytics.sendData(params);
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
				...this.#getBaseParams(dialogId)
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
				...this.#getBaseParams(dialogId)
			});
		}
		onFileDownload({
			messageId,
			dialogId
		}) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.downloadFile,
				type: this.#getAnalyticsFileType(messageId),
				c_section: AnalyticsSection.chatWindow,
				p2: getUserType(),
				p3: this.#getFilesAmountParam(messageId),
				p5: `chatId_${chat.chatId}`,
				...this.#getBaseParams(dialogId)
			};
			if (params.category === AnalyticsCategory.collab) {
				const projectId = getProjectId(chat);
				if (projectId) {
					params.p4 = projectId;
				}
			}
			ui_analytics.sendData(params);
		}
		onSaveOnDisk({
			messageId,
			dialogId
		}) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.saveToDisk,
				type: this.#getAnalyticsFileType(messageId),
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.more,
				p2: getUserType(),
				p3: this.#getFilesAmountParam(messageId),
				p5: `chatId_${chat.chatId}`,
				...this.#getBaseParams(dialogId)
			};
			if (params.category === AnalyticsCategory.collab) {
				const projectId = getProjectId(chat);
				if (projectId) {
					params.p4 = projectId;
				}
			}
			ui_analytics.sendData(params);
		}
		onCopyLink(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.copyLink,
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.more,
				...this.#getBaseParams(dialogId)
			};
			ui_analytics.sendData(params);
		}
		onCopyFile({
			dialogId,
			fileId
		}) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const file = im_v2_application_core.Core.getStore().getters['files/get'](fileId);
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.copyFile,
				type: file.type,
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.more,
				...this.#getBaseParams(dialogId)
			};
			ui_analytics.sendData(params);
		}
		onEdit(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.clickEdit,
				c_section: AnalyticsSection.chatWindow,
				...this.#getBaseParams(dialogId)
			};
			ui_analytics.sendData(params);
		}
		onCreateTask(dialogId, {
			isInNestedMenu = false
		} = {}) {
			this.#sendTaskCreationEvent(dialogId, AnalyticsEvent.clickCreateTask, isInNestedMenu);
		}
		onCreateAiTask(dialogId, {
			isInNestedMenu = false
		} = {}) {
			this.#sendTaskCreationEvent(dialogId, AnalyticsEvent.clickCreateAiTask, isInNestedMenu);
		}
		#sendTaskCreationEvent(dialogId, event, isInNestedMenu) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const params = {
				category: getCategoryByChat(chat),
				event,
				c_section: AnalyticsSection.chatWindow,
				p2: getUserType(),
				...this.#getBaseParams(dialogId)
			};
			if (isInNestedMenu) {
				params.c_element = AnalyticsElement.more;
			}
			ui_analytics.sendData(params);
		}
		onSelect(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.select,
				c_section: AnalyticsSection.chatWindow,
				...this.#getBaseParams(dialogId)
			};
			ui_analytics.sendData(params);
		}
		onMark(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.seeLater,
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.more,
				...this.#getBaseParams(dialogId)
			};
			ui_analytics.sendData(params);
		}
		onReply(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.clickReply,
				c_section: AnalyticsSection.chatWindow,
				...this.#getBaseParams(dialogId)
			};
			ui_analytics.sendData(params);
		}
		onAddFavorite({
			dialogId,
			messageId
		}) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
			const type = new im_v2_lib_messageComponent.MessageComponentManager(message).getName();
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.addToFav,
				type,
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.more,
				...this.#getBaseParams(dialogId)
			};
			ui_analytics.sendData(params);
		}
		onCreateEvent(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.clickCreateEvent,
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.more,
				p2: getUserType(),
				...this.#getBaseParams(dialogId)
			};
			ui_analytics.sendData(params);
		}
		onCopyText({
			dialogId,
			messageId
		}) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
			const type = new im_v2_lib_messageComponent.MessageComponentManager(message).getName();
			if (chat.type === im_v2_const.ChatType.copilot) {
				this.#onCopyTextCopilot({
					dialogId,
					messageId
				});
				return;
			}
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.copyMessage,
				type,
				c_section: AnalyticsSection.chatWindow,
				...this.#getBaseParams(dialogId)
			};
			ui_analytics.sendData(params);
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
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.askCopilot,
				c_section: AnalyticsSection.chatWindow,
				...this.#getBaseParams(dialogId)
			};
			ui_analytics.sendData(params);
		}
		#onCopyTextCopilot({
			dialogId,
			messageId
		}) {
			const aiModel = im_v2_application_core.Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
			const role = im_v2_application_core.Core.getStore().getters['copilot/chats/getRole'](dialogId);
			const type = new im_v2_lib_messageComponent.MessageComponentManager(message).getName();
			const aiModelName = aiModel.name ?? aiModel;
			const isMiniChat = im_v2_application_core.Core.getStore().getters['copilot/isChatOpenedInWidget'](dialogId);
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			const cSectionValue = isMiniChat ? AnalyticsSection.miniChat : getFolderSection(currentLayout);
			const params = {
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.copyMessage,
				type,
				c_section: cSectionValue,
				p5: `chatId_${chat.chatId}`,
				...this.#getBaseParams(dialogId)
			};
			if (!this.#isBitrixGptV2Available) {
				params.p2 = `provider_${aiModelName}`;
			}
			if (params.category !== AnalyticsCategory.collab && !this.#isBitrixGptV2Available) {
				params.p4 = `role_${main_core.Text.toCamelCase(role.code)}`;
			}
			ui_analytics.sendData(params);
		}
		#getFilesAmountParam(messageId) {
			const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
			if (message.files.length === 1) {
				return AnalyticsAmountFilesType.single;
			}
			return AnalyticsAmountFilesType.many;
		}
		#getAnalyticsFileType(messageId) {
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
		#getBaseParams(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			return {
				tool: AnalyticsTool.im,
				c_sub_section: AnalyticsSubSection.contextMenu,
				p1: `chatType_${getChatType(chat)}`
			};
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
				p1: `chatType_${getChatType(chat)}`
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

	const MS_IN_DAY = 24 * 60 * 60 * 1000;
	const toLocalMidnight = date => {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	};

	/**
	 * A 'YYYY-MM-DD' key names a day of the user's own calendar, so it is read into the local midnight
	 * of that day: new Date(key) would read the same string as UTC midnight and name the previous day
	 * west of Greenwich. The shared reader of the key lives in im.v2.provider.service.date-navigation
	 * and is not taken from there on purpose: this lib is loaded by every surface of the messenger and
	 * would then depend on the service of a single feature.
	 */
	function parseCalendarDay(day) {
		const [year, month, date] = day.split('-').map(part => Number.parseInt(part, 10));
		return new Date(year, month - 1, date);
	}

	/**
	 * Full days between the day of `date` and the day of `today`, counted in the user's own calendar:
	 * both ends are reduced to local midnight, so a jump made a minute before midnight counts the same
	 * as one made at noon of the same day, and rounding absorbs the 23/25-hour days of a DST switch.
	 * An unusable date gives null - the caller drops its label instead of sending `daysCnt_NaN`.
	 */
	function getDaysFromToday(date, today = new Date()) {
		if (!main_core.Type.isDate(date) || Number.isNaN(date.getTime())) {
			return null;
		}
		return Math.round((toLocalMidnight(today).getTime() - toLocalMidnight(date).getTime()) / MS_IN_DAY);
	}

	class MessageSearch {
		onOpenSearchPanel(dialogId) {
			const chatType = this.#getChatType(dialogId);
			const params = {
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				event: AnalyticsEvent.openSearch,
				c_section: AnalyticsSection.chatSidebar,
				p1: `chatType_${chatType}`
			};
			ui_analytics.sendData(params);
		}
		onStartSearch(dialogId) {
			const chatType = this.#getChatType(dialogId);
			const params = {
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				event: AnalyticsEvent.startSearch,
				c_section: AnalyticsSection.chatSidebar,
				p1: `chatType_${chatType}`
			};
			ui_analytics.sendData(params);
		}
		onGetSearchResult(dialogId, searchResult) {
			const chatType = this.#getChatType(dialogId);
			const status = searchResult.length > 0 ? AnalyticsStatus.success : AnalyticsStatus.notFound;
			const params = {
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				event: AnalyticsEvent.searchResult,
				c_section: AnalyticsSection.chatSidebar,
				status,
				p1: `chatType_${chatType}`
			};
			ui_analytics.sendData(params);
		}
		onSearchResultClick(dialogId, messageDate) {
			const chatType = this.#getChatType(dialogId);
			const params = {
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				event: AnalyticsEvent.selectSearchResult,
				c_section: AnalyticsSection.chatSidebar,
				p1: `chatType_${chatType}`
			};
			const daysFromToday = getDaysFromToday(messageDate);
			if (daysFromToday !== null) {
				params.p2 = `daysCnt_${daysFromToday}`;
			}
			ui_analytics.sendData(params);
		}

		/**
		 * Counts the attempts of the jump, not the hits: the panel reports the pick before it asks the
		 * server for a message of that day, so a jump that ends in an error is counted too. The section
		 * of this event is the entry it was started from, not the panel that hosts the calendar.
		 */
		onGoToDate(params) {
			const {
				dialogId,
				entryPoint,
				day
			} = params;
			const chatType = this.#getChatType(dialogId);
			const eventParams = {
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				event: AnalyticsEvent.goToDate,
				c_section: entryPoint,
				type: chatType,
				p1: `chatType_${chatType}`
			};
			const daysFromToday = getDaysFromToday(parseCalendarDay(day));
			if (daysFromToday !== null) {
				eventParams.p2 = `daysCnt_${daysFromToday}`;
			}
			ui_analytics.sendData(eventParams);
		}
		#getChatCategory(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return getCategoryByChat(chat);
		}
		#getChatType(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return getChatType(chat);
		}
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

	class Player {
		onViewTranscription(fileId, status) {
			const file = im_v2_application_core.Core.getStore().getters['files/get'](fileId);
			const chatType = this.#getTypeByChatId(file.chatId);
			const category = this.#getCategoryByFileType(file);
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
			const chatType = this.#getTypeByChatId(file.chatId);
			const category = this.#getCategoryByFileType(file);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category,
				event: AnalyticsEvent.play,
				p1: `chatType_${chatType}`
			});
		}
		onPause(fileId) {
			const file = im_v2_application_core.Core.getStore().getters['files/get'](fileId);
			const chatType = this.#getTypeByChatId(file.chatId);
			const category = this.#getCategoryByFileType(file);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category,
				event: AnalyticsEvent.pause,
				p1: `chatType_${chatType}`
			});
		}
		onChangeRate(chatId, rate) {
			const chatType = this.#getTypeByChatId(chatId);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.audioMessage,
				event: AnalyticsEvent.changeSpeed,
				p1: `chatType_${chatType}`,
				p2: `speed_${rate}`
			});
		}
		#getTypeByChatId(chatId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](chatId);
			return getChatType(chat);
		}
		#getCategoryByFileType(file) {
			if (file.isVideoNote) {
				return AnalyticsCategory.videoMessage;
			}
			return AnalyticsCategory.audioMessage;
		}
	}

	class ProjectTab {
		onSelectSection(section) {
			this.#sendData(AnalyticsEvent.useChatFilter, {
				type: section,
				p2: getUserType()
			});
		}
		onCreateTaskClick() {
			this.#sendData(AnalyticsEvent.clickCreateTask, {
				p2: getUserType()
			});
		}
		onCreateEventClick() {
			this.#sendData(AnalyticsEvent.clickCreateEvent, {
				p2: getUserType()
			});
		}
		onCreateChatClick(chatType = im_v2_const.ChatType.chat) {
			this.#sendData(AnalyticsEvent.clickCreateNew, {
				type: chatType,
				p2: getUserType()
			});
		}
		#sendData(event, extraParams) {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.collab,
				event,
				c_section: AnalyticsSection.projectTab,
				...extraParams
			});
		}
	}

	class RecentContextMenu {
		onUnread(dialogId) {
			const params = {
				event: AnalyticsEvent.seeLater,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				c_section: this.#getSection(),
				c_sub_section: AnalyticsSubSection.recentContextMenu,
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onPin(dialogId) {
			const params = {
				event: AnalyticsEvent.pinChat,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				c_section: this.#getSection(),
				c_sub_section: AnalyticsSubSection.recentContextMenu,
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onUnpin(dialogId) {
			const params = {
				event: AnalyticsEvent.unpinChat,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				c_section: this.#getSection(),
				c_sub_section: AnalyticsSubSection.recentContextMenu,
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onOpenProfile(dialogId) {
			const params = {
				event: AnalyticsEvent.openProfile,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				c_section: this.#getSection(),
				c_sub_section: AnalyticsSubSection.recentContextMenu,
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onFindChatsWithUser(dialogId) {
			const params = {
				event: AnalyticsEvent.findCommonChats,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				c_section: this.#getSection(),
				c_sub_section: AnalyticsSubSection.recentContextMenu,
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onMute(dialogId) {
			const params = {
				event: AnalyticsEvent.mute,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				c_section: this.#getSection(),
				c_sub_section: AnalyticsSubSection.recentContextMenu,
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onUnmute(dialogId) {
			const params = {
				event: AnalyticsEvent.unmute,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				c_section: this.#getSection(),
				c_sub_section: AnalyticsSubSection.recentContextMenu,
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onHide(dialogId) {
			const params = {
				event: AnalyticsEvent.hideChat,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				c_section: this.#getSection(),
				c_sub_section: AnalyticsSubSection.recentContextMenu,
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onRead(dialogId) {
			const params = {
				event: AnalyticsEvent.readAll,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				c_section: this.#getSection(),
				c_sub_section: AnalyticsSubSection.recentContextMenu,
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onLeave(dialogId) {
			const params = {
				event: AnalyticsEvent.leave,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				c_section: this.#getSection(),
				c_sub_section: AnalyticsSubSection.recentContextMenu,
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			this.#appendProjectId(params, dialogId);
			ui_analytics.sendData(params);
		}
		#getChatCategory(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return getCategoryByChat(chat);
		}
		#appendProjectId(params, dialogId) {
			if (params.category !== AnalyticsCategory.collab) {
				return;
			}
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const projectId = getProjectId(chat);
			if (projectId) {
				params.p4 = projectId;
			}
		}
		#getChatType(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return getChatType(chat);
		}
		#getLayout() {
			return getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
		}
		#getSection() {
			return getFolderSection(this.#getLayout());
		}
	}

	class RecentHeaderMenu {
		onOpenUnreadMode(section = null) {
			this.#sendListData(im_v2_const.ChatType.chat, AnalyticsEvent.openUnreadMode, section);
		}
		onReadAllChats(section = null) {
			this.#sendListData(im_v2_const.ChatType.chat, AnalyticsEvent.readAllChats, section);
		}
		onOpenTasksUnreadMode(section = null) {
			this.#sendListData(im_v2_const.ChatType.tasks, AnalyticsEvent.openUnreadMode, section);
		}
		onReadAllTaskChats(section = null) {
			this.#sendListData(im_v2_const.ChatType.tasks, AnalyticsEvent.readAllChats, section);
		}
		onOpenVibecodeAppUnreadMode(section = null) {
			this.#sendListData(im_v2_const.ChatType.vibecodeApp, AnalyticsEvent.openUnreadMode, section);
		}
		onReadAllVibecodeAppChats(section = null) {
			this.#sendListData(im_v2_const.ChatType.vibecodeApp, AnalyticsEvent.readAllChats, section);
		}
		onOpenProjectUnreadMode() {
			this.#sendSectionData(AnalyticsEvent.openUnreadMode, AnalyticsSection.project);
		}
		onReadAllProjectChats() {
			this.#sendSectionData(AnalyticsEvent.readAllChats, AnalyticsSection.project);
		}
		onOpenProjectTabUnreadMode(section = null) {
			this.#sendSectionData(AnalyticsEvent.openUnreadMode, section ?? AnalyticsSection.projectTab);
		}
		onReadAllProjectTabChats(section = null) {
			this.#sendSectionData(AnalyticsEvent.readAllChats, section ?? AnalyticsSection.projectTab);
		}
		#sendListData(type, event, section = null) {
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			this.#sendData({
				type,
				c_section: section ?? getFolderSection(currentLayout),
				event
			});
		}
		#sendSectionData(event, section) {
			this.#sendData({
				c_section: section,
				event
			});
		}
		#sendData(params) {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				...params
			});
		}
	}

	class RecentSearch {
		#hasSearchedBefore = {};
		onStart(layoutName, parentChatId = 0) {
			const surface = this.#getSurfaceKey(layoutName, parentChatId);
			if (this.#hasSearchedBefore[surface]) {
				return;
			}
			this.#hasSearchedBefore[surface] = true;
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.startSearch,
				c_section: this.#getSection(layoutName, parentChatId)
			});
		}
		onOpen(layoutName, parentChatId = 0) {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.openSearch,
				c_section: this.#getSection(layoutName, parentChatId)
			});
		}
		onClose(layoutName, parentChatId = 0) {
			this.#hasSearchedBefore[this.#getSurfaceKey(layoutName, parentChatId)] = false;
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.closeSearch,
				c_section: this.#getSection(layoutName, parentChatId)
			});
		}
		onSelectFromSearchResult(layoutName, position, parentChatId = 0) {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.selectSearchResult,
				c_section: this.#getSection(layoutName, parentChatId),
				p3: `position_${position}`
			});
		}
		onSelectFromRecentSearch(layoutName, dialogId, parentChatId = 0) {
			this.#onSelectFromRecent(layoutName, dialogId, AnalyticsSubSection.recentSearch, parentChatId);
		}
		onSelectFromRecentChats(layoutName, dialogId, parentChatId = 0) {
			this.#onSelectFromRecent(layoutName, dialogId, AnalyticsSubSection.recentChats, parentChatId);
		}
		onShowSuccessResult(layoutName, parentChatId = 0) {
			this.#onShowResult(layoutName, AnalyticsStatus.success, parentChatId);
		}
		onShowNotFoundResult(layoutName, parentChatId = 0) {
			this.#onShowResult(layoutName, AnalyticsStatus.notFound, parentChatId);
		}
		#onShowResult(layoutName, status, parentChatId) {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.searchResult,
				c_section: this.#getSection(layoutName, parentChatId),
				status
			});
		}
		#onSelectFromRecent(layoutName, dialogId, subSection, parentChatId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.selectSearchRecent,
				c_section: this.#getSection(layoutName, parentChatId),
				c_sub_section: subSection,
				p1: `chatType_${getChatType(chat)}`
			});
		}

		// A parent chat is only supplied by the nested list of a single project, so it - and not the
		// layout - is what separates a search inside a project from the tab listing all of them. The
		// nested list is a drawer over the root list and does not change the layout: opening a chat
		// inside a project switches the layout to `chat` while the search stays project-scoped.
		#getSection(layoutName, parentChatId) {
			if (parentChatId > 0) {
				return AnalyticsSection.project;
			}
			return getFolderSection(layoutName);
		}

		// start_search fires once per search surface, and the projects tab and a project's own list
		// share a layout - so the guard is keyed by both parts the section is built from.
		#getSurfaceKey(layoutName, parentChatId) {
			return `${layoutName}:${parentChatId}`;
		}
	}

	class Settings {
		onOpenHotkeySection() {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.openSettings,
				type: AnalyticsType.hotkeys,
				c_section: AnalyticsSection.settings
			});
		}
		onOpenFromFolderMenu() {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.openSettings,
				c_section: AnalyticsSection.folderMenu
			});
		}
	}

	class SliderInvite {
		getEmptyStateContext() {
			return AnalyticsSection.chatEmptyState;
		}
		getRecentCreateMenuContext() {
			return AnalyticsSection.chatCreateMenu;
		}
	}

	class Stickers {
		onOpenEmoteSelector(dialogId) {
			const params = {
				event: AnalyticsEvent.openEmoteSelector,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onOpenStickerTab(dialogId) {
			const params = {
				event: AnalyticsEvent.openStickerTab,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onViewPromoPopup(dialogId) {
			const params = {
				event: AnalyticsEvent.viewStickerPopup,
				type: AnalyticsType.stickers,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onShowCreateForm(dialogId) {
			const params = {
				event: AnalyticsEvent.clickCreateStickerPack,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		onLinkPackFromPopup(dialogId) {
			const params = {
				event: AnalyticsEvent.addStickerPack,
				c_section: AnalyticsSection.stickerPackPopup,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		#getChatCategory(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return getCategoryByChat(chat);
		}
		#getChatType(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return getChatType(chat);
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

	class TaskComments {
		#sendData;
		constructor(sendDataHandler = ui_analytics.sendData) {
			this.#sendData = sendDataHandler;
		}
		onOpenCard(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			this.#sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.chat,
				event: AnalyticsEvent.openTaskCard,
				c_section: AnalyticsSection.taskCommentsLayout,
				c_sub_section: AnalyticsSubSection.chatHeader,
				c_element: AnalyticsElement.taskButton,
				p1: `chatType_${chatType}`
			});
		}
		onOpenCardFromMessage(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			this.#sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.chat,
				event: AnalyticsEvent.openTaskCard,
				c_section: AnalyticsSection.taskCommentsLayout,
				c_sub_section: AnalyticsSubSection.message,
				p1: `chatType_${chatType}`
			});
		}
		onOpenSideCard(taskId) {
			this.#sendSideCardEvent(taskId, AnalyticsEvent.openSideCard, AnalyticsElement.openButton);
		}
		onCloseSideCard(taskId) {
			this.#sendSideCardEvent(taskId, AnalyticsEvent.closeSideCard, AnalyticsElement.closeButton);
		}
		#sendSideCardEvent(taskId, event, element) {
			this.#sendData({
				tool: AnalyticsTool.tasks,
				category: AnalyticsCategory.taskOperations,
				event,
				type: AnalyticsType.chatTask,
				c_section: AnalyticsSection.chatTasks,
				c_sub_section: AnalyticsSubSection.chatTaskCard,
				c_element: element,
				status: Number.isInteger(taskId) && taskId > 0 ? AnalyticsStatus.success : AnalyticsStatus.error,
				p1: `taskId_${taskId}`
			});
		}
	}

	const SelectUserSource = Object.freeze({
		recent: 'recent',
		searchResult: 'search_result'
	});
	class UserAdd {
		#hasSearchedBefore = false;
		onChatSidebarClick(dialogId) {
			this.#onAddUserClick(dialogId, AnalyticsSection.chatSidebar);
		}
		onChatHeaderClick(dialogId) {
			this.#onAddUserClick(dialogId, AnalyticsSection.chatHeader);
		}
		onStartSearch({
			dialogId
		}) {
			if (this.#hasSearchedBefore) {
				return;
			}
			this.#hasSearchedBefore = true;
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.startSearch,
				c_section: AnalyticsSection.userAdd,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType()
			};
			ui_analytics.sendData(params);
		}
		onClosePopup() {
			this.#hasSearchedBefore = false;
		}
		onSelectUserFromRecent({
			dialogId,
			position
		}) {
			this.#onSelectUser({
				dialogId,
				position,
				source: SelectUserSource.recent
			});
		}
		onSelectUserFromSearchResult({
			dialogId,
			position
		}) {
			this.#onSelectUser({
				dialogId,
				position,
				source: SelectUserSource.searchResult
			});
		}
		#onSelectUser({
			dialogId,
			position,
			source
		}) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.selectUser,
				type: source,
				c_section: AnalyticsSection.userAdd,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType(),
				p3: `position_${position}`
			};
			ui_analytics.sendData(params);
		}
		#onAddUserClick(dialogId, element) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			const params = {
				tool: AnalyticsTool.im,
				category: getCategoryByChat(chat),
				event: AnalyticsEvent.clickAddUser,
				c_section: element,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType(),
				p5: `chatId_${chat.chatId}`
			};
			if (params.category === AnalyticsCategory.collab) {
				const projectId = getProjectId(chat);
				if (projectId) {
					params.p4 = projectId;
				}
			}
			ui_analytics.sendData(params);
		}
	}

	/**
	 * The recording of a voice message. A record that reached the chat is counted once, and the mode it
	 * was made in travels with it: the locked recording is the gesture the mobile application has not.
	 */
	class VoiceRecorder {
		#sendData;
		constructor(sendDataHandler = ui_analytics.sendData) {
			this.#sendData = sendDataHandler;
		}
		onRecordSent({
			dialogId,
			durationSeconds,
			isLocked
		}) {
			this.#sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.audioMessage,
				event: AnalyticsEvent.record,
				type: isLocked ? AnalyticsType.lockedRecord : AnalyticsType.quickRecord,
				p1: `chatType_${this.#getChatType(dialogId)}`,
				p3: `recordLength_${durationSeconds}`
			});
		}

		// a chat the store does not hold answers with a blank one instead of throwing: counting an event
		// must not be able to break the recording it is counting
		#getChatType(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			return getChatType(chat);
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
				category: getCategoryByChat(chat),
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType(),
				p5: `chatId_${chat.chatId}`
			};
			if (chatType === im_v2_const.ChatType.comment) {
				const parentChat = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](chat.parentChatId);
				if (!parentChat) {
					return options;
				}
				options.p1 = `chatType_${parentChat.type}`;
				options.p4 = `parentChatId_${chat.parentChatId}`;
			}
			if (options.category === AnalyticsCategory.collab) {
				const projectId = getProjectId(chat);
				if (projectId) {
					options.p4 = projectId;
				}
			}
			return options;
		}
	}

	class BitrixGptAgentPromo {
		onPopupView() {
			this.#sendData(AnalyticsEvent.bitrixGptAgentPromoView);
		}
		onButtonClick() {
			this.#sendData(AnalyticsEvent.bitrixGptAgentPromoButtonClick);
		}
		onPopupClose() {
			this.#sendData(AnalyticsEvent.bitrixGptAgentPromoClose);
		}
		#sendData(event) {
			ui_analytics.sendData({
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.popups,
				type: AnalyticsType.ahaSpringRelease2026,
				c_section: AnalyticsSection.im,
				event
			});
		}
	}

	// Tabs of the navigation menu that became tiles of the folder bar once the folders feature was turned
	// on (`MenuItemProvider::getDefaultMenuItems()` hides the menu items there). While it is off they are
	// still tabs and still report. `notification` and `settings` stay menu items either way.
	const FolderSectionTabs = [im_v2_const.Layout.copilot, im_v2_const.Layout.collab, im_v2_const.Layout.channel, im_v2_const.Layout.openlines, im_v2_const.Layout.taskComments];
	const TrackedTabs = [...FolderSectionTabs, im_v2_const.Layout.notification, im_v2_const.Layout.settings];
	class Analytics {
		#excludedChats = new Set();
		#chatsWithTyping = new Set();
		#currentTab = im_v2_const.Layout.chat;
		chatCreate = new ChatCreate();
		chatEdit = new ChatEdit();
		chatDelete = new ChatDelete();
		messageDelete = new MessageDelete();
		historyLimit = new HistoryLimit();
		userAdd = new UserAdd();
		collabEntities = new CollabEntities();
		chatEntities = new ChatEntities();
		supervisor = new Supervisor();
		checkIn = new CheckIn();
		copilot = new Copilot();
		attachMenu = new AttachMenu();
		vote = new Vote();
		messagePins = new MessagePins();
		messageForward = new MessageForward();
		messageContextMenu = new MessageContextMenu();
		bulkActionsPanel = new BulkActionsPanel();
		sliderInvite = new SliderInvite();
		desktopMode = new DesktopMode();
		chatInviteLink = new ChatInviteLink();
		aiAssistant = new AiAssistant();
		player = new Player();
		voiceRecorder = new VoiceRecorder();
		projectTab = new ProjectTab();
		notification = new Notification();
		stickers = new Stickers();
		messageSearch = new MessageSearch();
		recentContextMenu = new RecentContextMenu();
		formatToolbar = new FormatToolbar();
		recentSearch = new RecentSearch();
		mention = new Mention();
		taskComments = new TaskComments();
		recentHeaderMenu = new RecentHeaderMenu();
		guest = new Guest();
		bitrixGptAgentPromo = new BitrixGptAgentPromo();
		folder = new Folder();
		settings = new Settings();
		#isBitrixGptV2Available = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
		static #instance;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		ignoreNextChatOpen(dialogId) {
			if (!main_core.Type.isStringFilled(dialogId)) {
				return;
			}
			this.#excludedChats.add(dialogId);
		}
		onOpenTab(tabName) {
			if (this.#currentTab === tabName) {
				return;
			}

			// The folder bar reports this section with an open_folder of its own, and open_tab is the event
			// of the tab navigation that bar replaced: sending both would count one move twice. The visit of
			// the previous tab still ends here, so a later return to it is a move of its own and reports.
			if (this.#isFolderSection(tabName)) {
				this.#currentTab = null;
				return;
			}

			// An untracked section ends the current tab just as well: keeping the previous name here would
			// drop the next return to that tab as a repeat.
			this.#currentTab = tabName;
			if (!TrackedTabs.includes(tabName)) {
				return;
			}
			ui_analytics.sendData({
				event: AnalyticsEvent.openTab,
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				type: getLayoutName(tabName),
				p2: getUserType()
			});
		}

		// Asked of the feature and not of im.v2.lib.folder: that extension already imports this one, and
		// the answer here needs nothing but the flag and the list above.
		#isFolderSection(tabName) {
			return FolderSectionTabs.includes(tabName) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatFoldersWebAvailable);
		}
		onOpenChat(dialog) {
			if (this.#excludedChats.has(dialog.dialogId)) {
				this.#excludedChats.delete(dialog.dialogId);
				return;
			}
			this.#chatsWithTyping.delete(dialog.dialogId);
			const chatType = getChatType(dialog);
			if (chatType === im_v2_const.ChatType.copilot) {
				this.copilot.onOpenChat(dialog.dialogId);
			}
			if (isAiAssistant(dialog.dialogId)) {
				this.aiAssistant.onOpenChatAI(dialog);
			}
			const currentLayout = getLayoutName(im_v2_application_core.Core.getStore().getters['application/getLayout'].name);
			const isMember = dialog.role === im_v2_const.UserRole.guest ? 'N' : 'Y';
			const isProjectChat = getCategoryByChat(dialog) === AnalyticsCategory.collab;
			const params = {
				tool: AnalyticsTool.im,
				category: isProjectChat ? AnalyticsCategory.collab : getCategoryByChatType(chatType),
				event: AnalyticsEvent.openExisting,
				type: chatType,
				c_section: getFolderSection(currentLayout),
				p2: getUserType()
			};
			if (!isSelfChat(dialog.dialogId)) {
				params.p5 = `chatId_${dialog.chatId}`;
			}
			if (chatType === im_v2_const.ChatType.comment) {
				const parentChat = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](dialog.parentChatId);
				if (!parentChat) {
					return;
				}
				params.p1 = `chatType_${parentChat.type}`;
				params.p4 = `parentChatId_${dialog.parentChatId}`;
			}
			if (isProjectChat) {
				const projectId = getProjectId(dialog);
				if (projectId) {
					params.p4 = projectId;
				}
			}
			if (chatType !== im_v2_const.ChatType.copilot) {
				params.p3 = `isMember_${isMember}`;
			}
			if (chatType === im_v2_const.ChatType.copilot && !this.#isBitrixGptV2Available && !isProjectChat) {
				const role = im_v2_application_core.Core.getStore().getters['copilot/chats/getRole'](dialog.dialogId);
				params.p4 = `role_${main_core.Text.toCamelCase(role.code)}`;
			}
			ui_analytics.sendData(params);
		}
		onTypeMessage(dialog) {
			if (!dialog.inited) {
				return;
			}
			if (!isSelfChat(dialog.dialogId) || this.#chatsWithTyping.has(dialog.dialogId)) {
				return;
			}
			this.#chatsWithTyping.add(dialog.dialogId);
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

	exports.Analytics = Analytics;
	exports.AnalyticsSection = AnalyticsSection;
	exports.AnalyticsSubSection = AnalyticsSubSection;
	exports.CreateChatContext = CreateChatContext;
	exports.DateNavigationEntryPoint = DateNavigationEntryPoint;
	exports.getCollabId = getCollabId;
	exports.getCopilotContext = getCopilotContext;
	exports.getUserType = getUserType;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.UI.Analytics, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.UI.PageContext, BX.Messenger.v2.Lib);
//# sourceMappingURL=analytics.bundle.js.map
