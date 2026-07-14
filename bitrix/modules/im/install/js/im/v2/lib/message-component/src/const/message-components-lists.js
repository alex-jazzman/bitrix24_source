import { MessageComponent } from 'im.v2.const';

export const serverComponentList = new Set([
	MessageComponent.unsupported,
	MessageComponent.error,
	MessageComponent.chatCreation,
	MessageComponent.ownChatCreation,
	MessageComponent.conferenceCreation,
	MessageComponent.callInvite,
	MessageComponent.copilotCreation,
	MessageComponent.copilotMessage,
	MessageComponent.aiAssistantMessage,
	MessageComponent.supportVote,
	MessageComponent.supportSessionNumber,
	MessageComponent.supportChatCreation,
	MessageComponent.zoomInvite,
	MessageComponent.copilotAddedUsers,
	MessageComponent.supervisorUpdateFeature,
	MessageComponent.supervisorEnableFeature,
	MessageComponent.sign,
	MessageComponent.admin,
	MessageComponent.checkIn,
	MessageComponent.generalChatCreationMessage,
	MessageComponent.generalChannelCreationMessage,
	MessageComponent.channelCreationMessage,
	MessageComponent.callMessage,
	MessageComponent.voteMessage,
	MessageComponent.convertToCollabMessage,
	MessageComponent.collabCreationMessage,
	MessageComponent.sticker,
	MessageComponent.aiBizprocMessage,
]);

export const demoComponentList = new Set([
	MessageComponent.taskChatCreationMessage,
]);
