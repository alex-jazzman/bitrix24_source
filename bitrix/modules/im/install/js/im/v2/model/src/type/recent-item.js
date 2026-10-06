export type RecentItem = {
	dialogId: string,
	messageId: number | string,
	ownMessageId: number | string,
	draft: {
		text: string,
		date: ?Date
	},
	pinned: boolean,
	liked: boolean,
	invitation: {
		isActive: boolean,
		originator: number,
		canResend: boolean
	},
	isFakeElement: boolean, // invitation or fake element for new users
	isBirthdayPlaceholder: boolean,
	lastActivityDate: null | Date,
};
