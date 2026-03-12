declare type MessagesContextOptions = {
	targetMessageId: string | number,
	withMessageHighlight: boolean,
	targetMessagePosition: string,
}

export type UpdateMessageByIdUpdatingBlocksParam = UpdatingBlocksEnum | null;

export enum UpdatingBlocksEnum {
	status = 'status',
	showAvatar = 'showAvatar',
	isAuthorBottomMessage = 'isAuthorBottomMessage',
	isAuthorTopMessage = 'isAuthorTopMessage',
	showUsername = 'showUsername',
	commentInfo = 'commentInfo',
	vote ='vote',
	reactionAnimate ='reaction_animate_',
	withoutUi ='without-ui',
	aiAnimation ='aiAnimation',
}
