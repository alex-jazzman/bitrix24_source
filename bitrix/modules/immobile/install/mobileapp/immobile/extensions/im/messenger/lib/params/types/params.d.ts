import { UserType } from '../../../const/types/user';

export type PlanLimits = {
	fullChatHistory?: {
			isAvailable: boolean,
			limitDays: number | null,
		}
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
	isCopilotReasoningAvailable: boolean,
	videoNoteTranscriptionAvailable: boolean,
	stickersAvailable: boolean,
	aiAssistantMcpSelectorAvailable: boolean,
	isAddingUserByMentionAvailable: boolean,
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
	changeMessagesAutoDeleteDelay: boolean,
	changeStickerPack: boolean,
	createChannel: boolean,
	createChat: boolean,
	createCollab: boolean,
	createConference: boolean,
	createCopilot: boolean,
	createStickerPack: boolean,
	getChannels: boolean,
	getMarket: boolean,
	getOpenlines: boolean,
	leaveCollab: boolean,
}
