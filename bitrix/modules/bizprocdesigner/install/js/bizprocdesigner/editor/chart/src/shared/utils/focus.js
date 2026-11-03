import { Dom, Type } from 'main.core';

// A focused text field owns Escape: it is the key a field cancels editing by, and the exclusive
// channel of the canvas hands Escape over even from a field - it is the one key a field types
// nothing with. The tags repeat what the input state of `ui.block-diagram` counts as a field,
// because the predicate deciding it is not part of its public exports.
const EDITABLE_TAGS = {
	INPUT: true,
	TEXTAREA: true,
	SELECT: true,
};

export function isEditableElement(element: ?EventTarget): boolean
{
	return element instanceof HTMLElement
		&& (EDITABLE_TAGS[element.tagName] === true || element.isContentEditable === true);
}

// Neither the canvas nor the nodes and groups on it are tab stops of their own, so a receiver of a
// focus handed back to it is made reachable programmatically first, and stays out of the tab order.
export function focusProgrammatically(element: ?HTMLElement): boolean
{
	if (!(element instanceof HTMLElement))
	{
		return false;
	}

	if (!element.hasAttribute('tabindex'))
	{
		Dom.attr(element, 'tabindex', '-1');
	}

	element.focus({ preventScroll: true });

	return true;
}

export function focusFirstAvailable(...candidates: Array<?Object>): void
{
	const target = candidates
		.flat()
		.find((candidate) => Type.isFunction(candidate?.focus) && candidate.disabled !== true)
	;

	target?.focus();
}
