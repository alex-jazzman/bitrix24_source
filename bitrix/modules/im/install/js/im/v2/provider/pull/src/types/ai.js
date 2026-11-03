import { type AiTaskStatusValue, type AiTaskContentTypeValue } from 'im.v2.const';

export type EngineUpdateParams = {
	chatId: number,
	engineCode: string,
	engineName: string,
};

export type AutoTaskStatusParams = {
	status: AiTaskStatusValue,
	// Anchor message id of the operation. For a multiselect the backend uses the newest
	// (max id) selected message as the anchor for every pull status — see
	// Bitrix\Im\V2\Integration\AI\TaskCreation\MultipleMessagesCreator::resolveAnchorMessageId()
	// ((int)max($messageIds)); the client mirrors it via Math.max(...messageIds).
	messageId: number,
	// Chat of the anchor message, nullable on the wire: the backend takes it from that message
	// (`Bitrix\Im\V2\Pull\Event\AutoTaskStatus::getBasePullParamsInternal()`), and with a terminal
	// `notFound` the anchor may be hard-deleted while no message of the selection survived to lend
	// its chat. The key is always present, the value is not - so correlation must not depend on it.
	chatId: number | null,
	type: AiTaskContentTypeValue,
	// The task was built without part of the selected sources. Rides only on `taskCreationCompleted`
	// (the backend drops the field from every other status), and its absence means a plain success.
	isPartial?: boolean,
};

export type FileTranscriptionParams = {
	fileId: number,
	status: 'Success' | 'Pending' | 'Error',
	transcriptText: string | null,
};

export type CopilotRoleParams = {
	chatId: number,
	dialogId: string,
	copilotRole: CopilotRoleCollection,
};

type CopilotRoleCollection = {
	chats: CopilotChatData[],
	roles: { [string]: CopilotRole },
}

export type AiAssistantTitleParams = {
	chatId: number,
	dialogId: string,
};

export type CopilotGenerationStateParams = {
	dialogId: string,
	chatId: number,
	status: 'generating' | 'stopped' | 'completed' | 'error',
	initiatorId: number,
};

type CopilotChatData = {
	dialogId: string,
	role: string,
};

type CopilotRole = {
	code: string,
	name: string,
	desc: string,
	default: boolean,
	avatar: {
		small: string,
		medium: string,
		large: string,
	},
	prompts: CopilotPrompt[],
};

type CopilotPrompt = {
	code: string,
	isNew: boolean,
	promptType: string,
	text: string,
	title: string
};
