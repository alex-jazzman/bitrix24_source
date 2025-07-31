export type ChatOrChannelDetailed = {
	id: number,
	avatar: string,
	color: string,
	dialogId: string,
	isExtranet: boolean,
	originalNodeId: ?number,
	hasAccess: boolean,
	subtitle: string,
	title: string,
	type: string,
};

export type ChatListResponse = {
	channels: ChatOrChannelDetailed[],
	chats: ChatOrChannelDetailed[],
}
