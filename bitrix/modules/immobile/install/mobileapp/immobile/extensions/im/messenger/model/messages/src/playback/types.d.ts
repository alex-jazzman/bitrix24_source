import { MessengerModel, PayloadData } from '../../../base';
import { DialogId } from '../../../../types/common';

type MessageId = number | string

export type PlaybackModelSetPayload = PlaybackModelState & {
	dialogId: DialogId,
	messageId: MessageId,
}

export type PlaybackModelUpdatePayload = Partial<PlaybackModelState> & {
	dialogId: DialogId,
	messageId: MessageId,
}

export type PlaybackModelDeletePayload = {
	messageId: MessageId,
	dialogId: DialogId,
}

export type PlaybackModelState = {
	playingTime: number,
	isPlaying: boolean,
}

export type PlaybackMessengerModel = MessengerModel<PlaybackModelCollection>;
export type PlaybackModelByDialogId = Record<MessageId, PlaybackModelState>;

declare type PlaybackModelCollection = {
	collection: Record<DialogId, PlaybackModelByDialogId>
}

export type PlaybackModelActions =
	'messagesModel/playbackModel/set'
	| 'messagesModel/playbackModel/delete'
;

export type PlaybackModelMutation =
	'messagesModel/playbackModel/set'
	| 'messagesModel/playbackModel/delete'
;

export type PlaybackAddActions = 'add';
export interface PlaybackAddData extends PayloadData
{
	dialogId: DialogId,
	messageId: MessageId,
	playingTime: number,
	isPlaying: boolean,
}

export type PlaybackUpdateActions = 'update';
export interface PlaybackUpdateData extends PayloadData
{
	dialogId: DialogId,
	messageId: MessageId,
	playingTime: number,
	isPlaying: boolean,
}

export type PlaybackDeleteActions = 'delete';
export interface PlaybackDeleteData extends PayloadData
{
	dialogId: DialogId,
	messageId: MessageId,
}
