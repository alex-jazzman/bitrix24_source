import {
	Dom,
	Event,
	Loc,
	Runtime,
	Type,
} from 'main.core';

const LIMIT_SLIDER_CODE = 'limit_v2_mail_large_attachment_disk_upload';

export const CrmLargeAttachmentErrorCode = Object.freeze({
	NoSpace: 'MAIL_LA_NO_SPACE',
	DiskUnavailable: 'MAIL_LA_DISK_UNAVAILABLE',
	LinkUnavailable: 'MAIL_LA_LINK_UNAVAILABLE',
	AccessDenied: 'MAIL_LA_ACCESS_DENIED',
	InvalidContext: 'MAIL_LA_INVALID_CONTEXT',
	InvalidSendContract: 'MAIL_LA_INVALID_SEND_CONTRACT',
	InvalidSendResult: 'MAIL_LA_INVALID_SEND_RESULT',
	InvalidToken: 'MAIL_LA_INVALID_TOKEN',
	LinkMissing: 'MAIL_LA_LINK_MISSING',
	UploadFailed: 'MAIL_LA_UPLOAD_FAILED',
	TariffUnavailable: 'MAIL_LA_TARIFF_UNAVAILABLE',
});

type ErrorResponse = {
	ERROR_CODE?: unknown,
	errorCode?: unknown,
	errors?: Array<{ code?: unknown }>,
	data?: ErrorResponse,
};

type NotificationParams = {
	getContainer: () => HTMLElement | null,
	getIndicatorContainer?: () => HTMLElement | null,
};

type MessageBoxButton = {
	getContainer: () => HTMLElement,
};

type MessageBoxInstance = {
	close: () => void,
	show: () => void,
	getOkButton: () => MessageBoxButton,
	getCancelButton: () => MessageBoxButton,
};

type MessageBoxExtension = {
	MessageBox: {
		create: (options: Record<string, unknown>) => MessageBoxInstance,
	},
	MessageBoxButtons: {
		OK_CANCEL: string,
	},
};

type InfoHelperExtension = {
	FeaturePromotersRegistry: {
		getPromoter: (params: { code: string }) => { show: () => void },
	},
};

const loc = (key: string): string => Loc.getMessage(key) ?? '';

export function extractErrorCode(response: unknown): string
{
	if (!Type.isObjectLike(response))
	{
		return '';
	}

	const errorResponse = response as ErrorResponse;
	const directCode = errorResponse.ERROR_CODE ?? errorResponse.errorCode;
	if (Type.isString(directCode))
	{
		return directCode;
	}

	const collectionCode = errorResponse.errors?.[0]?.code;
	if (Type.isString(collectionCode))
	{
		return collectionCode;
	}

	return errorResponse.data ? extractErrorCode(errorResponse.data) : '';
}

export function isLargeAttachmentErrorCode(code: string): boolean
{
	return code.startsWith('MAIL_LA_');
}

export function getErrorMessageKey(code: string): string
{
	switch (code)
	{
		case CrmLargeAttachmentErrorCode.NoSpace:
			return 'CRM_LARGE_ATTACHMENT_ERROR_NO_SPACE';

		case CrmLargeAttachmentErrorCode.LinkMissing:
			return 'CRM_LARGE_ATTACHMENT_ERROR_LINK_MISSING';

		case CrmLargeAttachmentErrorCode.InvalidContext:
		case CrmLargeAttachmentErrorCode.InvalidSendContract:
		case CrmLargeAttachmentErrorCode.InvalidSendResult:
		case CrmLargeAttachmentErrorCode.InvalidToken:
			return 'CRM_LARGE_ATTACHMENT_ERROR_INVALID_CONTRACT';

		case CrmLargeAttachmentErrorCode.DiskUnavailable:
		case CrmLargeAttachmentErrorCode.LinkUnavailable:
		case CrmLargeAttachmentErrorCode.AccessDenied:
			return 'CRM_LARGE_ATTACHMENT_ERROR_UNAVAILABLE';

		default:
			return 'CRM_LARGE_ATTACHMENT_ERROR_UPLOAD';
	}
}

export class CrmLargeAttachmentNotification
{
	#getContainer: () => HTMLElement | null;
	#getIndicatorContainer: () => HTMLElement | null;
	#indicator: HTMLElement | null = null;
	#alert: HTMLElement | null = null;

	constructor(params: NotificationParams)
	{
		this.#getContainer = params.getContainer;
		this.#getIndicatorContainer = params.getIndicatorContainer ?? params.getContainer;
	}

