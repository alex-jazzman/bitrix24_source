import {BaseBuilderBlockType} from '../types/builder';
import {MessengerModel} from "../../../base";
import {MessageId} from "../../../../types/common";

export type BuilderMessengerModel = MessengerModel<BuilderModelCollection>;

declare type BuilderModelCollection = {
	collection: Record<MessageId, BuilderModelState>,
}

declare type BuilderModelState = {
	blocks: Array<BaseBuilderBlockType>,
}

declare type BuilderModelSetPayload = {
	messageId: number | string,
	builder: { blocks: Array<BaseBuilderBlockType> },
	actionName?: string,
}

declare type BuilderModelAppendBlockPayload = {
	messageId: number | string,
	block: BaseBuilderBlockType,
	text: string,
}

declare type BuilderModelUpdateBlockPayload = {
	messageId: number | string,
	blockId: string,
	block: BaseBuilderBlockType,
	text: string,
}

declare type BuilderModelDeleteBlockPayload = {
	messageId: number | string,
	blockId: string,
	text: string,
}

declare type BuilderModelSetListPayload = {
	messages: Array<{ id: number | string, builder?: { blocks: Array<BaseBuilderBlockType> } | null }>,
	actionName?: string,
}

declare type BuilderModelDeleteByChatIdPayload = {
	chatId: number | string,
}

declare type BuilderSetData = {
	messageId: number | string,
	blocks: Array<BaseBuilderBlockType>,
}

declare type BuilderUpdateData = BuilderSetData;

declare type BuilderDeleteData = {
	messageId: number | string,
}

declare type BuilderSetListData = {
	builderList: Array<{ messageId: number | string, blocks: Array<BaseBuilderBlockType> }>,
}

declare type BuilderDeleteByChatIdData = {
	messageIdList: Array<number | string>,
}

export type BuilderMessengerModelActions =
	'messagesModel/builderModel/set'
	| 'messagesModel/builderModel/setList'
	| 'messagesModel/builderModel/appendBlock'
	| 'messagesModel/builderModel/updateBlock'
	| 'messagesModel/builderModel/deleteBlock'
	| 'messagesModel/builderModel/delete'
	| 'messagesModel/builderModel/deleteByIdList'
	| 'messagesModel/builderModel/deleteByChatId';

export type BuilderMessengerModelMutation =
	'messagesModel/builderModel/set'
	| 'messagesModel/builderModel/setList'
	| 'messagesModel/builderModel/update'
	| 'messagesModel/builderModel/delete'
	| 'messagesModel/builderModel/deleteByIdList';
