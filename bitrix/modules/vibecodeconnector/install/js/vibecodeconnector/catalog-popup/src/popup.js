import { Dom, Event, Tag } from 'main.core';
import { Dialog } from 'ui.system.dialog';
import { Line } from 'ui.system.skeleton';

import './style.css';

const POPUP_WIDTH_PX = 460;
const POPUP_BIND_GAP_PX = 6;
const POPUP_BIND_OFFSET_LEFT_PX = 20;
const POPUP_VIEWPORT_MARGIN_PX = 16;
const SKELETON_TILES = 5;
const SKELETON_TAB_WIDTHS = [70, 49, 63, 128];

export class CatalogLoadingPopup
{
	#dialog: Dialog | null = null;
	#rootNode: HTMLElement | null = null;
	#bindNode: HTMLElement | null = null;
	#dialogContainer: HTMLElement | null = null;
	#repositionHandler: (() => void) | null = null;
	#onHide: (() => void) | null = null;

	show(bindNode: HTMLElement | null, onHide: () => void, disableScrolling: boolean = false): void
	{
		this.#bindNode = bindNode;
		this.#onHide = onHide;
		this.#rootNode = Tag.render`<div class="vibecode-catalog-loading__dialog-root"></div>`;
		Dom.append(this.#renderSkeleton(), this.#rootNode);
		this.#dialog = new Dialog({
			hasHorizontalPadding: false,
			hasVerticalPadding: false,
			content: this.#rootNode,
			hasCloseButton: true,
			hasOverlay: true,
			disableScrolling,
			closeByEsc: true,
			closeByClickOutside: true,
			events: {
				onShow: () => {
					this.#bindPositioning();
					this.#position();
				},
				onHide: () => {
					this.#reset();
					this.#onHide?.();
				},
			},
		});
		this.#dialog.show();
	}

	takeOver(onHide: () => void): { dialog: Dialog, rootNode: HTMLElement, bindNode: HTMLElement | null } | null
	{
		if (this.#dialog === null || this.#rootNode === null)
		{
			return null;
		}

		this.#onHide = onHide;
		this.#unbindPositioning();

		return {
			dialog: this.#dialog,
			rootNode: this.#rootNode,
			bindNode: this.#bindNode,
		};
	}

	close(): void
	{
		this.#dialog?.hide();
	}

	#renderSkeleton(): HTMLElement
	{
		const tabsNode = Tag.render`<nav class="vibecode-catalog-loading__tabs" aria-hidden="true"></nav>`;
		for (const width of SKELETON_TAB_WIDTHS)
		{
			Dom.append(Line(width, 26, 99), tabsNode);
		}

		const listNode = Tag.render`<ul class="vibecode-catalog-loading__list"></ul>`;
		for (let index = 0; index < SKELETON_TILES; index++)
		{
			Dom.append(this.#renderSkeletonItem(), listNode);
		}

		return Tag.render`
			<div class="vibecode-catalog-loading">
				<header class="vibecode-catalog-loading__header">
					<h3 class="vibecode-catalog-loading__title ui-headline --md --accent">${Line(200, 26)}</h3>
					<div class="vibecode-catalog-loading__search" aria-hidden="true">${Line(null, 34)}</div>
					${tabsNode}
				</header>
				<div class="vibecode-catalog-loading__content">
					<div class="vibecode-catalog-loading__body">${listNode}</div>
				</div>
			</div>
		`;
	}

	#renderSkeletonItem(): HTMLElement
	{
		return Tag.render`
			<li class="vibecode-catalog-loading__item" aria-hidden="true">
				<span class="vibecode-catalog-loading__item-icon">${Line(56, 56)}</span>
				<div class="vibecode-catalog-loading__item-content">
					${Line(136, 14)}
					<div class="vibecode-catalog-loading__item-subtitle">${Line(null, 10)}${Line(168, 10)}</div>
				</div>
			</li>
		`;
	}

	#bindPositioning(): void
	{
		this.#repositionHandler = () => this.#position();
		Event.bind(window, 'resize', this.#repositionHandler, { passive: true });
		Event.bind(window, 'scroll', this.#repositionHandler, { passive: true, capture: true });
	}

	#unbindPositioning(): void
	{
		if (this.#repositionHandler === null)
		{
			return;
		}

		Event.unbind(window, 'resize', this.#repositionHandler);
		Event.unbind(window, 'scroll', this.#repositionHandler, true);
		this.#repositionHandler = null;
		this.#dialogContainer = null;
	}

	#position(): void
	{
		const container = this.#getDialogContainer();
		if (container === null || this.#bindNode === null || !this.#bindNode.isConnected)
		{
			return;
		}

		const rect = this.#bindNode.getBoundingClientRect();
		const containerWidth = container.offsetWidth || POPUP_WIDTH_PX;
		const containerHeight = container.offsetHeight;
		const minLeft = window.scrollX + POPUP_VIEWPORT_MARGIN_PX;
		const maxLeft = window.scrollX + document.documentElement.clientWidth - containerWidth - POPUP_VIEWPORT_MARGIN_PX;
		let left = window.scrollX + rect.left + POPUP_BIND_OFFSET_LEFT_PX;
		left = maxLeft > minLeft ? Math.min(Math.max(left, minLeft), maxLeft) : minLeft;

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

	#getDialogContainer(): HTMLElement | null
	{
		if (this.#dialogContainer !== null && document.body.contains(this.#dialogContainer))
		{
			return this.#dialogContainer;
		}

		const container = this.#rootNode?.closest('.popup-window') ?? null;
		this.#dialogContainer = container instanceof HTMLElement ? container : null;

		return this.#dialogContainer;
	}

	#reset(): void
	{
		this.#unbindPositioning();
		this.#dialog = null;
		this.#rootNode = null;
		this.#bindNode = null;
	}
}
