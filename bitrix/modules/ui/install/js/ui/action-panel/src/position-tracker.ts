import { Type } from 'main.core';

export type PositionMetrics = {
	width: number;
	top: number;
	left: number;
};

export type PositionTrackerOptions = {
	parent: HTMLElement | (() => HTMLElement | null);
	maxHeight?: number | null;
	onApply: (metrics: PositionMetrics) => void;
	onModeChange?: ((fixed: boolean) => void) | null;
	/**
	 * Runs right after the position was applied. The tracker is the only owner of the scroll and
	 * resize subscriptions, so a consumer that needs its own geometry work hangs it here instead
	 * of listening to the window on its own and reading the same layout a second time.
	 */
	onGeometryChange?: (() => void) | null;
};

const SCROLL_OVERFLOW = /(auto|scroll|overlay)/;

function isScrollable(node: HTMLElement): boolean
{
	const style = window.getComputedStyle(node);

	return SCROLL_OVERFLOW.test(`${style.overflowY}${style.overflowX}`);
}

function collectScrollableAncestors(node: HTMLElement): HTMLElement[]
{
	const result: HTMLElement[] = [];
	let current = node.parentElement;

	while (current && current !== document.body && current !== document.documentElement)
	{
		if (isScrollable(current))
		{
			result.push(current);
		}

		current = current.parentElement;
	}

	return result;
}

/**
 * Keeps the panel aligned with its parent container without observing the whole document.
 * Replaces the legacy body-wide MutationObserver: geometry is tracked through ResizeObserver
 * on the parent chain plus scroll and resize listeners.
 */
export default class PositionTracker
{
	#parent: HTMLElement | (() => HTMLElement | null);
	#maxHeight: number | null;
	#onApply: (metrics: PositionMetrics) => void;
	#onModeChange: ((fixed: boolean) => void) | null;
	#onGeometryChange: (() => void) | null;

	#resizeObserver: ResizeObserver | null = null;
	/** The node the current subscriptions describe; a different one means they have to be rebuilt. */
	#observedParent: HTMLElement | null = null;
	/**
	 * Where that node hung when the subscriptions were built. The observed set and the scrollable
	 * ancestors are taken from the whole path, so the same node in another subtree is another set.
	 */
	#observedAncestor: HTMLElement | null = null;
	#observedNodes: HTMLElement[] = [];
	#scrollTargets: Array<HTMLElement | Window> = [];
	#fixed: boolean = false;
	#started: boolean = false;
	#refreshing: boolean = false;
	#frameId: number | null = null;
	#handleGeometryEvent: () => void;

	constructor(options: PositionTrackerOptions)
	{
		this.#parent = options.parent;
		this.#maxHeight = Type.isNumber(options.maxHeight) ? options.maxHeight : null;
		this.#onApply = options.onApply;
		this.#onModeChange = Type.isFunction(options.onModeChange) ? options.onModeChange : null;
		this.#onGeometryChange = Type.isFunction(options.onGeometryChange) ? options.onGeometryChange : null;
		this.#handleGeometryEvent = this.#scheduleRefresh.bind(this);
	}

