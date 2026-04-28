import { CopilotRecentItemData, RecentItemMessageData } from '../copilot/types';
import { RawChat, RawUser } from '../../../../../provider/pull/base/types/common';
import { MessagesAutoDeleteConfigs } from '../../../../../provider/pull/base/types/message';

declare type RecentItemData = {
	id: string,
	avatar: number,
	chat: RawChat,
	pinned: boolean,
	unread: boolean,
	chat_id: number,
	counter: number,
	date_last_activity: string,
	last_id: number,
	message: RecentItemMessageData,
	options: [],
	title: string,
	type: string,
	user: RawUser,
}

declare type imV2RecentChatsResult = {
	hasMore: boolean,
	hasMorePages: boolean,
	items: Array<RecentItemData>,
	copilot: CopilotRecentItemData,
	messagesAutoDeleteConfigs: Array<MessagesAutoDeleteConfigs>,
}
