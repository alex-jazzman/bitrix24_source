export type AttachmentChangeType = 'add' | 'complete' | 'remove';

export type FormAttachment = {
	id: number | null,
	size: number,
};

export type LargeAttachmentSendContract = {
	token: string,
	fileIds: number[],
};

export type FormAdapterUnsubscribe = () => void;

export interface LargeAttachmentFormAdapter
{
	readonly formId: string;

	getFiles(): FormAttachment[];
	getBody(): string;
	insertBody(text: string, html: string): boolean;
	setBody(html: string): boolean;
	serializeSendContracts(contracts: LargeAttachmentSendContract[]): boolean;
	syncIndicator(fileIds: number[]): void;
	showUploadError(onRetry?: () => void): void;
	showNoSpaceError(onRetry?: () => void): void;
	showTariffUnavailable(): void;
	showAha(): void;
	subscribeFileChange(handler: (type: AttachmentChangeType) => void): FormAdapterUnsubscribe;
	subscribeSubmit(handler: (body: string) => void): FormAdapterUnsubscribe;
	subscribeSendSuccess(handler: () => void): FormAdapterUnsubscribe;
	subscribeSendError(handler: () => void): FormAdapterUnsubscribe;
	subscribeDestroy(handler: () => void): FormAdapterUnsubscribe;
	destroy(): void;
}
