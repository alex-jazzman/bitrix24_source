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
	teamsInStructureAvailable: 'teamsInStructureAvailable',
	isDesktopRedirectAvailable: 'isDesktopRedirectAvailable',
	aiAssistantBotAvailable: 'aiAssistantAvailable',
	isCopilotMentionAvailable: 'isCopilotMentionAvailable',
	aiAssistantChatAvailable: 'aiAssistantChatCreationAvailable',
	aiFileTranscriptionAvailable: 'aiFileTranscriptionAvailable',
	isTasksRecentListAvailable: 'isTasksRecentListAvailable',
	aiAssistantMcpSelectorAvailable: 'aiAssistantMcpSelectorAvailable',
	videoNoteTranscriptionAvailable: 'videoNoteTranscriptionAvailable',
	chatSharedLinkAvailable: 'chatSharingLinkAvailable',
	isCopilotFileUploadAvailable: 'isCopilotFileUploadAvailable',
	isTaskCardAvailable: 'isMountedTasksCardAvailable',
	isBitrixGptV2Available: 'isBitrixGptV2Available',
	isCopilotDraftChatAvailable: 'isCopilotDraftChatAvailable',
	isCollabV2Available: 'isNestedChatAvailable',
	isCollabPreviewSourceEnabled: 'collabPreviewSourceEnabled',
	isChatWithGuestsAvailable: 'isChatWithGuestsAvailable',
	isCopilotForceSearchAvailable: 'isCopilotForceSearchAvailable',
	isCopilotWebSearchEnabledByAdmin: 'isCopilotWebSearchEnabledByAdmin',
	isCopilotWebSearchAllowedByTariff: 'isCopilotWebSearchAllowedByTariff',
	isAiAssistantFeedbackAvailable: 'isAiAssistantFeedbackAvailable',
	isAiAssistantRegenerateAvailable: 'isAiAssistantRegenerateAvailable',
	isAiAssistantAgentModeAvailable: 'isAiAssistantAgentModeAvailable',
	isChatFoldersWebAvailable: 'isChatFoldersWebAvailable',
	isAttachToCollabV2Available: 'isAttachChatToProjectAvailable',
	isReplyWithMediaAvailable: 'isReplyWithMediaAvailable',
	isMarkdownAvailable: 'isMarkdownAvailable',
};

export const FeatureManager = {
	isFeatureAvailable(featureName: $Values<typeof Feature>): boolean
	{
		const { featureOptions = {} } = Core.getApplicationData();

		return featureOptions[featureName] ?? false;
	},
};
