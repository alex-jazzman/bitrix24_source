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
	isUserSubscribed: boolean,
}

declare type CommentModelActions = 'commentModel/setComments'
	| 'commentModel/setComment'
	| 'commentModel/updateComment'
	| 'commentModel/setCounters'
	| 'commentModel/setCommentWithCounter'
	| 'commentModel/deleteComments'
	| 'commentModel/deleteChannelCounters'
	| 'commentModel/subscribe'
	| 'commentModel/unsubscribe'
;

declare type CommentModelMutation = 'commentModel/setComments'
	| 'commentModel/setCounters'
	| 'commentModel/setCommentsWithCounters'
	| 'commentModel/deleteComments'
	| 'commentModel/deleteChannelCounters'
;

declare type CommentsSetCommentsActions = 'setComments' | 'updateComment'| 'setComment';
declare type CommentsSetCommentsData = {
	commentList: Array<CommentInfo>
}

declare type CommentsSetCountersActions = 'setCounters';
declare type CommentsSetCountersData = {
	chatCounterMap: Record<channelChatId, Record<commentChatId, number>>
}

declare type CommentsDeleteChannelCountersActions = 'commentModel/deleteChannelCounters';
declare type CommentsDeleteChannelCountersData = {
	channelId: number,
	commentChatIdList: Array<number>,
}

declare type commentMessageId = number;
declare type channelChatId = number;
declare type commentChatId = number;

declare type CommentModelCollection = {
	commentCollection: Record<commentMessageId, CommentInfo>,
	countersCollection: Record<channelChatId, Record<commentChatId, number>>,
}

export type CommentMessengerModel = MessengerModel<CommentModelCollection>;