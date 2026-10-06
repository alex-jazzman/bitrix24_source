const SCROLL_EDGE_THRESHOLD = 1;
const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);

function resolveWheelTarget(target: EventTarget | null): HTMLElement | null
{
	if (target instanceof HTMLElement)
	{
		return target;
	}

	if (target instanceof Node && target.parentElement instanceof HTMLElement)
	{
		return target.parentElement;
	}

	return null;
}

function canScrollWithDelta(element: HTMLElement, deltaY: number): boolean
{
	const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
	const canScrollUp = element.scrollTop > SCROLL_EDGE_THRESHOLD;
	const canScrollDown = element.scrollTop < maxScrollTop - SCROLL_EDGE_THRESHOLD;

	return deltaY < 0 ? canScrollUp : canScrollDown;
}

export function preventWheelScrollChaining(event: WheelEvent): void
{
	const container = event.currentTarget;
	if (
		!(container instanceof HTMLElement)
		|| event.deltaY === 0
		|| event.ctrlKey
	)
	{
		return;
	}

	let current = resolveWheelTarget(event.target);

	while (current)
	{
		const style = getComputedStyle(current);
		const isScrollable = SCROLLABLE_OVERFLOW_VALUES.has(style.overflowY)
			&& current.scrollHeight > current.clientHeight;
		if (isScrollable && canScrollWithDelta(current, event.deltaY))
		{
			return;
		}

		if (current === container)
		{
			break;
		}

		current = current.parentElement;
	}

	event.preventDefault();
}
