type ForwardRunActionError = {
	code?: string,
	customData?: { uuid?: string },
};

export type ForwardUuidMap = { [uuid: string]: number };

export type ForwardDeliveryResponse = {
	id?: number,
	uuidMap?: { [uuid: string]: number },
	failureMap?: { [uuid: string]: string },
	errors?: ForwardRunActionError[],
};

export type ForwardMessageResult = {
	uuid: string,
	messageId: number,
	state: string,
	deliveredMessageId?: number,
	code?: string,
	retryable: boolean,
	failureGroup?: string,
};

export type ForwardRecipientResult = {
	dialogId: string,
	dialogTitle: string,
	state: string,
	displayReason?: string,
	messages: ForwardMessageResult[],
};

export type ForwardOperationResult = {
	operationId: string,
	attempt: number,
	isRetry: boolean,
	totalRecipients: number,
	successfulRecipients: number,
	hasRetryableDeliveries: boolean,
	recipients: ForwardRecipientResult[],
};
