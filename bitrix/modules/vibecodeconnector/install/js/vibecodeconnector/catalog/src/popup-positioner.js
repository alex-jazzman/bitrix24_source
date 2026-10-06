import { Dom, Event } from 'main.core';

const POPUP_WIDTH_PX = 460;
const POPUP_BIND_GAP_PX = 6;
const POPUP_BIND_OFFSET_LEFT_PX = 20;
const POPUP_VIEWPORT_MARGIN_PX = 16;

type CatalogPopupPositionerOptions = {
	getRootNode: () => HTMLElement | null,
	getBindNode: () => HTMLElement | null,
	onReposition?: () => void,
};

export class CatalogPopupPositioner
{
	#getRootNode: () => HTMLElement | null;
	#getBindNode: () => HTMLElement | null;
	#onReposition: ?() => void;
	#dialogContainer: HTMLElement | null = null;
	#repositionHandler: ?() => void = null;

	constructor(options: CatalogPopupPositionerOptions)
	{
		this.#getRootNode = options.getRootNode;
		this.#getBindNode = options.getBindNode;
		this.#onReposition = options.onReposition;
	}

	bind(): void
	{
		if (this.#repositionHandler)
		{
			return;
		}

		this.#repositionHandler = () => {
			this.#onReposition?.();
			this.position();
		};

		Event.bind(window, 'resize', this.#repositionHandler, { passive: true });
		Event.bind(window, 'scroll', this.#repositionHandler, { passive: true, capture: true });
	}

	unbind(): void
	{
		if (!this.#repositionHandler)
		{
			return;
		}

		Event.unbind(window, 'resize', this.#repositionHandler);
		Event.unbind(window, 'scroll', this.#repositionHandler, true);
		this.#repositionHandler = null;
	}

	reset(): void
	{
		this.unbind();
		this.#dialogContainer = null;
	}

	position(): void
	{
		const container = this.#ensureDialogContainer();

		if (!container)
		{
			return;
		}

		const bindNode = this.#getBindNode();

		if (!bindNode || !bindNode.isConnected)
		{
			Dom.style(container, 'left', '');
			Dom.style(container, 'top', '');
			Dom.style(container, 'transform', '');

			return;
		}

		const rect = bindNode.getBoundingClientRect();
		const containerWidth = container.offsetWidth || POPUP_WIDTH_PX;
		const containerHeight = container.offsetHeight;
		const minLeft = window.scrollX + POPUP_VIEWPORT_MARGIN_PX;
		const maxLeft = window.scrollX
			+ document.documentElement.clientWidth
			- containerWidth
			- POPUP_VIEWPORT_MARGIN_PX;
		let left = window.scrollX + rect.left + POPUP_BIND_OFFSET_LEFT_PX;

		if (maxLeft > minLeft)
		{
			left = Math.min(Math.max(left, minLeft), maxLeft);
		}
		else
		{
			left = minLeft;
		}

		const availableBelow = window.innerHeight - rect.bottom - POPUP_BIND_GAP_PX - POPUP_VIEWPORT_MARGIN_PX;
		const availableAbove = rect.top - POPUP_BIND_GAP_PX - POPUP_VIEWPORT_MARGIN_PX;
		let top = window.scrollY + rect.bottom + POPUP_BIND_GAP_PX;

		if (containerHeight > 0 && availableBelow < containerHeight && availableAbove > availableBelow)
		{
			top = window.scrollY + rect.top - containerHeight - POPUP_BIND_GAP_PX;
		}

		Dom.style(container, 'left', `${Math.round(left)}px`);
		Dom.style(container, 'top', `${Math.round(Math.max(window.scrollY + POPUP_VIEWPORT_MARGIN_PX, top))}px`);
		Dom.style(container, 'transform', 'none');
	}

	#ensureDialogContainer(): ?HTMLElement
	{
		if (this.#dialogContainer && document.body.contains(this.#dialogContainer))
		{
			return this.#dialogContainer;
		}

		const container = this.#getRootNode()?.closest('.popup-window') ?? null;

		if (!(container instanceof HTMLElement))
		{
			return null;
		}

		this.#dialogContainer = container;

		return container;
	}
}
