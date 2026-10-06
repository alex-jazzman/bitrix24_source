import { Type } from 'main.core';
import {
	type AttachmentChangeType,
	type FormAttachment,
	type LargeAttachmentFormAdapter,
	type LargeAttachmentSendContract,
} from 'mail.client.large-attachment';

import {
	CrmLargeAttachmentNotification,
	extractErrorCode,
} from '../notification';

type FormAdapterUnsubscribe = () => void;

export type LegacyEmailAdapterParams = {
	formId: string,
	uploaderControlId: string,
	lheJsName: string,
	getContainer: () => HTMLElement | null,
};

type LegacyEditor = {
	GetContent(): unknown,
	InsertHTML(html: string): void,
	SetContent(html: string, isBbCode?: boolean): void,
};

type LegacyUploaderItem = {
	getId(): string | number,
	getFileId(): number,
	getSize(): string | number,
	getProgress(): number,
};

type QueueItem = {
	size?: number,
};

type QueueItems = {
	getItem(id: string | number): QueueItem | null,
};

type LegacyUploaderAgent = {
	queue?: {
		items?: QueueItems,
	},
};

type LegacyUploader = {
	getItems(): LegacyUploaderItem[],
	getAgent(): LegacyUploaderAgent | null,
	getPlaceHolder(): HTMLElement | null,
	subscribe(eventName: string, handler: () => void): void,
	unsubscribe(eventName: string, handler: () => void): void,
};

type LegacyBx = {
	CrmDiskUploader?: {
		items?: Record<string, LegacyUploader>,
	},
	addCustomEvent(target: object, eventName: string, handler: (...args: unknown[]) => void): void,
	removeCustomEvent(target: object, eventName: string, handler: (...args: unknown[]) => void): void,
};

type LegacyEditorRegistry = {
	Get(name: string): LegacyEditor | null,
};

const UploaderEvent = Object.freeze({
	Add: 'addItem',
	Remove: 'removeItem',
	AgentFileInit: 'onFileIsInited',
	UploadDone: 'onUploadDone',
});

export class LegacyEmailAdapter implements LargeAttachmentFormAdapter
{
	readonly formId: string;

	#uploaderControlId: string;
	#lheJsName: string;
	#notification: CrmLargeAttachmentNotification;
	#contracts: LargeAttachmentSendContract[] = [];
	#fileChangeHandlers: Set<(type: AttachmentChangeType) => void> = new Set();
	#submitHandlers: Set<(body: string) => void> = new Set();
	#successHandlers: Set<() => void> = new Set();
	#errorHandlers: Set<() => void> = new Set();
	#destroyHandlers: Set<() => void> = new Set();
	#queueUnsubscribes: Map<object, () => void> = new Map();
	#uploaderSubscribed: boolean = false;
	#destroyed: boolean = false;

