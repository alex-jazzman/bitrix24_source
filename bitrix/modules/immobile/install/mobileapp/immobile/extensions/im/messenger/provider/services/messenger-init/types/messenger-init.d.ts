import {RecentItemData} from '../../../../controller/recent/service/server-load/chat/type';
import { UsersModelState } from '../../../../model/users/src/types';
import { DialoguesModelState } from '../../../../model/dialogues/src/types';
import {ChannelRecentItemData} from '../../../../controller/recent/service/server-load/channel/types';
import { channelChatId, commentChatId } from '../../../../model/comment/src/types';
import {
	ChatsCopilotDataItem,
	CopilotRoleData,
	MessageCopilotDataItem,
} from '../../../../model/dialogues/src/copilot/types';
import { PlanLimits } from '../../../../lib/params/types/params';
import { MessagesAutoDeleteConfigs } from '../../../pull/base/types/message';
import { AnchorModelState } from '../../../../model/anchor/src/types';
import { imV2CollabTailResult } from '../../../../controller/recent/collab/types/recent';
import { DialogId } from '../../../../types/common';
import { RawFile, RawMessage } from '../../../pull/base/types/common';
import { OpenlinesSessionStatus } from '../../../../model/dialogues/src/openlines/type';
import {CounterModelState} from "../../../../model/counter/src/types";

declare type immobileTabsLoadCommonResult = {
	desktopStatus: {
		isOnline: boolean,
		version: number,
	},
	imCounters: {
		messengerCounters: Array<CounterModelState>
		notifyCounters: number,
	},
	mobileRevision: number,
	portalCounters: {
		result: Object,
		time: number,
	},
	serverTime: string,
	userData: UsersModelState,
	promotion: string[],
}

declare type immobileTabChatLoadResult = Partial<immobileTabsLoadCommonResult> & {
	departmentColleagues?: unknown[] | null,
	recentList: immobileTabChatLoadResultRecentList,
	tariffRestriction?: PlanLimits,
	activeCalls: [],
	anchors: AnchorModelState[],
}

declare type immobileTabChatLoadResultRecentList = {
	additionalMessages: Array<RawMessage>,
	birthdayList: unknown[],
	chats: DialoguesModelState[],
	copilot: immobileTabLoadResultCopilotData | null,
	files: RawFile[],
	hasMore: boolean,
	hasNextPage: boolean,
	items: RecentItemData[],
	messagesAutoDeleteConfigs: Array<MessagesAutoDeleteConfigs>,
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

declare type immobileTabCopilotLoadResultV2 = {
	copilotList: immobileTabCopilotLoadResultCopilotList,
}

declare type immobileTabChatsLoadResultV2 = {
	chatsList: immobileTabChatsLoadResultChatsList,
}

declare type immobileTabCollabLoadResultV2 = {
	collabList: immobileTabCollabLoadResultCollabList,
}

declare type immobileTabOpenlinesLoadResultV2 = {
	openlinesList: immobileTabOpenlinesLoadResultOpenlinesList,
}

declare type immobileTabCopilotLoadResultCopilotList = {
	birthdayList: unknown[],
	copilot: immobileTabLoadResultCopilotData | null,
	hasMore: boolean,
	hasMorePages: boolean,
	items: RecentItemData[],
}

declare type immobileTabChatsLoadResultChatsList = {
	birthdayList: unknown[],
	copilot: immobileTabLoadResultCopilotData | null,
	hasMore: boolean,
	hasMorePages: boolean,
	items: RecentItemData[],
	messagesAutoDeleteConfigs: Array<MessagesAutoDeleteConfigs>,
}

declare type immobileTabOpenlinesLoadResultOpenlinesList = {
	additionalMessages: Array<RawMessage>,
	chats: Array<DialoguesModelState>,
	copilot: null,
	files: RawFile[],
	hasNextPage: boolean,
	messages: Array<RawMessage>,
	messagesAutoDeleteConfigs: Array<MessagesAutoDeleteConfigs>,
	recentItems: Array<OpenlinesRecentItemData>,
	sessions: Array<OpenlinesSession>,
	users: Array<UsersModelState>,
}

declare type immobileTabCollabLoadResultCollabList = imV2CollabTailResult

declare type immobileTabCopilotLoadResult = Partial<immobileTabsLoadCommonResult> & {
	recentList: {
		birthdayList: unknown[], // TODO: concrete type
		copilot: immobileTabLoadResultCopilotData | null,
		hasMore: boolean,
		hasNextPage: boolean,
		items: RecentItemData[],
	},
}

declare type MessengerInitActionData = {
	methodList: Array<string>,
	options?: {
		siteId: string,
	}
}

declare type immobileTabLoadResultCopilotData = {
	chats: ChatsCopilotDataItem[],
	messages: MessageCopilotDataItem[],
	recommendedRoles: string[],
	roles: Record<string, CopilotRoleData>,
};

declare type OpenlinesRecentItemData = {
	chatId: number,
	dialogId: DialogId,
	messageId: number,
	sessionId: number,
}

declare type OpenlinesSession = {
	id: number,
	operatorId: number,
	chatId: number,
	status: OpenlinesSessionStatus,
	queueId: string,
	pinned: boolean,
	isClosed: boolean,
}
