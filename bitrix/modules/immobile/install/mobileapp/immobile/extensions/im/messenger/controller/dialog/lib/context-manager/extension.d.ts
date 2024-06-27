declare type GoToMessageContextEvent = {
	dialogId: string | number,
	messageId: string | number,
	parentMessageId?: string,
	withMessageHighlight?: boolean,
	showNotificationIfUnsupported?: boolean,
}

declare type GoToLastReadMessageContextEvent = {
	dialogId: string | number,
}

declare type GoToBottomMessageContextEvent = {
	dialogId: string | number,
}

declare type GoToPostMessageContextEvent = {
	postMessageId: number,
	withMessageHighlight?: boolean,
}

declare type GoToMessageContextByCommentsChatIdEvent = {
	commentChatId: number,
	withMessageHighlight?: boolean,
}