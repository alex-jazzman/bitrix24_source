import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { PopupManager } from 'main.popup';

import { AhaGuide } from '../aha-guide';
import {
	type AttachmentChangeType,
	type FormAdapterUnsubscribe,
	type FormAttachment,
	type LargeAttachmentFormAdapter,
	type LargeAttachmentSendContract,
} from '../type/form-adapter';

export type MainMailFormAdapterParams = {
	formId: string,
	uploaderControlId: string,
	showAha?: boolean,
	ahaOptionName?: string,
};

type DiskFile = {
	getSize(): number,
	getCustomData(property: string): unknown,
};

type UploaderControl = {
	getFiles(): DiskFile[],
};

type DiskUploaderGlobal = {
	Disk?: {
		Uploader?: {
			UserFieldControl?: {
				getById(id: string): UploaderControl | null,
			},
		},
	},
};

type MailFormInstance = {
	editor?: {
		GetContent?: () => unknown,
		SetContent?: (html: string) => void,
	} | null,
	showError?: (html: string) => void,
};

type MailFormRegistry = {
	getForm(formId: string): MailFormInstance | null,
};

type LegacyEventBus = {
	addCustomEvent(target: object, eventName: string, handler: (...args: unknown[]) => void): void,
	removeCustomEvent(target: object, eventName: string, handler: (...args: unknown[]) => void): void,
};

type SidePanelSlider = object;

type TopBx = LegacyEventBus & {
	SidePanel?: {
		Instance?: {
			getSliderByWindow?(targetWindow: Window): SidePanelSlider | null,
		},
	},
};

const UploaderEvent = Object.freeze({
	ItemAdd: 'BX.Disk.Uploader.Integration:Item:onAdd',
	ItemComplete: 'BX.Disk.Uploader.Integration:Item:onComplete',
	ItemRemove: 'BX.Disk.Uploader.Integration:Item:onRemove',
});

const MailFormEvent = Object.freeze({
	Submit: 'MailForm:submit',
	Success: 'MailForm:submit:ajaxSuccess',
	Failure: 'MailForm:submit:ajaxFailure',
});

const SliderEvent = Object.freeze({
	CloseStart: 'SidePanel.Slider:onCloseStart',
	Destroy: 'SidePanel.Slider:onDestroy',
});

const EDITOR_INSERT_EVENT = 'OnInsertContent';
const LIMIT_SLIDER_CODE = 'limit_v2_mail_large_attachment_disk_upload';

const loc = (key: string): string => Loc.getMessage(key) ?? '';

export class MainMailFormAdapter implements LargeAttachmentFormAdapter
{
	readonly formId: string;

	#uploaderControlId: string;
	#ahaGuide: AhaGuide | null;
	#indicatorNode: HTMLElement | null = null;
	#destroyed: boolean = false;

	constructor(params: MainMailFormAdapterParams)
	{
		this.formId = params.formId;
		this.#uploaderControlId = params.uploaderControlId;
		this.#ahaGuide = params.showAha
			? new AhaGuide({
				formId: params.formId,
				optionName: params.ahaOptionName ?? '',
			})
			: null
		;
	}

