import { type RecentTypeItem } from 'im.v2.const';
import {
	type RawChat,
	type RawFile,
	type RawMessage,
	type RawMessagesAutoDeleteConfig,
	type RawRecentItem,
	type RawUser,
	type RawCopilot,
} from 'im.v2.provider.service.types';

export type BaseRecentQueryParams = {
	limit: number,
	filter: BaseRecentFilterParams,
};

export type BaseRecentFilterParams = {
	lastMessageDate?: ?Date,
	lastMessageId?: number,
	recentSection: RecentTypeItem,
	parentId: number,
	unread: boolean,
};

export type RecentRestResult = {
	hasNextPage: boolean,
	chats: RawChat[],
	files: RawFile[],
	recentItems: RawRecentItem[],
	users: RawUser[],
	messages: RawMessage[],
	additionalMessages: RawMessage[],
	messagesAutoDeleteConfigs: RawMessagesAutoDeleteConfig[],
	copilot: null | RawCopilot,
};
