import type { JsonObject, JsonValue } from 'main.core';

export type PanelContext = {
	messageId: number,
	[prop: string]: JsonValue,
}

export type PanelContextWithMultipleIds = PanelContext & {
	messagesIds: number[],
}

export type PlainMessageParams = BaseMessageParams & {
	replyId?: number,
	forwardIds?: number[],
};

export type CopilotMessageParams = BaseMessageParams & {
	copilot: {
		promptCode: string,
	},
};

export type FileMessageParams = BaseMessageParams & {
	fileIds: string[],
};

export type PreparedMessage = {
	temporaryId: string,
	chatId: number,
	dialogId: string,
	authorId: number,
	replyId: number,
	forward: {userId: number, id: string},
	forwardIds: {[string]: number},
	text: string,
	params: JsonObject,
	copilot: {
		reasoning: boolean,
		promptCode: string,
	},
	stickerParams: Sticker,
	aiAssistant?: {
		mcpAuthId: number
	},
	unread: boolean,
	sending: boolean,
	viewedByOthers: boolean,
};

type BaseMessageParams = {
	dialogId: string,
	text: string,
	tempMessageId?: string,
};

type Sticker = {
	id: string,
	packId: string,
	packType: string,
}

export type StickerMessageParams = {
	dialogId: string,
	stickerParams: Sticker,
};
