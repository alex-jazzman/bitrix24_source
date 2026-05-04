import { Dom, Event, Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Icon, Outline } from 'ui.icon-set.api.core';
import { Composite } from './composite';

export class RightPanel extends EventEmitter
{
	static #EXPANDED_CLASS = '--right-panel-expanded';
	static #RESIZING_CLASS = '--resizing';
	static #DEFAULT_WIDTH = 380;
	static #SS_WIDTH_KEY = 'b24_right_panel_width';
	static #SS_EXPANDED_KEY = 'b24_right_panel_expanded';

	#resizeObserver: ResizeObserver | null = null;
	#resizeHandleEl: HTMLElement | null = null;
	#dragOverlayEl: HTMLElement | null = null;
	#isDragging: boolean = false;
	#pendingTransitionEvent: string | null = null;
	#dragStartX: number = 0;
	#dragStartWidth: number = 0;
	#savedWidth: number | null = null;
	#boundOnPointerDown: Function;
	#boundOnPointerMove: Function;
	#boundOnPointerUp: Function;
	#boundOnTransitionEnd: Function;

	constructor()
	{
		super();
		this.setEventNamespace('BX.Intranet.Bitrix24.Template.RightPanel');

		this.#boundOnPointerDown = this.#onPointerDown.bind(this);
		this.#boundOnPointerMove = this.#onPointerMove.bind(this);
		this.#boundOnPointerUp = this.#onPointerUp.bind(this);
		this.#boundOnTransitionEnd = this.#onTransitionEnd.bind(this);

		this.#subscribeToEvents();
	}

