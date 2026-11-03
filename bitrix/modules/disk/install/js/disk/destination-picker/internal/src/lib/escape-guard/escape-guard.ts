import { Event } from 'main.core';

const ESCAPE_KEY = 'Escape';

/**
 * Holds back the `keyup` of an Escape that has already been answered elsewhere.
 *
 * main.popup closes the topmost layer from a `keyup` bound on the document in the
 * capture phase (`popup.ts`, bindClosingByEsc). Whoever answers the key on `keydown`
 * is usually gone by the time that `keyup` arrives, so stopping the `keydown` buys
 * nothing: the popup still closes on the second half of the same keystroke.
 *
 * Window stands above document in the capture path, which is the one place left to
 * hold the key. The guard lives for a single keystroke - the first `keyup` of any key
 * takes it down - so a key it was not armed for is never touched.
 *
 * A window that loses the focus takes it down too: the `keyup` of a keystroke the
 * window was left in the middle of never arrives, and a guard waiting for it would
 * outlive its keystroke and swallow the next Escape on the page - somebody else's by
 * then. The `blur` is listened for on the window alone, without the capture phase,
 * so the focus moving inside the popup leaves the guard where it is.
 */
export function swallowNextEscapeKeyUp(): void
{
	const handler = (event: KeyboardEvent | FocusEvent): void => {
		Event.unbind(window, 'keyup', handler, true);
		Event.unbind(window, 'blur', handler);

		if ('key' in event && event.key === ESCAPE_KEY)
		{
			event.stopPropagation();
		}
	};

	Event.bind(window, 'keyup', handler, true);
	Event.bind(window, 'blur', handler);
}
