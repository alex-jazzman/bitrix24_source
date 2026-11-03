type StableRect = {
	left: number,
	top: number,
	width: number,
	height: number,
};

export type StableRectWait = {
	promise: Promise<boolean>,
	cancel: () => void,
};

const REQUIRED_STABLE_INTERVALS = 2;
const MAX_MEASURED_FRAMES = 30;

export function waitForStableRect(element: HTMLElement): StableRectWait
{
	return new StableRectWaiter(element).start();
}

/**
 * Waits until the element has a non-zero box that keeps the same position and size.
 * A box-less element is awaited on a size observer, so a hidden anchor costs nothing
 * and still resolves once it becomes visible; measuring is limited by a frame budget,
 * so an endlessly moving anchor gives up instead of looping forever.
 */
class StableRectWaiter
{
	#element: HTMLElement;
	#promise: Promise<boolean>;
	#resolve: (isStable: boolean) => void = () => {};
	#frameId: number | null = null;
	#sizeObserver: ResizeObserver | null = null;
	#previousRect: StableRect | null = null;
	#stableIntervals: number = 0;
	#remainingFrames: number = MAX_MEASURED_FRAMES;
	#isFinished: boolean = false;

	constructor(element: HTMLElement)
	{
		this.#element = element;
		this.#promise = new Promise((resolve) => {
			this.#resolve = resolve;
		});
	}

	start(): StableRectWait
	{
		if (this.#element.isConnected)
		{
			this.#observeSize();
		}
		else
		{
			this.#finish(false);
		}

		return {
			promise: this.#promise,
			cancel: () => this.#finish(false),
		};
	}

	#observeSize(): void
	{
		if (this.#isFinished)
		{
			return;
		}

		this.#sizeObserver = new ResizeObserver(() => this.#handleResize());
		this.#sizeObserver.observe(this.#element);
	}

	#handleResize(): void
	{
		if (this.#isFinished || this.#readRect() === null)
		{
			return;
		}

		this.#stopObserving();
		this.#scheduleMeasure();
	}

	#measure(): void
	{
		this.#frameId = null;

		const rect = this.#readRect();
		if (rect === null)
		{
			this.#previousRect = null;
			this.#stableIntervals = 0;
			this.#observeSize();

			return;
		}

		this.#stableIntervals = isSameRect(rect, this.#previousRect) ? this.#stableIntervals + 1 : 0;
		this.#previousRect = rect;

		if (this.#stableIntervals >= REQUIRED_STABLE_INTERVALS)
		{
			this.#finish(true);

			return;
		}

		this.#scheduleMeasure();
	}

	#scheduleMeasure(): void
	{
		if (this.#remainingFrames <= 0)
		{
			this.#finish(false);

			return;
		}

		this.#remainingFrames--;
		this.#frameId = requestAnimationFrame(() => this.#measure());
	}

	#readRect(): StableRect | null
	{
		if (!this.#element.isConnected)
		{
			this.#finish(false);

			return null;
		}

		const { left, top, width, height } = this.#element.getBoundingClientRect();

		return width > 0 && height > 0 ? { left, top, width, height } : null;
	}

	#stopObserving(): void
	{
		this.#sizeObserver?.disconnect();
		this.#sizeObserver = null;
	}

	#finish(isStable: boolean): void
	{
		if (this.#isFinished)
		{
			return;
		}

		this.#isFinished = true;
		this.#stopObserving();

		if (this.#frameId !== null)
		{
			cancelAnimationFrame(this.#frameId);
			this.#frameId = null;
		}

		this.#resolve(isStable);
	}
}

function isSameRect(rect: StableRect, previousRect: StableRect | null): boolean
{
	return previousRect !== null
		&& rect.left === previousRect.left
		&& rect.top === previousRect.top
		&& rect.width === previousRect.width
		&& rect.height === previousRect.height
	;
}
