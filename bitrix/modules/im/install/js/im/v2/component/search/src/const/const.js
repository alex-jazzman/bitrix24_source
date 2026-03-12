import { RecentType } from 'im.v2.const';
import { EntitySearch } from 'im.v2.lib.search';

export const EntitySearchType = {
	addToChat: 'addToChat',
	messageForward: 'messageForward',
};

export const EntitySearchConfig = {
	[EntitySearchType.addToChat]: {
		exclude: [EntitySearch.chats],
	},
	[EntitySearchType.messageForward]: {
		exclude: [],
	},
};

export const RecentSectionSearchConfig = {
	[RecentType.taskComments]: {
		searchRecentSection: RecentType.taskComments,
	},
	[RecentType.default]: {
		searchRecentSection: RecentType.default,
	},
};
