import { MessengerModel, PayloadData } from '../../../base';

export type ReactionType = string;

export type RawReaction = {
	dialogId: string,
	messageId: number,
	reactionCounters: Record<ReactionType, number>
	reactionUsers: Record<ReactionType, Array<number>>
	ownReactions: Array<ReactionType>,
}

export type ReactionUser = {
	id: number,
	name: string,
	avatar: string,
};

type ReactionsModelSetPayload = {
	reactions: Array<RawReaction>,
	usersShort: Array<ReactionUser>,
}

type ReactionsModelSetReactionPayload = {
	dialogId: string,
	messageId: number,
	userId: number,
	reaction: ReactionType,
	actionName?: string,
}

type ReactionsModelSetReactionSilentPayload = ReactionsModelSetReactionPayload;

type ReactionsModelRemoveReactionPayload = {
	messageId: number,
	userId: number,
	reaction: ReactionType,
	actionName?: string,
}

type ReactionsModelRemoveReactionSilentPayload = ReactionsModelRemoveReactionPayload;


type ReactionsDeleteByChatIdPayload = {
	chatId: number
}

type ReactionsModelState = {
	dialogId: string,
	messageId: number,
	// @ts-ignore
	ownReactions: Set<ReactionType>,
	reactionCounters: Record<ReactionType, number>,
	// @ts-ignore
	reactionUsers: Map<ReactionType, Array<number>>,
}

type MessageId = number | string

export type ReactionsMessengerModel = MessengerModel<ReactionsModelCollection>;

declare type ReactionsModelCollection = {
	collection: Record<MessageId, ReactionsModelState>
}

export type ReactionsModelActions =
	'messagesModel/reactionsModel/store'
	| 'messagesModel/reactionsModel/set'
	| 'messagesModel/reactionsModel/setFromSync'
	| 'messagesModel/reactionsModel/setFromLocalDatabase'
	| 'messagesModel/reactionsModel/setFromPullEvent'
	| 'messagesModel/reactionsModel/setReaction'
	| 'messagesModel/reactionsModel/setReactionSilent'
	| 'messagesModel/reactionsModel/removeReaction'
	| 'messagesModel/reactionsModel/removeReactionSilent'
	| 'messagesModel/reactionsModel/deleteByChatId'


export type ReactionsModelMutation =
	'messagesModel/reactionsModel/store'
	| 'messagesModel/reactionsModel/set'
	| 'messagesModel/reactionsModel/add'
	| 'messagesModel/reactionsModel/updateWithId'
	| 'messagesModel/reactionsModel/deleteByChatId'


export interface ReactionsStoreData extends PayloadData
{
	reactionList: Array<ReactionsModelState>;
}


export type ReactionsSetActions =
	'setFromPullEvent'
	| 'set'
	;
export interface ReactionsSetData extends PayloadData
{
	reactionList: Array<ReactionsModelState>;
}


export type ReactionsAddActions = 'setReaction';
export interface ReactionsAddData extends PayloadData
{
	reaction: ReactionsModelState;
}


export type ReactionsUpdateWithIdActions =
	'setReaction'
	| 'setReactionSilent'
	| 'removeReaction'
	| 'removeReactionSilent'
	;
export interface ReactionsUpdateWithIdData extends PayloadData
{
	reaction: ReactionsModelState;
}

export type ReactionsDeleteByChatIdActions = 'deleteByChatId';
export interface ReactionsDeleteByChatIdData extends PayloadData
{
	messageIdList: Array<MessageId>;
}