	syncIndicator(fileIds: number[]): void
	{
		if (fileIds.length === 0)
		{
			Dom.remove(this.#indicator);
			this.#indicator = null;

			return;
		}

		if (this.#indicator?.isConnected)
		{
			return;
		}

		const container = this.#getIndicatorContainer();
		if (!container)
		{
			return;
		}

		const indicator = document.createElement('div');
		indicator.className = 'ui-alert ui-alert-primary';
		indicator.dataset.testid = 'crm-large-attachment-indicator';
		indicator.setAttribute('role', 'status');
		indicator.setAttribute('aria-live', 'polite');

		const message = document.createElement('span');
		message.className = 'ui-alert-message';
		message.textContent = loc('CRM_LARGE_ATTACHMENT_INDICATOR');
		indicator.append(message);
		Dom.append(indicator, container);
		this.#indicator = indicator;
	}

	showStatus(messageKey: string): void
	{
		this.#showAlert(messageKey, false);
	}

	showError(code: string, onRetry?: () => void): void
	{
		if (code === CrmLargeAttachmentErrorCode.TariffUnavailable)
		{
			this.showTariffUnavailable();

			return;
		}

		this.#showAlert(getErrorMessageKey(code), true, onRetry);
	}

	showNetworkError(): void
	{
		this.#showAlert('CRM_LARGE_ATTACHMENT_ERROR_NETWORK', true);
	}

	showTariffUnavailable(): void
	{
		void (Runtime.loadExtension('ui.info-helper') as unknown as Promise<InfoHelperExtension>)
			.then((extension: InfoHelperExtension): void => {
				extension.FeaturePromotersRegistry
					.getPromoter({ code: LIMIT_SLIDER_CODE })
					.show()
				;
			});
	}

	confirmDelete(onDelete: () => void): Promise<void>
	{
		const content = document.createElement('div');
		content.dataset.testid = 'crm-large-attachment-delete-confirmation';
		content.textContent = loc('CRM_LARGE_ATTACHMENT_DELETE_TEXT');

		return (Runtime.loadExtension('ui.dialogs.messagebox') as unknown as Promise<MessageBoxExtension>)
			.then((extension: MessageBoxExtension): void => {
				const messageBox = extension.MessageBox.create({
					title: loc('CRM_LARGE_ATTACHMENT_DELETE_TITLE'),
					message: content,
					okCaption: loc('CRM_LARGE_ATTACHMENT_DELETE_CONFIRM'),
					cancelCaption: loc('CRM_LARGE_ATTACHMENT_DELETE_CANCEL'),
					buttons: extension.MessageBoxButtons.OK_CANCEL,
					popupOptions: {
						closeByEsc: true,
					},
					onOk: (): void => {
						messageBox.close();
						onDelete();
					},
					onCancel: (): void => {
						messageBox.close();
					},
				});

				messageBox.getOkButton().getContainer().dataset.testid = 'crm-large-attachment-delete-button';
				messageBox.getCancelButton().getContainer().dataset.testid = 'crm-large-attachment-keep-button';
				messageBox.show();
			});
	}

	destroy(): void
	{
		Dom.remove(this.#indicator);
		Dom.remove(this.#alert);
		this.#indicator = null;
		this.#alert = null;
	}

	#showAlert(messageKey: string, critical: boolean, onRetry?: () => void): void
	{
		const container = this.#getContainer();
		if (!container)
		{
			return;
		}

		Dom.remove(this.#alert);

		const alert = document.createElement('div');
		alert.className = `ui-alert crm-large-attachment-notification ${
			critical ? 'ui-alert-danger' : 'ui-alert-primary'
		}`;
		alert.dataset.testid = 'crm-large-attachment-notification';
		alert.setAttribute('role', critical ? 'alert' : 'status');
		if (!critical)
		{
			alert.setAttribute('aria-live', 'polite');
		}

		const message = document.createElement('span');
		message.className = 'ui-alert-message';
		message.textContent = loc(messageKey);
		alert.append(message);

		if (onRetry)
		{
			const retryButton = document.createElement('button');
			retryButton.type = 'button';
			retryButton.className = 'ui-btn ui-btn-xs ui-btn-link';
			retryButton.dataset.testid = 'crm-large-attachment-retry-button';
			retryButton.textContent = loc('CRM_LARGE_ATTACHMENT_RETRY');
			Event.bind(retryButton, 'click', (): void => {
				Dom.remove(alert);
				if (this.#alert === alert)
				{
					this.#alert = null;
				}
				onRetry();
			});
			alert.append(retryButton);
		}

		Dom.prepend(alert, container);
		this.#alert = alert;
	}
}
