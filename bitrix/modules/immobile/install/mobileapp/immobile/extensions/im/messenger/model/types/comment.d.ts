import {DialogId} from "../../types/common";
import {MessagesModelState} from "./messages";
import {Pin, PinModelCollection} from "./messages/pin";
import {MessengerModel} from "./base";

declare type CommentInfo = {
	chatId: number,
	dialogId: DialogId,
	messageId: number,
	lastUserIds: Array<number>,
	messageCount: number,
}

declare type CommentModelActions = 'commentModel/setComments'
	| 'commentModel/updateComment'
	| 'commentModel/setCounters'
	| 'commentModel/setCommentWithCounter'
	| 'commentModel/deleteComments'
;

declare type CommentModelMutation = 'commentModel/setComments'
	| 'commentModel/setCounters'
	| 'commentModel/setCommentsWithCounters'
	| 'commentModel/deleteComments'
;

declare type CommentsSetCommentsActions = 'setComments' | 'updateComment';
declare type CommentsSetCommentsData = {
	commentList: Array<CommentInfo>
}

declare type CommentsSetCountersActions = 'setCounters';
declare type CommentsSetCountersData = {
	chatCounterMap: Record<channelChatId, Record<commentChatId, number>>
}

declare type commentMessageId = number;
declare type channelChatId = number;
declare type commentChatId = number;

declare type CommentModelCollection = {
	commentCollection: Record<commentMessageId, CommentInfo>,
	countersCollection: Record<channelChatId, Record<commentChatId, number>>,
}

export type CommentMessengerModel = MessengerModel<CommentModelCollection>;