import { Core } from 'im.v2.application.core';

export { TariffManager } from './tariff';

export const Feature = {
	chatV2: 'chatV2',
	openLinesV2: 'openLinesV2',
	chatDepartments: 'chatDepartments',
	copilotActive: 'copilotActive',
	copilotAvailable: 'copilotAvailable',
	sidebarLinks: 'sidebarLinks',
	sidebarFiles: 'sidebarFiles',
	sidebarBriefs: 'sidebarBriefs',
	zoomActive: 'zoomActive',
	zoomAvailable: 'zoomAvailable',
	collabAvailable: 'collabAvailable',
	collabCreationAvailable: 'collabCreationAvailable',
	enabledCollabersInvitation: 'enabledCollabersInvitation',
	changeInviteLanguageAvailable: 'changeInviteLanguageAvailable',
	inviteByLinkAvailable: 'inviteByLinkAvailable',
	inviteByPhoneAvailable: 'inviteByPhoneAvailable',
	documentSignAvailable: 'documentSignAvailable',
	intranetInviteAvailable: 'intranetInviteAvailable',
	voteCreationAvailable: 'voteCreationAvailable',
	messagesAutoDeleteEnabled: 'messagesAutoDeleteEnabled',
	isAIModelChangeAllowed: 'isCopilotSelectModelAvailable',
	teamsInStructureAvailable: 'teamsInStructureAvailable',
	isDesktopRedirectAvailable: 'isDesktopRedirectAvailable',
	aiAssistantBotAvailable: 'aiAssistantAvailable',
	isCopilotMentionAvailable: 'isCopilotMentionAvailable',
	aiAssistantChatAvailable: 'aiAssistantChatCreationAvailable',
	aiFileTranscriptionAvailable: 'aiFileTranscriptionAvailable',
	isTasksRecentListAvailable: 'isTasksRecentListAvailable',
	unreadRecentModeAvailable: 'unreadRecentModeAvailable',
	isCopilotReasoningAvailable: 'isCopilotReasoningAvailable',
	aiAssistantMcpSelectorAvailable: 'aiAssistantMcpSelectorAvailable',
	videoNoteTranscriptionAvailable: 'videoNoteTranscriptionAvailable',
	chatSharedLinkAvailable: 'chatSharingLinkAvailable',
	isCopilotFileUploadAvailable: 'isCopilotFileUploadAvailable',
	isMessageBuilderAvailable: 'isMessageBuilderAvailable',
	isTaskCardAvailable: 'isMountedTasksCardAvailable',
	isBitrixGptV2Available: 'isBitrixGptV2Available',
	isCopilotDraftChatAvailable: 'isCopilotDraftChatAvailable',
	isAddingUserByMentionAvailable: 'isAddingUserByMentionAvailable',
	isCollabV2Available: 'isNestedChatAvailable',
	isChatWithGuestsAvailable: 'isChatWithGuestsAvailable',
	isCopilotForceSearchAvailable: 'isCopilotForceSearchAvailable',
	isCopilotWebSearchEnabledByAdmin: 'isCopilotWebSearchEnabledByAdmin',
	isCopilotWebSearchAllowedByTariff: 'isCopilotWebSearchAllowedByTariff',
	isAiAssistantFeedbackAvailable: 'isAiAssistantFeedbackAvailable',
	isAiAssistantRegenerateAvailable: 'isAiAssistantRegenerateAvailable',
	isAiAssistantAgentModeAvailable: 'isAiAssistantAgentModeAvailable',
};

export const FeatureManager = {
	isFeatureAvailable(featureName: $Values<typeof Feature>): boolean
	{
		const { featureOptions = {} } = Core.getApplicationData();

		return featureOptions[featureName] ?? false;
	},
};
