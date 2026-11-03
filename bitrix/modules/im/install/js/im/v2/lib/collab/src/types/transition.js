export type CollabTransitionCandidate = {
	chatId: number,
	dialogId: string,
	lastMessageId: number,
	isParent: boolean,
	// The chat whose message the project row of the recent list shows.
	isShownInRecent: boolean,
};
