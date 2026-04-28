/**
 * @module im/messenger/const
 */
jn.define('im/messenger/const', (require, exports, module) => {
	const { AiAssistantButtonType } = require('im/messenger/const/ai-assistant-button');
	const { AiTasksStatusType } = require('im/messenger/const/ai-task');
	const { AppStatus } = require('im/messenger/const/app-status');
	const {
		AttachType,
		AttachDescription,
		AttachGridItemDisplay,
		AttachColorToken,
	} = require('im/messenger/const/attach');
	const { AttachPickerId } = require('im/messenger/const/attach-picker');
	const {
		CacheNamespace,
		CacheName,
	} = require('im/messenger/const/cache');
	const {
		RawBotType,
		BotType,
		BotCode,
		BotCommand,
	} = require('im/messenger/const/bot');
	const {
		BackgroundUI,
	} = require('im/messenger/const/background-ui');
	const { ConnectionStatus } = require('im/messenger/const/connection-status');
	const { EventType } = require('im/messenger/const/event-type');
	const { EventFilterType } = require('im/messenger/const/event-filter');
	const {
		RestMethod,
	} = require('im/messenger/const/rest');
	const {
		ChatTypes,
		RecentTab,
		MessageStatus,
		SubTitleIconType,
	} = require('im/messenger/const/recent');
	const {
		UserType,
		UserExternalType,
		UserRole,
		UserColor,
	} = require('im/messenger/const/user');
	const {
		MessageType,
		MessageIdType,
		OwnMessageStatus,
		MessageParams,
		MessageComponent,
	} = require('im/messenger/const/message');
	const { ReactionType } = require('im/messenger/const/reaction-type');
	const { UserInputAction } = require('im/messenger/const/dialog-status');
	const { DialogBackgroundId } = require('im/messenger/const/dialog-background');
	const { DialogActionType } = require('im/messenger/const/dialog-action-type');
	const {
		DialogType,
		DialogWidgetType,
	} = require('im/messenger/const/dialog-type');
	const { DialogViewUpdatingBlocksType} = require('im/messenger/const/dialog-view');
	const { ActionByUserType } = require('im/messenger/const/permission');
	const {
		SidebarActionType,
		SidebarHeaderContextMenuActionType,
	} = require('im/messenger/const/sidebar-action-type');
	const { FileStatus } = require('im/messenger/const/file-status');
	const {
		FileType,
		FileEmojiType,
		FileImageType,
		FileAudioType,
	} = require('im/messenger/const/file-type');
	const { Color } = require('im/messenger/const/color');
	const {
		Path,
	} = require('im/messenger/const/path');

	const { DraftType } = require('im/messenger/const/draft');
	const { SearchEntityIdTypes } = require('im/messenger/const/search');
	const { ErrorType, ErrorCode } = require('im/messenger/const/error');
	const { BBCode, BBCodeEntity } = require('im/messenger/const/bb-code');
	const { Setting } = require('im/messenger/const/setting');
	const { SidebarFileType, SidebarTab } = require('im/messenger/const/sidebar');
	const { Promo, PromoType } = require('im/messenger/const/promo');
	const { CopilotButtonType, CopilotPromptType } = require('im/messenger/const/copilot-button');
	const { CopilotRoleType } = require('im/messenger/const/copilot-role');
	const { ComponentCode } = require('im/messenger/const/component-code');
	const { Analytics } = require('im/messenger/const/analytics');
	const { ChatEntityType } = require('im/messenger/const/src/chat-entity-link');
	const { NavigationTabId } = require('im/messenger/const/navigation-tab');
	const {
		KeyboardButtonContext,
		KeyboardButtonType,
		KeyboardButtonNewLineSeparator,
		KeyboardButtonColorToken,
		KeyboardButtonAction,
	} = require('im/messenger/const/keyboard');
	const { WaitingEntity } = require('im/messenger/const/waiting-entity');
	const { OpenRequest } = require('im/messenger/const/open-request');
	const { OpenDialogContextType } = require('im/messenger/const/context-type');
	const { UrlGetParameter } = require('im/messenger/const/url-params');
	const { CollabEntity } = require('im/messenger/const/collab');
	const { MessengerInitRestMethod } = require('im/messenger/const/messenger-init-rest');
	const { DialogPermissions, RightsLevel } = require('im/messenger/const/permission');
	const { WidgetTitleParamsType } = require('im/messenger/const/widget');
	const { EntitySelectorElementType } = require('im/messenger/const/entity-selector');
	const { MessagesAutoDeleteDelay, MessagesAutoDeleteMenuIds } = require('im/messenger/const/messages-auto-delete');
	const { MessageMenuActionType } = require('im/messenger/const/message-menu-action-type');
	const { AnchorType} = require('im/messenger/const/anchor-type');
	const { FileDownloadType } = require('im/messenger/const/src/file-download-types');
	const { PinCount } = require('im/messenger/const/pin');
	const { AudioEvents } = require('im/messenger/const/src/audio');
	const { RefreshMode } = require('im/messenger/const/refresher');
	const { TranscriptStatus, TranscriptResponseStatus } = require('im/messenger/const/transcript-status');
	const { MessengerComponentRequestMethod } = require('im/messenger/const/messenger-component-request-method');
	const { OpenlineStatus } = require('im/messenger/const/openline');
	const { RecordMediaType } = require('im/messenger/const/record-media-type');
	const { UploaderClientEvent } = require('im/messenger/const/upload');
	const { COUNTER_OVERFLOW_LIMIT } = require('im/messenger/const/src/counter');
	const { ChatSearchSelectorSection } = require('im/messenger/const/chat-search-selector-section');
	const { RecentFilterId } = require('im/messenger/const/recent-filter');

	module.exports = {
		AiAssistantButtonType,
		AiTasksStatusType,
		AppStatus,
		AudioEvents,
		Analytics,
		ChatEntityType,
		AttachType,
		AttachPickerId,
		AttachDescription,
		AttachGridItemDisplay,
		AttachColorToken,
		CacheNamespace,
		CacheName,
		RawBotType,
		BotType,
		BotCode,
		BotCommand,
		BackgroundUI,
		ConnectionStatus,
		EventType,
		EventFilterType,
		ChatTypes,
		RecentTab,
		MessageStatus,
		SubTitleIconType,
		RestMethod,
		MessageType,
		MessageIdType,
		MessageComponent,
		OwnMessageStatus,
		MessageParams,
		ReactionType,
		DialogType,
		DialogWidgetType,
		DialogActionType,
		DialogBackgroundId,
		DialogViewUpdatingBlocksType,
		ActionByUserType,
		SidebarActionType,
		SidebarHeaderContextMenuActionType,
		FileStatus,
		FileType,
		FileEmojiType,
		FileImageType,
		FileAudioType,
		UserType,
		UserExternalType,
		UserRole,
		UserColor,
		UserInputAction,
		Color,
		Path,
		DraftType,
		SearchEntityIdTypes,
		ErrorType,
		ErrorCode,
		BBCode,
		BBCodeEntity,
		Setting,
		SidebarFileType,
		SidebarTab,
		PinCount,
		Promo,
		PromoType,
		CopilotButtonType,
		CopilotPromptType,
		CopilotRoleType,
		ComponentCode,
		NavigationTabId,
		KeyboardButtonContext,
		KeyboardButtonType,
		KeyboardButtonNewLineSeparator,
		KeyboardButtonColorToken,
		KeyboardButtonAction,
		WaitingEntity,
		OpenRequest,
		OpenDialogContextType,
		UrlGetParameter,
		CollabEntity,
		MessengerInitRestMethod,
		DialogPermissions,
		RightsLevel,
		WidgetTitleParamsType,
		EntitySelectorElementType,
		MessagesAutoDeleteDelay,
		MessagesAutoDeleteMenuIds,
		MessageMenuActionType,
		AnchorType,
		FileDownloadType,
		RefreshMode,
		TranscriptStatus,
		TranscriptResponseStatus,
		MessengerComponentRequestMethod,
		OpenlineStatus,
		RecordMediaType,
		UploaderClientEvent,
		COUNTER_OVERFLOW_LIMIT,
		ChatSearchSelectorSection,
		RecentFilterId,
	};
});
