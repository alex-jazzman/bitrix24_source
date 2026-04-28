import { MessengerModel, PayloadData } from '../../base';
import { DialogId } from '../../../types/common';

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
	chatIdCollection: Set<string>,
	copilotIdCollection: Set<string>,
	channelIdCollection: Set<string>,
	collabIdCollection: Set<string>,
	taskIdCollection: Set<string>,
	openlineIdCollection: Set<string>,
}

export type RecentMessengerModel = MessengerModel<RecentModelCollection>;

export type RecentModelActions =
	'recentModel/set'
	| 'recentModel/syncFilteredIdCollection'
	| 'recentModel/setChat'
	| 'recentModel/setCopilot'
	| 'recentModel/setChannel'
	| 'recentModel/setCollab'
	| 'recentModel/setFirstPageByTab'
	| 'recentModel/setByRecentConfigTabs'
	| 'recentModel/setByNavigationTabs'
	| 'recentModel/setGroupCollection'
	| 'recentModel/hideByRecentConfigTabs'
	| 'recentModel/hideByNavigationTabs'
	| 'recentModel/delete'
	| 'recentModel/deleteOpenChannel'
	| 'recentModel/update'
	| 'recentModel/like'

export type RecentModelMutation =
	'recentModel/setChatIdCollection'
	| 'recentModel/setCopilotIdCollection'
	| 'recentModel/setChannelIdCollection'
	| 'recentModel/setCollabIdCollection'
	| 'recentModel/storeIdCollection'
	| 'recentModel/deleteFromChatIdCollection'
	| 'recentModel/deleteFromCopilotIdCollection'
	| 'recentModel/deleteFromChannelIdCollection'
	| 'recentModel/deleteFromCollabIdCollection'
	| 'recentModel/deleteFromTaskIdCollection'
	| 'recentModel/add'
	| 'recentModel/update'
	| 'recentModel/delete'
;

export type RecentSetIdCollectionActions =
	'setChat'
	| 'setCollab'
	| 'setCopilot'
	| 'setChannel'
	;
export type RecentStoreIdCollectionActions = 'setFirstPageByTab';

export interface RecentSetIdCollectionData extends PayloadData
{
	itemIds: Array<string>;
}

export interface RecentStoreIdCollectionData extends PayloadData
{
	tab: string;
	itemIds: Array<string>;
}

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

export interface RecentDeleteData extends PayloadData
{
	id: string;
}
