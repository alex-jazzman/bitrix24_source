export type LabelDto = {
	id: number,
	name: string,
	mailboxId: number,
	sort: number,
	unread: number,
};

export type LabelCounters = {
	[labelId: string]: number,
};
