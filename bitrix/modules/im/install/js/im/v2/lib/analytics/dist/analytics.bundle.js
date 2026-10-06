/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, ui_analytics, im_v2_application_core, im_v2_const, im_v2_lib_feature, ui_pageContext, im_v2_lib_messageComponent) {
	'use strict';

	const PSEUDO_SELF_CHAT_TYPE = 'notes';
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
		selectSearchRecent: 'click_recent_suggest',
		openTaskCard: 'open_task_description',
		addUser: 'add_mentioned_user',
		openUnreadMode: 'show_unread',
		readAllChats: 'read_all',
		viewJoinPopup: 'view_join_popup',
		copyGuestLink: 'copy_guest_link',
		openMiniChat: 'open_mini_chat',
		bitrixGptAgentPromoView: 'banner_view',
		bitrixGptAgentPromoButtonClick: 'button_click',
		bitrixGptAgentPromoClose: 'banner_close',
		suggestsShow: 'suggests_show',
		suggestsClick: 'suggests_click',
		modeChange: 'mode_change'
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
		notificationOperations: 'notif_ops',
		banners: 'banners'
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
		ahaSpringRelease2026: 'ahaspringrelease2026'
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
		notificationLayout: 'notification_tab',
		mentionPopup: 'mention_popup',
		im: 'im'
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
		sharedLinkCompactMenu: 'link_menu'
	});
	const AnalyticsElement = Object.freeze({
		initialBanner: 'initial_banner',
		videocall: 'videocall',
		audiocall: 'audiocall',
		startButton: 'start_button',
		more: 'more',
		taskButton: 'task_button'
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
		const chatTypeExists = Object.values(im_v2_const.ChatType).includes(chat.type);
		if (chatTypeExists) {
			return chat.type;
		}
		return CUSTOM_CHAT_TYPE;
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
			const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
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
			const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
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

	function getCollabId(chatId) {
		const collabInfo = im_v2_application_core.Core.getStore().getters['chats/collabs/getByChatId'](chatId);
		if (!collabInfo) {
			return null;
		}
		return `collabId_${collabInfo.collabId}`;
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
				section: AnalyticsSection.chatTextarea
			});
		}
		#onClick({
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
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.copyChatLink,
				c_section: AnalyticsSection.sidebar,
				c_sub_section: subSection,
				p1: `chatType_${chat.type}`
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
			const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
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
			const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
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
			const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
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
			const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
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
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: getCategoryByChatType(chatType),
				event: AnalyticsEvent.useFormatToolbar,
				p1: `chatType_${chatType}`,
				type
			});
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
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.chat,
				event: AnalyticsEvent.addUser,
				c_section: AnalyticsSection.mentionPopup,
				p1: `chatType_${chatType}`
			});
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

	const SelectRecipientSource = Object.freeze({
		recent: 'recent',
		searchResult: 'search_result',
		selfChat: 'notes'
	});
	class MessageForward {
		#hasSearchedBefore = false;
		onClickForward(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.clickShare,
				c_section: AnalyticsSection.chatWindow,
				c_sub_section: AnalyticsSubSection.contextMenu,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType()
			});
		}
		onStartSearch({
			dialogId
		}) {
			if (this.#hasSearchedBefore) {
				return;
			}
			this.#hasSearchedBefore = true;
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.startSearch,
				c_section: AnalyticsSection.forward,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType()
			});
		}
		onSelectRecipientFromRecent({
			dialogId,
			position
		}) {
			this.#onSelectRecipient({
				dialogId,
				position,
				source: SelectRecipientSource.recent
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
		#onSelectRecipient({
			dialogId,
			position,
			source
		}) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const type = isSelfChat(dialogId) ? SelectRecipientSource.selfChat : source;
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.selectRecipient,
				type,
				c_section: AnalyticsSection.forward,
				p1: `chatType_${getChatType(chat)}`,
				p2: getUserType(),
				p3: `position_${position}`
			});
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
				category: getCategoryByChatType(chat.type),
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
			const role = im_v2_application_core.Core.getStore().getters['copilot/chats/getRole'](dialogId);
			const aiModel = im_v2_application_core.Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
			const aiModelName = aiModel.name ?? aiModel;
			const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
			const isMiniChat = im_v2_application_core.Core.getStore().getters['copilot/isChatOpenedInWidget'](dialogId);
			const cSectionValue = isMiniChat ? AnalyticsSection.miniChat : `${currentLayout}_tab`;
			const params = {
				category: AnalyticsCategory.copilot,
				event: AnalyticsEvent.addFeedback,
				c_section: cSectionValue,
				...this.#getBaseParams(dialogId)
			};
			if (!this.#isBitrixGptV2Available) {
				params.p2 = `provider_${aiModelName}`;
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
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.downloadFile,
				type: this.#getAnalyticsFileType(messageId),
				c_section: AnalyticsSection.chatWindow,
				p2: getUserType(),
				p3: this.#getFilesAmountParam(messageId),
				p5: `chatId_${chat.chatId}`,
				...this.#getBaseParams(dialogId)
			};
			if (chat.type === im_v2_const.ChatType.collab) {
				params.p4 = getCollabId(chat.chatId);
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
				type: this.#getAnalyticsFileType(messageId),
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.more,
				p2: getUserType(),
				p3: this.#getFilesAmountParam(messageId),
				p5: `chatId_${chat.chatId}`,
				...this.#getBaseParams(dialogId)
			};
			if (chat.type === im_v2_const.ChatType.collab) {
				params.p4 = getCollabId(chat.chatId);
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
				...this.#getBaseParams(dialogId)
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
				...this.#getBaseParams(dialogId)
			});
		}
		onEdit(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			ui_analytics.sendData({
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.clickEdit,
				c_section: AnalyticsSection.chatWindow,
				...this.#getBaseParams(dialogId)
			});
		}
		onCreateTask(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			ui_analytics.sendData({
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.clickCreateTask,
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.more,
				...this.#getBaseParams(dialogId)
			});
		}
		onSelect(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			ui_analytics.sendData({
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.select,
				c_section: AnalyticsSection.chatWindow,
				...this.#getBaseParams(dialogId)
			});
		}
		onMark(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			ui_analytics.sendData({
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.seeLater,
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.more,
				...this.#getBaseParams(dialogId)
			});
		}
		onReply(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			ui_analytics.sendData({
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.clickReply,
				c_section: AnalyticsSection.chatWindow,
				...this.#getBaseParams(dialogId)
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
				...this.#getBaseParams(dialogId)
			});
		}
		onCreateEvent(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			ui_analytics.sendData({
				category: getCategoryByChatType(chat.type),
				event: AnalyticsEvent.clickCreateEvent,
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.more,
				...this.#getBaseParams(dialogId)
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
				this.#onCopyTextCopilot({
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
				...this.#getBaseParams(dialogId)
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
				...this.#getBaseParams(dialogId)
			});
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
			const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
			const cSectionValue = isMiniChat ? AnalyticsSection.miniChat : `${currentLayout}_tab`;
			const params = {
				category: AnalyticsCategory.copilot,
				event: AnalyticsEvent.copyMessage,
				type,
				c_section: cSectionValue,
				p5: `chatId_${chat.chatId}`,
				...this.#getBaseParams(dialogId)
			};
			if (!this.#isBitrixGptV2Available) {
				params.p2 = `provider_${aiModelName}`;
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
		onSearchResultClick(dialogId) {
			const chatType = this.#getChatType(dialogId);
			const params = {
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				event: AnalyticsEvent.selectSearchResult,
				c_section: AnalyticsSection.chatSidebar,
				p1: `chatType_${chatType}`
			};
			ui_analytics.sendData(params);
		}
		#getChatCategory(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return getCategoryByChatType(chat.type);
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

	class RecentContextMenu {
		onUnread(dialogId) {
			const params = {
				event: AnalyticsEvent.seeLater,
				tool: AnalyticsTool.im,
				category: this.#getChatCategory(dialogId),
				c_section: `${this.#getLayout()}_tab`,
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
				c_section: `${this.#getLayout()}_tab`,
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
				c_section: `${this.#getLayout()}_tab`,
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
				c_section: `${this.#getLayout()}_tab`,
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
				c_section: `${this.#getLayout()}_tab`,
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
				c_section: `${this.#getLayout()}_tab`,
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
				c_section: `${this.#getLayout()}_tab`,
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
				c_section: `${this.#getLayout()}_tab`,
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
				c_section: `${this.#getLayout()}_tab`,
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
				c_section: `${this.#getLayout()}_tab`,
				c_sub_section: AnalyticsSubSection.recentContextMenu,
				p1: `chatType_${this.#getChatType(dialogId)}`
			};
			ui_analytics.sendData(params);
		}
		#getChatCategory(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return getCategoryByChatType(chat.type);
		}
		#getChatType(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return getChatType(chat);
		}
		#getLayout() {
			return im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
		}
	}

	class RecentHeaderMenu {
		onOpenUnreadMode() {
			this.#sendData(im_v2_const.ChatType.chat, AnalyticsEvent.openUnreadMode);
		}
		onReadAllChats() {
			this.#sendData(im_v2_const.ChatType.chat, AnalyticsEvent.readAllChats);
		}
		onOpenTasksUnreadMode() {
			this.#sendData(im_v2_const.ChatType.tasks, AnalyticsEvent.openUnreadMode);
		}
		onReadAllTaskChats() {
			this.#sendData(im_v2_const.ChatType.tasks, AnalyticsEvent.readAllChats);
		}
		#sendData(type, event) {
			const currentLayout = im_v2_application_core.Core.getStore().getters['application/getLayout'].name;
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				type,
				c_section: `${currentLayout}_tab`,
				event
			});
		}
	}

	const SectionByLayoutName = {
		[im_v2_const.Layout.chat]: AnalyticsSection.chatLayout,
		[im_v2_const.Layout.notification]: AnalyticsSection.notificationLayout,
		[im_v2_const.Layout.taskComments]: AnalyticsSection.taskCommentsLayout
	};
	class RecentSearch {
		#hasSearchedBefore = {};
		onStart(layoutName) {
			if (this.#hasSearchedBefore[layoutName]) {
				return;
			}
			this.#hasSearchedBefore[layoutName] = true;
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
			this.#hasSearchedBefore[layoutName] = false;
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
			this.#onSelectFromRecent(layoutName, dialogId, AnalyticsSubSection.recentSearch);
		}
		onSelectFromRecentChats(layoutName, dialogId) {
			this.#onSelectFromRecent(layoutName, dialogId, AnalyticsSubSection.recentChats);
		}
		onShowSuccessResult(layoutName) {
			this.#onShowResult(layoutName, AnalyticsStatus.success);
		}
		onShowNotFoundResult(layoutName) {
			this.#onShowResult(layoutName, AnalyticsStatus.notFound);
		}
		#onShowResult(layoutName, status) {
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.searchResult,
				c_section: SectionByLayoutName[layoutName],
				status
			});
		}
		#onSelectFromRecent(layoutName, dialogId, subSection) {
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
			return getCategoryByChatType(chat.type);
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
		onOpenCard(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			const chatType = getChatType(chat);
			ui_analytics.sendData({
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
			ui_analytics.sendData({
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.chat,
				event: AnalyticsEvent.openTaskCard,
				c_section: AnalyticsSection.taskCommentsLayout,
				c_sub_section: AnalyticsSubSection.message,
				p1: `chatType_${chatType}`
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
		#onAddUserClick(dialogId, element) {
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

	class BitrixGptAgentPromo {
		onBannerView() {
			this.#sendData(AnalyticsEvent.bitrixGptAgentPromoView);
		}
		onButtonClick() {
			this.#sendData(AnalyticsEvent.bitrixGptAgentPromoButtonClick);
		}
		onBannerClose() {
			this.#sendData(AnalyticsEvent.bitrixGptAgentPromoClose);
		}
		#sendData(event) {
			ui_analytics.sendData({
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.banners,
				type: AnalyticsType.ahaSpringRelease2026,
				c_section: AnalyticsSection.im,
				event
			});
		}
	}

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
		sliderInvite = new SliderInvite();
		desktopMode = new DesktopMode();
		chatInviteLink = new ChatInviteLink();
		aiAssistant = new AiAssistant();
		player = new Player();
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
			const trackedTabs = [im_v2_const.Layout.copilot, im_v2_const.Layout.collab, im_v2_const.Layout.channel, im_v2_const.Layout.notification, im_v2_const.Layout.settings, im_v2_const.Layout.openlines, im_v2_const.Layout.taskComments];
			if (!trackedTabs.includes(tabName)) {
				return;
			}
			if (this.#currentTab === tabName) {
				return;
			}
			this.#currentTab = tabName;
			ui_analytics.sendData({
				event: AnalyticsEvent.openTab,
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				type: tabName,
				p2: getUserType()
			});
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
			if (!isSelfChat(dialog.dialogId)) {
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
			if (chatType === im_v2_const.ChatType.copilot && !this.#isBitrixGptV2Available) {
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
	exports.CreateChatContext = CreateChatContext;
	exports.getCollabId = getCollabId;
	exports.getCopilotContext = getCopilotContext;
	exports.getUserType = getUserType;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.UI.Analytics, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.UI.PageContext, BX.Messenger.v2.Lib);
//# sourceMappingURL=analytics.bundle.js.map
