const SCROLL_EDGE_THRESHOLD = 1;

// The popup marks its own scrollers with `data-scroll-container`, so a wheel event
// never has to ask for a computed style to tell one from an ordinary region.
function isScrollContainer(element: HTMLElement): boolean
{
	return element.dataset.scrollContainer !== undefined;
}

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

function hasRoomToScroll(element: HTMLElement, deltaY: number): boolean
{
	const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);

	return deltaY < 0
		? element.scrollTop > SCROLL_EDGE_THRESHOLD
		: element.scrollTop < maxScrollTop - SCROLL_EDGE_THRESHOLD;
}

/**
 * Keeps a wheel gesture inside the popup: nested scrollers keep working, but once
 * every one of them is at its edge the page behind the popup must not scroll on.
 * `ctrlKey` wheels are browser zoom and are always left alone.
 */
export function preventWheelScrollChaining(event: WheelEvent): void
{
	const boundary = event.currentTarget;
	if (!(boundary instanceof HTMLElement) || event.deltaY === 0 || event.ctrlKey)
	{
		return;
	}

	let current = resolveWheelTarget(event.target);
	while (current)
	{
		const scrollable = isScrollContainer(current) && current.scrollHeight > current.clientHeight;
		if (scrollable && hasRoomToScroll(current, event.deltaY))
		{
			return;
		}

		if (current === boundary)
		{
			break;
		}

		current = current.parentElement;
	}

	event.preventDefault();
}
