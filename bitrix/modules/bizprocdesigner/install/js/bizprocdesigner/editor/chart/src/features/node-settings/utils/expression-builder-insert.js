import { Dom, Type } from 'main.core';

// Mirrors (does not import) the target-input resolution and caret insertion of
// bp-selector-button.js: `findTargetInput` there is not exported, so the logic is
// duplicated intentionally to keep the additive expression-builder trigger independent
// of the existing selector button.

export const SELECTOR_BUTTON_ROLE = 'bp-selector-button';

/**
 * A selector button hidden by a stylesheet: a field where picking a value was switched off on
 * purpose. Neither the trigger of the builder nor the readable layer touches such a field — the
 * rules that hide the button match it as the next sibling of its input
 * (`input#id_message_from + input[data-role="bp-selector-button"]`), so anything inserted between
 * the two would break the match and bring the hidden button back on screen.
 *
 * `display` is read off the button itself: an element inside a hidden ancestor keeps its own computed
 * display, so a form that is merely not visible yet still gets its triggers.
 */
export function isSelectorButtonHidden(button: HTMLElement): boolean
{
	return Dom.style(button, 'display') === 'none';
}

function readControlId(button: ?HTMLElement): ?string
{
	const propsAttribute = button?.getAttribute?.('data-bp-selector-props');
	if (!propsAttribute)
	{
		return null;
	}

	try
	{
		return JSON.parse(propsAttribute)?.controlId ?? null;
	}
	catch
	{
		return null;
	}
}

/**
 * Resolve the text input/textarea of a field row the expression should be inserted into.
 * Prefers the control referenced by the selector button's `controlId`, falling back to the
 * first text input/textarea within the row.
 */
export function findTargetInput(fieldRow: ?HTMLElement, button: ?HTMLElement = null): ?HTMLElement
{
	if (!fieldRow)
	{
		return null;
	}

	const controlId = readControlId(button);
	if (controlId)
	{
		const controlById = fieldRow.querySelector(`#${CSS.escape(controlId)}`);
		if (controlById)
		{
			return controlById;
		}
	}

	return fieldRow.querySelector('input[type="text"], textarea') ?? null;
}

/**
 * Resolve the container the trigger belongs to. Node settings controls wrap every field in
 * `.field-row`, while the legacy property dialog lays fields out in nested tables, where the
 * selector button and its control live in sibling cells: there the host is the closest
 * ancestor of the button that already holds the control.
 */
export function resolveFieldHost(root: ?HTMLElement, button: ?HTMLElement): ?HTMLElement
{
	const fieldRow = button?.closest('.field-row');
	if (fieldRow)
	{
		return fieldRow;
	}

	let host = button?.parentElement ?? null;
	while (host && host !== root)
	{
		if (findTargetInput(host, button))
		{
			return host;
		}

		host = host.parentElement;
	}

	return null;
}

/**
 * Insert a value at the caret position (selectionEnd) of the input, keeping the text before
 * and after the caret, then dispatch bubbling `input` and `change` events, the way typing into
 * the field would: the form input tracker is bound to the form, while the ordinary settings form
 * binds `input` to the control itself.
 * Returns true when the value was inserted.
 */
export function insertExpression(input: ?HTMLElement, value: string): boolean
{
	if (!input || !Type.isStringFilled(value))
	{
		return false;
	}

	const target = input;
	const caret = target.selectionEnd || 0;
	const beforePart = target.value.slice(0, caret);
	const afterPart = target.value.slice(caret);

	target.value = beforePart + value + afterPart;
	target.selectionEnd = beforePart.length + value.length;
	target.focus();
	target.dispatchEvent(new window.Event('input', { bubbles: true }));
	target.dispatchEvent(new window.Event('change', { bubbles: true }));

	return true;
}
