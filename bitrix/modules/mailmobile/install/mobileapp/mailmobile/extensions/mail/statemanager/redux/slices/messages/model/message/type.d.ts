declare type MessageReduxModel = {
	id: number,
	to: object[],
	from: object[],
	date: string,
	isRead: number,
	isRemoved: boolean,
	isSelected: boolean,
	subject: string,
	abbreviatedText: string,
};
