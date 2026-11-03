export type LaunchAnswer = {
	chatId: number,
	errorCode: string,
	limitCode: string,
};

export type LaunchResponse = {
	data?: { chatId?: number },
};

export type ServerError = {
	code?: string,
	customData?: { limitCode?: string },
};
