/**
 * The shape shared by the candidate collector, the target selector
 * and the recent item selection service.
 */
declare type CollabTransitionCandidate = {
	chatId: number,
	/** `chat{chatId}`: opens the chat and reads its recent item */
	dialogId: string,
	/** comparison key; 0 means there is no key */
	lastMessageId: number,
	/** true only for the parent chat of the project */
	isParent: boolean,
	/** true for the chat whose message the project row of the recent list shows */
	isShownInRecent: boolean,
}
