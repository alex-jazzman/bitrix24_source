import { MessengerModel, PayloadData } from '../../base';
import { DialogType } from '../../dialogues/src/types';

declare type AnchorModelActions = (
	'anchorModel/setState'
	| 'anchorModel/add'
	| 'anchorModel/delete'
	| 'anchorModel/deleteByChatId'
	| 'anchorModel/deleteByMessageId'
	| 'anchorModel/deleteByMessageIdList'
	| 'anchorModel/updateByAuthorId'
	| 'anchorModel/clear'
	| 'anchorModel/clearByDialogType'
);

export type AnchorModelActionParams = {
	'anchorModel/setState': Array<AnchorModelState>;
	'anchorModel/add': AnchorModelState;
	'anchorModel/delete': AnchorModelState;
	'anchorModel/deleteByChatId': { chatId: number };
	'anchorModel/deleteByMessageId': { messageId: number };
	'anchorModel/deleteByMessageIdList': {chatId: number, messageIdList: Array<number>};
	'anchorModel/updateByAuthorId': AnchorModelState;
	'anchorModel/clear': void;
	'anchorModel/clearByDialogType': { dialogType: DialogType };
};

declare type AnchorModelState = {
	chatId: number,
	fromUserId: number,
	messageId: number,
	parentChatId: number,
	subType: string,
	type: 'MENTION' | 'REACTION',
};

declare type AnchorModelMutation = (
	'anchorModel/setState'
	| 'anchorModel/add'
	| 'anchorModel/delete'
	| 'anchorModel/deleteMany'
	| 'anchorModel/updateByAuthorId'
);

export interface AnchorSetStateData extends PayloadData
{
	collection: Record<string, Array<AnchorModelState>>,
}

export interface AnchorAddData extends PayloadData
{
	anchor: AnchorModelState,
}

export interface AnchorUpdateByAuthorIdData extends PayloadData
{
	anchor: AnchorModelState,
}

export interface AnchorDeleteData extends PayloadData
{
	anchor: AnchorModelState,
}

export interface AnchorDeleteManyData extends PayloadData
{
	anchorList: AnchorModelState[],
}

export type AnchorSetStateAction = 'setState';
export type AnchorAddAction = 'add';
export type AnchorDeleteAction = 'delete';
export type AnchorUpdateByAuthorIdAction = 'updateByAuthorId';
export type AnchorDeleteManyAction = 'deleteMany';

export type AnchorModelCollection = {
	collection: Record<string, Array<AnchorModelState>>,
}

export type AnchorMessengerModel = MessengerModel<AnchorModelCollection>;
