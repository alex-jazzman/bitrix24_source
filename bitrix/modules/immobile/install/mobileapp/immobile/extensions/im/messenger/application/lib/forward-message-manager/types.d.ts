declare type ForwardRecipient = {
	id: string,
	title?: string,
	imageUrl?: string,
};

declare type ForwardMessageStartParams = {
	fromDialogId: DialogId,
	messageIds: number[],
	recipients: ForwardRecipient[],
};

declare type ForwardMessageManagerOptions = {
	sendingService: {
		sendForwardMessages: (params: ForwardTransportParams) => Promise<ForwardTransportResponse>,
	},
	uuidFactory?: () => string,
	onOperationFinished?: (
		result: ForwardOperationResult,
		meta: { attempt: 'initial' | 'retry', fromDialogId: DialogId },
	) => void | Promise<void>,
	platformProvider?: () => string,
};

declare type ForwardMessageOperationOptions = {
	operationId: string,
	fromDialogId: DialogId,
	messageIds: number[],
	recipients: ForwardRecipient[],
	uuidFactory: () => string,
};

declare type ForwardTransportParams = {
	dialogId: string,
	forwardIds: Record<string, number>,
};

declare type ForwardTransportResponse = {
	id?: number | null,
	uuidMap?: Record<string, number>,
	failureMap?: Record<string, string>,
};

declare type ForwardOperationResult = {
	operationId: string,
	totalRecipients: number,
	succeededRecipients: number,
	failedRecipients: ForwardRecipientResult[],
	recipients: ForwardRecipientResult[],
	interruptedByBackground: boolean,
};

declare type ForwardRecipientResult = {
	recipient: ForwardRecipient,
	succeeded: boolean,
	reason: 'retryable' | 'storageFull' | 'fileUnavailable' | 'chatUnavailable' | 'notWritable' | null,
	retryable: boolean,
	requestOutcome: 'known' | 'unknown' | null,
	deliveries: ForwardDeliveryResult[],
};

declare type ForwardDeliveryResult = {
	messageId: number,
	uuid: string,
	status: 'queued' | 'inFlight' | 'succeeded' | 'failed' | 'unknown',
	failureCode: string | null,
	failureGroup: 'retryable' | 'storageFull' | 'fileUnavailable' | 'chatUnavailable' | 'notWritable' | null,
	attempts: number,
};
