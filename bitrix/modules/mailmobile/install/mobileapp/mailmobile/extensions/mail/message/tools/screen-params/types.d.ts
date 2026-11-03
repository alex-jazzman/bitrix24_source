declare type MessageScreenParams = {
	threadId: number | string | null,
	isCrmMessage: number,
	folder: string,
	source: string,
	startEmailSender: object | null,
	act: string,
	mailUfMessageToken: string,
};
