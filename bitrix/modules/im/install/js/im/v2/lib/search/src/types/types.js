import { RecentType } from 'im.v2.const';

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

export type LocalSearchItem = {
	dialogId: string,
	dialog: ImModelChat,
	user?: ImModelUser,
	dateMessage: string,
}

export type SearchResultItem = {
	dialogId: string,
	dateMessage: string,
	isChatParticipant: boolean | null,
};

type EntitySelectorProviderEntity = {
	id: string,
	options: SearchConfig,
	dynamicLoad: boolean,
	dynamicSearch: boolean,
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
	searchRecentSection: $Values<typeof RecentType>,
};

export type EntitySearchConfigType = {
	exclude: $Values<typeof EntitySearch>[],
}

export type MentionSearchConfigType = {
	contextChatId: number,
} & EntitySearchConfigType;

export type SearchConfig = RecentSectionSearchConfigType | EntitySearchConfigType | MentionSearchConfigType;
