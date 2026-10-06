/* eslint-disable */
type MainMailLargeAttachmentParams = Omit<BX.Mail.Client.LargeAttachmentParams, 'context' | 'postSendPrompt'>;

type LegacyEmailLargeAttachmentParams = {
	formId: string;
	uploaderControlId: string;
	lheJsName: string;
	messageId: number;
	featureAvailable: boolean;
	folderName: string;
	maxSize: number;
	getContainer: () => HTMLElement | null;
};

type LegacyEmailAdapterParams = {
	formId: string;
	uploaderControlId: string;
	lheJsName: string;
	getContainer: () => HTMLElement | null;
};

type FormAdapterUnsubscribe = () => void;

type MainMailFormAdapterParams = {
	formId: string;
	uploaderControlId: string;
	showAha?: boolean;
	ahaOptionName?: string;
};

type NotificationParams = {
	getContainer: () => HTMLElement | null;
	getIndicatorContainer?: () => HTMLElement | null;
};

declare namespace BX.Crm.Mail {
	class LargeAttachment {
		static init(params: MainMailLargeAttachmentParams): BX.Mail.Client.LargeAttachment;
		static initLegacy(params: LegacyEmailLargeAttachmentParams): LegacyEmailLargeAttachment;
	}

	class LegacyEmailLargeAttachment {
		constructor(params: LegacyEmailLargeAttachmentParams);
		beforeSubmit(): boolean;
		applySendContract(data: Record<string, unknown>): Record<string, unknown>;
		handleSendSuccess(): void;
		handleSendError(response: unknown): boolean;
		getState(): BX.Mail.Client.LargeAttachmentState;
		destroy(): void;
	}

	class LegacySubmitGuard {
		tryStart(state: BX.Mail.Client.LargeAttachmentState, hasPendingUploads: boolean): boolean;
		finish(): void;
	}

	class LegacyEmailAdapter implements BX.Mail.Client.LargeAttachmentFormAdapter {
		readonly formId: string;
		constructor(params: LegacyEmailAdapterParams);
		getFiles(): BX.Mail.Client.FormAttachment[];
		getBody(): string;
		insertBody(_text: string, html: string): boolean;
		setBody(html: string): boolean;
		serializeSendContracts(contracts: BX.Mail.Client.LargeAttachmentSendContract[]): boolean;
		getSendContracts(): BX.Mail.Client.LargeAttachmentSendContract[];
		hasPendingUploads(): boolean;
		syncIndicator(fileIds: number[]): void;
		showUploadError(onRetry?: () => void): void;
		showNoSpaceError(onRetry?: () => void): void;
		showTariffUnavailable(): void;
		showAha(): void;
		showSubmitPending(): void;
		showLinkRestored(): void;
		showLinkMissing(): void;
		routeSendError(response: unknown): void;
		confirmDelete(onDelete: () => void): void;
		subscribeFileChange(handler: (type: BX.Mail.Client.AttachmentChangeType) => void): FormAdapterUnsubscribe;
		subscribeSubmit(handler: (body: string) => void): FormAdapterUnsubscribe;
		subscribeSendSuccess(handler: () => void): FormAdapterUnsubscribe;
		subscribeSendError(handler: () => void): FormAdapterUnsubscribe;
		subscribeDestroy(handler: () => void): FormAdapterUnsubscribe;
		notifySubmit(): void;
		notifySendSuccess(): void;
		notifySendError(): void;
		destroy(): void;
	}

	class MainMailFormAdapter extends BX.Mail.Client.MainMailFormAdapter {
		constructor(params: MainMailFormAdapterParams);
		serializeSendContracts(contracts: BX.Mail.Client.LargeAttachmentSendContract[]): boolean;
		syncIndicator(fileIds: number[]): void;
		showUploadError(onRetry?: () => void): void;
		showNoSpaceError(onRetry?: () => void): void;
		showTariffUnavailable(): void;
		subscribeSendSuccess(handler: () => void): () => void;
		subscribeSendError(handler: () => void): () => void;
		startErrorRouting(): void;
		startSubmitGuard(prepareSubmit: () => 'ready' | 'pending' | 'restored' | 'error'): void;
		confirmDelete(onDelete: () => void): void;
		destroy(): void;
	}

	const CrmLargeAttachmentErrorCode: Readonly<{
		NoSpace: "MAIL_LA_NO_SPACE";
		DiskUnavailable: "MAIL_LA_DISK_UNAVAILABLE";
		LinkUnavailable: "MAIL_LA_LINK_UNAVAILABLE";
		AccessDenied: "MAIL_LA_ACCESS_DENIED";
		InvalidContext: "MAIL_LA_INVALID_CONTEXT";
		InvalidSendContract: "MAIL_LA_INVALID_SEND_CONTRACT";
		InvalidSendResult: "MAIL_LA_INVALID_SEND_RESULT";
		InvalidToken: "MAIL_LA_INVALID_TOKEN";
		LinkMissing: "MAIL_LA_LINK_MISSING";
		UploadFailed: "MAIL_LA_UPLOAD_FAILED";
		TariffUnavailable: "MAIL_LA_TARIFF_UNAVAILABLE";
	}>;

	class CrmLargeAttachmentNotification {
		constructor(params: NotificationParams);
		syncIndicator(fileIds: number[]): void;
		showStatus(messageKey: string): void;
		showError(code: string, onRetry?: () => void): void;
		showNetworkError(): void;
		showTariffUnavailable(): void;
		confirmDelete(onDelete: () => void): Promise<void>;
		destroy(): void;
	}

	function extractErrorCode(response: unknown): string;

	function getErrorMessageKey(code: string): string;
}