	/**
	 * Native scroll fires once per frame, so an immediate refresh would read and write layout on
	 * every one of them. One pass per frame is the most the position can change anyway.
	 */
	#scheduleRefresh(): void
	{
		if (this.#frameId !== null)
		{
			return;
		}

		this.#frameId = requestAnimationFrame(() => {
			this.#frameId = null;
			this.refresh();
		});
	}

	#cancelScheduledRefresh(): void
	{
		if (this.#frameId === null)
		{
			return;
		}

		cancelAnimationFrame(this.#frameId);
		this.#frameId = null;
	}

	resolveParent(): HTMLElement | null
	{
		if (Type.isDomNode(this.#parent))
		{
			return this.#parent as HTMLElement;
		}

		if (Type.isFunction(this.#parent))
		{
			const node = (this.#parent as () => HTMLElement | null).call(null);

			return Type.isDomNode(node) ? node : null;
		}

		return null;
	}

	isFixed(): boolean
	{
		return this.#fixed;
	}

	setMaxHeight(maxHeight: number | null): void
	{
		this.#maxHeight = Type.isNumber(maxHeight) ? maxHeight : null;
	}

	/** Reports whether the tracking is on: a parent that resolves to nothing cannot be followed. */
	start(): boolean
	{
		if (this.#started)
		{
			return true;
		}

		const parent = this.resolveParent();
		if (!parent)
		{
			return false;
		}

		this.#started = true;
		this.#subscribe(parent);

		this.refresh();

		return true;
	}

	stop(): void
	{
		if (!this.#started)
		{
			return;
		}

		this.#started = false;
		this.#cancelScheduledRefresh();
		this.#unsubscribe();
	}

	#subscribe(parent: HTMLElement): void
	{
		this.#observedParent = parent;
		this.#observedAncestor = parent.parentElement;

		const observer = new ResizeObserver(this.#handleGeometryEvent);
		this.#resizeObserver = observer;

		// Body and documentElement are deliberately excluded: their size is already covered by the
		// window resize listener, and observing them would bring back document-wide recalculations.
		this.#observedNodes = [parent, parent.parentElement].filter(
			(node): node is HTMLElement => Boolean(node)
				&& node !== document.body
				&& node !== document.documentElement,
		);
		this.#observedNodes.forEach((node) => observer.observe(node));

		this.#scrollTargets = [...collectScrollableAncestors(parent), window];
		this.#scrollTargets.forEach((target) => {
			target.addEventListener('scroll', this.#handleGeometryEvent, { passive: true });
		});

		window.addEventListener('resize', this.#handleGeometryEvent, { passive: true });
	}

	#unsubscribe(): void
	{
		if (this.#resizeObserver)
		{
			this.#resizeObserver.disconnect();
			this.#resizeObserver = null;
		}

		this.#observedNodes = [];
		this.#observedParent = null;
		this.#observedAncestor = null;

		this.#scrollTargets.forEach((target) => {
			target.removeEventListener('scroll', this.#handleGeometryEvent);
		});
		this.#scrollTargets = [];

		window.removeEventListener('resize', this.#handleGeometryEvent);
	}

	refresh(): void
	{
		// A consumer is free to move the container from `onModeChange` and to ask for a refresh while
		// doing it. The pass that is already running re-reads the rectangle right after the mode
		// switch, so the nested call has nothing of its own to apply: repeating the work would write
		// the same metrics twice, and its cancellation would drop a frame the outer pass scheduled.
		if (this.#refreshing)
		{
			return;
		}

		const parent = this.resolveParent();
		if (!parent)
		{
			return;
		}

		// The parent is resolved lazily, and a consumer is allowed to replace it after the panel was
		// drawn. The coordinates would follow the new node on their own, but the observers of the
		// previous one describe geometry the panel no longer has anything to do with. An ajax redraw
		// moves the very same node into a fresh wrapper just as often as it replaces it, and that
		// leaves the observers on a subtree the panel has left, so the path is compared too.
		if (this.#started && (parent !== this.#observedParent || parent.parentElement !== this.#observedAncestor))
		{
			this.#unsubscribe();
			this.#subscribe(parent);
		}

		// A pending frame would repeat the work that is being done right now.
		this.#cancelScheduledRefresh();

		this.#refreshing = true;

		try
		{
			// One read of the rectangle per pass: the fixed mode and the metrics come from the same one.
			const viewportRect = parent.getBoundingClientRect();
			let measuredRect = viewportRect;

			const fixed = viewportRect.top <= 0;
			if (fixed !== this.#fixed)
			{
				this.#fixed = fixed;
				if (this.#onModeChange)
				{
					this.#onModeChange(fixed);
					// A consumer may move the container on the mode switch, and then the rectangle
					// read above no longer describes it.
					measuredRect = parent.getBoundingClientRect();
				}
			}

			this.#onApply(this.measure(parent, fixed, measuredRect));

			if (this.#onGeometryChange)
			{
				this.#onGeometryChange();
			}
		}
		finally
		{
			// A consumer handler that throws must not leave the tracker refusing every next pass.
			this.#refreshing = false;
		}
	}

	measure(parent: HTMLElement, fixed: boolean, rect: DOMRect | null = null): PositionMetrics
	{
		const viewportRect = rect ?? parent.getBoundingClientRect();
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

		const documentTop = viewportRect.top + scrollTop;
		const documentLeft = viewportRect.left + scrollLeft;
		const offsetTop = this.#maxHeight === null ? 0 : viewportRect.height - this.#maxHeight;

		return {
			width: viewportRect.width,
			top: documentTop + offsetTop,
			// Fixed mode lives in viewport coordinates, normal mode in document coordinates.
			left: fixed ? viewportRect.left : documentLeft,
		};
	}
}
