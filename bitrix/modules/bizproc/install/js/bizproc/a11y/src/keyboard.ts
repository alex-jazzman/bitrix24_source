import { Dom, Event } from 'main.core';

const NATIVE_ACTIVATABLE_SELECTOR = 'button, a[href], input, select, textarea';

export const FOCUSABLE_CLASS = 'bizproc-a11y-focusable';

export function makeActivatable(element: HTMLElement, handler: (event: MouseEvent) => void): void
{
	Event.bind(element, 'click', handler);
	Dom.addClass(element, FOCUSABLE_CLASS);

	if (element.matches(NATIVE_ACTIVATABLE_SELECTOR))
	{
		// native elements already fire click on Enter/Space
		return;
	}

	if (!element.hasAttribute('role'))
	{
		Dom.attr(element, 'role', 'button');
	}

	if (!element.hasAttribute('tabindex'))
	{
		Dom.attr(element, 'tabindex', '0');
	}

	Event.bind(element, 'keydown', (event: KeyboardEvent) => {
		if (event.target !== element)
		{
			return;
		}

		if (event.key === 'Enter' || event.key === ' ')
		{
			event.preventDefault();
			element.click();
		}
	});
}
