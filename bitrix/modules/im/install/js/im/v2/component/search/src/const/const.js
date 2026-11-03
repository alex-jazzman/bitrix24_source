import { type RecentTypeItem } from 'im.v2.const';
import { EntitySearch } from 'im.v2.lib.search';

export const EntitySearchType = {
	addToChat: 'addToChat',
	messageForward: 'messageForward',
};

// pseudo-section of the forward picker: search runs across all recent sections at once
export const ForwardAllSection = 'all';

export type ForwardSectionId = RecentTypeItem | typeof ForwardAllSection;

export const EntitySearchConfig = {
	[EntitySearchType.addToChat]: {
		exclude: [EntitySearch.chats],
		excludeGuests: true,
	},
	[EntitySearchType.messageForward]: {
		exclude: [],
		onlyWithManageMessagesRight: true,
		fillDialogByRecent: true,
		// entityConfig holds fields of the ui.EntitySelector entity itself, not provider options;
		// getSearchConfig lifts them onto the entity, while everything else goes to entity.options.
		entityConfig: {
			// The forward picker shows "Recent" strictly by chat activity, not by the EntitySelector
			// usage history (the IM_CHAT_SEARCH context is shared with the regular messenger search).
			// Otherwise items previously picked in search float up as pseudo-pinned and push active
			// task chats past the recent limit. Read on the server in ui/lib/entityselector/entity.php.
			fillRecentItems: false,
		},
	},
};
