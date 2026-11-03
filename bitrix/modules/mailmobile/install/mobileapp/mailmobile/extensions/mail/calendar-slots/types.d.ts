type MailCalendarSlotsProps = {
	layoutWidget?: LayoutWidget,
	onInsertLink: (shortUrl: string) => Promise<void> | void,
	ownerEntity?: {
		ownerType?: string | number,
		ownerId?: string | number,
	},
	isCrmMessage?: boolean | number,
};

type MailCalendarSlotsState = {
	creatingLink: boolean,
	initFailed: boolean,
	loading: boolean,
	model: object,
};
