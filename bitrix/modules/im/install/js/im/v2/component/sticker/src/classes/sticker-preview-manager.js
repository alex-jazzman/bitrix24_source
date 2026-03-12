import { Event } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { Core } from 'im.v2.application.core';

import type { ImModelSticker, ImModelStickerIdentifier } from 'im.v2.model';

const LONG_PRESS_DELAY = 300;
const CHECK_INTERVAL = 50;
const CLICK_SUPPRESSION_UNBIND_DELAY = 500;

export class StickerPreviewManager extends EventEmitter
{
	static instance: StickerPreviewManager;
	static events = {
		showPreview: 'showPreview',
		hidePreview: 'hidePreview',
	};

	#isPreviewing: boolean = false;
	#checkInterval: ?number = null;
	#pressTimer: ?number = null;
	#lastMoveEvent: MouseEvent | PointerEvent | null = null;
	#currentSticker: ?ImModelSticker = null;
	#onMouseUpHandler: () => void;
	#onMouseMoveHandler: (event: MouseEvent) => void;
	#checkUnderCursorHandler: () => void;

	static getInstance(): StickerPreviewManager
	{
		if (!this.instance)
		{
			this.instance = new StickerPreviewManager();
		}

		return this.instance;
	}

	constructor()
	{
		super();
		this.setEventNamespace('BX.Messenger.v2.StickerPreviewManager');

		this.#onMouseUpHandler = this.#onMouseUp.bind(this);
		this.#onMouseMoveHandler = this.#onMouseMove.bind(this);
		this.#checkUnderCursorHandler = this.#checkUnderCursor.bind(this);
	}

	trackLongPress(event: PointerEvent, sticker: ImModelSticker)
	{
		if (event.button !== 0)
		{
			return;
		}

		this.#reset();
		this.#currentSticker = sticker;
		this.#lastMoveEvent = event;

		this.#pressTimer = setTimeout(() => this.#activatePreview(), LONG_PRESS_DELAY);

		Event.bind(document, 'mouseup', this.#onMouseUpHandler);
		Event.bind(document, 'mousemove', this.#onMouseMoveHandler);
	}

	cancelLongPressTracking()
	{
		this.#reset();
	}

	#activatePreview()
	{
		this.#isPreviewing = true;
		this.emit(StickerPreviewManager.events.showPreview, { sticker: this.#currentSticker });
		this.#checkInterval = setInterval(this.#checkUnderCursorHandler, CHECK_INTERVAL);
	}

	#onMouseMove(event: MouseEvent)
	{
		if (!this.#isPreviewing)
		{
			return;
		}

		this.#lastMoveEvent = event;
	}

	#checkUnderCursor()
	{
		const newSticker = this.#getNewStickerFromMoveEvent();
		if (!newSticker)
		{
			return;
		}

		this.#currentSticker = newSticker;
		this.emit(StickerPreviewManager.events.showPreview, { sticker: this.#currentSticker });
	}

	#onMouseUp()
	{
		if (this.#isPreviewing)
		{
			this.emit(StickerPreviewManager.events.hidePreview);
			this.#suppressNextClick();
		}

		this.#reset();
	}

	#suppressNextClick()
	{
		const blockClick = (event: PointerEvent) => {
			event.stopPropagation();
			event.preventDefault();
			event.stopImmediatePropagation();
		};

		Event.bind(window, 'click', blockClick, { capture: true, once: true });
		// we need to unbind the click listener after some time in case the click event doesn't happen (bug #238345)
		setTimeout(() => {
			Event.unbind(window, 'click', blockClick, { capture: true });
		}, CLICK_SUPPRESSION_UNBIND_DELAY);
	}

	#reset()
	{
		clearTimeout(this.#pressTimer);
		clearInterval(this.#checkInterval);

		this.#pressTimer = null;
		this.#checkInterval = null;
		this.#isPreviewing = false;
		this.#currentSticker = null;
		this.#lastMoveEvent = null;

		Event.unbind(document, 'mouseup', this.#onMouseUpHandler);
		Event.unbind(document, 'mousemove', this.#onMouseMoveHandler);
	}

	#getNewStickerFromMoveEvent(): ?ImModelSticker
	{
		if (!this.#lastMoveEvent)
		{
			return null;
		}

		const { clientX, clientY } = this.#lastMoveEvent;
		const element = document.elementFromPoint(clientX, clientY);
		const container: HTMLElement | null = element?.closest('[data-sticker-id]');
		if (!container)
		{
			return null;
		}

		const stickerIdentifier = this.#getStickerIdentifier(container);
		if (!stickerIdentifier || this.#isSameSticker(stickerIdentifier))
		{
			return null;
		}

		return Core.getStore().getters['stickers/get'](stickerIdentifier);
	}

	#getStickerIdentifier(container: HTMLElement): ?ImModelStickerIdentifier
	{
		const { stickerId, stickerPackId, stickerPackType } = container.dataset;
		if (!stickerId || !stickerPackId || !stickerPackType)
		{
			return null;
		}

		return {
			id: Number.parseInt(stickerId, 10),
			packId: Number.parseInt(stickerPackId, 10),
			packType: stickerPackType,
		};
	}

	#isSameSticker(newSticker: ImModelStickerIdentifier): boolean
	{
		if (!this.#currentSticker || !newSticker)
		{
			return false;
		}

		return (
			this.#currentSticker.id === newSticker.id
			&& this.#currentSticker.packId === newSticker.packId
			&& this.#currentSticker.packType === newSticker.packType
		);
	}
}
