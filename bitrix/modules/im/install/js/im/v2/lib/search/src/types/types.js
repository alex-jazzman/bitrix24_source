import { RecentType, type ParentChatIdType } from 'im.v2.const';

import { EntitySearch } from '../const/const';

import type { ImModelChat, ImModelUser } from 'im.v2.model';
import type { RawUser, RawChat } from 'im.v2.provider.service.types';

export type ImRecentProviderItem = {
	id: string,
	entityId: string,
	entityType: string,
	title: string,
	avatar: string,
	sort: number,
	customData: {
		id: number | string,
		chat: Partial<RawChat>,
		secondSort: number,
		dateMessage?: string,
		user?: RawUser,
		byUser?: boolean,
		isContextChatMember?: boolean,
	},
};

export type LocalSearchItemOrigin = 'recentList' | 'chatParticipants' | 'tabMemory';

export type LocalSearchItem = {
	dialogId: string,
	dialog?: ImModelChat,
	user?: ImModelUser,
	dateMessage: string,
	origin: LocalSearchItemOrigin,
}

// the words a person is searched by, kept beside the very strings they were parsed from
export type UserSearchWords = {
	name: string,
	lastName: string,
	workPosition: string,
	words: string[],
}

export type SearchResultItem = {
	dialogId: string,
	dateMessage: string,
	isChatParticipant: boolean | null,
	// the part of the pool the item was collected from, set by the consumer that collects it
	origin?: LocalSearchItemOrigin,
};

// Fields of the ui.EntitySelector entity itself (not provider options): getSearchConfig lifts
// them onto the entity rather than into entity.options.
export type EntitySelectorEntityConfigType = {
	fillRecentItems?: boolean,
};

type EntitySelectorProviderEntity = {
	id: string,
	options: SearchConfig,
	dynamicLoad: boolean,
	dynamicSearch: boolean,
	fillRecentItems?: boolean,
};

export type EntitySelectorRequestConfig = {
	dialog: {
		entities: EntitySelectorProviderEntity[],
		preselectedItems: [],
		clearUnavailableItems: boolean,
		context: string,
		id: string,
	}
};

type RecentSectionSearchConfigType = {
	searchRecentSection: ?$Values<typeof RecentType>,
	parentId: ParentChatIdType,
	// Folder scope: the identifier alone describes the result set, the composition stays on the server
	// and on the local stage comes from the same store getters the folder list is built from.
	searchFolderId?: ?number,
	// Folder eligibility: every personal folder allows the same chats, so the mode needs no identifier.
	searchFolderEligible?: boolean,
	onlyWithManageUsersAddRight?: boolean,
	onlyWithOwnerRight?: boolean,
};

export type EntitySearchConfigType = {
	exclude: $Values<typeof EntitySearch>[],
	excludeGuests?: boolean,
	searchRecentSection?: ?$Values<typeof RecentType>,
	searchAllChats?: boolean,
	parentId?: ParentChatIdType,
	onlyWithManageMessagesRight?: boolean,
	fillDialogByRecent?: boolean,
	entityConfig?: EntitySelectorEntityConfigType,
	withTabMemoryPool?: boolean,
}

export type MentionSearchConfigType = {
	contextChatId: number,
	// tells the server the request comes from the mention list, the single consumer with a lower
	// threshold of the query length
	mentionSearch?: boolean,
} & EntitySearchConfigType;

export type SearchConfig = RecentSectionSearchConfigType | EntitySearchConfigType | MentionSearchConfigType;
