import { Dom } from 'main.core';
import { type Popup } from 'main.popup';

const CLOSE_ICON_SELECTOR = '.popup-window-close-icon';

/**
 * `main.popup` and `ui.tour` keep the parts of their popups to themselves: neither an option nor a
 * getter reaches them, and a class is the only way in. The messages of the feature name those parts
 * for the tests, and this is the single place that reaches into the markup of another module.
 *
 * A class that is gone is a broken agreement with that module, and it is told about here, where it
 * breaks: `Dom.attr` takes `null` in silence, and the test that trips over the missing name trips far
 * from the cause. The message itself goes on without the name rather than not at all - a name for a
 * test is not worth a person losing the message it was written on.
 */
export function markPopupNode(popup: Popup, selector: string, testId: string): void
{
	const node = popup.getPopupContainer().querySelector<HTMLElement>(selector);
	if (node === null)
	{
		console.error(`mail.migration-notice: nothing matches "${selector}", "${testId}" has nowhere to go`);

		return;
	}

	Dom.attr(node, 'data-testid', testId);
}

export function markCloseIcon(popup: Popup, testId: string): void
{
	markPopupNode(popup, CLOSE_ICON_SELECTOR, testId);
}
