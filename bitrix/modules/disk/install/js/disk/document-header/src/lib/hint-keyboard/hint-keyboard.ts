/**
 * The hint directive of the design system listens to the mouse alone. A hint which is the only
 * place a text is written has to be reachable without a pointer too.
 */
export function showHint(event: FocusEvent | KeyboardEvent): void
{
	dispatchHintEvent(event.currentTarget, 'mouseenter');
}

export function hideHint(event: FocusEvent | KeyboardEvent): void
{
	dispatchHintEvent(event.currentTarget, 'mouseleave');
}

function dispatchHintEvent(target: EventTarget | null, eventName: string): void
{
	if (target instanceof HTMLElement)
	{
		target.dispatchEvent(new MouseEvent(eventName));
	}
}
