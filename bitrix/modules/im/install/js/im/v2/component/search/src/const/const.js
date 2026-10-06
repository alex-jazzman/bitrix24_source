import { EntitySearch } from 'im.v2.lib.search';

export const EntitySearchType = {
	addToChat: 'addToChat',
	messageForward: 'messageForward',
};

export const EntitySearchConfig = {
	[EntitySearchType.addToChat]: {
		exclude: [EntitySearch.chats],
		excludeGuests: true,
	},
	[EntitySearchType.messageForward]: {
		exclude: [],
	},
};
