import { RecentItemData } from '../chat/type';
import {
	ChatsCopilotDataItem,
	CopilotRoleData,
	MessageCopilotDataItem,
} from '../../../../../model/dialogues/src/copilot/types';

declare type imV2RecentCopilotResult = {
	hasMore: boolean,
	hasMorePages: boolean,
	items: Array<RecentItemData>,
	copilot: CopilotRecentItemData,
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
	messages: Array<MessageCopilotDataItem>,
	chats: Array<ChatsCopilotDataItem>,
	recommendedRoles?: Array<object>,
	engines: object,
	roles: Record<string, CopilotRoleData>,
}
