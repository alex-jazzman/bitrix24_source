import {ReactionType, ReactionUser, RawReaction} from '../../../../model/messages/src/reactions/types';
import {UsersModelState} from '../../../../model/users/src/types';
import {DialoguesModelState} from '../../../../model/dialogues/src/types';
import {RawChat, RawFile, RawMessage, RawPin, RawUser} from '../../../service/src/types/sync-list-result';
import {MessageParams} from '../../../../model/messages/src/types/messages';
import {CopilotRecentItemData} from "../../../../controller/recent/copilot/types/recent";

export type MessagesAutoDeleteDelayParams = {
	delay: number,
	chatId: number,
	dialogId: string,
};

export type AddReactionParams = {
	actualReactions: {
		reaction: RawReaction,
		usersShort: ReactionUser[]
	},
	reaction: ReactionType,
	userId: number,
	dialogId: string
};

export type DeleteReactionParams = {
	actualReactions: {
		reaction: RawReaction,
		usersShort: ReactionUser[]
	},
	reaction: ReactionType,
	userId: number
};

type MessagePullHandlerMessageDeleteCompleteParams = {
	chatId: number,
	counter: number,
	dialogId: string | number,
	fromUserId: number,
	id: number,
	lastMessageViews: {
		messageId: number,
		firstViewers: Array<number>,
		countOfViewers: number,
	},
	muted: boolean,
	newLastMessage: {
		id: number,
		uuid: string,
		author_id: number,
		chat_id: number,
		date: string,
		isSystem: boolean,
		text: string,
		unread: boolean,
		viewedByOthers: boolean,
		viewed: boolean,
		params: object,
		replaces: Array<any>,
		files?: Array<any>,
	},
	params: object,
	senderId: number,
	text: string,
	toUserId: number,
	type: string,
	unread: boolean,
};

type MessagePullHandlerMessageDeleteV2Params = {
	chatId: number,
	counter: number,
	dialogId: string | number,
	fromUserId: number,
	counterType: string, // see im/messenger/const/counter
	lastMessageViews: {
		messageId: number,
		firstViewers: Array<number>,
		countOfViewers: number,
	},
	messages: Array<DeleteV2MessageObject>,
	muted: boolean,
	newLastMessage: {
		id: number,
		uuid: string,
		author_id: number,
		chat_id: number,
		date: string,
		isSystem: boolean,
		text: string,
		unread: boolean,
		viewedByOthers: boolean,
		viewed: boolean,
		params: object,
		replaces: Array<any>,
		files?: Array<any>,
	},
	toUserId: number,
	unread: boolean,
	type: 'private' | 'chat',
};

type DeleteV2MessageObject = {
	completelyDeleted: boolean,
	id: number,
	params: MessageParams,
	senderId: number,
	text: string,
}

type MessagePullHandlerUpdateDialogParams = {
	dialogId: string | number,
	chatId?: number,
	message: {
		id: number,
		senderId: number,
	},
	counter: number,
	users?: Record<number, UsersModelState>,
	chat: Record<number, Partial<DialoguesModelState>>,
	userInChat: Record<number, Array<number>>,
	copilot: CopilotRecentItemData,
	messagesAutoDeleteConfigs: Array<MessagesAutoDeleteConfigs>
}

type MessagesAutoDeleteConfigs = {
	chatId: number,
	delay: number,
}

declare type MessagePullHandlerMessageParamsUpdateParams = {
	id: number, // message id
	chatId: number,
	type: 'private' | 'chat',
	senderId?: number, // only open chat
	fromUserId?: number, // only private chat
	toUserId?: number, // only private chat
	params: Object,
}

declare type MessagePullHandlerPinAddParams = {
	additionalMessages: Array<RawMessage>,
	files: Array<RawFile>,
	pin: RawPin,
	users: Array<RawUser>
}

declare type MessagePullHandlerPinDeleteParams = {
	chatId: number,
	linkId: number,
	messageId: number
}

declare type MessagePullHandlerAdditionalEntities = {
	additionalMessages: Array<RawMessage>,
	files: Array<RawFile>,
	messages: Array<RawMessage>,
	users: Array<RawUser>,
	reactions: any,
}

declare type MessageAddParams = {
	chat?: {[chatId: string]: RawChat} | [],
	chatId: number,
	counter: number,
	dialogId: string,
	files: {[fileId: string]: RawFile} | [],
	lines: null,
	message: RawMessage,
	notify: boolean,
	userBlockChat: {[chatId: string]: {[userId: string]: boolean}} | [],
	userInChat: {[chatId: string]: Array<number>} | [],
	users: {[userId: string]: RawUser} | null,
	dateLastActivity: string,
};
