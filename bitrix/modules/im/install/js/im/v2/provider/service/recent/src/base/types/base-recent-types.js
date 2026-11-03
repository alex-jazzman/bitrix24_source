import { type RecentTypeItem } from 'im.v2.const';
import {
	type RawChat,
	type RawFile,
	type RawMessage,
	type RawMessagesAutoDeleteConfig,
	type RawRecentConfig,
	type RawRecentItem,
	type RawUser,
	type RawCopilot,
	type RawCollabInfo,
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

export type RecentRestResult = BaseRecentRestResult | RecentFirstPageRestResult;

export type RecentFirstPageRestResult = BaseRecentRestResult & {
	sectionMeta?: {
		fixedChatIds: number[],
		collabInfo: RawCollabInfo,
	},
};

type BaseRecentRestResult = {
	hasNextPage: boolean,
	chats: RawChat[],
	files: RawFile[],
	recentItems: RawRecentItem[],
	// section membership of every chat in the tail, comes in all v2 tails
	recentConfigs: RawRecentConfig[],
	// colleagues whose birthday is today, comes in all v2 tails
	birthdayList: RawUser[],
	users: RawUser[],
	messages: RawMessage[],
	additionalMessages: RawMessage[],
	messagesAutoDeleteConfigs: RawMessagesAutoDeleteConfig[],
	copilot: null | RawCopilot,
};
