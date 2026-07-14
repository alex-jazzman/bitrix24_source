import {BaseBlockElementType, BlockBackgroundType} from '../types/block';
import {MessengerModel} from "../../../base";
import {MessageId} from "../../../../types/common";

export type BlockMessengerModel = MessengerModel<BlockModelCollection>;

declare type BlockModelCollection = {
	collection: Record<MessageId, BlockModelState>,
}

declare type BlockModelState = {
	elements: Array<BaseBlockElementType>,
	background?: BlockBackgroundType,
}

declare type BlockModelSetPayload = {
	messageId: number | string,
	block: { elements?: Array<BaseBlockElementType>, blocks?: Array<BaseBlockElementType>, config?: { background?: BlockBackgroundType }, background?: BlockBackgroundType },
	actionName?: string,
}

declare type BlockModelAppendElementPayload = {
	messageId: number | string,
	element: BaseBlockElementType,
	text: string,
	files?: Array<number>,
}

declare type BlockModelUpdateElementPayload = {
	messageId: number | string,
	elementId: string,
	element: BaseBlockElementType,
	text: string,
	files?: Array<number>,
}

declare type BlockModelDeleteElementPayload = {
	messageId: number | string,
	elementId: string,
	text: string,
}

declare type BlockModelSetListPayload = {
	messages: Array<{ id: number | string, block?: { elements?: Array<BaseBlockElementType>, config?: { background?: BlockBackgroundType } } | null }>,
	actionName?: string,
}

declare type BlockModelDeleteByChatIdPayload = {
	chatId: number | string,
}

declare type BlockSetData = {
	messageId: number | string,
	elements: Array<BaseBlockElementType>,
	background?: BlockBackgroundType,
}

declare type BlockUpdateData = BlockSetData;

declare type BlockDeleteData = {
	messageId: number | string,
}

declare type BlockSetListData = {
	blockList: Array<{ messageId: number | string, elements: Array<BaseBlockElementType>, background?: BlockBackgroundType }>,
}

declare type BlockDeleteByChatIdData = {
	messageIdList: Array<number | string>,
}

export type BlockMessengerModelActions =
	'messagesModel/blockModel/set'
	| 'messagesModel/blockModel/setList'
	| 'messagesModel/blockModel/appendElement'
	| 'messagesModel/blockModel/updateElement'
	| 'messagesModel/blockModel/deleteElement'
	| 'messagesModel/blockModel/delete'
	| 'messagesModel/blockModel/deleteByIdList'
	| 'messagesModel/blockModel/deleteByChatId'
	| 'messagesModel/blockModel/updateWithId';

export type BlockMessengerModelMutation =
	'messagesModel/blockModel/set'
	| 'messagesModel/blockModel/setList'
	| 'messagesModel/blockModel/update'
	| 'messagesModel/blockModel/delete'
	| 'messagesModel/blockModel/deleteByIdList'
	| 'messagesModel/blockModel/updateWithId';
