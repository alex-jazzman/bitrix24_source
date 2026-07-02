export type QuickReply = {
	id: number,
	name: string,
	text: string,
	sectionId: number,
	canEdit: boolean,
	rating: number,
};

export type QuickReplySection = {
	id: number,
	name: string,
	code: string,
};
