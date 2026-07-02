import { MessengerModel, PayloadData } from '../../base';
import { DialogId } from '../../../types/common';
import { SectionRecentValue } from '../../../provider/pull/base/types/recent';

export enum MessageStatus
{
	received = 'received',
	delivered = 'delivered',
	error = 'error',
}

declare type RecentMessage = {
	id: number,
	senderId: string,
	date: Date,
	status: MessageStatus,
	subTitleIcon: string,
	sending: boolean,
	text: string,
	params: object,
}

export type RecentModelState = {
	id: string,
	message: RecentMessage,
	dateMessage: Date | null,
	lastActivityDate: Date,
	unread: boolean,
	pinned: boolean,
	liked: boolean,
	invitation?: {
		isActive: boolean,
		originator: number,
		canResend: boolean,
	},
	options: {
		defaultUserRecord?: boolean,
		birthdayPlaceholder?: boolean,
	},
	uploadingState?: {
		message: RecentMessage,
		lastActivityDate: Date,
	},
	sticker: boolean,
};

export type RecentModelCollection = {
	collection: Record<DialogId, RecentModelState>,
	nestedIdCollection: Record<number, Partial<Record<string, Set<DialogId>>>>,
}

export type RecentMessengerModel = MessengerModel<RecentModelCollection>;

export type RecentModelActions =
	'recentModel/set'
	| 'recentModel/syncFilteredIdCollection'
	| 'recentModel/setChat'
	| 'recentModel/setCopilot'
	| 'recentModel/setChannel'
	| 'recentModel/setCollab'
	| 'recentModel/setTask'
	| 'recentModel/setOpenline'
	| 'recentModel/setFirstPageByRecentSection'
	| 'recentModel/setByRecentSection'
	| 'recentModel/setFirstPageByTab'
	| 'recentModel/setByRecentConfigTabs'
	| 'recentModel/setByRecentConfigTabsBatch'
	| 'recentModel/setByNavigationTabs'
	| 'recentModel/setGroupCollection'
	| 'recentModel/hideByRecentConfigTabs'
	| 'recentModel/hideByNavigationTabs'
	| 'recentModel/delete'
	| 'recentModel/deleteFromModel'
	| 'recentModel/deleteOpenChannel'
	| 'recentModel/update'
	| 'recentModel/like'

type RecentItemListPayload = {
	itemList: RecentModelState | Array<RecentModelState>;
	parentChatId?: number;
}

export type RecentModelActionParams = {
	'recentModel/set': Array<RecentModelState>;
	'recentModel/syncFilteredIdCollection': { tabId: string };
	'recentModel/setChat': RecentItemListPayload;
	'recentModel/setCopilot': RecentItemListPayload;
	'recentModel/setChannel': RecentItemListPayload;
	'recentModel/setCollab': RecentItemListPayload;
	'recentModel/setTask': RecentItemListPayload & { parentChatId: number };
	'recentModel/setOpenline': RecentItemListPayload;
	'recentModel/setFirstPageByRecentSection': {
		recentSection: SectionRecentValue;
		itemList: Array<RecentModelState>;
		parentChatId?: number;
	};
	'recentModel/setByRecentSection': {
		recentSection: SectionRecentValue;
		itemList: Array<RecentModelState>;
		parentChatId?: number;
	};
	'recentModel/setFirstPageByTab': {
		tab: string;
		itemList: Array<RecentModelState>;
		parentChatId?: number;
	};
	'recentModel/setByRecentConfigTabs': SetByRecentConfigTabsPayload;
	'recentModel/setByRecentConfigTabsBatch': {
		items: Array<SetByRecentConfigTabsPayload>;
	};
	'recentModel/setByNavigationTabs': {
		tabs: Array<string>;
		itemList: RecentModelState | Array<RecentModelState>;
		actionName?: string;
		parentChatId?: number;
	};
	'recentModel/setGroupCollection': {
		groups: Record<string, Array<RecentModelState>>;
		parentChatId?: number;
	};
	'recentModel/hideByRecentConfigTabs': {
		id: string;
		fromSections: Array<SectionRecentValue>;
		parentChatId?: number;
	};
	'recentModel/hideByNavigationTabs': {
		id: string;
		fromTabs: Array<string>;
		actionName?: string;
		parentChatId?: number;
	};
	'recentModel/delete': { id: string; actionName?: string };
	'recentModel/deleteFromModel': { id: string; actionName?: string };
	'recentModel/deleteOpenChannel': { id: string; parentChatId?: number; actionName?: string };
	'recentModel/update': Array<Partial<RecentModelState>>;
	'recentModel/like': { id: string; messageId: number; liked: boolean };
}

export type RecentModelMutation =
	'recentModel/setNestedIdCollection'
	| 'recentModel/storeNestedIdCollection'
	| 'recentModel/deleteFromNestedIdCollection'
	| 'recentModel/deleteIdFromNestedIdCollection'
	| 'recentModel/add'
	| 'recentModel/update'
	| 'recentModel/delete'
;

// region Mutation: setNestedIdCollection
export type RecentSetNestedIdCollectionActions =
	'setChat'
	| 'setCopilot'
	| 'setChannel'
	| 'setCollab'
	| 'setTask'
	| 'setOpenline'
	| 'setByNavigationTabs'
	| 'setByRecentConfigTabs'
	| 'setByRecentSection'
	| 'setGroupCollection'
	;

export interface RecentSetNestedIdCollectionData extends PayloadData
{
	recentSection: SectionRecentValue;
	itemIds: Array<string>;
	parentChatId?: number;
}
// endregion

// region Mutation: storeNestedIdCollection
export type RecentStoreNestedIdCollectionActions =
	'setFirstPageByTab'
	| 'setFirstPageByRecentSection'
	;

export interface RecentStoreNestedIdCollectionData extends PayloadData
{
	recentSection: SectionRecentValue;
	itemIds: Array<string>;
	parentChatId?: number;
}
// endregion

// region Mutation: deleteFromNestedIdCollection
export type RecentDeleteFromNestedIdCollectionActions =
	'deleteOpenChannel'
	| 'hideByNavigationTabs'
	| 'hideByRecentConfigTabs'
	;

export interface RecentDeleteFromNestedIdCollectionData extends PayloadData
{
	recentSection: SectionRecentValue;
	id: string;
	parentChatId?: number;
}
// endregion

// region Mutation: deleteIdFromNestedIdCollection
export type RecentDeleteIdFromNestedIdCollectionActions = 'delete';

export interface RecentDeleteIdFromNestedIdCollectionData extends PayloadData
{
	id: string;
}
// endregion

// region Action: setByRecentConfigTabs
export type SetByRecentConfigTabsPayload = {
	sections: Array<SectionRecentValue>;
	itemList: RecentModelState | Array<RecentModelState>;
	parentChatId?: number;
}
// endregion

// region Mutation: add
export type RecentAddActions = 'set' | 'setFirstPageByTab' | 'setFromPush' | 'setFromSync';
export interface RecentAddData extends PayloadData
{
	recentItemList: Array<{ fields: RecentModelState }>;
}
// endregion

// region Mutation: update
export type RecentUpdateActions =
	'set'
	| 'update'
	| 'setFromPush'
	| 'setFromSync'
	| 'like'
	;
export interface RecentUpdateData extends PayloadData
{
	recentItemList: Array<{ fields: Partial<RecentModelState> }>;
}
// endregion

// region Mutation: delete
export type RecentDeleteActions = 'delete' | 'deleteFromModel';
export interface RecentDeleteData extends PayloadData
{
	id: string;
}
