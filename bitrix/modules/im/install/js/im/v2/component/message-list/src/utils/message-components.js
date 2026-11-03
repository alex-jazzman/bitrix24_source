import { FeedbackFormMessage } from 'imopenlines.v2.component.message.feedback-form';
import { HiddenMessage } from 'imopenlines.v2.component.message.hidden';
import { MultiDialogErrorMessage } from 'imopenlines.v2.component.message.multidialog-error';
import { NetworkStickerMessage } from 'imopenlines.v2.component.message.network-sticker';
import { StartDialogMessage } from 'imopenlines.v2.component.message.start-dialog';

import { AdminMessage } from 'im.v2.component.message.admin';
import { AiAssistantMessage } from 'im.v2.component.message.ai-assistant.answer';
import { AiBizprocMessage } from 'im.v2.component.message.ai-bizproc';
import { CallMessage } from 'im.v2.component.message.call';
import { CallInviteMessage } from 'im.v2.component.message.call-invite';
import { CheckInMessage } from 'im.v2.component.message.check-in';
import { ConvertToCollabMessage } from 'im.v2.component.message.collab.convert';
import { ChatCopilotAddedUsersMessage } from 'im.v2.component.message.copilot.added-users';
import { CopilotMessage } from 'im.v2.component.message.copilot.answer';
import { ChatCopilotCreationMessage } from 'im.v2.component.message.copilot.creation';
import { ChannelCreationMessage } from 'im.v2.component.message.creation.channel';
import { ChatCreationMessage } from 'im.v2.component.message.creation.chat';
import { CollabCreationMessage } from 'im.v2.component.message.creation.collab';
import { ConferenceCreationMessage } from 'im.v2.component.message.creation.conference';
import { GeneralChannelCreationMessage } from 'im.v2.component.message.creation.general-channel';
import { GeneralChatCreationMessage } from 'im.v2.component.message.creation.general-chat';
import { OwnChatCreationMessage } from 'im.v2.component.message.creation.own-chat';
import { TaskChatCreationMessage } from 'im.v2.component.message.creation.task-chat';
import { DefaultMessage } from 'im.v2.component.message.default';
import { DeletedMessage } from 'im.v2.component.message.deleted';
import { ErrorMessage } from 'im.v2.component.message.error';
import { FileMessage } from 'im.v2.component.message.file';
import { SignMessage } from 'im.v2.component.message.sign';
import { SmileMessage } from 'im.v2.component.message.smile';
import { StickerMessage } from 'im.v2.component.message.sticker';
import { SupervisorEnableFeatureMessage } from 'im.v2.component.message.supervisor.enable-feature';
import { SupervisorUpdateFeatureMessage } from 'im.v2.component.message.supervisor.update-feature';
import { SupportChatCreationMessage } from 'im.v2.component.message.support.chat-creation';
import { SupportSessionNumberMessage } from 'im.v2.component.message.support.session-number';
import { SupportVoteMessage } from 'im.v2.component.message.support.vote';
import { UnsupportedMessage } from 'im.v2.component.message.unsupported';
import { VoteMessage } from 'im.v2.component.message.vote';
import { ContactMessage } from 'im.v2.component.message.contact';
import { ZoomInviteMessage } from 'im.v2.component.message.zoom-invite';

export const MessageComponents = {
	DefaultMessage,
	FileMessage,
	SmileMessage,
	StickerMessage,
	ErrorMessage,
	CallInviteMessage,
	DeletedMessage,
	UnsupportedMessage,
	ChatCreationMessage,
	OwnChatCreationMessage,
	ChatCopilotCreationMessage,
	CopilotMessage,
	AiAssistantMessage,
	SupportVoteMessage,
	SupportSessionNumberMessage,
	SupportChatCreationMessage,
	ConferenceCreationMessage,
	ZoomInviteMessage,
	CheckInMessage,
	SupervisorUpdateFeatureMessage,
	SupervisorEnableFeatureMessage,
	ChatCopilotAddedUsersMessage,
	SignMessage,
	AdminMessage,
	GeneralChatCreationMessage,
	GeneralChannelCreationMessage,
	ChannelCreationMessage,
	CallMessage,
	StartDialogMessage,
	FeedbackFormMessage,
	NetworkStickerMessage,
	MultiDialogErrorMessage,
	HiddenMessage,
	VoteMessage,
	ContactMessage,
	TaskChatCreationMessage,
	ConvertToCollabMessage,
	CollabCreationMessage,
	AiBizprocMessage,
};
