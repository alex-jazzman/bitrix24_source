import {RawChat} from "../../../../provider/service/src/types/sync-list-result";

declare type imV2RecentCopilotResult = {
    hasMore: boolean,
    hasMorePages: boolean,
    items: Array<RecentItemData>,
    copilot: CopilotRecentItemData,
}

declare type RecentItemData = {
    avatar: number,
    chat: RawChat,
    pinned: boolean,
    unread: boolean,
    chat_id: number,
    counter: number,
    date_last_activity: string,
    message: RecentItemMessageData,
    options: [],
    title: string,
    type: string,
    user: object,
}

export type RecentItemMessageData = {
	attach: false,
	author_id: number,
	date: string,
	file: boolean | { id: number, type: string, name: string},
	id: number,
	status: string,
	text: string,
	uuid: string,
}

declare type CopilotRecentItemData = {
    chats: Array<object>,
    messages: Array<object>,
    recommendedRoles: Array<object>,
    roles: object,
}