	constructor(params: LegacyEmailAdapterParams)
	{
		this.formId = params.formId;
		this.#uploaderControlId = params.uploaderControlId;
		this.#lheJsName = params.lheJsName;
		this.#notification = new CrmLargeAttachmentNotification({
			getContainer: params.getContainer,
			getIndicatorContainer: (): HTMLElement | null => (
				this.#resolveUploader()?.getPlaceHolder()?.parentElement
				?? params.getContainer()
			),
		});
	}

	getFiles(): FormAttachment[]
	{
		const uploader = this.#resolveUploader();

		return uploader?.getItems().map((item: LegacyUploaderItem): FormAttachment => {
			const id = Number(item.getFileId());

			return {
				id: Number.isInteger(id) && id > 0 ? id : null,
				size: this.#getRawSize(item, uploader),
			};
		}) ?? [];
	}

	getBody(): string
	{
		const content = this.#resolveEditor()?.GetContent();

		return Type.isString(content) ? content : '';
	}

	insertBody(_text: string, html: string): boolean
	{
		const editor = this.#resolveEditor();
		if (!editor)
		{
			return false;
		}

		editor.InsertHTML(html);

		return true;
	}

	setBody(html: string): boolean
	{
		const editor = this.#resolveEditor();
		if (!editor)
		{
			return false;
		}

		editor.SetContent(html);

		return true;
	}

	serializeSendContracts(contracts: LargeAttachmentSendContract[]): boolean
	{
		this.#contracts = contracts.map((contract: LargeAttachmentSendContract) => ({
			token: contract.token,
			fileIds: [...contract.fileIds],
		}));

		return true;
	}

	getSendContracts(): LargeAttachmentSendContract[]
	{
		return this.#contracts.map((contract: LargeAttachmentSendContract) => ({
			token: contract.token,
			fileIds: [...contract.fileIds],
		}));
	}

	hasPendingUploads(): boolean
	{
		return this.#resolveUploader()?.getItems().some((item: LegacyUploaderItem): boolean => (
			item.getProgress() < 100 || item.getFileId() <= 0
		)) ?? false;
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

	showAha(): void
	{
		// The legacy dialog has no stable anchor for an Aha guide.
	}

	showSubmitPending(): void
	{
		this.#notification.showStatus('CRM_LARGE_ATTACHMENT_WAIT_UPLOAD');
	}

	showLinkRestored(): void
	{
		this.#notification.showStatus('CRM_LARGE_ATTACHMENT_LINK_RESTORED');
	}

	showLinkMissing(): void
	{
		this.#notification.showError('MAIL_LA_LINK_MISSING');
	}

	routeSendError(response: unknown): void
	{
		const code = extractErrorCode(response);
		if (code === '')
		{
			this.#notification.showNetworkError();
		}
		else
		{
			this.#notification.showError(code);
		}
	}

	confirmDelete(onDelete: () => void): void
	{
		void this.#notification.confirmDelete(onDelete);
	}

	subscribeFileChange(handler: (type: AttachmentChangeType) => void): FormAdapterUnsubscribe
	{
		this.#fileChangeHandlers.add(handler);
		this.#startUploaderSubscriptions();

		return (): void => {
			this.#fileChangeHandlers.delete(handler);
			if (this.#fileChangeHandlers.size === 0)
			{
				this.#stopUploaderSubscriptions();
			}
		};
	}

	subscribeSubmit(handler: (body: string) => void): FormAdapterUnsubscribe
	{
		this.#submitHandlers.add(handler);

		return (): void => {
			this.#submitHandlers.delete(handler);
		};
	}

	subscribeSendSuccess(handler: () => void): FormAdapterUnsubscribe
	{
		this.#successHandlers.add(handler);

		return (): void => {
			this.#successHandlers.delete(handler);
		};
	}

	subscribeSendError(handler: () => void): FormAdapterUnsubscribe
	{
		this.#errorHandlers.add(handler);

		return (): void => {
			this.#errorHandlers.delete(handler);
		};
	}

	subscribeDestroy(handler: () => void): FormAdapterUnsubscribe
	{
		this.#destroyHandlers.add(handler);

		return (): void => {
			this.#destroyHandlers.delete(handler);
		};
	}

	notifySubmit(): void
	{
		const body = this.getBody();
		this.#submitHandlers.forEach((handler: (body: string) => void): void => {
			handler(body);
		});
	}

	notifySendSuccess(): void
	{
		this.#successHandlers.forEach((handler: () => void): void => {
			handler();
		});
	}

	notifySendError(): void
	{
		this.#errorHandlers.forEach((handler: () => void): void => {
			handler();
		});
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#stopUploaderSubscriptions();
		this.#notification.destroy();
		this.#contracts = [];
		this.#fileChangeHandlers.clear();
		this.#submitHandlers.clear();
		this.#successHandlers.clear();
		this.#errorHandlers.clear();
		this.#destroyHandlers.clear();
	}

	#startUploaderSubscriptions(): void
	{
		const uploader = this.#resolveUploader();
		if (!uploader || this.#uploaderSubscribed)
		{
			return;
		}

		uploader.subscribe(UploaderEvent.Add, this.#handleItemAdd);
		uploader.subscribe(UploaderEvent.Remove, this.#handleItemRemove);

		const agent = uploader.getAgent();
		if (agent)
		{
			const bx = this.#getBx();
			bx.addCustomEvent(agent, UploaderEvent.AgentFileInit, this.#handleAgentFileInit);
			uploader.getItems().forEach((item: LegacyUploaderItem): void => {
				const queueItem = agent.queue?.items?.getItem(item.getId());
				if (item.getProgress() < 100 && queueItem)
				{
					this.#handleAgentFileInit(item.getId(), queueItem);
				}
			});
		}

		this.#uploaderSubscribed = true;
	}

	#stopUploaderSubscriptions(): void
	{
		const uploader = this.#resolveUploader();
		if (uploader && this.#uploaderSubscribed)
		{
			uploader.unsubscribe(UploaderEvent.Add, this.#handleItemAdd);
			uploader.unsubscribe(UploaderEvent.Remove, this.#handleItemRemove);

			const agent = uploader.getAgent();
			if (agent)
			{
				this.#getBx().removeCustomEvent(agent, UploaderEvent.AgentFileInit, this.#handleAgentFileInit);
			}
		}

		this.#queueUnsubscribes.forEach((unsubscribe: () => void): void => {
			unsubscribe();
		});
		this.#queueUnsubscribes.clear();
		this.#uploaderSubscribed = false;
	}

	#handleItemAdd = (): void => {
		this.#emitFileChange('add');
	};

	#handleItemRemove = (): void => {
		this.#emitFileChange('remove');
	};

	#handleAgentFileInit = (_id: unknown, queueItem: unknown): void => {
		if (!Type.isObjectLike(queueItem) || this.#queueUnsubscribes.has(queueItem))
		{
			return;
		}

		const handleDone = (): void => {
			this.#queueUnsubscribes.get(queueItem)?.();
			queueMicrotask((): void => {
				this.#emitFileChange('complete');
			});
		};
		const bx = this.#getBx();
		bx.addCustomEvent(queueItem, UploaderEvent.UploadDone, handleDone);
		this.#queueUnsubscribes.set(queueItem, (): void => {
			bx.removeCustomEvent(queueItem, UploaderEvent.UploadDone, handleDone);
			this.#queueUnsubscribes.delete(queueItem);
		});
	};

	#emitFileChange(type: AttachmentChangeType): void
	{
		this.#fileChangeHandlers.forEach((handler: (type: AttachmentChangeType) => void): void => {
			handler(type);
		});
	}

	#getRawSize(item: LegacyUploaderItem, uploader: LegacyUploader): number
	{
		const size = Number(item.getSize());
		if (Number.isFinite(size) && size > 0)
		{
			return size;
		}

		const queueSize = uploader.getAgent()?.queue?.items?.getItem(item.getId())?.size;

		return Number.isFinite(queueSize) ? Number(queueSize) : 0;
	}

	#resolveEditor(): LegacyEditor | null
	{
		const registry = (window as unknown as { BXHtmlEditor?: LegacyEditorRegistry }).BXHtmlEditor;

		return registry?.Get(this.#lheJsName) ?? null;
	}

	#resolveUploader(): LegacyUploader | null
	{
		return this.#getBx().CrmDiskUploader?.items?.[this.#uploaderControlId] ?? null;
	}

	#getBx(): LegacyBx
	{
		return BX as unknown as LegacyBx;
	}
}