	getFiles(): FormAttachment[]
	{
		return this.#resolveUploader()?.getFiles().map((file: DiskFile): FormAttachment => {
			const id = Number(file.getCustomData('objectId'));

			return {
				id: Number.isInteger(id) && id > 0 ? id : null,
				size: file.getSize(),
			};
		}) ?? [];
	}

	getBody(): string
	{
		const content = this.#resolveForm()?.editor?.GetContent?.();

		return Type.isString(content) ? content : '';
	}

	insertBody(text: string, html: string): boolean
	{
		const editor = this.#resolveForm()?.editor;
		if (!editor)
		{
			return false;
		}

		EventEmitter.emit(editor, EDITOR_INSERT_EVENT, [text, html]);

		return true;
	}

	setBody(html: string): boolean
	{
		const editor = this.#resolveForm()?.editor;
		if (!Type.isFunction(editor?.SetContent))
		{
			return false;
		}

		editor.SetContent(html);

		return true;
	}

	serializeSendContracts(contracts: LargeAttachmentSendContract[]): boolean
	{
		const form = document.getElementById(this.formId);
		if (!(form instanceof HTMLFormElement))
		{
			return false;
		}

		form.querySelectorAll<HTMLInputElement>('input[name^="data[__largeAttachments]"]').forEach(
			(input: HTMLInputElement): void => {
				Dom.remove(input);
			},
		);

		contracts.forEach((contract: LargeAttachmentSendContract, index: number): void => {
			const tokenInput = document.createElement('input');
			tokenInput.type = 'hidden';
			tokenInput.name = `data[__largeAttachments][${index}][token]`;
			tokenInput.value = contract.token;
			form.append(tokenInput);

			contract.fileIds.forEach((fileId: number): void => {
				const fileIdInput = document.createElement('input');
				fileIdInput.type = 'hidden';
				fileIdInput.name = `data[__largeAttachments][${index}][fileIds][]`;
				fileIdInput.value = String(fileId);
				form.append(fileIdInput);
			});
		});

		return true;
	}

	syncIndicator(fileIds: number[]): void
	{
		if (fileIds.length === 0)
		{
			Dom.remove(this.#indicatorNode);
			this.#indicatorNode = null;

			return;
		}

		if (this.#indicatorNode?.isConnected)
		{
			return;
		}

		const container = document
			.getElementById(this.formId)
			?.querySelector<HTMLElement>('.main-mail-form-editor-wrapper')
		;
		if (!container)
		{
			return;
		}

		const node = document.createElement('div');
		node.className = 'ui-alert ui-alert-primary';
		node.dataset.testid = 'mail-large-attachment-indicator';
		node.setAttribute('role', 'status');
		node.setAttribute('aria-live', 'polite');
		const message = document.createElement('span');
		message.className = 'ui-alert-message';
		message.textContent = loc('MAIL_LARGE_ATTACHMENT_INDICATOR_LABEL');
		node.append(message);
		Dom.append(node, container);
		this.#indicatorNode = node;
	}

	showUploadError(onRetry?: () => void): void
	{
		const form = this.#resolveForm();
		if (form && Type.isFunction(form.showError))
		{
			const content: HTMLElement = Tag.render`
				<div>
					<span></span>
					<button
						type="button"
						class="ui-btn ui-btn-xs ui-btn-link mail-large-attachment-retry"
						data-testid="mail-large-attachment-retry-button"
					></button>
				</div>
			`;
			const textNode = content.querySelector('span');
			const retryButton = content.querySelector<HTMLButtonElement>('.mail-large-attachment-retry');
			if (textNode)
			{
				textNode.textContent = loc('MAIL_LARGE_ATTACHMENT_UPLOAD_ERROR');
			}

			if (retryButton)
			{
				retryButton.textContent = loc('MAIL_LARGE_ATTACHMENT_RETRY');
			}

			form.showError(content.outerHTML);
			this.#bindRenderedRetry(onRetry);

			return;
		}

		this.#showMessagePopup(
			'mail-large-attachment-upload-error',
			'',
			loc('MAIL_LARGE_ATTACHMENT_UPLOAD_ERROR'),
			onRetry,
		);
	}

	showNoSpaceError(onRetry?: () => void): void
	{
		this.#showMessagePopup(
			'mail-large-attachment-no-space',
			loc('MAIL_LARGE_ATTACHMENT_NO_SPACE_TITLE'),
			loc('MAIL_LARGE_ATTACHMENT_NO_SPACE_TEXT'),
			onRetry,
		);
	}

	showTariffUnavailable(): void
	{
		FeaturePromotersRegistry.getPromoter({ code: LIMIT_SLIDER_CODE }).show();
	}

	showAha(): void
	{
		this.#ahaGuide?.show();
	}

	subscribeFileChange(handler: (type: AttachmentChangeType) => void): FormAdapterUnsubscribe
	{
		const subscriptions = [
			[UploaderEvent.ItemAdd, (): void => handler('add')],
			[UploaderEvent.ItemComplete, (): void => handler('complete')],
			[UploaderEvent.ItemRemove, (): void => handler('remove')],
		] as const;
		subscriptions.forEach(([eventName, eventHandler]): void => {
			EventEmitter.subscribe(eventName, eventHandler);
		});

		return (): void => {
			subscriptions.forEach(([eventName, eventHandler]): void => {
				EventEmitter.unsubscribe(eventName, eventHandler);
			});
		};
	}

	subscribeSubmit(handler: (body: string) => void): FormAdapterUnsubscribe
	{
		return this.#subscribeMailFormEvent(MailFormEvent.Submit, (): void => handler(this.getBody()));
	}

	subscribeSendSuccess(handler: () => void): FormAdapterUnsubscribe
	{
		return this.#subscribeMailFormEvent(MailFormEvent.Success, (_form: unknown, data: unknown): void => {
			if ((data as { status?: unknown } | null)?.status === 'success')
			{
				handler();
			}
		});
	}

	subscribeSendError(handler: () => void): FormAdapterUnsubscribe
	{
		const unsubscribeAjaxError = this.#subscribeMailFormEvent(MailFormEvent.Failure, handler);
		const unsubscribeUnsuccessfulResponse = this.#subscribeMailFormEvent(
			MailFormEvent.Success,
			(_form: unknown, data: unknown): void => {
				if ((data as { status?: unknown } | null)?.status !== 'success')
				{
					handler();
				}
			},
		);

		return (): void => {
			unsubscribeAjaxError();
			unsubscribeUnsuccessfulResponse();
		};
	}

	subscribeDestroy(handler: () => void): FormAdapterUnsubscribe
	{
		const topBx = this.#getTopBx();
		const slider = topBx?.SidePanel?.Instance?.getSliderByWindow?.(window) ?? null;
		if (!topBx || !slider)
		{
			return (): void => {};
		}

		topBx.addCustomEvent(slider, SliderEvent.CloseStart, handler);
		topBx.addCustomEvent(slider, SliderEvent.Destroy, handler);

		return (): void => {
			topBx.removeCustomEvent(slider, SliderEvent.CloseStart, handler);
			topBx.removeCustomEvent(slider, SliderEvent.Destroy, handler);
		};
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#ahaGuide?.destroy();
		this.#ahaGuide = null;
		this.syncIndicator([]);
	}

	#bindRenderedRetry(onRetry?: () => void): void
	{
		if (!onRetry)
		{
			return;
		}

		const retryButton = document
			.getElementById(this.formId)
			?.querySelector<HTMLButtonElement>('[data-testid="mail-large-attachment-retry-button"]')
		;
		if (retryButton)
		{
			Event.bind(retryButton, 'click', onRetry);
		}
	}

	#showMessagePopup(id: string, title: string, text: string, onRetry?: () => void): void
	{
		const content: HTMLElement = Tag.render`
			<div
				class="mail-large-attachment-notice"
				data-testid="mail-large-attachment-notice"
			>
				<div class="mail-large-attachment-notice__text"></div>
				<div class="mail-large-attachment-notice__buttons"></div>
			</div>
		`;
		const textNode = content.querySelector('.mail-large-attachment-notice__text');
		if (textNode)
		{
			textNode.textContent = text;
		}

		let popup: ReturnType<typeof PopupManager.create> | null = null;
		const buttonBar = content.querySelector<HTMLElement>('.mail-large-attachment-notice__buttons');
		if (onRetry && buttonBar)
		{
			const retryButton = Dom.create('button', {
				props: { className: 'ui-btn ui-btn-sm ui-btn-primary', type: 'button' },
				attrs: { 'data-testid': 'mail-large-attachment-retry-button' },
				text: loc('MAIL_LARGE_ATTACHMENT_RETRY'),
				events: {
					click: (): void => {
						popup?.close();
						onRetry();
					},
				},
			});
			Dom.append(retryButton, buttonBar);
		}

		if (buttonBar)
		{
			const closeButton = Dom.create('button', {
				props: { className: 'ui-btn ui-btn-sm ui-btn-link', type: 'button' },
				attrs: { 'data-testid': 'mail-large-attachment-confirm-button' },
				text: loc('MAIL_LARGE_ATTACHMENT_NO_SPACE_CLOSE'),
				events: {
					click: (): void => {
						popup?.close();
					},
				},
			});
			Dom.append(closeButton, buttonBar);
		}

		popup = PopupManager.create({
			id,
			titleBar: title.length > 0 ? title : undefined,
			content,
			width: 400,
			overlay: true,
			closeIcon: true,
			closeByEsc: true,
		});
		popup.show();
	}

	#subscribeMailFormEvent(
		eventName: string,
		handler: (...args: unknown[]) => void,
	): FormAdapterUnsubscribe
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

	#resolveUploader(): UploaderControl | null
	{
		const uploaderApi = (BX as unknown as DiskUploaderGlobal).Disk?.Uploader?.UserFieldControl;

		return uploaderApi?.getById(this.#uploaderControlId) ?? null;
	}

	#getTopBx(): TopBx | null
	{
		try
		{
			return (window.top as unknown as { BX?: TopBx } | null)?.BX ?? null;
		}
		catch
		{
			return null;
		}
	}
}
