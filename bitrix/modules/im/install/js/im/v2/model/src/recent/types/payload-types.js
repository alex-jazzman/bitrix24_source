import type { RecentTypeItem } from 'im.v2.const';
import type { RawLegacyRecentItem, RawRecentItem } from 'im.v2.provider.service.types';
import type { RecentItem as ImModelRecentItem } from '../../type/recent-item';

type RawRecentScope = {
	type: RecentTypeItem,
	parentChatId?: number,
};

type RecentScope = {
	parentChatId: number,
	type: RecentTypeItem,
	unread: boolean,
};

export type RawSetPayload = RawRecentScope & { items: RawRecentItemsPayload };
export type SetPayload = RecentScope & { itemIds: string[] };

export type GetPayload = RawRecentScope;

export type RawClearPayload = RawRecentScope;
export type ClearPayload = RecentScope;

export type UpdatePayload = {
	dialogId: string | number,
	fields: Partial<ImModelRecentItem>,
};

export type RawRecentItemsPayload =
	RawRecentItem[]
	| RawLegacyRecentItem[]
	| RawRecentItem
	| RawLegacyRecentItem;

export type SetDraftPayload = {
	dialogId: string | number,
	text: string,
	addFakeItems: boolean,
};
