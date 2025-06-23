import { Core } from 'im.v2.application.core';

import { ChatHistoryManager } from './classes/chat-history';
import { MessagesAutoDelete } from './classes/messages-auto-delete';
import { CollabManager } from './classes/collab';

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
	giphyAvailable: 'giphyAvailable',
	collabAvailable: 'collabAvailable',
	collabCreationAvailable: 'collabCreationAvailable',
	enabledCollabersInvitation: 'enabledCollabersInvitation',
	inviteByLinkAvailable: 'inviteByLinkAvailable',
	inviteByPhoneAvailable: 'inviteByPhoneAvailable',
	documentSignAvailable: 'documentSignAvailable',
	intranetInviteAvailable: 'intranetInviteAvailable',
	voteCreationAvailable: 'voteCreationAvailable',
	messagesAutoDeleteAvailable: 'messagesAutoDeleteAvailable',
	defaultTabCopilotAvailable: 'defaultTabCopilotAvailable',
	messagesAutoDeleteEnabled: 'messagesAutoDeleteEnabled',
	isNotificationsStandalone: 'isNotificationsStandalone',
	showCopilotChatsInRecentTab: 'copilotInDefaultTabAvailable',
	teamsInStructureAvailable: 'teamsInStructureAvailable',
	isDesktopRedirectAvailable: 'isDesktopRedirectAvailable',
};

export const FeatureManager = {
	chatHistory: ChatHistoryManager,
	messagesAutoDelete: MessagesAutoDelete,
	collab: CollabManager,

	isFeatureAvailable(featureName: $Values<typeof Feature>): boolean
	{
		const { featureOptions = {} } = Core.getApplicationData();

		return featureOptions[featureName] ?? false;
	},
};
