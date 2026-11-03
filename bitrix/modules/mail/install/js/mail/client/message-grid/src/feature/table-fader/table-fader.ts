import { Dom, Event, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { GridEvent } from '../../const';

export type TableFaderNodes = {
	/** Holds the ears and the shadows, and carries which edge of the table is currently scrolled past. */
	fade: HTMLElement,
	container: HTMLElement,
	table: HTMLTableElement,
	earLeft: HTMLElement,
	earRight: HTMLElement,
};

/** How an ear scrolls the table, taken from the fader of the platform grid (`fader.js:99-106`). */
const ScrollStep = 8;
const ScrollStepTime = (1000 / 60) / 2;
const ScrollStartDelay = 100;

/** How long the ears wait before following the window down the page (`fader.js:33`). */
const DocumentScrollDelay = 400;

/** Class names of the platform grid (`settings.js:19-20`, `:119`). */
const ClassShow = 'show';
const ClassFadeLeft = 'main-grid-fade-left';
const ClassFadeRight = 'main-grid-fade-right';

/** The mark the product leaves on a touch document; the platform grid reads the same one (`grid.js:311`). */
const TouchClass = 'bx-touch';

/**
 * The ears of the horizontal scroll of the table, and the shadows at its edges. A table wider than
 * its box is scrolled by resting on an ear rather than by a scrollbar.
 *
 * Carried over from `BX.Grid.Fader` of the platform grid, whose script is not loaded on this path.
 * What is left behind belongs to parts that screen has none of: the offset of the left ear is only
 * moved by a sticked column, and `Grid::resize`, `Grid::headerUpdated` and `Grid::columnResize` are
 * raised by a pinned header and by the resizing of columns.
 *
 * Every table gets a fader of its own and it holds its listeners only while its table stands.
 */
export class TableFader
{
	#nodes: TableFaderNodes | null = null;
	#touch: boolean = Dom.hasClass(document.documentElement, TouchClass);
	/** A touch answers a tap where a pointer answers a hover (`fader.js:25-26`). */
	#scrollStartEvent: 'touchstart' | 'mouseenter' = this.#touch ? 'touchstart' : 'mouseenter';
	#scrollEndEvent: 'touchend' | 'mouseleave' = this.#touch ? 'touchend' : 'mouseleave';
	#scrollTimer: number = 0;
	#scrollInterval: number = 0;
	#frame: number = 0;
	#windowHeight: number = 0;
	#bodyPosition: DOMRect = new DOMRect();
	#headPosition: DOMRect = new DOMRect();
	#lastTop: number | null = null;
	#lastHeight: number | null = null;

	#handleToggle = (): void => {
		this.#toggle();
	};

	/** `Runtime.debounce` answers with a bare function, so the shape of the handler is named here. */
	#handleDocumentScroll: () => void = Runtime.debounce(
		(): void => this.#adjustEarOffset(false),
		DocumentScrollDelay,
	) as () => void;

	#handleScrollLeft = (event: TouchEvent | MouseEvent): void => {
		this.#startScroll(event, -ScrollStep);
	};

	#handleScrollRight = (event: TouchEvent | MouseEvent): void => {
		this.#startScroll(event, ScrollStep);
	};

	#handleStopScroll = (): void => {
		this.#stopScroll();
	};

	start(nodes: TableFaderNodes): void
	{
		this.#nodes = nodes;

		Event.bind(window, 'resize', this.#handleToggle);
		Event.bind(document, 'scroll', this.#handleDocumentScroll, { passive: true });
		Event.bind(nodes.container, 'scroll', this.#handleToggle, { passive: true });
		Event.bind(nodes.earLeft, this.#scrollStartEvent, this.#handleScrollLeft);
		Event.bind(nodes.earRight, this.#scrollStartEvent, this.#handleScrollRight);
		Event.bind(nodes.earLeft, this.#scrollEndEvent, this.#handleStopScroll);
		Event.bind(nodes.earRight, this.#scrollEndEvent, this.#handleStopScroll);
		EventEmitter.subscribe(GridEvent.Updated, this.#handleToggle);

		this.#toggle();
	}

	destroy(): void
	{
		const nodes = this.#nodes;
		if (!nodes)
		{
			return;
		}

		Event.unbind(window, 'resize', this.#handleToggle);
		Event.unbind(document, 'scroll', this.#handleDocumentScroll, { passive: true });
		Event.unbind(nodes.container, 'scroll', this.#handleToggle, { passive: true });
		Event.unbind(nodes.earLeft, this.#scrollStartEvent, this.#handleScrollLeft);
		Event.unbind(nodes.earRight, this.#scrollStartEvent, this.#handleScrollRight);
		Event.unbind(nodes.earLeft, this.#scrollEndEvent, this.#handleStopScroll);
		Event.unbind(nodes.earRight, this.#scrollEndEvent, this.#handleStopScroll);
		EventEmitter.unsubscribe(GridEvent.Updated, this.#handleToggle);

		this.#stopScroll();
		cancelAnimationFrame(this.#frame);
		// the debounced handler may still be on its way, and answers a table that is gone by this
		this.#nodes = null;
	}

	/** Which ears the table has earned, and where down the page they stand. */
	#toggle(): void
	{
		const nodes = this.#nodes;
		if (!nodes)
		{
			return;
		}

		this.#adjustEarOffset(true);

		const scrolled = nodes.container.scrollLeft;
		const hasScroll = nodes.table.offsetWidth > nodes.container.clientWidth;
		const seenWidth = Math.round(scrolled + nodes.container.clientWidth);

		this.#toggleEar('left', hasScroll && scrolled > 0);
		this.#toggleEar('right', hasScroll && nodes.table.offsetWidth > seenWidth);
	}

	#toggleEar(side: 'left' | 'right', show: boolean): void
	{
		const nodes = this.#nodes;
		if (!nodes)
		{
			return;
		}

		const ear = side === 'left' ? nodes.earLeft : nodes.earRight;
		const fadeClass = side === 'left' ? ClassFadeLeft : ClassFadeRight;

		if (show)
		{
			Dom.addClass(nodes.fade, fadeClass);
			Dom.addClass(ear, ClassShow);

			return;
		}

		Dom.removeClass(nodes.fade, fadeClass);
		Dom.removeClass(ear, ClassShow);
	}

	/**
	 * Keeps the ears against the part of the rows the reader can see: they start below the head of the
	 * table and end with the window. The place of the table is read again only when something may have
	 * moved it.
	 */
	#adjustEarOffset(measure: boolean): void
	{
		const nodes = this.#nodes;
		if (!nodes)
		{
			return;
		}

		const body = nodes.table.tBodies[0];
		const head = nodes.table.tHead;
		if (!body || !head)
		{
			return;
		}

		if (measure)
		{
			this.#windowHeight = window.innerHeight;
			this.#bodyPosition = Dom.getPosition(body);
			this.#headPosition = Dom.getPosition(head);
		}

		const headHeight = this.#headPosition.height;
		let height = (window.scrollY + this.#windowHeight) - this.#bodyPosition.top;
		let top = window.scrollY - this.#bodyPosition.top;

		if (height > this.#bodyPosition.height)
		{
			height = this.#bodyPosition.height;
		}

		if (top < headHeight)
		{
			top = headHeight;
		}
		else
		{
			height -= top;
			height += headHeight;
		}

		cancelAnimationFrame(this.#frame);
		this.#frame = requestAnimationFrame((): void => {
			if (top !== this.#lastTop)
			{
				const translate = `translate3d(0px, ${top}px, 0)`;

				Dom.style(nodes.earLeft, 'transform', translate);
				Dom.style(nodes.earRight, 'transform', translate);
			}

			if (height !== this.#lastHeight)
			{
				Dom.style(nodes.earLeft, 'height', `${height}px`);
				Dom.style(nodes.earRight, 'height', `${height}px`);
			}

			this.#lastTop = top;
			this.#lastHeight = height;
		});
	}

	/** The table walks a step at a time while the pointer rests on the ear, and stops when it leaves. */
	#startScroll(event: TouchEvent | MouseEvent, step: number): void
	{
		const container = this.#nodes?.container;
		if (!container)
		{
			return;
		}

		// a tap on an ear is not a tap on what lies under it
		if (this.#touch)
		{
			event.preventDefault();
		}

		let offset = container.scrollLeft;

		this.#scrollTimer = window.setTimeout((): void => {
			this.#scrollInterval = window.setInterval((): void => {
				offset += step;
				container.scrollLeft = offset;
			}, ScrollStepTime);
		}, ScrollStartDelay);
	}

	#stopScroll(): void
	{
		window.clearTimeout(this.#scrollTimer);
		window.clearInterval(this.#scrollInterval);
	}
}
