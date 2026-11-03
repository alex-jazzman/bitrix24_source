const SELECTOR_DIALOG_CLASS = '.ui-selector-dialog';

/**
 * Returns focus to the element that opened the selector, but only when the selector
 * took the focus with it. The popup fires onClose on any close, including auto-hide
 * on an outside click: by then the browser has already moved focus to whatever the
 * user clicked, and pulling it back would type into the wrong field.
 */
export function restoreOpenerFocus(opener: ?HTMLElement): void
{
	if (isFocusLost())
	{
		opener?.focus?.();
	}
}

/**
 * Tells whether the focus belongs to nobody: it sits on the body, on nothing, on a node that
 * has left the document, or inside a selector dialog that is closing (the popup is still on
 * screen while onClose runs, so in the keyboard flow focus stays inside it). Only then may the
 * code move the focus on its own without taking it away from the user.
 */
export function isFocusLost(): boolean
{
	const active = document.activeElement;

	return !active
		|| active === document.body
		|| !document.contains(active)
		|| Boolean(active.closest?.(SELECTOR_DIALOG_CLASS))
	;
}
