/* eslint-disable */
type LargeAttachmentParams = {
	formId: string;
	uploaderControlId: string;
	messageId: number;
	featureAvailable: boolean;
	folderName: string;
	maxSize: number;
	mailboxId?: number | null;
	showAha?: boolean;
	ahaOptionName?: string;
	postSendPromptSuppressed?: boolean;
	postSendPromptOptionName?: string;
	draftLargeAttachments?: DraftLargeAttachment[];
	context?: LargeAttachmentContext;
	postSendPrompt?: PostSendPrompt;
};

type DraftLargeAttachment = ConvertResult & {
	sourceFileIds: number[];
	valid?: boolean;
};

type ConvertResult = {
	publicUrl: string;
	token: string;
	fileIds: number[];
	sourceFileIds?: number[];
	folderName: string;
};

type LargeAttachmentContext = 'mail' | 'crm';

type PostSendPrompt = (orphaned: InsertedLink[], onDelete: () => void) => void;

type InsertedLink = {
	publicUrl: string;
	token: string;
	fileIds: number[];
	sourceFileIds?: number[];
	folderName: string;
};

interface LargeAttachmentFormAdapter {
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

type FormAttachment = {
	id: number | null;
	size: number;
};

type LargeAttachmentSendContract = {
	token: string;
	fileIds: number[];
};

type AttachmentChangeType = 'add' | 'complete' | 'remove';

type FormAdapterUnsubscribe = () => void;

type LargeAttachmentState = 'pending' | 'converting' | 'converted' | 'error';

type LargeAttachmentSubmitState = 'ready' | 'pending' | 'restored' | 'error';

type MainMailFormAdapterParams = {
	formId: string;
	uploaderControlId: string;
	showAha?: boolean;
	ahaOptionName?: string;
};

type ConvertRequest = {
	mailboxId: number | null;
	fileIds: number[];
	replacementToken?: string;
};

type DeleteUploadedRequest = {
	token: string;
};

type DeleteUploadedResult = {
	deleted: boolean;
};

type ConvertError = {
	code: string;
	message: string;
};

declare namespace BX.Mail.Client {
	class LargeAttachment {
		static init(params: LargeAttachmentParams, formAdapter?: LargeAttachmentFormAdapter): LargeAttachment;
		static getDraftState(formId: string): DraftLargeAttachment[] | null;
		constructor(params: LargeAttachmentParams, formAdapter?: LargeAttachmentFormAdapter);
		getState(): LargeAttachmentState;
		prepareSubmit(): LargeAttachmentSubmitState;
		getDraftState(): DraftLargeAttachment[];
		destroy(): void;
	}

	class MainMailFormAdapter implements LargeAttachmentFormAdapter {
		readonly formId: string;
		constructor(params: MainMailFormAdapterParams);
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

	const ConvertErrorCode: Readonly<{
		TariffUnavailable: "MAIL_LA_TARIFF_UNAVAILABLE";
		AccessDenied: "MAIL_LA_ACCESS_DENIED";
		InvalidContext: "MAIL_LA_INVALID_CONTEXT";
		DiskUnavailable: "MAIL_LA_DISK_UNAVAILABLE";
		DiskFeatureUnavailable: "MAIL_LA_DISK_FEATURE_UNAVAILABLE";
		NoSpace: "MAIL_LA_NO_SPACE";
		UploadFailed: "MAIL_LA_UPLOAD_FAILED";
	}>;

	const largeAttachmentApi: LargeAttachmentApi;

	class LargeAttachmentApi {
		convert(request: ConvertRequest, context?: LargeAttachmentContext): Promise<ConvertResult>;
		deleteUploaded(request: DeleteUploadedRequest): Promise<DeleteUploadedResult>;
		finalizeReplacement(previousToken: string, currentToken: string): Promise<void>;
	}
}
