export type RecentItem = {
	dialogId: string,
	chatId: number,
	messageId: number | string,
	sessionId: number,
	draft: {
		text: string,
		date: ?Date
	},
	pinned: boolean,
	liked: boolean,
};
