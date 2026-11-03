import { DialogId } from '../../../types/common';
import { MessengerModel } from '../../base';

declare type CommentInfoModelState = {
	chatId: number,
	dialogId: DialogId,
	messageId: number,
	lastUserIds: Array<number>,
	messageCount: number,
	isUserSubscribed: boolean,
	showLoader: boolean,
}

declare type RelationCommentInfo = {
	commentChatId: number,
	parentMessageId: number,
	parentChatId: number,
	// absent while the element of the model has no data of the plate yet
	messageCount?: number,
	lastUserIds?: Array<number>,
};

// a cell of the commentInfo section with the parent chat resolved by its consumer
declare type RestCommentInfo = CommentInfoModelState & {
	parentChatId: number,
};

declare type CommentModelActions = 'commentModel/setComments'
	| 'commentModel/setCommentsFromSync'
	| 'commentModel/setComment'
	| 'commentModel/setFromLocalDatabase'
	| 'commentModel/updateComment'
	| 'commentModel/setCounters'
	| 'commentModel/setCommentWithCounter'
	| 'commentModel/deleteComments'
	| 'commentModel/deleteChannelCounters'
	| 'commentModel/clearAllCounters'
	| 'commentModel/subscribe'
	| 'commentModel/unsubscribe'
	| 'commentModel/showLoader'
	| 'commentModel/hideLoader'
	;

declare type CommentModelMutation = 'commentModel/setComments'
	| 'commentModel/setCounters'
	| 'commentModel/setCommentsWithCounters'
	| 'commentModel/deleteComments'
	| 'commentModel/deleteChannelCounters'
	;

declare type CommentsSetCommentsActions = 'setComments'
	| 'setCommentsFromSync'
	| 'updateComment'
	| 'setComment'
	| 'setFromLocalDatabase';
declare type CommentsSetCommentsData = {
	commentList: Array<CommentInfoModelState>
}

declare type CommentsSetCountersActions = 'setCounters' | 'clearAllCounters';
declare type CommentsSetCountersData = {
	chatCounterMap: Record<channelChatId, Record<commentChatId, number>>,
	affectedChannels?: Array<number>, // for clearAllCounters action
	affectedComments?: Array<number>, // for clearAllCounters action
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
	commentCollection: Record<commentMessageId, CommentInfoModelState>,
	countersCollection: Record<channelChatId, Record<commentChatId, number>>,
}

export type CommentMessengerModel = MessengerModel<CommentModelCollection>;
