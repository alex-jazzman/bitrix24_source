export const CopilotChatType = Object.freeze({
	private: 'chatType_private',
	multiuser: 'chatType_multiuser',
});

export const AnalyticsEvent = Object.freeze({
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
	submitEdit: 'submit_edit',
});

export const AnalyticsTool = Object.freeze({
	ai: 'ai',
	checkin: 'checkin',
	im: 'im',
	infoHelper: 'InfoHelper',
});

export const AnalyticsCategory = Object.freeze({
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
});

export const AnalyticsType = Object.freeze({
	ai: 'ai',
	chat: 'chat',
	channel: 'channel',
	videoconf: 'videoconf',
	copilot: 'copilot',
	limitOfficeChatingHistory: 'limit_office_chating_history',
});

export const AnalyticsSection = Object.freeze({
	copilotTab: 'copilot_tab',
	chat: 'chat',
	chatStart: 'chat_start',
	chatHistory: 'chat_history',
	sidebar: 'sidebar',
	chatWindow: 'chat_window',
	messageLink: 'message_link',
});

export const AnalyticsStatus = Object.freeze({
	success: 'success',
	errorTurnedOff: 'error_turnedoff',
});

export const AnalyticsSubSection = Object.freeze({
	contextMenu: 'context_menu',
});
