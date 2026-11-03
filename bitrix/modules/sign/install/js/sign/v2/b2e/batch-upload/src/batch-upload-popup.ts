import { Loc, Tag } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { BitrixVue } from 'ui.vue3';

import { BatchUploadApp } from './app';
import { BatchUploadService } from './batch-upload-service';
import { type BatchFileItem } from './types';

type BatchUploadPopupOptions = {
	service: BatchUploadService,
	limitTotal: number,
	/**
	 * The limit spans the whole process, and only the wizard step knows how much of it is left:
	 * the window shows the number instead of working it out from the batch of its own list.
	 */
	resolveLimitLeft: () => number,
};

type VueApp = {
	mount: (container: HTMLElement) => BatchAppInstance,
	unmount: () => void,
};

type BatchAppInstance = {
	items: BatchFileItem[],
	doneCount: number,
	rejectedNames: string[],
	limitLeft: number,
};

const POPUP_WIDTH = 560;
const POPUP_ID_PREFIX = 'sign-b2e-batch-upload-popup';

// A wizard reopened in the slider builds a second popup while the first one is still in the DOM,
// and PopupManager keeps popups by id: a shared id would collide and duplicate the overlay node.
let popupCount = 0;

/**
 * Popup around the Vue view: it holds no batch state of its own and only mirrors the service state.
 */
export class BatchUploadPopup extends EventEmitter
{
	static events = Object.freeze({
		addMore: 'addMore',
		close: 'close',
	});

	#service: BatchUploadService;
	#limitTotal: number;
	#resolveLimitLeft: () => number;
	#popup: Popup | null = null;
	#app: VueApp | null = null;
	#appInstance: BatchAppInstance | null = null;
	#container: HTMLElement;
	#rejectedNames: string[] = [];
	#isVisible: boolean = false;
	#resizeObserver: ResizeObserver | null = null;
	#contentHeight: number = 0;
	#itemsChangeHandler: (event: BaseEvent) => void;
	#rejectedHandler: (event: BaseEvent) => void;

	constructor(options: BatchUploadPopupOptions)
	{
		super();
		this.setEventNamespace('BX.Sign.V2.B2e.BatchUploadPopup');

		this.#service = options.service;
		this.#limitTotal = options.limitTotal;
		this.#resolveLimitLeft = options.resolveLimitLeft;
		this.#container = Tag.render`<div></div>`;

		this.#itemsChangeHandler = (event: BaseEvent) => this.#syncFromService(event.getData().items);
		this.#rejectedHandler = (event: BaseEvent) => this.#onRejected(event);

		this.#service.subscribe(BatchUploadService.events.itemsChange, this.#itemsChangeHandler);
		this.#service.subscribe(BatchUploadService.events.rejected, this.#rejectedHandler);
	}

	show(): void
	{
		if (this.#popup === null)
		{
			this.#mountApp();
			this.#popup = new Popup({
				id: `${POPUP_ID_PREFIX}-${++popupCount}`,
				content: this.#container,
				titleBar: Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_TITLE') ?? '',
				width: POPUP_WIDTH,
				closeIcon: true,
				closeByEsc: true,
				overlay: true,
				// the portal-wide focus trap of main.popup is off by default, and a modal
				// upload window has to hold the keyboard focus while it is open
				focusTrap: true,
				events: {
					onPopupClose: () => {
						this.#isVisible = false;
						this.emit(BatchUploadPopup.events.close);
					},
				},
			});
			this.#observeContentHeight();
		}

		this.#isVisible = true;
		this.#syncFromService();
		this.#popup.show();
	}

	close(): void
	{
		this.#popup?.close();
	}

	/**
	 * Called by the owner of the limit once its count of documents has changed: the number of
	 * remaining places does not follow from the items of the batch, so no event of the service
	 * carries it.
	 */
	refreshLimitLeft(): void
	{
		if (this.#appInstance === null || !this.#isVisible)
		{
			return;
		}

		this.#appInstance.limitLeft = this.#resolveLimitLeft();
	}

	destroy(): void
	{
		this.#service.unsubscribe(BatchUploadService.events.itemsChange, this.#itemsChangeHandler);
		this.#service.unsubscribe(BatchUploadService.events.rejected, this.#rejectedHandler);

		this.#isVisible = false;
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
		this.#app?.unmount();
		this.#app = null;
		this.#appInstance = null;
		this.#popup?.destroy();
		this.#popup = null;
	}

	/**
	 * main.popup centers a window by the height it has at the moment of show(), and the list is
	 * filled after that: the window keeps growing downwards from the place of an empty one and ends
	 * up pressed against the bottom of the screen. The position depends on the height only, so the
	 * height is also the trigger: the item events of the service arrive with every progress tick
	 * and almost always leave the window exactly as tall as it was, while a removed file makes it
	 * shorter rather than taller.
	 */
	#observeContentHeight(): void
	{
		this.#resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
			// rounded: subpixel jitter of the layout is not a reason to move the window
			const height = Math.round(entries[0].contentRect.height);
			if (!this.#isVisible || height === this.#contentHeight)
			{
				return;
			}

			this.#contentHeight = height;
			this.#popup?.adjustPosition();
		});

		this.#resizeObserver.observe(this.#container);
	}

	#mountApp(): void
	{
		const service = this.#service;

		this.#app = BitrixVue.createApp(BatchUploadApp, {
			initialLimitTotal: this.#limitTotal,
			initialLimitLeft: this.#resolveLimitLeft(),
			onRemoveFile: (id: string) => service.removeFile(id),
			onRetryFile: (id: string) => service.retryFile(id),
			onAddMore: () => this.emit(BatchUploadPopup.events.addMore),
			onClose: () => this.close(),
		}) as unknown as VueApp;

		this.#appInstance = this.#app.mount(this.#container);
	}

	/**
	 * A closed popup renders nothing: main.popup keeps its container in the DOM, so the mounted app
	 * would otherwise keep re-rendering the list in an invisible subtree. show() syncs it back.
	 */
	#syncFromService(items: BatchFileItem[] | null = null): void
	{
		if (this.#appInstance === null || !this.#isVisible)
		{
			return;
		}

		this.#appInstance.items = items ?? this.#service.getItems();
		this.#appInstance.doneCount = this.#service.getDoneCount();
		this.#appInstance.rejectedNames = this.#rejectedNames;
		this.#appInstance.limitLeft = this.#resolveLimitLeft();
	}

	#onRejected(event: BaseEvent): void
	{
		this.#rejectedNames = event.getData().names ?? [];
		this.#syncFromService();
	}
}