	getContainer(): ?HTMLElement
	{
		const panel = document.getElementById('app__right-panel');
		if (panel !== null && this.#resizeObserver === null)
		{
			this.#resizeObserver = new ResizeObserver(this.#handleResizeObserver.bind(this));
			this.#resizeObserver.observe(panel);
		}

		return panel;
	}

	#getSavedWidth(): number
	{
		if (this.#savedWidth === null)
		{
			const parsed = parseInt(getComputedStyle(document.body).getPropertyValue('--air-right-panel-width'), 10);
			this.#savedWidth = parsed > 0 ? parsed : RightPanel.#DEFAULT_WIDTH;
		}

		return this.#savedWidth;
	}

	isExpanded(): boolean
	{
		return Dom.hasClass(document.body, RightPanel.#EXPANDED_CLASS);
	}

	expand(): void
	{
		if (this.isExpanded())
		{
			return;
		}

		this.#cancelTransition();
		Dom.addClass(document.body, RightPanel.#EXPANDED_CLASS);
		this.#applySavedWidth();
		this.#initResizeHandle();
		this.#saveExpandedToSessionStorage(true);
		this.#saveWidthToSessionStorage();

		this.emit('onExpand');
		this.#startTransition('onExpandComplete');
	}

	collapse(): void
	{
		if (!this.isExpanded())
		{
			return;
		}

		this.#cancelTransition();
		Dom.removeClass(document.body, [RightPanel.#EXPANDED_CLASS, '--right-panel-no-transition', RightPanel.#RESIZING_CLASS]);
		this.#saveExpandedToSessionStorage(false);

		this.emit('onCollapse');
		this.#startTransition('onCollapseComplete');
	}

	#startTransition(eventName: string): void
	{
		this.#pendingTransitionEvent = eventName;

		const container = this.getContainer();
		if (container)
		{
			Event.bind(container, 'transitionend', this.#boundOnTransitionEnd);
		}
	}

	#cancelTransition(): void
	{
		this.#pendingTransitionEvent = null;

		const container = this.getContainer();
		if (container)
		{
			Event.unbind(container, 'transitionend', this.#boundOnTransitionEnd);
		}
	}

	#onTransitionEnd(event: TransitionEvent): void
	{
		if (event.target !== this.getContainer() || event.propertyName !== 'width')
		{
			return;
		}

		const eventName = this.#pendingTransitionEvent;
		this.#cancelTransition();

		if (eventName)
		{
			this.emit(eventName);
		}

		window.dispatchEvent(new window.Event('resize'));
	}

	#applySavedWidth(): void
	{
		Dom.style(document.body, '--air-right-panel-width', `${this.#getSavedWidth()}px`);
	}

	#initResizeHandle(): void
	{
		const container = this.getContainer();
		if (!container || this.#resizeHandleEl)
		{
			return;
		}

		const grabberIcon = new Icon({ icon: Outline.DRAG_L, size: 18 });
		this.#resizeHandleEl = Tag.render`
			<div class="right-panel-resize-handle --ui-context-content-dark">
				<div class="right-panel-resize-handle__grabber">
					<div class="right-panel-resize-handle__grabber-icon">
						${grabberIcon.render()}
					</div>
				</div>
			</div>
		`;

		Dom.append(this.#resizeHandleEl, container);
		Event.bind(this.#resizeHandleEl, 'pointerdown', this.#boundOnPointerDown);
	}

	#onPointerDown(event: PointerEvent): void
	{
		event.preventDefault();

		const container = this.getContainer();
		if (!container)
		{
			return;
		}

		this.#isDragging = true;
		this.#dragStartX = event.clientX;
		this.#dragStartWidth = container.getBoundingClientRect().width;

		Dom.addClass(document.body, RightPanel.#RESIZING_CLASS);

		this.#showDragOverlay();

		Event.bind(document, 'pointermove', this.#boundOnPointerMove);
		Event.bind(document, 'pointerup', this.#boundOnPointerUp);
	}

	#onPointerMove(event: PointerEvent): void
	{
		if (!this.#isDragging)
		{
			return;
		}

		const delta = this.#dragStartX - event.clientX;
		const newWidth = this.#dragStartWidth + delta;

		Dom.style(document.body, '--air-right-panel-width', `${newWidth}px`);

		const container = this.getContainer();
		if (container)
		{
			const actualWidth = container.getBoundingClientRect().width;
			if (actualWidth !== newWidth)
			{
				Dom.style(document.body, '--air-right-panel-width', `${actualWidth}px`);
			}
		}
	}

	#onPointerUp(event: PointerEvent): void
	{
		if (!this.#isDragging)
		{
			return;
		}

		this.#isDragging = false;

		Dom.removeClass(document.body, RightPanel.#RESIZING_CLASS);

		this.#hideDragOverlay();

		Event.unbind(document, 'pointermove', this.#boundOnPointerMove);
		Event.unbind(document, 'pointerup', this.#boundOnPointerUp);

		const container = this.getContainer();
		if (container && this.#getSavedWidth() !== container.getBoundingClientRect().width)
		{
			this.#savedWidth = container.getBoundingClientRect().width;

			this.#saveWidth();
			window.dispatchEvent(new window.Event('resize'));
		}
	}

	#showDragOverlay(): void
	{
		if (!this.#dragOverlayEl)
		{
			this.#dragOverlayEl = Tag.render`
				<div class="right-panel-drag-overlay"></div>
			`;
		}

		Dom.append(this.#dragOverlayEl, document.body);
	}

	#hideDragOverlay(): void
	{
		if (this.#dragOverlayEl)
		{
			Dom.remove(this.#dragOverlayEl);
		}
	}

	#saveWidth(): void
	{
		BX.userOptions.save(
			'intranet',
			'right_panel_width',
			null,
			String(this.#getSavedWidth()),
		);

		this.#saveWidthToSessionStorage();

		Composite.clearCache();
	}

	#handleResizeObserver(): void
	{
		this.emit('onResize');
	}

	#saveExpandedToSessionStorage(expanded: boolean): void
	{
		try
		{
			sessionStorage.setItem(RightPanel.#SS_EXPANDED_KEY, expanded ? 'Y' : 'N');
		}
		catch
		{ /* sessionStorage may be unavailable */ }
	}

	#saveWidthToSessionStorage(): void
	{
		try
		{
			sessionStorage.setItem(RightPanel.#SS_WIDTH_KEY, String(this.#getSavedWidth()));
		}
		catch
		{ /* sessionStorage may be unavailable */ }
	}

	#subscribeToEvents(): void
	{
		const clearComposite = () => Composite.clearCache();
		this.subscribe('onExpandComplete', clearComposite);
		this.subscribe('onCollapseComplete', clearComposite);

		Composite.ready(() => {
			this.#initResizeHandle();
		});
	}
}
