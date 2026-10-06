import { UserType } from '../../../const/types/user';

export type PlanLimits = {
	fullChatHistory?: {
		isAvailable: boolean,
		limitDays: number | null,
	},
	collab?: {
		isAvailable: boolean,
		isCopyAvailable: boolean,
	},
}

declare type ImFeatures = {
	chatDepartments: boolean,
	chatV2: boolean,
	collabAvailable: boolean,
	collabCreationAvailable: boolean,
	copilotActive: boolean,
	copilotAvailable: boolean,
	giphyAvailable: boolean,
	sidebarBriefs: boolean,
	sidebarFiles: boolean,
	sidebarLinks: boolean,
	zoomActive: boolean,
	zoomAvailable: boolean,
	intranetInviteAvailable: boolean,
	messagesAutoDeleteEnabled: boolean,
	voteCreationAvailable: boolean,
	aiFileTranscriptionAvailable: boolean,
	mentionAllAvailable: boolean,
	isCopilotFileUploadAvailable: boolean,
	isCopilotMentionAvailable: boolean,
	videoNoteTranscriptionAvailable: boolean,
	isBitrixGptV2Available: boolean,
	aiAssistantMcpSelectorAvailable: boolean,
	isAiAssistantAgentModeAvailable: boolean,
	isCopilotForceSearchAvailable: boolean,
	isCopilotWebSearchEnabledByAdmin: boolean,
	isCopilotWebSearchAllowedByTariff: boolean,
	isChatWithGuestsAvailable: boolean,
	isNestedChatAvailable: boolean,
	isReplyWithMediaAvailable: boolean,
	isAiAssistantFeedbackAvailable: boolean,
	isAiAssistantRegenerateAvailable: boolean,
	collabPreviewSourceEnabled: boolean,
	isCopilotDraftChatAvailable: boolean,
	isAttachChatToProjectAvailable: boolean,
}

declare type UserInfo = {
	id: number,
	type: UserType,
}

declare type MessengerPermissions = {
	byChatType: object,
	byUserType: Record<Exclude<UserType, 'bot'>, PermissionsByUserType>,
	actionGroups: object,
	actionGroupsDefaults: object,
}

declare type PermissionsByUserType = {
	beChatManager: boolean,
	changeMessagesAutoDeleteDelay: boolean,
	changeStickerPack: boolean,
	createChannel: boolean,
	createChat: boolean,
	createCollab: boolean,
	createConference: boolean,
	createAnyTask: boolean,
	createCalendarEvent: boolean,
	createCopilot: boolean,
	createStickerPack: boolean,
	editChat: boolean,
	getChannels: boolean,
	getMarket: boolean,
	getOpenlines: boolean,
	joinChat: boolean,
	leaveCollab: boolean,
	openCalendar: boolean,
	openProfile: boolean,
	saveFileToDisk: boolean,
}
