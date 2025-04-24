import { RecentItemData } from '../../../controller/recent/copilot/types/recent';
import { UsersModelState } from '../../../model/types/users';
import { DialoguesModelState } from '../../../model/types/dialogues';
import { RawMessage, RawFile } from '../src/types/sync-list-result';
import { ChannelRecentItemData } from '../../../controller/recent/channel/types/recent';
import { channelChatId, commentChatId } from '../../../model/types/comment';
import { ChatsCopilotDataItem, CopilotRoleData, MessageCopilotDataItem } from '../../../model/types/dialogues/copilot';
import { PlanLimits } from '../../../lib/params/types/params';

declare type immobileTabsLoadCommonResult = {
	desktopStatus: {
		isOnline: boolean,
		version: number,
	},
	imCounters: {
		channelComment: Record<channelChatId, Record<commentChatId, number>>,
		chat: Record<string, number>,
		chatMuted: number[],
		chatUnread: number[],
		collab: Record<number, number>,
		copilot: Record<number, number>,
		lines: unknown[],
		type: {
			all: number,
			chat: number,
			collab: number,
			copilot: number,
			lines: number,
			notify: number,
		},
	},
	mobileRevision: number,
	portalCounters: {
		result: Object,
		time: number,
	},
	serverTime: string,
	userData: UsersModelState,
}

declare type immobileTabChatLoadResult = Partial<immobileTabsLoadCommonResult> & {
	departmentColleagues?: unknown[] | null,
	recentList: {
		additionalMessages: Array<RawMessage>,
		birthdayList: unknown[], // TODO: concrete type
		chats: DialoguesModelState[],
		copilot: null,
		files: RawFile[],
		hasMore: boolean,
		hasNextPage: boolean,
		items: RecentItemData[],
	},
	tariffRestriction?: PlanLimits,
}

declare type immobileTabChannelLoadResult = Partial<immobileTabsLoadCommonResult> & {
	recentList: {
		additionalMessages: Array<RawMessage>,
		birthdayList: unknown[], // TODO: concrete type
		chats: DialoguesModelState[],
		copilot: null,
		files: RawFile[],
		hasNextPage: boolean,
		messages: RawMessage[],
		recentItems: ChannelRecentItemData,
		reminders: unknown[],
		users: UsersModelState[],
	},
}

declare type immobileTabCopilotLoadResult = Partial<immobileTabsLoadCommonResult> & {
	recentList: {
		birthdayList: unknown[], // TODO: concrete type
		copilot: {
			chats: ChatsCopilotDataItem[],
			messages: MessageCopilotDataItem[],
			recommendedRoles: string[],
			roles: Record<string, CopilotRoleData>,
		},
		hasMore: boolean,
		hasNextPage: boolean,
		items: RecentItemData[],
	},
}
