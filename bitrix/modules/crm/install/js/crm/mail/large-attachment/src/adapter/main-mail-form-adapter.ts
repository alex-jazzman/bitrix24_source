import {
	MainMailFormAdapter as MailMainMailFormAdapter,
	type LargeAttachmentSendContract,
} from 'mail.client.large-attachment';

import { serializeMainMailSendContracts } from './main-mail-send-contract';
import { isSuccessfulSendResponse } from './send-response';
import {
	CrmLargeAttachmentNotification,
	extractErrorCode,
	isLargeAttachmentErrorCode,
} from '../notification';

export type MainMailFormAdapterParams = {
	formId: string,
	uploaderControlId: string,
	showAha?: boolean,
	ahaOptionName?: string,
};

type MailFormInstance = object;

type MailFormRegistry = {
	getForm(formId: string): MailFormInstance | null,
};

type LegacyEventBus = {
	addCustomEvent(target: object, eventName: string, handler: (...args: unknown[]) => void): void,
	removeCustomEvent(target: object, eventName: string, handler: (...args: unknown[]) => void): void,
	PreventDefault(event: unknown): void,
};

const MailFormEvent = Object.freeze({
	Submit: 'MailForm:submit',
	Success: 'MailForm:submit:ajaxSuccess',
	Failure: 'MailForm:submit:ajaxFailure',
});

export class MainMailFormAdapter extends MailMainMailFormAdapter
{
	#notification: CrmLargeAttachmentNotification;
	#errorRoutingUnsubscribes: Array<() => void> = [];
	#destroyed: boolean = false;

	constructor(params: MainMailFormAdapterParams)
	{
		super(params);
		this.#notification = new CrmLargeAttachmentNotification({
			getContainer: (): HTMLElement | null => (
				document
					.getElementById(params.formId)
					?.querySelector<HTMLElement>('.main-mail-form-editor-wrapper')
				?? null
			),
			getIndicatorContainer: (): HTMLElement | null => {
				const form = document.getElementById(params.formId);

				return form?.querySelector<HTMLElement>('.diskuf-selectdialog')
					?? form?.querySelector<HTMLElement>('.main-mail-form-editor-wrapper')
					?? null
				;
			},
		});
	}

	serializeSendContracts(contracts: LargeAttachmentSendContract[]): boolean
	{
		return serializeMainMailSendContracts(this.formId, contracts);
	}

	syncIndicator(fileIds: number[]): void
	{
		this.#notification.syncIndicator(fileIds);
	}

	showUploadError(onRetry?: () => void): void
	{
		this.#notification.showError('', onRetry);
	}

	showNoSpaceError(onRetry?: () => void): void
	{
		this.#notification.showError('MAIL_LA_NO_SPACE', onRetry);
	}

	showTariffUnavailable(): void
	{
		this.#notification.showTariffUnavailable();
	}

	subscribeSendSuccess(handler: () => void): () => void
	{
		return this.#subscribeMailFormEvent(
			MailFormEvent.Success,
			(_form: unknown, response: unknown): void => {
				if (isSuccessfulSendResponse(response))
				{
					handler();
				}
			},
		);
	}

	subscribeSendError(handler: () => void): () => void
	{
		const unsubscribeFailure = this.#subscribeMailFormEvent(MailFormEvent.Failure, handler);
		const unsubscribeErrorResponse = this.#subscribeMailFormEvent(
			MailFormEvent.Success,
			(_form: unknown, response: unknown): void => {
				if (!isSuccessfulSendResponse(response))
				{
					handler();
				}
			},
		);

		return (): void => {
			unsubscribeFailure();
			unsubscribeErrorResponse();
		};
	}

	startErrorRouting(): void
	{
		if (this.#errorRoutingUnsubscribes.length > 0)
		{
			return;
		}

		this.#errorRoutingUnsubscribes = [
			this.#subscribeMailFormEvent(
				MailFormEvent.Success,
				(_form: unknown, response: unknown): void => {
					const code = extractErrorCode(response);
					if (
						!isSuccessfulSendResponse(response)
						&& isLargeAttachmentErrorCode(code)
					)
					{
						this.#notification.showError(code);
					}
				},
			),
			this.#subscribeMailFormEvent(
				MailFormEvent.Failure,
				(): void => {
					this.#notification.showNetworkError();
				},
			),
		];
	}

	startSubmitGuard(prepareSubmit: () => 'ready' | 'pending' | 'restored' | 'error'): void
	{
		this.#errorRoutingUnsubscribes.push(
			this.#subscribeMailFormEvent(
				MailFormEvent.Submit,
				(_form: unknown, event: unknown): void => {
					const submitState = prepareSubmit();
					if (submitState === 'ready')
					{
						return;
					}

					(BX as unknown as LegacyEventBus).PreventDefault(event);
					if (submitState === 'pending')
					{
						this.#notification.showStatus('CRM_LARGE_ATTACHMENT_WAIT_UPLOAD');
					}
					else if (submitState === 'restored')
					{
						this.#notification.showStatus('CRM_LARGE_ATTACHMENT_LINK_RESTORED');
					}
					else
					{
						this.#notification.showError('MAIL_LA_LINK_MISSING');
					}
				},
			),
		);
	}

	confirmDelete(onDelete: () => void): void
	{
		void this.#notification.confirmDelete(onDelete);
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#errorRoutingUnsubscribes.forEach((unsubscribe: () => void): void => {
			unsubscribe();
		});
		this.#errorRoutingUnsubscribes = [];
		this.#notification.destroy();
		super.destroy();
	}

	#subscribeMailFormEvent(
		eventName: string,
		handler: (...args: unknown[]) => void,
	): () => void
	{
		const form = this.#resolveForm();
		if (!form)
		{
			return (): void => {};
		}

		const bus = BX as unknown as LegacyEventBus;
		bus.addCustomEvent(form, eventName, handler);

		return (): void => {
			bus.removeCustomEvent(form, eventName, handler);
		};
	}

	#resolveForm(): MailFormInstance | null
	{
		const registry = (window as unknown as { BXMainMailForm?: MailFormRegistry }).BXMainMailForm;

		return registry?.getForm(this.formId) ?? null;
	}
}
