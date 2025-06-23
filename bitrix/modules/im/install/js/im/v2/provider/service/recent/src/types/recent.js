import type { RawCopilot, RawMessagesAutoDeleteConfig, RawRecentItem, RawUser } from 'im.v2.provider.service.types';

export type RecentRestResult = {
	birthdayList: RawUser[],
	hasMore: boolean,
	hasMorePages: boolean,
	items: RawRecentItem[],
	copilot?: RawCopilot,
	messagesAutoDeleteConfigs: RawMessagesAutoDeleteConfig[],
};
