/**
 * @module im/messenger/const/message
 */
jn.define('im/messenger/const/message', (require, exports, module) => {
	const MessageType = Object.freeze({
		deleted: 'deleted',
		text: 'text',
		emojiOnly: 'emoji-only',
		audio: 'audio',
		image: 'image',
		video: 'video',
		mediaGallery: 'media-gallery',
		file: 'file',
		fileGallery: 'file-gallery',
		status: 'status',
		systemText: 'system-text',
		unsupported: 'unsupported',
		copilot: 'copilot',
		copilotError: 'copilot-error',
		error: 'error',
		copilotPrompt: 'copilot-promt',
		banner: 'banner',
		checkIn: 'check-in',
		vote: 'vote',
		videoNote: 'video-note',
		videoNoteText: 'video-note-text',
		sticker: 'sticker',
		call: 'call',
		builder: 'builder',
	});

	const MessageIdType = {
		statusMessage: 'status-message',
		templateSeparatorUnread: 'template-separator-unread',
		templateSeparatorDate: 'template-separator',
		templateSeparatorMarked: 'template-separator-marked',
		planLimitBanner: 'plan-limit-banner',
	};

	const OwnMessageStatus = Object.freeze({
		sending: 'sending',
		sent: 'sent',
		viewed: 'viewed',
		error: 'error',
	});

	const MessageComponent = Object.freeze({
		default: 'DefaultMessage',
		file: 'FileMessage',
		smile: 'SmileMessage',
		sticker: 'StickerMessage',
		unsupported: 'UnsupportedMessage',
		deleted: 'DeletedMessage',
		error: 'ErrorMessage',
		callInvite: 'CallInviteMessage',
		zoomInvite: 'ZoomInviteMessage',
		chatCreation: 'ChatCreationMessage',
		ownChatCreation: 'OwnChatCreationMessage',
		copilotCreation: 'ChatCopilotCreationMessage',
		copilot: 'CopilotMessage',
		copilotAddedUsers: 'ChatCopilotAddedUsersMessage',
		conferenceCreation: 'ConferenceCreationMessage',
		supervisorUpdateFeature: 'SupervisorUpdateFeatureMessage',
		supervisorEnableFeature: 'SupervisorEnableFeatureMessage',
		sign: 'SignMessage',
		admin: 'AdminMessage',
		checkIn: 'CheckInMessage',
		supportVote: 'SupportVoteMessage',
		supportSessionNumber: 'SupportSessionNumberMessage',
		supportChatCreation: 'SupportChatCreationMessage',
		system: 'SystemMessage',
		channelPost: 'ChannelPost',
		generalChatCreation: 'GeneralChatCreationMessage',
		generalChannelCreation: 'GeneralChannelCreationMessage',
		channelCreation: 'ChannelCreationMessage',
		openChannelCreation: 'OpenChannelCreationMessage',
		call: 'CallMessage',
		vote: 'VoteMessage',
		taskChatCreation: 'TaskChatCreationMessage',
		convertToCollab: 'ConvertToCollabMessage',
		aiAssistant: 'AiAssistantMessage',
		planLimits: 'PlanLimitsMessage',
		aiBizprocMessage: 'AiBizprocMessage',
		blockMessage: 'BlockMessage',
	});

	module.exports = {
		MessageType,
		MessageIdType,
		MessageComponent,
		OwnMessageStatus,
	};
});
